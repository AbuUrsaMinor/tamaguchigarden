# Tamaguchi Garden – Requirements v1

## 1. Overview
Tamaguchi Garden is a mobile-first Progressive Web App (PWA) that simulates a virtual garden. Plants in the garden grow only while the user's phone is in Focus or Do-Not-Disturb mode. Each plant is procedurally generated from a 32-bit seed, allowing the entire garden to be stored efficiently in a few kilobytes using IndexedDB.

## 2. Core Features
- **Mobile-first PWA**: Optimized for mobile devices, installable as a PWA.
- **Focus/Do-Not-Disturb Growth**: Plants grow exclusively when the device is in Focus or Do-Not-Disturb mode.
- **Procedural Generation**: Each plant is generated deterministically from a 32-bit seed using a Mulberry32 PRNG.
- **Efficient Storage**: All plant data (seeds, age, etc.) is stored in IndexedDB, with the entire garden fitting in a few kilobytes.

## 3. Rendering Stack
- **React 19 Compiler**: UI and state management.
- **OffscreenCanvas Worker**: Rendering is offloaded to a web worker using OffscreenCanvas for smooth performance.
- **Canvas 2D**: Plants are drawn using the Canvas 2D API.
- **Procedural Animation**: Leaf and branch sway is achieved using fast-noise-lite (WebAssembly) for Perlin noise.
- **Styling**: Layout and styles are managed with Tailwind CSS v4 (Oxide).

## 4. Plant Generation Algorithm
- **Seeded PRNG**: Mulberry32 PRNG is seeded per plant.
- **L-System Growth**: Generates an L-system string (`growString`) for each plant.
- **Turtle Drawing**: Uses a turtle-graphics approach (`drawLSystem`) to render the plant, with angles and branches determined by the PRNG.
- **Growth Stages**: The growth stage is calculated as `min(5, ageInDays)`, which determines the L-system iteration depth.
- **Procedural Sway**: Perlin noise offsets are applied each frame for gentle, natural leaf motion.

## 5. Performance Requirements
- **Memoization**: Plant paths are memoized as Path2D objects for efficient redraws.
- **Viewport Optimization**: Redraw occurs only when the canvas is in the viewport.
- **Bundle Size**: The full JavaScript bundle must be under 200 kB gzipped.
- **CPU Usage**: CPU usage should remain under 4% on mid-range mobile devices during normal operation.

## 6. Storage
- **IndexedDB**: All persistent data (plant seeds, ages, etc.) is stored in IndexedDB.
- **Minimal Footprint**: The entire garden, including all plants, must fit in a few kilobytes.

## 7. Technology Stack
- React 19
- Vite
- Tailwind CSS v4 (with @tailwindcss/vite plugin)
- TypeScript
- Node.js
- fast-noise-lite (WebAssembly)
- Canvas 2D API
- OffscreenCanvas (Web Worker)
- IndexedDB
- PWA (Progressive Web App)

## 8. Deployment
- The app is deployed as a GitHub Pages site.

---

For further details on installation and setup, see `docs/installation_tailwind.md`.
