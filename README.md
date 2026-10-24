# The Personal Atlas — Srivisnu A

A full-screen 3D expedition through a continuous archipelago of floating islands.
Each of seven projects has an animated landmark. Wheel, horizontal trackpad input,
dragging, arrow keys, and the chapter map move one cinematic camera through the world.
"Play the journey" runs a roughly 75-second guided flight. The Arsenal is the second
island after Arrival, with 33 skills from the original portfolio. Seven project islands
follow, ending at the contact station.

## Run

Use Node.js 22.18 or newer.

    npm ci
    npm run dev

Open http://localhost:3000.

For phone testing, use the optimized build to avoid downloading development bundles:

    npm run build
    npm run start -- --port 3001

Open `http://<computer-Wi-Fi-IPv4>:3001` on a phone connected to the same network.
`localhost` on the phone refers to the phone itself. Both scripts bind to `0.0.0.0`.

## Interaction

- Wheel or drag horizontally to travel. Touch supports swiping in either direction.
- Left/right arrows move between landmarks; Home/End visit the endpoints.
- Space plays or pauses when a control is not focused.
- Select a world marker or “Explore this project” to open field notes.
- The atlas provides direct chapter navigation and accessible project information.
- Escape closes a panel. Project URLs support sharing, refresh, and browser Back.
- Sound starts only when selected. Cursor position controls stereo balance and tone;
  movement adds a quiet note that fades while still. The score uses original Web Audio synthesis.
- Reduced motion freezes landmark animations and moves directly to selected camera positions.

## Content and rendering

lib/content.ts contains the curated resume and project content.
lib/world.ts defines travel bounds, damping, station positions, and deterministic randomness.
components/CinematicWorld.tsx contains the procedural Three.js world and its camera director.
components/Portfolio.tsx provides the controls, projected world markers, and field notes.
All terrain, stars, orbital sculptures, and landmark geometry are generated locally.
Project illustrations are identified as illustrations. Downloadable resumes are in public/resumes.
Only the current island mounts for the first frame; adjacent islands arrive afterward.
At most three islands stay mounted. Phones use a lower pixel ratio, lighter geometry,
and a 30 fps animation budget. Navigation and field notes work while 3D downloads.

No API keys, backend, analytics, remote fonts, or third-party asset requests are required.
Without WebGL, the atlas and field notes remain available. Without JavaScript, direct project
links and contact information are displayed.

## Check

    npm test
    npm run typecheck
    npm run lint
    npm run build
    npm run test:e2e

Run the local server before the browser tests. On Windows, the test configuration uses an
existing Chrome installation when available. Otherwise run npx playwright install chromium
or set PLAYWRIGHT_EXECUTABLE_PATH. Set TEST_BASE_URL to test another deployment.

## Vercel preview

Run npx vercel after signing into Vercel. Select a new project such as srivisnu-personal-atlas
and use the default Next.js build settings. The default deployment is a preview.
Do not link the existing production portfolio project unless you intend to replace it.

Vercel supplies the preview hostname for metadata automatically. For a custom domain, set
NEXT_PUBLIC_SITE_URL to its complete HTTPS URL before building.
