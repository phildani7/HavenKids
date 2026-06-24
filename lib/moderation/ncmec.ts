import "server-only";

// [GATED] Real NCMEC CyberTipline filing requires ESP registration + the reporting API.
// Stub: reports remain 'pending' in ncmec_reports (the filing worklist via list_open_ncmec_reports).
// Replace fileReport with the registered API call; mark 'filed' + report_ref, or 'failed'.
export async function fileReport(_reportId: string): Promise<{ filed: boolean; reason?: string }> {
  return { filed: false, reason: "NCMEC filing not configured (ESP registration required)" };
}
