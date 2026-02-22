import type { Root, Blockquote, Paragraph, Text } from "mdast";

const MARKER = /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i;

function walk(node: { children?: any[] }) {
  if (!node.children) return;
  for (const child of node.children) {
    if (child.type === "blockquote") tryTransform(child as Blockquote);
    walk(child);
  }
}

function tryTransform(node: Blockquote) {
  const firstParagraph = node.children[0] as Paragraph | undefined;
  if (!firstParagraph || firstParagraph.type !== "paragraph") return;

  const firstText = firstParagraph.children[0] as Text | undefined;
  if (!firstText || firstText.type !== "text") return;

  const firstLine = firstText.value.split("\n")[0];
  const match = firstLine.match(MARKER);
  if (!match) return;

  const typeKey = match[1].toLowerCase();

  // Remove the [!TYPE] marker from the text
  const newlineIdx = firstText.value.indexOf("\n");
  if (newlineIdx >= 0) {
    firstText.value = firstText.value.slice(newlineIdx + 1);
  } else if (firstParagraph.children.length === 1) {
    node.children.shift();
  } else {
    firstParagraph.children.shift();
    if (firstParagraph.children[0]?.type === "break") {
      firstParagraph.children.shift();
    }
  }

  (node as any).data = {
    hProperties: { className: ["callout", `callout-${typeKey}`] },
  };
}

export function remarkCallout() {
  return (tree: Root) => walk(tree);
}
