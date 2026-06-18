const FLAGS = ["dumb", "stupid", "hate", "shut up"];

export function moderateText(text: string): { flagged: boolean; word?: string } {
  const low = (text || "").toLowerCase();
  const word = FLAGS.find((f) => low.includes(f));
  return word ? { flagged: true, word } : { flagged: false };
}
