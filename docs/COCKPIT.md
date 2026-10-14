# Cockpit reconstruction — 15 October 2026

The interior follows the user's separate multi-view 812 blueprint. Source 812 body remains intact; seven source cockpit/underbody groups were replaced, and nine new cockpit groups added. Runtime has 62 selectable groups.

The new module src/interior.js creates padded seat contours, leather grips, shaped carbon spokes, metal paddles, start/manettino details, a yellow analog tachometer, two driver displays, passenger information display, four recessed vents with louvers, climate dials, transmission controls, door cards, perforated pedal faces, carpets, sill plates, flat woven shoulder belts and contrast seams. Horse silhouettes reuse the CC0 body asset badge.

Leather uses original 1K photometric normal/roughness maps from ambientCG Leather037 (CC0). Physical materials separate leather sheen, suede, clearcoated carbon, metal and rubber. Sewing is 3D geometry, not a flat screenshot. Rigid meshes are batched by material within each component; instanced perforations and component pivots remain independent.

Engine and covers are fitted inside the authored bonnet bay, ahead of the added cabin firewall. Door panels follow both door hinges. Export temporarily restores all component visibility/assembly so the full vehicle is included even when the user is viewing an isolated seat or roof cutaway; the active view restores afterward.

Use Interior → Enter the cockpit, or ?view=interior. Six views cover dashboard, driver, console, seats, top layout and door. Finishes control leather/suede, seat/dashboard color, stitching, belts and carbon trim. Studio lighting is selected on entry and the previous exterior environment restores on exit. Rectangular area lights and high-quality SSAO show curvature and contact depth. Performance mode bypasses SSAO/bloom.

Seats use an isolated inspection composition; top view hides the continuous body shell/glazing to reveal layout. Hidden exterior assemblies restore on exit and are included in exports. This is reversible visibility, not missing geometry.

Gauge values and switches are static showroom illustrations. No real vehicle telemetry, functional climate system, CAD accuracy or safety-certified restraint/seat geometry is claimed. Mobile verification uses a browser viewport rather than physical devices. Visual material detail varies with render quality and GPU.
