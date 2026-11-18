# Thrift Flip Studio

An iPhone app that helps beginner sewists plan an upcycling project before cutting into a garment. CIS 4120 / CIS 5120.

React Native · Expo SDK 58 · expo-router · TypeScript

**Where things stand:** the skeleton is done. Every screen opens, the shared contracts are fixed, and each person's work is stubbed out with tests waiting. Find your role below, open your files, and start turning your tests on.

---

## Quick start

```bash
npm ci
npm run check   # typecheck + lint + format check + tests. Run before every PR.
```

**Run it in the iOS Simulator.** The first time only, you need:

1. **Xcode 26 or newer** from the App Store. Expo SDK 58 needs Swift 6.2; older Xcode fails with "Swift tools version 6.2.0 but the installed version is 6.1.0".
2. Accept the Xcode license and finish its setup. You need to do this again after every Xcode update, or Xcode tools (even `git`) stop with "You have not agreed to the Xcode license":
   ```bash
   sudo xcodebuild -license
   sudo xcodebuild -runFirstLaunch
   ```
3. An iOS Simulator runtime: Xcode → Settings → Components → iOS, or `xcodebuild -downloadPlatform iOS` (about 9 GB).
4. CocoaPods: `brew install cocoapods`.

Then:

```bash
npm run ios     # builds the dev app and opens the Simulator (slow the first time)
npm start       # every time after that: just start the JS server
```

You should see **Hello World**. From there:

- **Start a project** walks the six-screen flow.
- **Dev fixtures** loads ready-made test projects for your role.

