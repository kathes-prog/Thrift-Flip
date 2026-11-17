# Thrift Flip Studio

An iPhone app that helps beginner sewists plan an upcycling project before cutting into a garment. CIS 4120 / CIS 5120.

Built with React Native, Expo (SDK 58), expo-router and TypeScript.

## Demo device

Fill this in once the first signed build is on the demo iPhone (required by the build plan).

|              |                                                   |
| ------------ | ------------------------------------------------- |
| iPhone model | _TBD_                                             |
| iOS version  | _TBD_                                             |
| Expo SDK     | 58                                                |
| Build method | _TBD: local Xcode build or EAS development build_ |

## Setup

You need Node 24 (see `.nvmrc`). For iPhone builds you also need a Mac with Xcode, or an EAS account.

```bash
npm ci
npm run check        # typecheck, lint, format check, tests
```

### Run on the iOS Simulator

```bash
npm run ios          # builds the dev client with Xcode and opens the Simulator
npm start            # later runs: start Metro for the installed dev client
```

### Install on the demo iPhone

Pick one route, then record it in the table above.

- **Local Xcode build:** connect the iPhone, turn on Developer Mode, sign in to your Apple ID in Xcode, then run `npm run ios:device`.
- **EAS development build:** `npx eas-cli build --profile development --platform ios`. This needs Apple Developer credentials and the iPhone registered with `npx eas-cli device:create`.

All native modules are already installed, including `expo-gl` and `@react-three/fiber` for the 3D preview. **Don't add new native modules** without agreeing as a team: each one forces a new dev build on every device.

## How the code is organised

| Path                                            | Owner      | What                                                              |
| ----------------------------------------------- | ---------- | ----------------------------------------------------------------- |
| `app/`                                          | per screen | expo-router stack, one file per screen                            |
| `app/index.tsx`                                 | Shared     | Hello World (requirement 1) and the launch screen                 |
| `app/dev/styles.tsx`                            | Shared     | Hello Styles (requirement 2)                                      |
| `app/dev/fixtures.tsx`                          | Shared     | Load preset projects for testing                                  |
| `src/model/`                                    | Shared     | `types.ts` data model, `units.ts` (design units are cm)           |
| `src/fixtures/`                                 | Shared     | Jeans, second garment, scrap, patterns and guide regions, presets |
| `src/state/actions.ts`                          | Shared     | Every action, defined up front                                    |
| `src/state/reducer.ts`                          | Shared     | Routes actions to handlers; undo history                          |
| `src/state/handlers/sources.ts`, `inventory.ts` | P1         | Add garment and scrap, place, store, restore, discard             |
| `src/state/selectors.ts`                        | P1         | Tracker totals and pattern shortage                               |
| `src/intake/`                                   | P1         | Photo picking and copying, scrap form validation                  |
| `src/features/tracker/`                         | P1         | `<FabricTracker />`                                               |
| `src/state/handlers/edits.ts`                   | P2         | Move, rotate, flip, recolour, cut                                 |
| `src/geometry/` (except `clip.ts`)              | P2         | Area, transforms, straight cut                                    |
| `src/features/studio/`                          | P2         | SVG canvas, tray, tools and gestures                              |
| `src/geometry/clip.ts`                          | P3         | Clip pieces to guide regions                                      |
| `src/features/preview3d/`                       | P3         | 3D skirt                                                          |
| `src/features/cutting-plan/`                    | P3         | Cutting Plan summary                                              |
| `src/storage/`                                  | P3         | Save and load (`paths.ts` is shared)                              |
| `src/theme/`                                    | Shared     | Colours, fonts, icons                                             |

Stubs throw `TODO(P1|P2|P3)` errors or show a dashed **STUB** banner, so unfinished work is easy to spot.

## Rules everyone follows

- **UI only dispatches actions** and renders state. Business rules live in the handlers and selectors.
- **Handlers return the same project object when nothing changes.** That is how a rejected action (such as a third jeans pocket) avoids creating an empty undo step.
- **Every committed action is one undo step.** Pan gestures commit `MOVE_PIECE` once on release.
- **Geometry is pure functions** in design units (cm). Convert to screen points only when drawing or reading gestures.
- **Photos** are copied to `<document>/images/<uuid>.jpg` and stored as relative paths. The project saves to `<document>/project.json`.
- **Shared files** (`src/model`, `src/fixtures`, `src/state/actions.ts`, `src/state/reducer.ts`, `src/theme`, `app/_layout.tsx`, `package.json`) change only in their own small pull request, reviewed by all three owners.

## Tests are the spec

`npm test` runs the shared tests now. Each owner's spec file is written from the build plan's numbers and is skipped until that part is built:

| File                                           | Owner |
| ---------------------------------------------- | ----- |
| `src/state/__tests__/tracking.spec.test.ts`    | P1    |
| `src/intake/__tests__/scrap.spec.test.ts`      | P1    |
| `src/geometry/__tests__/geometry.spec.test.ts` | P2    |
| `src/state/__tests__/edits.spec.test.ts`       | P2    |
| `src/geometry/__tests__/clip.spec.test.ts`     | P3    |

Remove `.skip` from a `describe` block when you start on it, and make it pass.

## Workflow

- Branch per feature, named like `p2/straight-cut`. Open a pull request into `main`.
- CI runs typecheck, lint, format check and tests on every pull request.
- Fill in the GitHub usernames in `.github/CODEOWNERS`, then protect `main` in GitHub settings: require a pull request, passing CI, and code owner review.
