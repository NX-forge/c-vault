const DEFAULT_GATEWAY = "https://gateway.pinata.cloud/ipfs";

/** Basic sanity check — CIDv0 (Qm..., 46 chars) or CIDv1 (bafy..., base32). */
export function isLikelyValidCid(cid: string): boolean {
  return /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/.test(cid) || /^ba[a-z0-9]{57,}$/.test(cid);
}

export function ipfsGatewayUrl(cid: string): string {
  const gateway = process.env.NEXT_PUBLIC_IPFS_GATEWAY || DEFAULT_GATEWAY;
  return `${gateway.replace(/\/$/, "")}/${cid}`;
}
