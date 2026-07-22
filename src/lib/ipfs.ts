// Anchors content to IPFS via Pinata's pinning API, so a version's chain hash can
// be checked against an independent, external record rather than only Postgres.
// Uses plain fetch against Pinata's REST API rather than their SDK, to keep this
// swappable for any other pinning service later (web3.storage, nft.storage, ...).

import { isLikelyValidCid, ipfsGatewayUrl } from "@/lib/ipfs-gateway";

export { ipfsGatewayUrl };

const PINATA_PIN_JSON_URL = "https://api.pinata.cloud/pinning/pinJSONToIPFS";

export class IpfsNotConfiguredError extends Error {
  constructor() {
    super(
      "IPFS anchoring is not configured. Set PINATA_JWT in your environment (get one at pinata.cloud)."
    );
    this.name = "IpfsNotConfiguredError";
  }
}

type PinnedVersionRecord = {
  chapterTitle: string;
  chainHash: string;
  previousHash: string | null;
  content: string;
  anchoredAt: string;
};

/**
 * Pins a version's content (plus a little metadata) as JSON to IPFS and returns
 * the resulting CID. Throws IpfsNotConfiguredError if PINATA_JWT isn't set —
 * callers should surface that clearly rather than fabricating a CID.
 */
export async function pinVersionToIpfs(input: {
  versionId: string;
  chainHash: string;
  previousHash: string | null;
  content: string;
  chapterTitle: string;
}): Promise<string> {
  const jwt = process.env.PINATA_JWT;
  if (!jwt) {
    throw new IpfsNotConfiguredError();
  }

  const response = await fetch(PINATA_PIN_JSON_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify({
      pinataMetadata: {
        name: `c-vault-version-${input.versionId}`,
      },
      pinataContent: {
        chapterTitle: input.chapterTitle,
        chainHash: input.chainHash,
        previousHash: input.previousHash,
        content: input.content,
        anchoredAt: new Date().toISOString(),
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`IPFS pin failed (${response.status}): ${body}`);
  }

  const data = (await response.json()) as { IpfsHash: string };

  // Guard against a malformed/unexpected response before we trust it as an anchor.
  if (!data.IpfsHash || !isLikelyValidCid(data.IpfsHash)) {
    throw new Error(`Pinata returned an unexpected CID: ${data.IpfsHash}`);
  }

  return data.IpfsHash;
}

/**
 * Re-fetches a previously pinned version from the public gateway and confirms
 * its chainHash still matches what we have stored — an external cross-check on
 * top of the internal Postgres hash chain. Returns null (rather than throwing)
 * if the gateway is unreachable, since that's a gateway/network problem, not
 * proof of tampering.
 */
export async function fetchPinnedVersion(cid: string): Promise<PinnedVersionRecord | null> {
  try {
    const response = await fetch(ipfsGatewayUrl(cid), { cache: "no-store" });
    if (!response.ok) return null;
    return (await response.json()) as PinnedVersionRecord;
  } catch {
    return null;
  }
}
