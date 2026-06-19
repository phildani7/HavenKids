import "server-only";

export type ScanVerdict = "clean" | "csam" | "review";
export interface ScanProvider { name: string; scanImage(path: string): Promise<ScanVerdict>; }

// Default: no automated scanner configured → everything goes to manual review
// (media stays quarantined/pending). SAFE-2 live integration swaps this out.
const manualReview: ScanProvider = {
  name: "manual",
  async scanImage() { return "review"; },
};

// [GATED] Real providers need vendor onboarding (approval-gated APIs).
// Stubs throw until configured, so selecting them fails loudly rather than silently passing content.
function gatedProvider(name: string): ScanProvider {
  return { name, async scanImage() { throw new Error(`scan provider '${name}' not configured (vendor onboarding required)`); } };
}

export function getScanProvider(): ScanProvider {
  switch ((process.env.SCAN_PROVIDER || "manual").toLowerCase()) {
    case "photodna": return gatedProvider("photodna");
    case "thorn": return gatedProvider("thorn");
    case "cloudflare": return gatedProvider("cloudflare");
    default: return manualReview;
  }
}

// Scan a freshly-uploaded media item and apply the verdict via the DB pipeline
// (set_media_verdict: clean->approved, csam->rejected+incident+NCMEC report, review->pending).
export async function scanAndAct(accountId: string, mediaId: string, path: string): Promise<ScanVerdict> {
  const provider = getScanProvider();
  let verdict: ScanVerdict;
  try { verdict = await provider.scanImage(path); }
  catch { verdict = "review"; } // a provider error must NOT auto-approve — fail safe to manual review
  const { setMediaVerdict } = await import("@/lib/content");
  await setMediaVerdict(accountId, mediaId, provider.name, verdict);
  return verdict;
}
