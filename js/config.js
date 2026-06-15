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
    kicker: 'A Private Residence',
    title: 'The Penthouse',
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
      copy: 'Placeholder description. Floor-to-ceiling glass, a double-height ceiling, and an open plan that flows from lounge to dining. Replace this text later.',
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
      // before the blur takes over. Tweak to aim at the mirror wall
      // ("x% y%", measured from the top-left of the frame).
      focus: '50% 46%',
      zoom: 0.16, // how far to push in (0.16 = +16% scale)
      label: 'Toward the Bedroom',
      heading: 'Down the Hall',
      copy: 'Placeholder transition text. A quiet passage leads from the social spaces to the private wing of the residence.',
      accent: '#8c97a8',
      length: 1.9,
    },
    {
      id: 'master-bedroom',
      type: 'video',
      src: 'assets/videos/03-master-bedroom.mp4',
      label: 'Master Bedroom',
      heading: 'The Master Bedroom',
      copy: 'Placeholder description. A serene retreat with a private terrace, soft natural light, and uninterrupted skyline views. Replace this text later.',
      accent: '#a88f7d',
      length: 1.6,
    },
    {
      id: 'walk-in-closet',
      type: 'video',
      src: 'assets/videos/04-walk-in-closet.mp4',
      label: 'Walk-in Closet',
      heading: 'The Walk-in Closet',
      copy: 'Placeholder description. A bespoke dressing room with custom joinery, integrated lighting, and a dedicated island. Replace this text later.',
      accent: '#9a8466',
      length: 1.5,
    },
    {
      id: 'bathroom',
      type: 'video',
      src: 'assets/videos/05-bathroom.mp4',
      label: 'Ensuite Bathroom',
      heading: 'The Ensuite Bathroom',
      copy: 'Placeholder description. A spa-inspired ensuite finished in natural stone, with a freestanding tub and a rainfall shower. Replace this text later.',
      accent: '#7f8a86',
      length: 1.5,
    },
  ],
};
