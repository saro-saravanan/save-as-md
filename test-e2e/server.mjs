// Local site for the end-to-end tests: the regression fixture pages plus pages with awkward images.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

const IMAGE = await readFile('icons/icon-128.png'); // a real 128×128 PNG, above the 32 px cut-off
const paragraphs = (n) =>
  Array.from({ length: n }, (_, i) => `<p>Paragraph ${i + 1} explains one more thing about saving pages, with enough words that the extractor treats this as the body of an article worth keeping.</p>`).join('\n');

export function startServer() {
  return new Promise((resolve) => {
    const server = createServer(async (req, res) => {
      const port = server.address().port;
      const url = new URL(req.url, `http://localhost:${port}`);
      const send = (status, type, body) => {
        res.writeHead(status, { 'content-type': type });
        res.end(body);
      };

      if (url.pathname.startsWith('/fixtures/')) {
        try {
          return send(200, 'text/html; charset=utf-8', await readFile(`test/fixtures/pages/${url.pathname.slice(10)}`));
        } catch {
          return send(404, 'text/plain', 'not found');
        }
      }
      if (url.pathname.startsWith('/img/')) return send(200, 'image/png', IMAGE);
      // Extension-less CDN-style URL with a generic content type.
      if (url.pathname === '/cdn/photo') return send(200, 'application/octet-stream', IMAGE);
      // Hotlink protection: only serves the image when the request comes from one of this site's pages.
      if (url.pathname === '/protected/photo.png') {
        const fromPage = (req.headers.referer || '').startsWith(`http://localhost:${port}/`);
        return fromPage ? send(200, 'image/png', IMAGE) : send(403, 'text/plain', 'hotlinking not allowed');
      }
      if (url.pathname === '/images.html') {
        return send(200, 'text/html; charset=utf-8', `<!doctype html><html><head><title>Images of every kind</title></head><body>
          <article><h1>Images of every kind</h1>
          ${paragraphs(3)}
          <p><img src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" data-src="/img/lazy.png" width="400" height="300" alt="Lazy loaded"></p>
          <p><img src="http://127.0.0.1:${port}/img/other-origin.png" width="400" height="300" alt="Other origin"></p>
          <p><img src="/protected/photo.png" width="400" height="300" alt="Hotlink protected"></p>
          <p><img src="/cdn/photo" width="400" height="300" alt="No extension"></p>
          ${paragraphs(3)}
          </article></body></html>`);
      }
      if (url.pathname === '/empty.html') {
        return send(200, 'text/html; charset=utf-8', '<!doctype html><html><head><title>App</title></head><body><div id="root"></div><canvas width="600" height="400"></canvas></body></html>');
      }
      // Code examples rendered by a web component into its shadow root, the way MDN does it.
      if (url.pathname === '/components.html') {
        return send(200, 'text/html; charset=utf-8', `<!doctype html><html><head><title>Component docs</title></head><body>
          <article><h1>Component docs</h1>${paragraphs(3)}<code-example data-code="const answer = await fetch(url);"></code-example>${paragraphs(3)}</article>
          <script>customElements.define('code-example', class extends HTMLElement {
            connectedCallback() { const pre = document.createElement('pre'); pre.className = 'language-js'; pre.textContent = this.dataset.code;
              this.attachShadow({ mode: 'open' }).append(pre); }
          });</script></body></html>`);
      }
      // A strict page: no frames, no inline styles. SaveMD's notice and Open button must still work.
      if (url.pathname === '/strict.html') {
        res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'content-security-policy': "default-src 'self'; frame-src 'none'; style-src 'none'" });
        return res.end(`<!doctype html><html><head><title>Strict page</title></head><body><article><h1>Strict page</h1>${paragraphs(4)}</article></body></html>`);
      }
      // Like sites (Reddit) whose own UI lives in the browser's top layer, above any z-index.
      if (url.pathname === '/overlay.html') {
        return send(200, 'text/html; charset=utf-8', `<!doctype html><html><head><title>Covered page</title>
          <style>#cover { position: fixed; inset: 0; width: auto; height: auto; margin: 0; border: 0; background: #fff; }</style></head><body>
          <article><h1>Covered page</h1>${paragraphs(4)}</article>
          <div id="cover" popover="manual"></div>
          <script>document.getElementById('cover').showPopover();</script></body></html>`);
      }
      if (url.pathname === '/pick.html') {
        return send(200, 'text/html; charset=utf-8', `<!doctype html><html><head><title>Pick test</title></head><body>
          <nav>Site navigation</nav>
          <section id="wanted"><h2>Only this part</h2><p>The picked section should be the only content in the saved file.</p></section>
          <section id="unwanted"><h2>Not this part</h2><p>Text that must not be saved when the other section is picked.</p></section>
          </body></html>`);
      }
      send(404, 'text/plain', 'not found');
    });
    server.listen(0, () => resolve(server)); // all interfaces: tests use both localhost and 127.0.0.1
  });
}
