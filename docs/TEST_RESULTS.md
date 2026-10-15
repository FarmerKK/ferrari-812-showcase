# Test results — 15 October 2026

Runtime: `812-passenger-layout-v6`. The final combined production-preview run passed 82 checks:

- `qa/cabin-acceptance.cjs`: 34 passed, including the new Passenger view.
- `qa/photo-cockpit-structure.cjs`: 17 passed.
- `qa/formed-surface-audit.cjs`: 3 passed.
- `qa/cabin-refinement.cjs`: 18 passed, including measured audio output.
- `qa/passenger-layout.cjs`: 10 passed.

No JavaScript runtime errors were recorded. The prior v4 exterior suite passed 50 checks; it was not rerun for this dashboard revision. Functional/geometry checks do not certify photographic identity. Final desktop viewport: 1600 × 1000; mobile: 390 × 844 in Chromium. The combined run allows up to 120 seconds for initial overlay removal.

## Passenger layout and shape

The supplied additional real-car photos guide the broad padded upper passenger panel, raised 812 superfast badge, straight black fascia band and contrasting lower glovebox. The user's correction is incorporated: the LCD is a plane rather than a curved strip. Its world depth range is 0.000000000 m. All nine sampled screen positions are visible ahead of surrounding geometry. All five sampled points through the outer passenger vent hit the vent rather than dashboard/door trim. The outer vent centers are ±0.645 m, moved inboard to provide clearance.

The screen sits behind a physically open bezel. Its RPM scale, neutral gear and zero speed describe an engine-off showroom state matching the driver dial. The upper leather pad and lower glovebox retain vertical padding depth and rounded return edges while the screen remains straight. A directional window key with weaker fill reveals the section depth. The badge backing and glovebox divider follow the surfaces rather than floating above them. Center service/climate controls are smaller and separate from the passenger display.

Lower dashboard leather defaults to #835b40 and has an independent color control. Color changes leave upper leather unchanged, persist through save/reset/load, and receive the default when older saved configurations lack the new field. The Passenger toolbar camera and direct ?view=passenger entry work on desktop and mobile without horizontal page overflow.

`qa/passenger-reference-views.cjs` captures front, passenger, door and screen close-up angles from unmodified runtime geometry. Current images: `passenger-front.png`, `passenger-passenger.png`, `passenger-door-angle.png`, `passenger-screen-close.png`, and `passenger-mobile.png` under output/playwright.

## Preserved cockpit behavior

Seven interior views, physical leather maps, colors, carbon inlays, persistence, cutaway, door-card mechanics, full assembled export from isolated Seats view, return to exterior and previous environment restoration pass. Padded upper/lower dashboard material inspection covers 51,584 triangles with 0 open edges. This checks those padded volumes, not every vehicle mesh. Steering rotor/paddles, column clearance, instrument roof normals and an actual open passage under the transmission bridge remain verified.

Idle and acceleration recordings decode and produce measured output. Start/rev/stop/mute/volume, keyboard operation, return to idle and mobile start/stop pass. The host forces real tab visibility, so the visibility handler uses a temporary document.hidden fixture which is restored afterward. No actual background-tab transition, human listening review or physical-phone test is claimed. The CC0 recordings are not identified as an 812 by their recordists.

## Model and build

Both the raw assembled export and the compressed static model import in Blender 4.5.3 LTS with 62 top-level semantic groups, 1181 mesh objects, 74 materials and 41 embedded images. No images are missing. Compressed model: 25,840,656 bytes, below the 26,214,400-byte hosting asset limit. Browser exports remain uncompressed.

`npm run build` succeeds with Three.js/application bundle-size advisories. No new hardware performance benchmark is claimed. Gauges/mechanics are illustrative; the model is a reconstruction based on supplied photographs rather than official Ferrari CAD.
