// Builds the one-line PowerShell command the Options page offers for linking Downloads\WebClips to a
// folder of the person's choice (a directory junction; Chrome's downloads write straight through it).
// Pasted into Windows Terminal, it: creates the folder, moves pages already in a real WebClips into it
// (stopping before any move if a name clashes), replaces an old link, and creates the new one.

const psQuote = (s) => `'${s.replace(/'/g, "''")}'`;
const ABSOLUTE = /^([A-Za-z]:\\|\\\\[^\\]+\\[^\\]+)/;
const INSIDE_WEBCLIPS = /\\WebClips(\\|$)/i;

export function checkTarget(target) {
  const t = (target || '').trim();
  if (!ABSOLUTE.test(t)) return 'Type the full path of a folder, like C:\\Users\\you\\Documents\\Clips.';
  if (INSIDE_WEBCLIPS.test(t)) return "Pick a folder outside Downloads\\WebClips: that's the folder being linked.";
  return null;
}

// downloadsDir: Chrome's download folder when known (from an earlier save); otherwise Windows is asked,
// which is right unless Chrome's download location was changed.
export function linkCommand({ target, downloadsDir }) {
  const downloads = downloadsDir
    ? psQuote(downloadsDir)
    : "(New-Object -ComObject Shell.Application).NameSpace('shell:Downloads').Self.Path";
  return [
    "$ErrorActionPreference='Stop'",
    `$t=${psQuote(target.trim())}`,
    `$d=${downloads}`,
    "$w=Join-Path $d 'WebClips'",
    'New-Item -ItemType Directory -Force -Path $t | Out-Null',
    '$i=Get-Item -LiteralPath $w -Force -ErrorAction SilentlyContinue',
    'if ($i -and $i.LinkType) { $i.Delete() } elseif ($i) { '
      + '$c=Get-ChildItem -LiteralPath $w -Force | Where-Object { Test-Path -LiteralPath (Join-Path $t $_.Name) } | Select-Object -First 1; '
      + "if ($c) { throw ('\"' + $t + '\" already has \"' + $c.Name + '\". Move or rename it, then run this again.') }; "
      + 'Get-ChildItem -LiteralPath $w -Force | Move-Item -Destination $t; Remove-Item -LiteralPath $w }',
    'New-Item -ItemType Junction -Path $w -Target $t | Out-Null',
    "Write-Output ('Linked ' + $w + ' -> ' + $t)",
  ].join('; ');
}
