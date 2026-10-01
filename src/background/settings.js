export const DEFAULTS = { redditMode: 'top', siteModes: {}, saved: {} };

export const getSettings = () => chrome.storage.local.get(DEFAULTS);
export const patchSettings = (patch) => chrome.storage.local.set(patch);

export async function setSiteMode(host, mode) {
  const { siteModes } = await getSettings();
  const next = { ...siteModes };
  if (mode === 'auto') delete next[host];
  else next[host] = mode;
  await patchSettings({ siteModes: next });
}
