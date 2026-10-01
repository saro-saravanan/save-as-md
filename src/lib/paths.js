export function vscodeFileUrl(absPath) {
  const segments = absPath.replace(/\\/g, '/').split('/')
    .map((seg, i) => (i === 0 && /^[A-Za-z]:$/.test(seg) ? seg : encodeURIComponent(seg)));
  return `vscode://file/${segments.join('/').replace(/^\//, '')}`;
}
