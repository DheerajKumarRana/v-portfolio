import p5 from 'p5';
import TOPOLOGY from 'vanta/dist/vanta.topology.min';

// Same pattern as vantaBackground.js (CLOUDS/THREE) but this effect runs on
// p5.js instead — passed in explicitly so it doesn't need a global.
// backgroundColor/color are overridable per page since the site mixes a
// dark cinematic page (tag.html) with light editorial ones (video-services.html).
export function initVantaTopology(el, { backgroundColor = 0x0a1220, color = 0x2d5f9e } = {}) {
  return TOPOLOGY({
    el,
    p5,
    mouseControls: true,
    touchControls: true,
    gyroControls: false,
    minHeight: 200.0,
    minWidth: 200.0,
    scale: 1.0,
    scaleMobile: 1.0,
    backgroundColor,
    color,
  });
}
