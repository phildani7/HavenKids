import "server-only";

// SAFE-3 contact-risk seam. Mirrors the SAFE-2 scan-provider pattern: a pluggable
// provider scores a connection request or a message for grooming / off-platform-contact
// risk. Default = a transparent keyword heuristic (no ML). A real classifier
// (Thorn/Hive/etc.) is a config-gated swap. Risk NEVER silently auto-allows — a
// provider error fails safe to 'review'.

export type ContactRisk = "allow" | "review" | "block";

export interface ContactRiskProvider {
  name: string;
  assessConnection(ctx: { requesterIsAdult: boolean; addresseeIsMinor: boolean }): Promise<ContactRisk>;
  assessMessage(ctx: { body: string; involvesMinor: boolean }): Promise<ContactRisk>;
}

// Phrases that suggest moving a minor off-platform or concealment — classic grooming
// signals. Conservative + transparent; flags for human review, does not hard-block.
const OFF_PLATFORM = [
  "what's your number", "whats your number", "your number", "snapchat", "snap me",
  "instagram", "whatsapp", "telegram", "kik", "discord", "add me on",
  "meet up", "meet in person", "where do you live", "send a pic", "send pic",
  "don't tell", "dont tell", "keep this secret", "our secret",
];

const heuristic: ContactRiskProvider = {
  name: "heuristic",
  async assessConnection({ requesterIsAdult, addresseeIsMinor }) {
    // An adult initiating contact with a minor is the highest-signal pattern → review.
    return requesterIsAdult && addresseeIsMinor ? "review" : "allow";
  },
  async assessMessage({ body, involvesMinor }) {
    if (!involvesMinor) return "allow";
    const low = (body || "").toLowerCase();
    return OFF_PLATFORM.some((p) => low.includes(p)) ? "review" : "allow";
  },
};

// [GATED] A real ML risk classifier needs vendor onboarding. The stub throws when
// selected so a misconfiguration fails loudly rather than silently passing contact.
function gatedProvider(name: string): ContactRiskProvider {
  const fail = async () => { throw new Error(`contact-risk provider '${name}' not configured (vendor onboarding required)`); };
  return { name, assessConnection: fail, assessMessage: fail };
}

export function getContactRiskProvider(): ContactRiskProvider {
  switch ((process.env.CONTACT_RISK_PROVIDER || "heuristic").toLowerCase()) {
    case "thorn": return gatedProvider("thorn");
    case "hive": return gatedProvider("hive");
    default: return heuristic;
  }
}

// Fail-safe wrappers: a provider error must escalate to 'review', never 'allow'.
export async function assessConnectionRisk(
  ctx: { requesterIsAdult: boolean; addresseeIsMinor: boolean },
): Promise<ContactRisk> {
  try { return await getContactRiskProvider().assessConnection(ctx); }
  catch { return "review"; }
}

export async function assessMessageRisk(
  ctx: { body: string; involvesMinor: boolean },
): Promise<ContactRisk> {
  try { return await getContactRiskProvider().assessMessage(ctx); }
  catch { return "review"; }
}
