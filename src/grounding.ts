// Extra risk check: UNSUPPORTED SPECIFICS.
// A summary that cites a valid message can still invent an amount or an order
// number. Support agents act on those, so a made-up "$500 refund" is worse than
// a vague summary. Rule: every number / identifier in the summary must appear in
// the text of the messages it cites.

const SPECIFIC = /\b[A-Z]{2,}-\d+\b|\$?\d[\d,]*(?:\.\d+)?%?/g;

const norm = (s: string) => s.replace(/,/g, '').replace(/^\$/, '').toLowerCase();

export function extractSpecifics(text: string): string[] {
  return (text.match(SPECIFIC) ?? []).map(norm);
}

export function ungroundedSpecifics(summary: string, citedText: string): string[] {
  const haystack = citedText.replace(/,/g, '').replace(/\$/g, '').toLowerCase();
  return extractSpecifics(summary).filter((tok) => !haystack.includes(tok));
}
