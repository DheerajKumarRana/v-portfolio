// Shared content for services.html and tag.html — single source of
// truth so both pages describe the same 7 categories consistently.
//
// Corporate, Real Estate, Hospitality, Products, Fashion & Jewellery, and
// Events use real client footage (downloaded from the agency's own YouTube
// Shorts channel, with poster frames extracted from each clip via ffmpeg).
// Podcast has no matching footage in that batch, so it keeps placeholder
// sample clips.

// Placeholder-only pool, used solely by Podcast below (see note above).
const PORTRAITS = {
  marcus: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=700&q=80',
  nina: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=700&q=80',
};

const SAMPLE_VIDEOS = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
];

export const SERVICES = [
  {
    title: 'Corporate',
    blurb: 'Events, conferences, and product stories built for the boardroom and beyond.',
    tags: ['Event', 'Conference', 'Product Info'],
    img: '/media/corporate/Content_Shoot_for_Levi_s_Client_Project_by_Vistaar_Media.jpg',
    heroVideo: '/media/corporate/Content_Shoot_for_Levi_s_Client_Project_by_Vistaar_Media.mp4',
    videos: [
      '/media/corporate/Content_Shoot_for_Levi_s_Client_Project_by_Vistaar_Media.mp4',
      '/media/corporate/Content_Shoot_for_MARVAC_Professional.mp4',
      '/media/corporate/Creative_Content_by_Vistaar_Media_Client_Project.mp4',
    ],
    gallery: [
      '/media/corporate/Content_Shoot_for_Levi_s_Client_Project_by_Vistaar_Media.jpg',
      '/media/corporate/Content_Shoot_for_MARVAC_Professional.jpg',
      '/media/corporate/Creative_Content_by_Vistaar_Media_Client_Project.jpg',
    ],
  },
  {
    title: 'Real Estate',
    blurb: 'Spaces that sell themselves — interiors, architecture, and aerials that move buyers.',
    tags: ['Interior', 'Architecture', 'Drone', 'Walkthrough', 'Testimonial'],
    img: '/media/real-estate/From_Listing_to_Lifestyle_Real_Estate_Content_That_Connects_.jpg',
    heroVideo: '/media/real-estate/From_Listing_to_Lifestyle_Real_Estate_Content_That_Connects_.mp4',
    videos: [
      '/media/real-estate/From_Listing_to_Lifestyle_Real_Estate_Content_That_Connects_.mp4',
      '/media/real-estate/Interior_work_for_client_advertising_marketing_interiorvideo.mp4',
      '/media/real-estate/Real_estate_listings_that_actually_sell_Social_media_content.mp4',
    ],
    gallery: [
      '/media/real-estate/From_Listing_to_Lifestyle_Real_Estate_Content_That_Connects_.jpg',
      '/media/real-estate/Interior_work_for_client_advertising_marketing_interiorvideo.jpg',
      '/media/real-estate/Real_estate_listings_that_actually_sell_Social_media_content.jpg',
    ],
  },
  {
    title: 'Hospitality',
    blurb: 'Food, festivals, and service moments shot to make people want to walk in the door.',
    tags: ['Food', 'Events', 'Services', 'Festival Campaigns'],
    img: '/media/hospitality/Aurum_Where_Seafood_Meets_the_Good_Life_Vistaar_Media.jpg',
    heroVideo: '/media/hospitality/Aurum_Where_Seafood_Meets_the_Good_Life_Vistaar_Media.mp4',
    videos: [
      '/media/hospitality/Aurum_Where_Seafood_Meets_the_Good_Life_Vistaar_Media.mp4',
      '/media/hospitality/Content_Shoot_for_21st_Amendment_Shot_Crafted_by_Vistaar_Med.mp4',
      '/media/hospitality/Content_That_Makes_You_Crave.mp4',
      '/media/hospitality/Edit_made_for_one_of_our_clints_instagram_page_@Runway27_blr.mp4',
      '/media/hospitality/Evenings_at_Buffalo_Wild_Wings_Client_Project_by_Vistaar_Med.mp4',
      '/media/hospitality/Everyone_Tried..._But_Chef_Made_It_Look_Easy..mp4',
      '/media/hospitality/How_We_Shot_Content_for_21st_Amendment.mp4',
      '/media/hospitality/I_Wonder_If_It_s_Warm_In_There....mp4',
      '/media/hospitality/Inside_Runway27_s_Kitchen_Real_Behind_The_Scenes.mp4',
      '/media/hospitality/Inside_The_Aurum_Premium_Brand_Shoot_by_Vistaar_Media.mp4',
      '/media/hospitality/Messy_Bar._Clean_Content..mp4',
      '/media/hospitality/POV_-_The_Chef_Just_Activated_Your_Hunger_Switch.mp4',
      '/media/hospitality/Restaurant_Showcase_Video_by_Vistaar_Media_foodphotography_r.mp4',
      '/media/hospitality/The_Yard_Framed_Differently_A_Vistaar_Media_Project.mp4',
      '/media/hospitality/Thirsty_Your_Perfect_Drink_Awaits_at_Runway27.mp4',
      '/media/hospitality/Turning_the_Runway27_Experience_into_Scroll-Stopping_Content.mp4',
      '/media/hospitality/Waffles_Made_to_Look_Irresistible_Food_Content_by_Vistaar_Me.mp4',
      '/media/hospitality/When_Last_Order_Isn_t_the_Last.mp4',
      '/media/hospitality/Where_Food_Meets_Vibes.mp4',
      '/media/hospitality/Xochi_Bar_Kitchen_A_New_Creative_Cut_by_Vistaar_Media.mp4',
    ],
    gallery: [
      '/media/hospitality/Aurum_Where_Seafood_Meets_the_Good_Life_Vistaar_Media.jpg',
      '/media/hospitality/Content_Shoot_for_21st_Amendment_Shot_Crafted_by_Vistaar_Med.jpg',
      '/media/hospitality/Content_That_Makes_You_Crave.jpg',
      '/media/hospitality/Edit_made_for_one_of_our_clints_instagram_page_@Runway27_blr.jpg',
      '/media/hospitality/Evenings_at_Buffalo_Wild_Wings_Client_Project_by_Vistaar_Med.jpg',
      '/media/hospitality/Everyone_Tried..._But_Chef_Made_It_Look_Easy..jpg',
      '/media/hospitality/How_We_Shot_Content_for_21st_Amendment.jpg',
      '/media/hospitality/I_Wonder_If_It_s_Warm_In_There....jpg',
      '/media/hospitality/Inside_Runway27_s_Kitchen_Real_Behind_The_Scenes.jpg',
      '/media/hospitality/Inside_The_Aurum_Premium_Brand_Shoot_by_Vistaar_Media.jpg',
      '/media/hospitality/Messy_Bar._Clean_Content..jpg',
      '/media/hospitality/POV_-_The_Chef_Just_Activated_Your_Hunger_Switch.jpg',
      '/media/hospitality/Restaurant_Showcase_Video_by_Vistaar_Media_foodphotography_r.jpg',
      '/media/hospitality/The_Yard_Framed_Differently_A_Vistaar_Media_Project.jpg',
      '/media/hospitality/Thirsty_Your_Perfect_Drink_Awaits_at_Runway27.jpg',
      '/media/hospitality/Turning_the_Runway27_Experience_into_Scroll-Stopping_Content.jpg',
      '/media/hospitality/Waffles_Made_to_Look_Irresistible_Food_Content_by_Vistaar_Me.jpg',
      '/media/hospitality/When_Last_Order_Isn_t_the_Last.jpg',
      '/media/hospitality/Where_Food_Meets_Vibes.jpg',
      '/media/hospitality/Xochi_Bar_Kitchen_A_New_Creative_Cut_by_Vistaar_Media.jpg',
    ],
  },
  {
    title: 'Products',
    blurb: 'From shelf to screen — D2C, FMCG, industrial, and medical, shot to convert.',
    tags: ['D2C', 'FMCG', 'Industrial', 'Medical & Others'],
    img: '/media/products/A_Fresh_Take_on_Tea_Royal_Virasat_Natural_Tea_x_Vistaar_Medi.jpg',
    heroVideo: '/media/products/A_Fresh_Take_on_Tea_Royal_Virasat_Natural_Tea_x_Vistaar_Medi.mp4',
    videos: [
      '/media/products/A_Fresh_Take_on_Tea_Royal_Virasat_Natural_Tea_x_Vistaar_Medi.mp4',
      '/media/products/Behind_the_Camera_-_Vespa_BTS_Shoot_Vistaar_Media.mp4',
      '/media/products/More_Than_Just_Dry_Fruits.mp4',
      '/media/products/One_Visit_Is_Never_Enough_Manak_Mewa.mp4',
      '/media/products/Real_Juice_Real_Refreshment_A_Vistaar_Media_Project.mp4',
      '/media/products/This_Snack_Is_Hard_to_Put_Down_Manak_Mewa_Feature.mp4',
      '/media/products/Vistaar_Networks_-_Your_Premier_Destination_for_Digital_Lear.mp4',
    ],
    gallery: [
      '/media/products/A_Fresh_Take_on_Tea_Royal_Virasat_Natural_Tea_x_Vistaar_Medi.jpg',
      '/media/products/Behind_the_Camera_-_Vespa_BTS_Shoot_Vistaar_Media.jpg',
      '/media/products/More_Than_Just_Dry_Fruits.jpg',
      '/media/products/One_Visit_Is_Never_Enough_Manak_Mewa.jpg',
      '/media/products/Real_Juice_Real_Refreshment_A_Vistaar_Media_Project.jpg',
      '/media/products/This_Snack_Is_Hard_to_Put_Down_Manak_Mewa_Feature.jpg',
      '/media/products/Vistaar_Networks_-_Your_Premier_Destination_for_Digital_Lear.jpg',
    ],
  },
  {
    title: 'Fashion & Jewellery',
    blurb: 'Every facet catches light — close-ups, ASMR, on-model, and AI-assisted product sets.',
    tags: ['Close-up Shots', 'ASMR', 'With Model', 'AI', 'Product Photos', 'Listing Photos', 'Banners'],
    img: '/media/fashion-jewellery/Jewelry_That_Deserves_the_Spotlight.jpg',
    heroVideo: '/media/fashion-jewellery/Jewelry_That_Deserves_the_Spotlight.mp4',
    videos: [
      '/media/fashion-jewellery/Jewelry_That_Deserves_the_Spotlight.mp4',
      '/media/fashion-jewellery/Velvet_Sheen_Reimagined_on_Screen_Vistaar_Media.mp4',
    ],
    gallery: [
      '/media/fashion-jewellery/Jewelry_That_Deserves_the_Spotlight.jpg',
      '/media/fashion-jewellery/Velvet_Sheen_Reimagined_on_Screen_Vistaar_Media.jpg',
    ],
  },
  {
    title: 'Events',
    blurb: 'Corporate, social, birthdays, sport — every occasion, covered start to finish.',
    tags: ['Corporate Event', 'Social Event', 'Birthday Parties', 'Sports Event'],
    img: '/media/events/Capture_Your_Special_Moments_Vistaar_Media.jpg',
    heroVideo: '/media/events/Capture_Your_Special_Moments_Vistaar_Media.mp4',
    videos: [
      '/media/events/Capture_Your_Special_Moments_Vistaar_Media.mp4',
    ],
    gallery: [
      '/media/events/Capture_Your_Special_Moments_Vistaar_Media.jpg',
    ],
  },
  {
    // No matching footage in the downloaded batch — kept as placeholder
    // sample content until real podcast/talking-head clips are available.
    title: 'Podcast',
    blurb: 'Conversations that carry — talking heads, walk-and-talks, and lessons that land.',
    tags: ['Talking Head Videos', 'Podcast', 'Walking & Talking Shots', 'Testimonial', 'Educational'],
    img: PORTRAITS.marcus,
    heroVideo: SAMPLE_VIDEOS[0],
    videos: [SAMPLE_VIDEOS[0], SAMPLE_VIDEOS[1], SAMPLE_VIDEOS[2]],
    gallery: [PORTRAITS.marcus, PORTRAITS.nina, PORTRAITS.marcus],
  },
];

// videos/gallery stay exactly as authored above — no padding/repeating.
// The stellar gallery (tag.html) shows each category's real clip count as-is
// (Events genuinely has 1 clip today, Hospitality has 20); duplicating a
// single clip to hit a fixed count used to make sense for the old flat
// "wall" layout, but in a 3D gallery where every card is a distinct,
// clickable, individually-labeled reel, repeats just read as a bug.

export function findService(categoryTitle) {
  return SERVICES.find(s => s.title.toLowerCase() === String(categoryTitle).toLowerCase());
}
