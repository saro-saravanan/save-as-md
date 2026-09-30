const TRACKING_PARAM = /^(utm_\w+|fbclid|gclid|dclid|msclkid|mc_cid|mc_eid|igshid|ref_src|si)$/i;
const ENTITIES = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&#x27;': "'" };

export function absolutize(href, baseUrl) {
  if (!href) return '';
  try {
    return new URL(href.trim(), baseUrl).href;
  } catch {
    return href;
  }
}

export function stripTracking(url) {
  let u;
  try {
    u = new URL(url);
  } catch {
    return url;
  }
  const tracking = [...u.searchParams.keys()].filter((k) => TRACKING_PARAM.test(k));
  if (!tracking.length) return url;
  for (const key of tracking) u.searchParams.delete(key);
  return u.href;
}

export function normalizeForDedupe(url) {
  try {
    const u = new URL(stripTracking(url));
    u.hash = '';
    return u.href.replace(/\/$/, '');
  } catch {
    return url;
  }
}

export function decodeEntities(s) {
  return s.replace(/&(amp|lt|gt|quot|#39|#x27);/g, (m) => ENTITIES[m]);
}
