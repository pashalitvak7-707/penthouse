/* ============================================================================
 * TOUR CONFIG  —  the single source of truth for the whole experience.
 *
 * Edit THIS file to change rooms, order, text, clips, or pacing.
 * Nothing else needs to be touched to re-arrange the tour.
 *
 *  scene types:
 *   - "video": a scroll-scrubbed transition clip. As the visitor scrolls
 *              through the scene, the clip plays forward (and rewinds when
 *              they scroll back). `src` is the file in assets/videos/.
 *   - "blur" : a built-in blur dissolve used where there is NO clip.
 *              It holds `fromVideo` on its LAST frame and `toVideo` on its
 *              FIRST frame, then blurs + cross-fades between them on scroll.
 *              (Used for the Living Room -> Master Bedroom move.)
 *
 *  per-scene fields:
 *   - id      : unique slug (used for nav dots / anchors)
 *   - label   : short name shown in the side nav + eyebrow
 *   - heading : big headline text (placeholder copy — change freely)
 *   - copy    : paragraph beneath the heading (placeholder copy)
 *   - accent  : hex colour used for the gradient behind the clip + nav dot
 *   - length  : scene "height" as a multiple of the viewport. Higher = the
 *               visitor scrolls longer / the clip plays slower. 1 = no scrub
 *               room, 2.5 is a comfortable default.
 * ========================================================================== */

