// Turns the flat list of blocks imported from each old WordPress service page into sections
// that can be laid out properly: headings, paragraphs, card grids and checklists.

export interface Block {
  k: string; // h | item | kicker | p | li
  t: string;
  tag: string;
}

export type Node =
  | { type: "heading"; text: string }
  | { type: "sub"; text: string }
  | { type: "p"; text: string }
  | { type: "cards"; items: { title: string; text?: string }[] }
  | { type: "list"; items: { label?: string; text: string }[] };

const isHeading = (b?: Block) => !!b && (b.k === "h" || b.k === "item" || b.k === "kicker");
const SHORT = 120;

/** Splits "Label: text" list items so the label can be bolded. */
function splitLabel(t: string) {
  const m = t.match(/^([^:]{2,48}):\s+(.+)$/);
  return m ? { label: m[1], text: m[2] } : { text: t };
}

export function parseService(blocks: Block[], title: string) {
  const b = [...blocks];
  let tagline: string | undefined;
  let lede: string | undefined;

  // The page's own title repeated as its first heading adds nothing; a different first heading is a tagline.
  if (b[0] && isHeading(b[0])) {
    const first = b.shift()!;
    if (first.t.toLowerCase() !== title.toLowerCase()) tagline = first.t;
  }
  // A short opening paragraph ("Bin Othaimeen's ... Services: ...") reads as a standfirst.
  if (b[0]?.k === "p" && b[0].t.length <= SHORT) lede = b.shift()!.t;

  const nodes: Node[] = [];
  for (let i = 0; i < b.length; i++) {
    const cur = b[i];
    const next = b[i + 1];

    // A run of (heading + one short paragraph) pairs, or of bare headings, becomes a card grid
    const mode = isHeading(cur) ? cardStart(b, i) : null;
    if (mode) {
      const items: { title: string; text?: string }[] = [];
      if (mode === "pair") {
        while (isPair(b, i)) {
          items.push({ title: b[i].t, text: b[i + 1].t });
          i += 2;
        }
      } else {
        while (isHeading(b[i]) && b[i].tag === cur.tag) items.push({ title: b[i++].t });
      }
      i -= 1;
      nodes.push({ type: "cards", items });
      continue;
    }
    if (isHeading(cur)) {
      nodes.push({ type: "heading", text: cur.t });
      continue;
    }
    if (cur.k === "li") {
      const items = [];
      while (b[i]?.k === "li") items.push(splitLabel(b[i++].t));
      i -= 1;
      nodes.push({ type: "list", items });
      continue;
    }
    // Short paragraph straight after a heading (or before a list) is a sub-heading
    if (cur.k === "p" && cur.t.length <= 90 && !/[.!?]$/.test(cur.t) && (next?.k === "p" || next?.k === "li")) {
      nodes.push({ type: "sub", text: cur.t });
      continue;
    }
    nodes.push({ type: "p", text: cur.t });
  }
  return { tagline, lede, nodes };
}

/** A heading followed by exactly one paragraph, then another heading or the end. */
function isPair(b: Block[], j: number) {
  return isHeading(b[j]) && b[j + 1]?.k === "p" && (isHeading(b[j + 2]) || j + 2 >= b.length);
}

/** "pair" when two heading+paragraph pairs start at i, "bare" for three same-level headings in a row. */
function cardStart(b: Block[], i: number): "pair" | "bare" | null {
  if (isPair(b, i) && isPair(b, i + 2)) return "pair";
  const t = b[i].tag;
  if (b[i + 1]?.tag === t && b[i + 2]?.tag === t && isHeading(b[i + 1]) && isHeading(b[i + 2])) return "bare";
  return null;
}
