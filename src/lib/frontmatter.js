const KEYS = ['title', 'source', 'site', 'author', 'published', 'saved'];
const yamlString = (v) => `"${String(v).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r?\n/g, ' ')}"`;

export function buildFrontmatter(meta) {
  const lines = ['---'];
  for (const key of KEYS) if (meta[key]) lines.push(`${key}: ${yamlString(meta[key])}`);
  lines.push('---');
  return lines.join('\n');
}
