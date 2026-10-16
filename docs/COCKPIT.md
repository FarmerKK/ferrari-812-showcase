# Cockpit reconstruction — 15 October 2026

Current runtime: `812-sloping-dashboard-v7`.

The cockpit follows the supplied 812 blueprint and the later real-car photographs. The vehicle remains left-hand drive, following the left-hand-drive reference; the right-hand-drive photo supplies construction and surface details. This is a photographic reconstruction, not official Ferrari CAD.

## Dashboard and instruments

src/cockpit-geometry.js builds closed padded dashboard volumes with a broad upper passenger airbag face, a continuous straight black fascia band, and a separate Cuoio lower leather glovebox roll. The passenger LCD is planar: it is not bowed around the cabin. An extruded bezel has an actual open aperture, and the LCD sits behind that lip. The default values are neutral, zero road speed and zero RPM, consistent with the static driver dial.

The 812 superfast badge is actual beveled metal lettering above the passenger screen. Its backing follows the padded leather surface; it is not placed on the display. The upper passenger leather now has a shallow ramp in its front-to-back section, descending toward the fascia. The stronger recessed shape was reduced following the user’s feedback. The display remains straight across its width. Lettering and the front seam are fitted to the revised surface. A more directional window key light and weaker fill reveal these volumes and their seams.

The central vent carrier is dark anodized metal rather than a bright silver shelf. Vent pods have real openings and darker throats, with recessed vanes and thin red/metal lip rings. Both outer vent centers move inboard to ±0.645 m to clear the door trim. The glovebox divider and panel splits follow the actual padded surface. Center service and climate controls are smaller and separate from the passenger screen.

Upper and lower dashboard leather use separate color controls; Lower dashboard color defaults to #835b40. This field is validated and survives save/load, with a default for configurations saved before it was introduced. The Passenger camera is accessible from the toolbar and directly via ?view=passenger. There are seven interior camera views.

The instrument hood follows a scalloped contour and wraps over inset side LCDs and a central yellow tachometer. The analog face has a corrected clockwise scale from lower left to lower right, a raised narrow pointer and hub, an inset neutral indicator, stepped barrel and subtle lens. Face, needle, lens and hood occupy separate depths. The readouts are illustrative static showroom values.

## Steering wheel

The wheel uses a flattened carbon rim, perforated side grips, integrated thumb rests and fine inner seams. A single flared lower spoke joins the curved carbon bottom rim. Curved carbon switch wings support separate indicator rockers, light/wiper switch banks, the smaller engine-start button, telephone/audio switches and Manettino selector. The padded airbag follows a rounded trapezoid profile, with the CC0 horse badge set into its bezel. Carbon weave uses a separate finer scale on the wheel.

The steering frame moves 52 mm toward the instruments, to X = 0.026 m. Its 128 mm closed fairing, bearing collars and enclosed rear airbag cover connect to a sculpted knee socket below the tachometer. The socket is part of the lower dashboard volume. Hood perforations have their own material and UV repetition, preserving small holes along both axes instead of stretched slots. The wheel rotor is an articulated child of a stationary mounting frame: rim, airbag and switches rotate, while the column and slim, bent shift paddles stay fixed. Batching preserves this articulated frame and all selection/export semantics. The driver camera uses a higher eye point and 55-degree vertical field of view so the instruments can be seen above the hub.

## Console and supporting detail

The transmission bridge slopes back toward the armrest. Paired curved carbon brackets return into the lower tunnel, leaving an actual open side passage; there are no straight table-like support walls. Three inset transmission controls, hazard button, window switches and rear handle sit on the deck. The climate system uses a compact upper service strip and a lower bank with small knurled dials and backlit controls. The passenger display occupies the straight black band below the upper airbag panel.

src/upholstery.js retains shared padded seat surfaces with material-region center inserts/stripes, surface-sampled stitching and conforming alpha-cut embroidery. Door cards, carpet, perforated pedal faces, supports, sill trim and flat woven belts remain separate selectable parts. Leather maps derive from ambientCG Leather037 (CC0), with a softened runtime roughness response. Carbon/perforation artwork is project-authored canvas texture data.

## Interaction and delivery

There are 62 semantic groups. Cockpit entry is available from the header or ?view=interior, with seven views and editable materials. Studio lighting is selected on entry and previous exterior lighting restores on exit. The isolated-seat view and roof cutaway use reversible visibility. Exports temporarily restore all part visibility and assembled transforms, then restore the active view. The downloadable compressed model includes the same cockpit.

The V12/manifold remains fitted ahead of the cabin firewall. Door cards follow the animated hinges. High quality uses area lighting and SSAO; adaptive quality waits for sustained slow samples and can recover on desktop.

Sound opens the recorded-exhaust controls. Start engine plays the idle loop; Rev exhaust plays one of two acceleration excerpts then returns to idle. Stop interrupts both. Volume, mute and hidden-tab stop remain available. Locally hosted CC0 recordings are by jtvdb and biholao on Freesound; their recordists do not identify an 812, so no authentic-812 recording claim is made. Credits are in public/audio/credits.json and About.

Gauge values, switch labels, engine/suspension details and opening mechanics are illustrative. No engineering dimensions, safety certification, real telemetry or exact photographic identity is claimed. Mobile is verified in a resized browser rather than physical phone hardware. Audio output is measured in Chromium; no human listening review is claimed.

Finishing includes an enclosed rear instrument shell with outward-facing roof normals, a recessed hex grille constrained below the leather eyebrow, and glovebox clearance for the right climate knob. The photo structure suite checks these clearances and the actual open passage under the console. The browser host forces page visibility; the audio suite exercises the production visibility handler with a temporary document.hidden fixture and restores the property.

The geometric surface audit welds coincident triangle positions for the padded dashboard material and checks for unclosed boundaries. The final count is recorded in qa-summary.json; the padded upper and lower materials are both inspected for unclosed boundaries. This audit covers the padded dashboard volumes; it is not a claim that every mesh in the vehicle is manifold.

The slope check casts downward rays at three longitudinal positions on the actual leather mesh and records their heights. It verifies a shallow descending section while retaining the separate LCD planarity and visibility checks. The current results are in qa-summary.json.

## Structure-fit revision — 16 October 2026

The thin undertray, fitted carpet floor, open central passage, bulkheads and rear luggage liner are adjusted around the new mechanical packaging. Armrests clear the seat bolsters; belt anchors remain inside the glazing. Dashboard/ramp/screen geometry remains v7. New mechanical groups are hidden in cabin inspection views; the assembled rear-glass view is enclosed by the luggage liner. See ASSEMBLY_AUDIT.md and STRUCTURE_RESEARCH.md.
