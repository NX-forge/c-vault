import Link from "next/link";

const CREATOR_TYPES = ["Writers", "Filmmakers", "Designers", "Digital creators"];

const FEATURES = [
  {
    title: "Co-create, don't outsource",
    body: "AI drafts outlines, scenes, and rewrites. You review, edit, and approve every one before it's saved — the work stays yours at every step.",
  },
  {
    title: "Cryptographic provenance",
    body: "Every save is hashed and chained to the version before it. Rewrite history quietly and the chain breaks — so your authorship is provable, not just claimed.",
  },
  {
    title: "Publish and monetize",
    body: "Export a polished PDF, share a public creator profile, and lock premium chapters for supporters who want more.",
  },
  {
    title: "Governed AI, logged",
    body: "Every prompt and output is recorded and labeled AI-assisted or human-written. Nothing publishes without your explicit confirmation.",
  },
];

const STEPS = [
  "Create a project",
  "Generate an outline",
  "Draft a chapter",
  "Edit and save",
  "Version gets hashed",
  "Review the provenance timeline",
  "Export to PDF",
  "Publish your creator profile",
];

function HashChainMark() {
  const nodes = ["3f9a", "b207", "e614", "0c5d"];
  return (
    <div className="flex flex-wrap items-center gap-y-2" aria-hidden="true">
      {nodes.map((hex, i) => (
        <div key={hex} className="flex items-center">
          <div
            className={`flex h-11 items-center rounded-md border px-3 font-mono text-xs ${
              i === nodes.length - 1
                ? "border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300"
                : "border-secondary-200 bg-secondary-50 text-secondary-500 dark:border-secondary-800 dark:bg-secondary-900 dark:text-secondary-400"
            }`}
          >
            {hex}&hellip;
          </div>
          {i < nodes.length - 1 && (
            <div className="h-px w-6 bg-secondary-300 dark:bg-secondary-700" />
          )}
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-white text-secondary-900 dark:bg-secondary-950 dark:text-secondary-50">
      {/* Nav */}
      <header className="border-b border-secondary-100 dark:border-secondary-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <span className="text-lg font-semibold tracking-tight">
            C<span className="text-primary-600">·</span>Vault
          </span>
          <nav className="hidden items-center gap-8 text-sm text-secondary-600 dark:text-secondary-400 sm:flex">
            <a href="#features" className="hover:text-secondary-900 dark:hover:text-secondary-100">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-secondary-900 dark:hover:text-secondary-100">
              How it works
            </a>
            <Link href="/creator" className="hover:text-secondary-900 dark:hover:text-secondary-100">
              Creators
            </Link>
          </nav>
          <div className="flex items-center gap-3 text-sm">
            <Link
              href="/login"
              className="text-secondary-600 hover:text-secondary-900 dark:text-secondary-400 dark:hover:text-secondary-100"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-primary-600 px-4 py-2 font-medium text-white hover:bg-primary-700"
            >
              Start creating
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24">
        <p className="text-sm font-medium uppercase tracking-wide text-primary-600">
          IBM AI Builders Challenge 2026 &middot; Reimagine Creative Industries with AI
        </p>
        <h1 className="mt-4 max-w-2xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          Create with an AI partner. Keep proof it&rsquo;s yours.
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-8 text-secondary-600 dark:text-secondary-400">
          C-Vault is a co-creation studio for writers, filmmakers, designers, and digital
          creators. Outline and draft with AI, edit and save as normal — every version is
          chained and hashed, so your authorship holds up to scrutiny.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link
            href="/register"
            className="rounded-full bg-primary-600 px-6 py-3 text-sm font-medium text-white hover:bg-primary-700"
          >
            Start creating
          </Link>
          <a
            href="#how-it-works"
            className="rounded-full border border-secondary-200 px-6 py-3 text-sm font-medium text-secondary-700 hover:border-secondary-300 dark:border-secondary-800 dark:text-secondary-300"
          >
            See how it works
          </a>
        </div>

        <div className="mt-14 flex flex-col gap-3">
          <HashChainMark />
          <p className="text-xs text-secondary-500 dark:text-secondary-500">
            Each save chains to the last — tamper with history and the chain visibly breaks.
          </p>
        </div>

        <div className="mt-16 flex flex-wrap gap-2">
          {CREATOR_TYPES.map((type) => (
            <span
              key={type}
              className="rounded-full border border-secondary-200 px-3 py-1 text-xs font-medium text-secondary-600 dark:border-secondary-800 dark:text-secondary-400"
            >
              {type}
            </span>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-secondary-100 bg-secondary-50 dark:border-secondary-900 dark:bg-secondary-900/40">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight">
            AI suggests. You decide.
          </h2>
          <p className="mt-2 max-w-xl text-secondary-600 dark:text-secondary-400">
            Every AI output is a draft, never a final word — that principle runs through
            everything below.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-secondary-200 bg-white p-6 dark:border-secondary-800 dark:bg-secondary-950"
              >
                <h3 className="font-medium">{f.title}</h3>
                <p className="mt-2 text-sm leading-6 text-secondary-600 dark:text-secondary-400">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <h2 className="text-2xl font-semibold tracking-tight">How it works</h2>
        <p className="mt-2 max-w-xl text-secondary-600 dark:text-secondary-400">
          One project, start to finish — the same eight steps every time.
        </p>
        <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <li
              key={step}
              className="rounded-lg border border-secondary-200 p-4 dark:border-secondary-800"
            >
              <span className="font-mono text-xs text-primary-600">
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className="mt-2 text-sm font-medium">{step}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Footer */}
      <footer className="border-t border-secondary-100 dark:border-secondary-900">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 sm:px-6 text-xs text-secondary-500 dark:text-secondary-500 sm:flex-row sm:items-center sm:justify-between">
          <p>Built with IBM Bob &middot; aligned with watsonx.ai and watsonx.governance principles.</p>
          <p>C-Vault &mdash; AI Builders Challenge, July 2026 track</p>
        </div>
      </footer>
    </div>
  );
}
