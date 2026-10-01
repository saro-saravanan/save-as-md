const SINGLE_DOCUMENT = /single offscreen document/i;

export function createOffscreenClient(api) {
  let creating = null;

  async function ensureOffscreen() {
    if (await api.offscreen.hasDocument()) return;
    creating ??= api.offscreen
      .createDocument({ url: 'offscreen.html', reasons: ['BLOBS', 'CLIPBOARD'], justification: 'Write saved pages to the chosen folder and copy Markdown to the clipboard.' })
      // Two saves can both see "no document" before either creates it; the loser's error is harmless.
      .catch((err) => { if (!SINGLE_DOCUMENT.test(err?.message)) throw err; })
      .finally(() => { creating = null; });
    await creating;
  }

  async function call(type, payload = {}) {
    await ensureOffscreen();
    // Payload goes in its own field: spreading it would let a payload key (write's `target`) clobber the routing.
    const res = await api.runtime.sendMessage({ target: 'offscreen', type, payload });
    if (res === undefined) throw new Error(`The offscreen document did not answer "${type}".`);
    if (res?.ok === false) throw new Error(res.error);
    return res;
  }

  return {
    fetchImages: (jobId, images) => call('fetch-images', { jobId, images }),
    write: (args) => call('write', args),
    copy: (text) => call('copy', { text }),
    revoke: (urls) => call('revoke-urls', { urls }),
  };
}
