import * as THREE from 'three';
import { initDial } from './dial.js';

// ==========================================
// 1. THREE.JS SETUP
// ==========================================
const canvas = document.querySelector('#webgl-canvas');
const scene = new THREE.Scene();
// No solid scene background — stays transparent so the Vanta clouds layer
// behind this canvas shows through (renderer is created with alpha: true)

// Camera placed at the center, optimized FOV for perfect sizing (60 degrees)
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 0);

// PerspectiveCamera's fov is the VERTICAL field of view — on a narrow
// portrait phone (aspect well under 1), a fixed 60° vertical fov leaves
// horizontal fov much narrower than on desktop, so far fewer images are
// visible at once and each looks oddly zoomed in. Widening the vertical fov
// as aspect drops keeps roughly the same amount of the gallery visible;
// desktop/landscape (aspect >= 1) is untouched.
function updateCameraFov() {
  const aspect = window.innerWidth / window.innerHeight;
  camera.aspect = aspect;
  camera.fov = aspect < 1 ? Math.min(92, 60 + (1 - aspect) * 40) : 60;
  camera.updateProjectionMatrix();
}
updateCameraFov();

const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
  alpha: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// ==========================================
// 2. CYLINDER GALLERY SETUP
// ==========================================
const galleryGroup = new THREE.Group();
scene.add(galleryGroup);

const textureLoader = new THREE.TextureLoader();

const imageUrls = [
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&q=80',
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&q=80',
  'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=600&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&q=80',
  'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=600&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80',
  'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=600&q=80',
  'https://images.unsplash.com/photo-1521119989659-a83eee488004?w=600&q=80',
  'https://images.unsplash.com/photo-1496345875659-11f7dd282d1d?w=600&q=80'
];

const numImages = imageUrls.length;
const radius = 10;

// Base dimensions
const baseWidth = 3.2;
const baseHeight = 4.2;

// Per-image scale factors: varied sizes
const scales = [1.3, 1.0, 1.15, 1.25, 0.95, 1.1, 1.35, 1.0, 1.2, 1.05, 1.3, 0.95, 1.15, 1.25];

// KEY FIX: Strong alternating HIGH-LOW pattern matching the reference exactly
// Reference shows: image HIGH near top, next image LOW near bottom, repeat
const yOffsets = [1.5, -1.3, 1.2, -1.5, 1.4, -1.2, 1.3, -1.4, 1.5, -1.1, 1.2, -1.5, 1.4, -1.3];

// Moderate tilts alternating direction
const zRotations = [-0.08, 0.06, -0.1, 0.08, -0.06, 0.1, -0.08, 0.06, -0.1, 0.08, -0.06, 0.1, -0.08, 0.06];

imageUrls.forEach((url, index) => {
  // Load texture
  const texture = textureLoader.load(url);
  texture.colorSpace = THREE.SRGBColorSpace;

  // Per-image scaling for mixed sizes
  const scale = scales[index % scales.length];
  const w = baseWidth * scale;
  const h = baseHeight * scale;

  // Create Plane with individual size
  const geometry = new THREE.PlaneGeometry(w, h);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.DoubleSide,
    transparent: true
  });
  const plane = new THREE.Mesh(geometry, material);

  // Calculate position in a circle
  const angle = (index / numImages) * Math.PI * 2;

  // Position
  plane.position.x = Math.sin(angle) * radius;
  plane.position.z = Math.cos(angle) * radius;

  // Rotate to face inwards
  plane.rotation.y = angle;

  // Apply staggering
  plane.position.y = yOffsets[index % yOffsets.length];
  plane.rotation.z = zRotations[index % zRotations.length];

  // Slight X tilt
  plane.rotation.x = -0.05;

  galleryGroup.add(plane);
});

// Add ambient light for better colors (though using BasicMaterial it's not strictly needed)
const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

// ==========================================
// 3. INFINITE SCROLL ANIMATION
// ==========================================
let targetRotation = 0;
let currentRotation = 0;