**Run it on the demo iPhone:** see [Demo device](#demo-device).

---

## Who owns what

Everyone owns whole acceptance requirements, so you can demo your part on the phone without waiting for the others.

|                      | Zoe (Person 1)                                             | Katherine (Person 2)                 | Mario (Person 3)                        |
| -------------------- | ---------------------------------------------------------- | ------------------------------------ | --------------------------------------- |
| **Role**             | Materials and fabric tracking                              | 2D editor and touch                  | 3D preview and project output           |
| **Requirements**     | 3 (material intake), 6 (fabric tracking)                   | 4 (2D canvas), 5 (touch and cutting) | 7 (3D preview), Cutting Plan, save      |
| **Screens**          | New Garment, Garment Map, Start Designing, Pattern Library | Design Studio                        | Cutting Plan, the 3D view inside Studio |
| **Test with preset** | `jeans`, `jeans-second`, `jeans-scrap`                     | `studio-both`, `skirt-a`             | `skirt-a`, `skirt-b`                    |

### Zoe (Person 1) · Materials and fabric tracking

**You build:** photo intake for both garments and measured scraps, the inventory rules (place, store, restore, discard), the tracker numbers and pattern shortage warnings.

| File                                     | What to do                                                         |
| ---------------------------------------- | ------------------------------------------------------------------ |
| `app/new-garment.tsx`                    | Photo picker and preview; Analyze garment                          |
| `app/garment-map.tsx`                    | Pieces grouped with counts, sizes and areas; sample-analysis label |
| `app/start.tsx`                          | Pattern Library or Freestyle (mostly done)                         |
| `app/patterns.tsx`                       | Pattern list, shortage warnings, Add garment, Add scrap            |
| `src/intake/photos.ts`                   | `pickPhoto`, `copyPhotoToDocuments`                                |
| `src/intake/scrap.ts`                    | `validateScrapInput`, `createScrap`                                |
| `src/state/handlers/sources.ts`          | `ADD_GARMENT`, `ADD_SCRAP`, `SELECT_MODE`                          |
| `src/state/handlers/inventory.ts`        | `PLACE_PIECE`, `STORE_PIECE`, `RESTORE_PIECE`, `DISCARD_PIECE`     |
| `src/state/selectors.ts`                 | `selectTracker`, `selectPatternFit`                                |
| `src/features/tracker/FabricTracker.tsx` | Tracker card (Katherine places it in Studio)                       |

**Your tests:** `src/state/__tests__/tracking.spec.test.ts` and `src/intake/__tests__/scrap.spec.test.ts`

**Start here:** `selectors.ts` and `inventory.ts`. They are pure functions, and your tests already spell out the expected numbers (11,856 cm², 644 short, 44 short, the pocket sequence).

### Katherine (Person 2) · 2D editor and touch

**You build:** the SVG canvas, tapping and dragging pieces, rotate, flip, recolour, the straight-line cut, and the tray. Undo is already built.

| File                                   | What to do                                                                            |
| -------------------------------------- | ------------------------------------------------------------------------------------- |
| `app/studio.tsx`                       | Studio screen: toolbar, tray, 2D/3D toggle (layout started)                           |
| `src/features/studio/StudioCanvas.tsx` | Draws the guide now; add pieces, selection, gestures, cut line                        |
| `src/geometry/area.ts`                 | `polygonArea`                                                                         |
| `src/geometry/transform.ts`            | `localToDesign`, `designToLocal`, `pieceToDesign`, `designToScreen`, `screenToDesign` |
| `src/geometry/cut.ts`                  | `cutPolygon`                                                                          |
| `src/state/handlers/edits.ts`          | `MOVE_PIECE`, `ROTATE_PIECE`, `FLIP_PIECE`, `RECOLOR_PIECE`, `CUT_PIECE`              |

**Your tests:** `src/geometry/__tests__/geometry.spec.test.ts` and `src/state/__tests__/edits.spec.test.ts`

**Start here:** the `geometry/` functions. Mario's clipping depends on `pieceToDesign`, so finish transforms early.

### Mario (Person 3) · 3D preview and project output

**You build:** the rotatable 3D skirt showing the pieces placed in 2D, the Cutting Plan summary, and saving and reopening the project.

| File                                               | What to do                                              |
| -------------------------------------------------- | ------------------------------------------------------- |
| `src/features/preview3d/SkirtPreview.tsx`          | Replace the placeholder with a React Three Fiber skirt  |
| `src/geometry/clip.ts`                             | `clipToRegion`                                          |
| `app/cutting-plan.tsx`                             | Cutting Plan screen and Save button (wired up)          |
| `src/features/cutting-plan/CuttingPlanSummary.tsx` | Pattern, pieces, sources, used area, construction steps |
| `src/storage/projectStore.ts`                      | `saveProject`, `loadProject`                            |

**Your tests:** `src/geometry/__tests__/clip.spec.test.ts` (the storage tests are `test.todo` for now)

**Start here:** a basic spinning cube using `Canvas` from `@react-three/fiber/native`, **on the real iPhone**. That is the riskiest part of the project, so prove it works in week one.

---

## Project structure

```
app/                              Screens (expo-router: one file = one route)
├── _layout.tsx                   Shared     Stack navigator, fonts, ProjectProvider
├── index.tsx                     Shared     Hello World + links (requirement 1)
├── new-garment.tsx               Zoe
├── garment-map.tsx               Zoe
├── start.tsx                     Zoe
├── patterns.tsx                  Zoe
├── studio.tsx                    Katherine
├── cutting-plan.tsx              Mario
└── dev/
    ├── styles.tsx                Shared     Hello Styles (requirement 2)
    └── fixtures.tsx              Shared     Load test projects

src/
├── model/                        Shared     The data model. Read this first.
│   ├── types.ts                             Project, MaterialSource, FabricPiece, Pattern
│   └── units.ts                             Point, Polygon; all geometry is in cm
├── fixtures/                     Shared     Demo data from the build plan
│   ├── jeans.ts                             10 pieces, 11,856 cm²
│   ├── secondGarment.ts                     +600 cm² garment, 30 × 30 cm scrap
│   ├── patterns.ts                          Tote, cropped top, skirt + guide regions
│   └── presets.ts                           Whole test projects for Dev fixtures
├── state/
│   ├── actions.ts                Shared     Every action the app can dispatch
│   ├── reducer.ts                Shared     Routes actions to handlers; undo history
│   ├── ProjectContext.tsx        Shared     useProject() hook
│   ├── selectors.ts              Zoe        Tracker totals, pattern shortage
│   └── handlers/
│       ├── sources.ts            Zoe
│       ├── inventory.ts          Zoe
│       └── edits.ts              Katherine
├── geometry/                     Pure math  s, no React
│   ├── area.ts                   Katherine
│   ├── transform.ts              Katherine
│   ├── cut.ts                    Katherine
│   └── clip.ts                   Mario
├── intake/                       Zoe        Photos, scrap form
├── storage/
│   ├── paths.ts                  Shared     Where files live on the phone
│   └── projectStore.ts           Mario      Save / load
├── features/
│   ├── tracker/                  Zoe        <FabricTracker />
│   ├── studio/                   Katherine  <StudioCanvas />
│   ├── preview3d/                Mario      <SkirtPreview />
│   └── cutting-plan/             Mario      <CuttingPlanSummary />
├── components/                   Shared     AppText, Button, Card, Screen, StubBanner
├── theme/                        Shared     Colours, fonts, icons
├── testUtils.ts                  Shared     preset(), applyAll(), shoelace()
└── todo.ts                       Shared     todo() helper used by stubs
```

Unfinished code is easy to spot. Stub functions throw `TODO(P1)` (Zoe), `TODO(P2)` (Katherine) or `TODO(P3)` (Mario), and unfinished screens show a dashed orange **STUB** banner. Delete the banner when your part is done.

---

## How the pieces fit together

```
Screen ──dispatch(action)──▶ reducer.ts ──▶ handlers/{sources,inventory,edits}.ts
   ▲                              │
   │                              ▼ new Project (+ one undo step)
   └──── useProject() ◀──── ProjectContext
            │
            └─▶ selectors.ts (tracker, shortage) · geometry/ (drawing, 3D)
```

- **Screens never change data directly.** They dispatch an action from `actions.ts` and render what comes back.
- **Handlers decide the rules.** If an action isn't allowed (a third jeans pocket, a cut that misses), return the **same** project object. Nothing changes, and no empty undo step is recorded.
- **Every successful action is one undo step.** For drags, dispatch `MOVE_PIECE` once when the finger lifts, not on every frame.
- **Totals are calculated, never stored.** The tracker always comes from `selectors.ts`.
- **Geometry is in centimetres.** Convert to screen points only when drawing or reading touches.
- **Files on the phone:** photos are copied to `images/<uuid>.jpg` and the project saves to `project.json`, both in the app's document folder. Paths are stored relative to that folder.

### Where people's work meets

| Between           | Agreement                                                                                                                                                  |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Zoe ↔ Katherine   | Katherine's canvas dispatches `PLACE_PIECE`, and Zoe's handler decides whether it's allowed. Katherine places Zoe's `<FabricTracker />` in Studio.         |
| Zoe ↔ Katherine   | Cut fragments keep the parent's status, `sourceId` and `originalPieceId`, and split its area by polygon area. Zoe's tracker must still add up after a cut. |
| Katherine ↔ Mario | Mario's clipping uses Katherine's `pieceToDesign()`. Both use the region IDs in `fixtures/patterns.ts`.                                                    |
| Zoe ↔ Mario       | Zoe saves photo paths as `images/<uuid>.jpg`. Mario saves and reloads them as they are.                                                                    |

---

## Tests

```bash
npm test                  # all tests
npm test -- tracking      # only files matching "tracking"
```

Shared tests for the fixtures and undo already pass. Each person's spec file is written from the build plan's numbers and wrapped in `describe.skip`. **Remove `.skip` when you start a section, then make it pass.** A role is done when all of its tests run and pass, and the requirement works on the iPhone.

---

## Still placeholders

These should be copied from the finalized Figma Make prototype:

- [ ] Colours, spacing and radii: `src/theme/tokens.ts`
- [ ] Which font goes with each text style: `src/theme/typography.ts`
- [ ] Custom icons: `src/theme/icons.tsx` (keep the names)
- [ ] Real piece outlines (rectangles now; keep the areas): `src/fixtures/jeans.ts`
- [ ] Pattern guide shapes and the skirt's estimated area (6,000 cm² is a guess): `src/fixtures/patterns.ts`
- [ ] Construction steps for each pattern: `src/fixtures/patterns.ts`

---

## Demo device

Fill this in once the app is installed on the demo iPhone (the build plan requires it).

|              |       |
| ------------ | ----- |
| iPhone model | _TBD_ |
| iOS version  | _TBD_ |
| Expo SDK     | 58    |
| Build method | _TBD_ |

**Two ways to install:**

- **From Xcode:** plug in the iPhone, turn on Developer Mode (Settings → Privacy & Security), sign in to your Apple ID in Xcode, then run `npm run ios:device`.
- **With EAS:** run `npx eas-cli build --profile development --platform ios`. This needs an Apple Developer account and the iPhone registered with `npx eas-cli device:create`.

## Reference

- Build plan: `Thrift_Flip_Studio_Build_Plan.docx`
- Team plan and skeleton doc: https://claude.ai/artifact/Ja6b2kTdQF9cDLBNSLCwvH (private until it's shared)
