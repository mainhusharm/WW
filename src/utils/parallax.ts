export function bindTilt(el: HTMLElement) {
  const max = 7;
  el.addEventListener('mousemove', (e) => {
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(1000px) rotateX(${-py * max}deg) rotateY(${px * max}deg) translateZ(0)`;
  });
  el.addEventListener('mouseleave', () => {
    el.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
  });
}