// Handle Mouse Wheel
window.addEventListener('wheel', (e) => {
  // Ignore scroll if hovering over the nav dial — it has its own wheel handler
  if (e.target.closest('.photo-page-menu')) return;
  ensureWindAudio();
  targetRotation += e.deltaY * 0.002;
});

// Handle Touch for Mobile
let touchStartX = 0;
let touchStartY = 0;
window.addEventListener('touchstart', (e) => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
});
window.addEventListener('touchmove', (e) => {
  ensureWindAudio();
  const touchX = e.touches[0].clientX;
  const touchY = e.touches[0].clientY;

  // Use the larger delta (either X or Y) to feel natural
  const deltaX = touchStartX - touchX;
  const deltaY = touchStartY - touchY;

  if (Math.abs(deltaY) > Math.abs(deltaX)) {
    targetRotation += deltaY * 0.003;
  } else {
    targetRotation += deltaX * 0.003;
  }

  touchStartX = touchX;
  touchStartY = touchY;
});

// ==========================================
// 3b. WIND WHOOSH — the gallery images "fly" past in 3D as you spin it, so a
// filtered-noise whoosh that swells with rotation speed sells that motion,
// easing back to silence at rest rather than a repeated one-shot effect
// ==========================================
let windAudioCtx, windGain, windFilter;

function ensureWindAudio() {
  if (windAudioCtx) {
    if (windAudioCtx.state === 'suspended') windAudioCtx.resume();
    return;
  }
  windAudioCtx = new (window.AudioContext || window.webkitAudioContext)();

  const bufferSeconds = 2;
  const bufferSize = windAudioCtx.sampleRate * bufferSeconds;
  const buffer = windAudioCtx.createBuffer(1, bufferSize, windAudioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

  const noiseSource = windAudioCtx.createBufferSource();
  noiseSource.buffer = buffer;
  noiseSource.loop = true;

  windFilter = windAudioCtx.createBiquadFilter();
  windFilter.type = 'bandpass';
  windFilter.frequency.value = 350;
  windFilter.Q.value = 0.6;

  windGain = windAudioCtx.createGain();
  windGain.gain.value = 0;

  noiseSource.connect(windFilter);
  windFilter.connect(windGain);
  windGain.connect(windAudioCtx.destination);
  noiseSource.start();
}

// ==========================================
// 4. ANIMATION LOOP & RESIZE
// ==========================================

let prevRotation = currentRotation;

function animate() {
  requestAnimationFrame(animate);

  // Smoothly interpolate rotation for that buttery GSAP feel
  currentRotation += (targetRotation - currentRotation) * 0.05;
  galleryGroup.rotation.y = currentRotation;

  // Wind swells with how fast the gallery is spinning, eases back to
  // silence at rest — angular velocity is tiny (radians/frame), so scale it
  // up to roughly the same 0-60 "speed" range the sound mapping expects
  if (windGain) {
    const angularVelocity = currentRotation - prevRotation;
    prevRotation = currentRotation;
    const speed = Math.min(Math.abs(angularVelocity) * 500, 60);
    // sqrt curve instead of linear — boosts quiet/slow scrolling so it's
    // still audible, without pushing fast scrolling too loud
    const targetGain = speed > 0.3 ? Math.sqrt(speed / 60) * 0.14 : 0;
    windGain.gain.value += (targetGain - windGain.gain.value) * 0.08;
    windFilter.frequency.value = 300 + speed * 9;
  }

  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  updateCameraFov();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ==========================================
// 5. MENU INTERACTION — shared nav dial module
// ==========================================
initDial();

// ==========================================
// 6. VANTA CLOUDS BACKGROUND
// ==========================================
// Dynamically imported so the gallery/dial above can render and become
// interactive without waiting on this decorative layer to load first
import('./vantaBackground.js').then(({ initVantaBackground }) => {
  initVantaBackground('#vanta-bg');
});
