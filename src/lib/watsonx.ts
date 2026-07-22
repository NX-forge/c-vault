// IBM watsonx.ai integration.
// Uses IBM Cloud IAM to exchange the API key for a bearer token, then calls the
// watsonx.ai text generation endpoint directly. Kept as a plain fetch-based client
// (rather than depending on SDK internals) so it's easy to read, test, and swap models.

const IAM_TOKEN_URL = "https://iam.cloud.ibm.com/identity/token";
const DEFAULT_MODEL_ID = "ibm/granite-3-8b-instruct";
const GENERATION_VERSION = "2023-05-29";

type CachedToken = { token: string; expiresAt: number };

class WatsonxClient {
  private apiKey: string;
  private projectId: string;
  private url: string;
  private modelId: string;
  private cachedToken: CachedToken | null = null;

  constructor() {
    this.apiKey = process.env.WATSONX_API_KEY || "";
    this.projectId = process.env.WATSONX_PROJECT_ID || "";
    this.url = (process.env.WATSONX_URL || "https://us-south.ml.cloud.ibm.com").replace(/\/$/, "");
    this.modelId = process.env.WATSONX_MODEL_ID || DEFAULT_MODEL_ID;
  }

  private isConfigured(): boolean {
    return Boolean(this.apiKey && this.projectId);
  }

  private async getAccessToken(): Promise<string> {
    if (this.cachedToken && this.cachedToken.expiresAt > Date.now() + 30_000) {
      return this.cachedToken.token;
    }

    const response = await fetch(IAM_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ibm:params:oauth:grant-type:apikey",
        apikey: this.apiKey,
      }),
    });

    if (!response.ok) {
      throw new Error(`watsonx auth failed: IAM token exchange returned ${response.status}`);
    }

    const data = (await response.json()) as { access_token: string; expires_in: number };
    this.cachedToken = {
      token: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    };
    return data.access_token;
  }

  /**
   * Generate text from a prompt. Throws if watsonx.ai isn't configured or the
   * request fails — callers should surface this as a clear error rather than
   * silently faking an AI response.
   */
  async generateText(prompt: string, maxNewTokens = 800): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error(
        "watsonx.ai is not configured. Set WATSONX_API_KEY and WATSONX_PROJECT_ID in your environment."
      );
    }

    const token = await this.getAccessToken();

    const response = await fetch(
      `${this.url}/ml/v1/text/generation?version=${GENERATION_VERSION}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          model_id: this.modelId,
          project_id: this.projectId,
          input: prompt,
          parameters: {
            decoding_method: "greedy",
            max_new_tokens: maxNewTokens,
            repetition_penalty: 1.1,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      throw new Error(`watsonx.ai generation failed (${response.status}): ${errorBody}`);
    }

    const data = (await response.json()) as {
      results: { generated_text: string }[];
    };

    return data.results?.[0]?.generated_text?.trim() ?? "";
  }
}

export const watsonx = new WatsonxClient();

// --- Prompt templates -------------------------------------------------------
// Kept here (rather than inline in routes) so the "what did we actually ask the
// model to do" logic is in one reviewable place.

export function buildOutlinePrompt(input: {
  title: string;
  genre?: string | null;
  tone?: string | null;
  targetAudience?: string | null;
  premise: string;
  beats: number;
}): string {
  return [
    `You are a creative collaborator helping a human creator plan a project titled "${input.title}".`,
    input.genre ? `Genre: ${input.genre}` : null,
    input.tone ? `Tone: ${input.tone}` : null,
    input.targetAudience ? `Target audience: ${input.targetAudience}` : null,
    `Premise: ${input.premise}`,
    ``,
    `Produce a ${input.beats}-beat outline. Number each beat, one or two sentences per beat.`,
    `This is a suggestion for the creator to edit — do not add a preamble or sign-off, just the numbered beats.`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildChapterActionPrompt(input: {
  action: "draft" | "continue" | "rewrite" | "review";
  projectTitle: string;
  outline?: string | null;
  chapterTitle: string;
  currentContent?: string;
  instruction?: string;
}): string {
  const header = `You are co-writing "${input.projectTitle}" with a human creator. Chapter: "${input.chapterTitle}".`;
  const outlineContext = input.outline ? `Project outline:\n${input.outline}\n` : "";

  switch (input.action) {
    case "draft":
      return [
        header,
        outlineContext,
        `Write a first draft of this chapter. This is a suggestion the creator will review and edit — write it in full prose, no preamble.`,
      ]
        .filter(Boolean)
        .join("\n");

    case "continue":
      return [
        header,
        outlineContext,
        `Here is the chapter so far:`,
        input.currentContent || "(empty so far)",
        ``,
        `Continue the scene naturally for a few more paragraphs. Output only the continuation, not the existing text.`,
      ].join("\n");

    case "rewrite":
      return [
        header,
        `Here is the current text:`,
        input.currentContent || "(empty)",
        ``,
        `Rewrite it in this style/direction: ${input.instruction || "clearer and more vivid, same meaning"}.`,
        `Output only the rewritten text.`,
      ].join("\n");

    case "review":
      return [
        header,
        `Here is the current text:`,
        input.currentContent || "(empty)",
        ``,
        `Give a short creative review: 2-3 strengths, 2-3 concrete suggestions, and a rough 1-10 score with one line on why. Be specific to this text, not generic.`,
      ].join("\n");
  }
}
