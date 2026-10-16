# Assembled-model contact review — 16 October 2026

77 component groups were checked in the assembled raw export using world-space BVH candidates, triangle-plane rejection, segment/triangle tests and coplanar SAT. The neutral pose has 84 surface-contact pairs: 20 new mechanical joint interfaces and 64 retained shell/trim interfaces. A contact pair is not automatically a defect.

Both sampled steering limits have eight contact pairs each, all existing mounting, wheel/rotor or tire-bead interfaces. Opened panels have eight retained panel/glazing/hinge interfaces. No pose introduces a new pair name relative to neutral. No unclassified contact involving the new mechanical assemblies remains in these sampled poses.

## Repairs

- Airboxes and ducts clear the closed bonnet, lamps and cooler; no front rack or housing protrudes through the nose.
- Calipers have two casting lobes, separate pads and a clear rotor throat. Bleed hardware points upward and remains clear of both wheel designs.
- Springs have space between tower supports; bushes, spring seats and upper damper mounts remain attachment interfaces.
- Frame, torque tube and rear transmission occupy separate passages below the fitted cabin floor.
- Underfloor fuel, oil, wiring and exhaust routes avoid each other and the tire envelope at both steering limits.
- Front uprights/steering arms rotate with the wheel and steering-rod endpoints update with steering. This is an illustrative animation, not solved suspension kinematics.
- Rear exhaust-cover inlets are cut from the retained mesh around the reconstructed pipe route. A luggage-bay liner closes the rear mechanical bay below the glass.
- Inward door construction sheets are removed; rear exterior returns stay fixed. Moving door skins use a reconstructed outer hinge region.

## Reading the reports

`assembly-final.json`, `assembly-steer-negative.json`, `assembly-steer-positive.json` and `assembly-panels-open.json` retain triangle counts and witness coordinates. `assembly-audit-summary.json` records the audited model hash. `summarize_assembly_audit.py` fails on an unreviewed new mechanical contact or a pair name introduced by a sampled pose.

Retained artist geometry includes intersecting seals, panel joins and embedded trim/housing surfaces. The supplied cockpit reference is photographic; catalogue diagrams do not supply manufacturing tolerances. These findings are not a claim of collision-free closed volumes or factory CAD. Fully contained solids, a continuous motion sweep, loads and operating clearances at suspension travel are not certified by this surface audit.
