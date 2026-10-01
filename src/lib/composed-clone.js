// Copies a document the way it is displayed, including what web components render in their shadow
// roots. document.cloneNode(true) leaves shadow roots behind, so sites built from components (MDN's
// <mdn-code-example>, for one) lost that content entirely. Slots are filled with the page content
// assigned to them, or their fallback content when nothing is assigned. A component's own styles
// and scripts are not page content and are left out. The live page is never modified.

const NOT_CONTENT_IN_SHADOW = new Set(['STYLE', 'LINK', 'SCRIPT']);

export function composedClone(doc) {
  const copy = doc.cloneNode(false); // a Document clone keeps the URL
  for (const child of doc.childNodes) copy.appendChild(cloneNode(child, copy, false));
  return copy;
}

// One element's HTML as displayed, for Pick an area (outerHTML would drop its components' content).
export function composedOuterHTML(element) {
  return cloneNode(element, element.ownerDocument, false).outerHTML;
}

function cloneNode(node, ownerDoc, inShadow) {
  const copy = ownerDoc.importNode(node, false);
  if (node.nodeType !== 1) return copy;
  // A host shows its shadow tree, not its own children (those appear only where a slot takes them).
  const shown = node.shadowRoot ? node.shadowRoot.childNodes : node.childNodes;
  const childrenInShadow = inShadow || Boolean(node.shadowRoot);
  for (const child of shown) appendShown(copy, child, ownerDoc, childrenInShadow);
  return copy;
}

function appendShown(parent, node, ownerDoc, inShadow) {
  if (node.nodeType === 1 && inShadow) {
    if (node.tagName === 'SLOT') {
      const assigned = node.assignedNodes({ flatten: true });
      if (assigned.length) for (const n of assigned) appendShown(parent, n, ownerDoc, false);
      else for (const n of node.childNodes) appendShown(parent, n, ownerDoc, true);
      return;
    }
    if (NOT_CONTENT_IN_SHADOW.has(node.tagName)) return;
  }
  parent.appendChild(cloneNode(node, ownerDoc, inShadow));
}
