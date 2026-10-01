// Points Downloads\WebClips (where SaveMD saves) at a folder of your choice, using a Windows
// directory junction. Chrome writes through the junction, so pages land in your folder with no
// permission prompts. Pages already in a real WebClips folder are moved across first.
//
//   npm run link -- "C:\Users\you\OneDrive\Clips"
//   npm run link -- "C:\Users\you\OneDrive\Clips" --downloads "D:\Downloads"
import { mkdir, readdir, rename, lstat, realpath, rmdir, unlink, symlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export async function linkWebClips({ downloadsDir, target }) {
  const webclips = join(downloadsDir, 'WebClips');
  const absTarget = resolve(target);
  await mkdir(absTarget, { recursive: true });

  let moved = 0;
  const info = existsSync(webclips) ? await lstat(webclips) : null;
  if (info?.isSymbolicLink()) {
    if ((await realpath(webclips)) === (await realpath(absTarget))) return 'already linked';
    await removeLink(webclips);
    await symlink(absTarget, webclips, 'junction');
    return 'relinked';
  }
  if (info) {
    const entries = await readdir(webclips);
    // Check every name first so a clash leaves everything exactly as it was.
    const taken = new Set(await readdir(absTarget));
    const clash = entries.find((name) => taken.has(name));
    if (clash) throw new Error(`"${absTarget}" already has "${clash}". Move or rename it, then run this again.`);
    for (const name of entries) await rename(join(webclips, name), join(absTarget, name));
    moved = entries.length;
    await rmdir(webclips);
  }
  await symlink(absTarget, webclips, 'junction');
  return moved ? `moved ${moved} item${moved === 1 ? '' : 's'} and linked` : 'linked';
}

async function removeLink(path) {
  try {
    await unlink(path);
  } catch {
    await rmdir(path); // Windows junctions are removed as directories
  }
}

// Chrome's default download folder is the Windows "Downloads" known folder, which may be moved
// (for example into OneDrive), so ask Windows rather than assuming %USERPROFILE%\Downloads.
function windowsDownloadsFolder() {
  const ps = "(New-Object -ComObject Shell.Application).NameSpace('shell:Downloads').Self.Path";
  return execFileSync('powershell.exe', ['-NoProfile', '-Command', ps], { encoding: 'utf8' }).trim();
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const args = process.argv.slice(2);
  const flag = args.indexOf('--downloads');
  const downloadsDir = flag >= 0 ? args.splice(flag, 2)[1] : windowsDownloadsFolder();
  const [target] = args;
  if (!target) {
    console.error('Usage: npm run link -- "<folder where saved pages should go>" [--downloads "<Chrome download folder>"]');
    process.exit(1);
  }
  try {
    const outcome = await linkWebClips({ downloadsDir, target });
    console.log(`${outcome}: ${join(downloadsDir, 'WebClips')} → ${resolve(target)}`);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}
