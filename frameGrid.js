// Vanilla port of a "dynamic frame layout" video mosaic (the hover-expand
// grid effect popularized by Luma Labs' site) — the React/framer-motion
// version this project was handed relies on React state + CSS transitions;
// this does the same thing with plain DOM + inline grid-template styles,
// consistent with the rest of this vanilla Vite site.
//
// Hovering a cell enlarges its whole row AND whole column (via
// grid-template-rows/columns), so the hovered cell reads as the biggest
// tile while cells sharing its row or column go medium and everything else
// shrinks — only the actually-hovered cell's video plays.
export function initFrameGrid(container, items, { cols = 3, hoverSize = 6, gapSize = 4 } = {}) {
  if (!items.length) return;

  const rows = Math.ceil(items.length / cols);
  const nonHoveredSize = (12 - hoverSize) / 2;

  container.style.display = 'grid';
  container.style.gap = `${gapSize}px`;
  container.style.transition = 'grid-template-rows 0.4s ease, grid-template-columns 0.4s ease';

  function applySizes(hovered) {
    container.style.gridTemplateRows = Array.from({ length: rows }, (_, r) =>
      hovered && r === hovered.row ? `${hoverSize}fr` : `${nonHoveredSize}fr`
    ).join(' ');
    container.style.gridTemplateColumns = Array.from({ length: cols }, (_, c) =>
      hovered && c === hovered.col ? `${hoverSize}fr` : `${nonHoveredSize}fr`
    ).join(' ');
  }
  applySizes(null);

  items.forEach((item, i) => {
    const row = Math.floor(i / cols);
    const col = i % cols;

    const cell = document.createElement('div');
    cell.className = 'frame-cell';
    cell.innerHTML = `
      <video muted loop playsinline preload="none" poster="${item.poster}" data-src="${item.video}"></video>
      <div class="frame-cell-scrim"></div>
      <div class="frame-cell-spinner" aria-hidden="true"></div>
      <p class="frame-cell-label">${item.title}</p>
    `;
    const video = cell.querySelector('video');
    // Some clips take a moment to actually start playing after src is
    // assigned — is-buffering shows a small spinner for that window, so
    // hovering doesn't look like nothing is happening.
    video.addEventListener('playing', () => cell.classList.remove('is-buffering'));
    video.addEventListener('waiting', () => cell.classList.add('is-buffering'));

    cell.addEventListener('mouseenter', () => {
      applySizes({ row, col });
      if (video.readyState < 3) cell.classList.add('is-buffering');
      if (!video.src) video.src = video.dataset.src;
      video.play().catch(() => {});
    });
    cell.addEventListener('mouseleave', () => {
      applySizes(null);
      video.pause();
      cell.classList.remove('is-buffering');
    });
    if (item.href) {
      cell.addEventListener('click', () => { window.location.href = item.href; });
    }

    container.appendChild(cell);
  });
}
