// Packets turn over on click (or Enter/Space: they are buttons) to show the Markdown they became.
const packets = [...document.querySelectorAll('.packet')];
let turnedByVisitor = false;

for (const packet of packets) {
  packet.addEventListener('click', () => {
    turnedByVisitor = true;
    packet.setAttribute('aria-pressed', String(packet.getAttribute('aria-pressed') !== 'true'));
  });
}

// Show the idea once: if the visitor hasn't turned a packet within a couple of seconds, turn the first.
if (packets.length && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  setTimeout(() => {
    if (!turnedByVisitor) packets[0].setAttribute('aria-pressed', 'true');
  }, 2400);
}
