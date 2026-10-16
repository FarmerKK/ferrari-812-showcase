# Sculpted alloy wheels — 16 October 2026

Runtime wheel revision: `812-forged-wheels-v1`. The cockpit remains `812-sloping-dashboard-v7`.

`src/wheels.js` replaces the former straight rounded-box spokes. Both split and forged-star designs use swept, closed sections with a crowned face, beveled shoulders, rear thickness and a smooth depth transition from the inset hub to the outer lip. The rear design has a deeper dish than the front. These are project-authored reference-style wheels, not measured Ferrari parts.

The hollow barrel uses a continuous lathed profile with front/rear flanges, bead seats, safety humps and a drop center. The front coating occupies the same mesh as the barrel; there is no coincident second flange. Material groups are consolidated into two draws. A closed mounting bell returns into the retained brake annulus behind the wheel hub. A fine machined edge, real hub apertures and countersunk seats surround five beveled hex lug heads. The enamel horse cap has a solid backing, seal and bezel; its silhouette comes from the retained CC0 body badge image. A rubber valve stem and metal dust cap sit near the rim edge.

The outer rim diameter is 0.532 m including the flange; the modeled bead seat is near 0.508 m diameter. These are reconstruction dimensions. The four assemblies retain their original selectable wheel groups, axle pivots and independent spoke-style visibility. The fixed brake/caliper groups remain separate from wheel spin. Finishes and colors continue using the existing configurator and save/load flow.

Open `?view=wheel` for the wheel inspection camera and wheel controls. `qa/wheel-depth.cjs` measures actual spoke depth, verifies closed/outward-facing solids, checks brake-to-spoke separation and tests styles, finishes, persistence, spin, steering, explode/assemble and mobile controls. `qa/wheel-reference-views.cjs` captures direct and oblique angles in graphite/silver and both styles. Current results are recorded in `docs/wheel-qa-summary.json`.

The full browser GLB export and downloadable compressed model contain the active wheel style and complete vehicle. The hidden alternative style is excluded by the existing visible-only export behavior. The archived source retains both style generators.
