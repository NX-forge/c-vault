import { createHash } from "crypto";

/** Hash of the raw content alone — one input to the chain hash below. */
export function generateContentHash(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

/**
 * The chain hash: content hash combined with the previous version's chain
 * hash, then re-hashed. This is what gets stored as Version.chainHash — it's
 * "chained" because each one depends on the one before it, so altering any
 * past version invalidates every chainHash after it.
 */
export function generateChainHash(
  rawContentHash: string,
  previousChainHash: string | null
): string {
  const data = previousChainHash ? `${rawContentHash}:${previousChainHash}` : rawContentHash;
  return createHash("sha256").update(data).digest("hex");
}

export function verifyHashChain(
  rawContentHash: string,
  previousChainHash: string | null,
  expectedChainHash: string
): boolean {
  const computedHash = generateChainHash(rawContentHash, previousChainHash);
  return computedHash === expectedChainHash;
}

// Made with Bob
