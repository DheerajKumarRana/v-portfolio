// Shared content for video-services.html and tag.html — single source of
// truth so both pages describe the same 7 categories consistently.

// A small pool of portraits already proven to load elsewhere in this app
// (photo.js's gallery) — reused here as "behind the lens" filler shots so
// every showcase grid uses only known-good image URLs.
const PORTRAITS = {
  marcus: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=700&q=80',
  james: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=700&q=80',
  nina: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=700&q=80',
  ava: 'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=700&q=80',
  elle: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=700&q=80',
  sophia: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=700&q=80',
};

// Public sample clips (Google's long-standing test-video bucket) used purely
// as dummy placeholder footage for the tag showcase — cycled across
// categories rather than sourced per-tag.
const SAMPLE_VIDEOS = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
];

export const SERVICES = [
  {
    title: 'Corporate',
    blurb: 'Events, conferences, and product stories built for the boardroom and beyond.',
    tags: ['Event', 'Conference', 'Product Info'],
    img: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=700&q=80',
      PORTRAITS.marcus,
      PORTRAITS.james,
      'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=500&q=80',
    ],
    heroVideo: SAMPLE_VIDEOS[1],
    videos: [SAMPLE_VIDEOS[1], SAMPLE_VIDEOS[0], SAMPLE_VIDEOS[3], SAMPLE_VIDEOS[2]],
  },
  {
    title: 'Real Estate',
    blurb: 'Spaces that sell themselves — interiors, architecture, and aerials that move buyers.',
    tags: ['Interior', 'Architecture', 'Drone', 'Walkthrough', 'Testimonial'],
    img: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=700&q=80',
      PORTRAITS.james,
      PORTRAITS.nina,
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=500&q=80',
    ],
    heroVideo: SAMPLE_VIDEOS[2],
    videos: [SAMPLE_VIDEOS[2], SAMPLE_VIDEOS[5], SAMPLE_VIDEOS[0], SAMPLE_VIDEOS[4]],
  },
  {
    title: 'Hospitality',
    blurb: 'Food, festivals, and service moments shot to make people want to walk in the door.',
    tags: ['Food', 'Events', 'Services', 'Festival Campaigns'],
    img: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=700&q=80',
      PORTRAITS.ava,
      PORTRAITS.elle,
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=500&q=80',
    ],
    heroVideo: SAMPLE_VIDEOS[3],
    videos: [SAMPLE_VIDEOS[3], SAMPLE_VIDEOS[1], SAMPLE_VIDEOS[5], SAMPLE_VIDEOS[0]],
  },
  {
    title: 'Products',
    blurb: 'From shelf to screen — D2C, FMCG, industrial, and medical, shot to convert.',
    tags: ['D2C', 'FMCG', 'Industrial', 'Medical & Others'],
    img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=700&q=80',
      PORTRAITS.nina,
      PORTRAITS.marcus,
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80',
    ],
    heroVideo: SAMPLE_VIDEOS[0],
    videos: [SAMPLE_VIDEOS[0], SAMPLE_VIDEOS[4], SAMPLE_VIDEOS[2], SAMPLE_VIDEOS[3]],
  },
  {
    title: 'Fashion & Jewellery',
    blurb: 'Every facet catches light — close-ups, ASMR, on-model, and AI-assisted product sets.',
    tags: ['Close-up Shots', 'ASMR', 'With Model', 'AI', 'Product Photos', 'Listing Photos', 'Banners'],
    img: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=700&q=80',
      PORTRAITS.sophia,
      PORTRAITS.elle,
      'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500&q=80',
    ],
    heroVideo: SAMPLE_VIDEOS[5],
    videos: [SAMPLE_VIDEOS[5], SAMPLE_VIDEOS[3], SAMPLE_VIDEOS[1], SAMPLE_VIDEOS[2]],
  },
  {
    title: 'Events',
    blurb: 'Corporate, social, birthdays, sport — every occasion, covered start to finish.',
    tags: ['Corporate Event', 'Social Event', 'Birthday Parties', 'Sports Event'],
    img: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=700&q=80',
      PORTRAITS.ava,
      PORTRAITS.sophia,
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=500&q=80',
    ],
    heroVideo: SAMPLE_VIDEOS[4],
    videos: [SAMPLE_VIDEOS[4], SAMPLE_VIDEOS[0], SAMPLE_VIDEOS[3], SAMPLE_VIDEOS[5]],
  },
  {
    title: 'Podcast',
    blurb: 'Conversations that carry — talking heads, walk-and-talks, and lessons that land.',
    tags: ['Talking Head Videos', 'Podcast', 'Walking & Talking Shots', 'Testimonial', 'Educational'],
    img: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=700&q=80',
      PORTRAITS.marcus,
      PORTRAITS.nina,
      'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=500&q=80',
    ],
    heroVideo: SAMPLE_VIDEOS[3],
    videos: [SAMPLE_VIDEOS[3], SAMPLE_VIDEOS[2], SAMPLE_VIDEOS[1], SAMPLE_VIDEOS[0]],
  },
];

// A gallery wall needs more than 4 frames to look like a wall — cycle each
// category's small hand-picked pool up to a full set rather than sourcing
// 14 unique clips/photos per category by hand.
const SHOWCASE_COUNT = 14;
function expand(arr, count) {
  return Array.from({ length: count }, (_, i) => arr[i % arr.length]);
}
SERVICES.forEach((service) => {
  service.videos = expand(service.videos, SHOWCASE_COUNT);
  service.gallery = expand(service.gallery, SHOWCASE_COUNT);
});

export function findService(categoryTitle) {
  return SERVICES.find(s => s.title.toLowerCase() === String(categoryTitle).toLowerCase());
}
