// Packets turn over on click (or Enter/Space: they are buttons) to show the Markdown they became.
const packets = [...document.querySelectorAll('.packet')];
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let turnedByVisitor = false;

const isTurned = (packet) => packet.getAttribute('aria-pressed') === 'true';
const turn = (packet, turned) => packet.setAttribute('aria-pressed', String(turned));

for (const packet of packets) {
  packet.addEventListener('click', () => {
    turnedByVisitor = true;
    turn(packet, !isTurned(packet));
  });
}

// "Turn a packet over" turns the next packet and puts the others face up, so each press shows the next page's Markdown.
document.getElementById('turn-next')?.addEventListener('click', () => {
  if (!packets.length) return;
  turnedByVisitor = true;
  const last = packets.findLastIndex(isTurned);
  const next = packets[(last + 1) % packets.length];
  for (const packet of packets) turn(packet, packet === next);
  // Bring it into view: below the copy on narrow screens, and along the sideways shelf on phones.
  next.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest', inline: 'center' });
});

// Show the idea once: if the visitor hasn't turned a packet within a couple of seconds, turn the first.
if (packets.length && !reduceMotion) {
  setTimeout(() => {
    if (!turnedByVisitor) turn(packets[0], true);
  }, 2400);
}
