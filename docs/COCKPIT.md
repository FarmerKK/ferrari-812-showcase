# Cockpit reconstruction — 15 October 2026

The interior follows the user's separate multi-view 812 blueprint. Source 812 body remains intact; seven source cockpit/underbody groups were replaced, and nine new cockpit groups added. Runtime has 62 selectable groups.

The new module src/interior.js creates padded seat contours, leather grips, shaped carbon spokes, metal paddles, start/manettino details, a yellow analog tachometer, two driver displays, passenger information display, four recessed vents with louvers, climate dials, transmission controls, door cards, perforated pedal faces, carpets, sill plates, flat woven shoulder belts and contrast seams. Horse silhouettes reuse the CC0 body asset badge.

Leather uses 1K photometric normal/roughness maps from ambientCG Leather037 (CC0). Runtime roughness is remapped to a softer leather finish; the original files remain bundled. Physical materials separate leather sheen, suede, clearcoated carbon, metal and rubber. Sewing is 3D geometry. Rigid meshes are batched by material within each component; instanced perforations and component pivots remain independent.

Engine and covers are fitted inside the authored bonnet bay, ahead of the added cabin firewall. Door panels follow both door hinges. Export temporarily restores all component visibility/assembly so the full vehicle is included even when the user is viewing an isolated seat or roof cutaway; the active view restores afterward.

Use Interior → Enter the cockpit, or ?view=interior. Six views cover dashboard, driver, console, seats, top layout and door. Finishes control leather/suede, seat/dashboard color, stitching, belts and carbon trim. Studio lighting is selected on entry and the previous exterior environment restores on exit. Rectangular area lights and high-quality SSAO show curvature and contact depth. Performance mode bypasses SSAO/bloom.

Seats use an isolated inspection composition; top view hides the continuous body shell/glazing to reveal layout. Hidden exterior assemblies restore on exit and are included in exports. This is reversible visibility, not missing geometry.

Gauge values and switches are static showroom illustrations. No real vehicle telemetry, functional climate system, CAD accuracy or safety-certified restraint/seat geometry is claimed. Mobile verification uses a browser viewport rather than physical devices. Visual material detail varies with render quality and GPU.

## Refinement after close-up review

The oversized extruded instrument tunnel has been replaced by a rounded, low binnacle integrated into the dashboard pad. Its measured top is 0.928 m and its width 0.396 m. The earlier hood reached approximately 1.059 m with approximately 0.5 m width. The dashboard top is now 0.850 m and the steering wheel crown 1.021 m. The tachometer diameter is 119 mm. Four vents use 104 mm sleeves with fine red/metal rims, rather than oversized projecting rings.

src/upholstery.js builds seat front, rear and cushion surfaces from shared profiles. The center insert and red stripe are material regions of the actual padded mesh. Surface-sampled stitching uses approximately 3.5 mm spacing and 0.56 mm thread diameter. Headrest embroidery conforms to the front surface with an alpha-cut material; it has no opaque rectangular patch. Filled cushion ends, softer normal strength, handle mounts and pedal support stems complete the close-up work. The isolated seats view excludes the large cabin wall blocks.

Camera transitions use one interpolation for camera position and target, clearing residual orbit damping. Adaptive rendering requires three slow samples before lowering quality and can recover on desktop, preventing a single shader-compilation stall from permanently flattening the cabin shading.

## Exhaust sound

Sound opens the exhaust controls. Start engine plays the recorded idle loop; Rev exhaust plays one of two acceleration excerpts then returns to idle. Stop engine interrupts both. Volume works with a slider/keyboard, Mute silences output, and hiding the tab stops sound. Audio initializes only after a user gesture, uses local MP3 files and requires no external runtime connection. The on-screen meter reads actual output frequencies.

The CC0 source recordings are Ferrari_motor_idle by jtvdb and Acceleration 1.wav by biholao on Freesound. Their recordists do not establish an 812 model or a particular V12 engine, so this is an illustrative Ferrari sound study rather than a claimed authentic 812 recording. Credits and edit provenance are in public/audio/credits.json and the About dialog. Playback/decoding/output were measured in Chromium; no claim of a human listening review or physical-device audio verification is made.