window.TOUR_CONFIG = {
  // Shown on the intro hero at the very top of the page.
  intro: {
    title: 'The Penthouse Residence',
    subtitle: 'Scroll to move through the home',
  },

  // Shown on the closing card after the last scene.
  outro: {
    title: 'Enquire about the residence',
    copy: 'Placeholder closing text. Add contact details, a booking link, or a call to action here.',
  },

  scenes: [
    {
      id: 'living-room',
      type: 'video',
      src: 'assets/videos/01-living-room.mp4',
      label: 'Living Room',
      heading: 'The Living Room',
      copy: 'A light-filled living space designed for effortless penthouse living. The open-plan kitchen, dining and lounge areas flow seamlessly together, creating a refined setting for everyday comfort, entertaining and quiet moments above the city. Natural textures, soft tones and panoramic glazing bring warmth, depth and a sense of calm sophistication.',
      accent: '#c9a37e',
      length: 1.6,
    },
    {
      id: 'lr-to-bedroom',
      type: 'blur',
      // Holds the living-room clip on its LAST frame and the bedroom clip on
      // its FIRST frame, then blurs between them. No clip needed here.
      // Because the timeline is continuous, this picks up exactly on the
      // living room's final frame and hands off exactly on the bedroom's first.
      fromVideo: 'assets/videos/01-living-room.mp4',
      toVideo: 'assets/videos/03-master-bedroom.mp4',
      // Mirror-wall push-in: the "from" frame zooms toward this focal point
      // before the blur takes over. Aimed at the mirror wall on the RIGHT
      // side of the living room ("x% y%", measured from the top-left).
      focus: '80% 48%',
      zoom: 0.16, // how far to push in (0.16 = +16% scale)
      label: 'Toward the Bedroom',
      heading: 'Down the Hall',
      copy: 'A refined hallway that begins at the penthouse entrance and connects the living area with the master bedroom. Along the way, a compact workspace by the window creates a quiet spot for reading, planning or working from home — turning the passage into a functional and elegant part of everyday life.',
      accent: '#8c97a8',
      length: 1.9,
    },
    {
      id: 'master-bedroom',
      type: 'video',
      src: 'assets/videos/03-master-bedroom.mp4',
      label: 'Master Bedroom',
      heading: 'The Master Bedroom',
      copy: 'A serene master bedroom designed as a private retreat. Warm wood textures, soft natural light and floor-to-ceiling glazing create a calm, elegant atmosphere, while refined details and generous proportions bring the comfort of a five-star suite into everyday living.',
      accent: '#a88f7d',
      length: 1.6,
      // Zoom OUT this clip so its framing matches the walk-in-closet clip at
      // the cut (1 = no change, <1 = zoomed out). Tune to taste.
      scale: 0.9,
    },
    {
      id: 'walk-in-closet',
      type: 'video',
      src: 'assets/videos/04-walk-in-closet.mp4',
      label: 'Walk-in Closet',
      heading: 'The Walk-in Closet',
      copy: 'A private walk-in closet connected to the master bedroom, designed with illuminated glass wardrobes, generous storage and refined detailing. A window brings in natural light, while the elegant vanity desk can be used for beauty rituals, quiet work or as a compact laptop station.',
      accent: '#9a8466',
      length: 1.5,
    },
    {
      id: 'bathroom',
      type: 'video',
      src: 'assets/videos/05-bathroom.mp4',
      label: 'Ensuite Bathroom',
      heading: 'The Ensuite Bathroom',
      copy: 'From the walk-in closet, the master suite flows directly into a spacious ensuite bathroom — a private spa-like retreat filled with natural light. Elegant stone surfaces, warm wood, brass accents and a sculptural bathtub create a calm, sophisticated atmosphere designed for complete comfort and daily rituals.',
      accent: '#7f8a86',
      length: 1.5,
    },
  ],

  /* ----------------------------------------------------------------------
   * ROOM GALLERY — still-image rooms shown after the scrubbed video tour and
   * before the closing card. Each is a full-screen photo (with a slow zoom)
   * and a description. Edit the copy freely; reorder/add by editing this list.
   * -------------------------------------------------------------------- */
  rooms: [
    {
      id: 'childrens-bedroom',
      image: 'assets/images/room-childrens-bedroom.png',
      label: 'Second Bedroom',
      heading: 'The Children’s Bedroom',
      copy: 'A flexible bedroom that can be used as a child’s room, guest room or quiet private retreat. Soft textures, warm wood tones and a built-in workspace create a comfortable setting for rest, study or working from home, while large mirrors and refined lighting add a sense of space and elegance.',
    },
    {
      id: 'private-bathroom',
      image: 'assets/images/room-private-bathroom.png',
      label: 'Private Bathroom',
      heading: 'The Private Bathroom',
      copy: 'The guest bedroom includes its own private bathroom, designed for comfort and everyday convenience. Natural textures, warm wood finishes, a walk-in shower and soft daylight create a clean, elegant space with a calm, refined atmosphere.',
    },
    {
      id: 'guest-bedroom',
      image: 'assets/images/room-guest-bedroom.png',
      label: 'Guest Bedroom',
      heading: 'The Guest Bedroom',
      copy: 'A refined guest bedroom designed for comfort, privacy and a sense of quiet elegance. Soft textures, sculptural wall details and generous natural light create a welcoming retreat, while the connected dressing area adds the feeling of a private suite.',
    },
    {
      id: 'powder-room',
      image: 'assets/images/room-powder-room.png',
      label: 'Powder Room',
      heading: 'The Powder Room',
      copy: 'The private corridor also leads to a beautifully designed guest powder room. Rich marble, warm wood textures, soft lighting and sculptural details create a refined space for guests — elegant, intimate and seamlessly connected to the penthouse layout.',
    },
    {
      id: 'ensuite-bathroom',
      image: 'assets/images/room-ensuite-bathroom.png',
      label: 'Private Ensuite',
      heading: 'The Private Ensuite Bathroom',
      copy: 'This bedroom features its own private ensuite bathroom, designed for comfort and privacy. Natural stone textures, a walk-in shower, soft daylight and refined black accents create a clean, contemporary space with a calm, spa-like atmosphere.',
    },
    {
      id: 'passage',
      image: 'assets/images/room-passage.png',
      label: 'Private Passage',
      heading: 'The Private Passage',
      copy: 'A quiet private corridor leads to the additional bedrooms and their bathrooms, creating a clear separation between the social areas of the penthouse and the more intimate sleeping quarters. Soft lighting, refined wall details and warm wood flooring give this transitional space an elegant, calm character.',
    },
  ],
};
