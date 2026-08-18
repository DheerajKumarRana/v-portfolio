import * as THREE from 'three';
import CLOUDS from 'vanta/dist/vanta.clouds.min';

// Vanta ships as a UMD module that looks for a global `THREE` unless one is
// passed in via options — passing it explicitly avoids relying on a global
// and keeps everything on the single `three` copy Vite already bundles.
export function initVantaBackground(el) {
  return CLOUDS({
    el,
    THREE,
    mouseControls: true,
    touchControls: true,
    gyroControls: false,
    minHeight: 200.0,
    minWidth: 200.0,
    backgroundColor: 0xf4f4f4,
    skyColor: 0xd2e0ea,
    cloudColor: 0xc3ccd6,
    cloudShadowColor: 0x60748a,
    sunColor: 0xd6dfe8,
    sunGlareColor: 0xd8e2ea,
    sunlightColor: 0xd0dae4,
    speed: 1,
  });
}
