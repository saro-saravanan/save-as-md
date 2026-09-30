export class FakeDir {
  constructor(name = 'root', failOn = null) {
    this.name = name;
    this.kind = 'directory';
    this.entries = new Map();
    this.failOn = failOn;
  }
  async getDirectoryHandle(name, { create = false } = {}) {
    let e = this.entries.get(name);
    if (!e) {
      if (!create) throw new DOMException('not found', 'NotFoundError');
      e = new FakeDir(name, this.failOn);
      this.entries.set(name, e);
    }
    if (e.kind !== 'directory') throw new DOMException('type mismatch', 'TypeMismatchError');
    return e;
  }
  async getFileHandle(name, { create = false } = {}) {
    let e = this.entries.get(name);
    if (!e) {
      if (!create) throw new DOMException('not found', 'NotFoundError');
      e = new FakeFile(name, this.failOn);
      this.entries.set(name, e);
    }
    return e;
  }
  async removeEntry(name) {
    if (!this.entries.delete(name)) throw new DOMException('not found', 'NotFoundError');
  }
  async queryPermission() {
    return 'granted';
  }
  async tree(prefix = '') {
    const out = {};
    for (const [n, e] of this.entries) {
      if (e.kind === 'directory') Object.assign(out, await e.tree(`${prefix}${n}/`));
      else out[`${prefix}${n}`] = e.content;
    }
    return out;
  }
}

class FakeFile {
  constructor(name, failOn) {
    this.name = name;
    this.kind = 'file';
    this.content = null;
    this.failOn = failOn;
  }
  async createWritable() {
    const file = this;
    let buf = '';
    return {
      async write(blob) {
        if (file.failOn === file.name) throw new Error('disk full');
        buf += typeof blob === 'string' ? blob : await blob.text();
      },
      async close() {
        file.content = buf;
      },
    };
  }
}
