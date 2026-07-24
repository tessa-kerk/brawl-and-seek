/* Approved public-runtime asset preloader. */
(function () {
  const specs = {
    world_plate: 'assets/world/d003-world-plate-approved.png',
    world_mask_wall: 'assets/world/d003-mask-wall.png',
    world_mask_bush: 'assets/world/d003-mask-bush.png',
    tag_icon: 'assets/ui/tag_icon.png',
    camo_icon: 'assets/ui/camo_icon.png',
  };
  const imgs = {};
  for (const k in specs) { const im = new Image(); im.decoding = 'async'; im.src = specs[k]; imgs[k] = im; }
  window.Assets = {
    get(k) { const i = imgs[k]; return (i && i.complete && i.naturalWidth > 0) ? i : null; },
    raw: imgs,
  };
})();
