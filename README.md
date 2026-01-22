# @ctrlcan/orbit

Cross-page, themeable React site tour. Provide step-by-step guided tours for single-page and multi-page React apps with configurable tooltips, spotlight masking, modal steps, i18n and programmatic control.

<img src="https://raw.githubusercontent.com/batuhnoztrkk/Orbit/main/examples/spa-basic/src/styles.css" alt="visual" />

## Install

Peer dependencies required at runtime: react (>=18), react-dom (>=18), jotai (>=2)

```bash
# install package
npm install @ctrlcan/orbit

# ensure peers are installed
npm install react react-dom jotai
```

Module entry (ESM / CJS) is exported via:
```js
import { CtrlcanOrbit, useOrbit } from '@ctrlcan/orbit';
```

## Quick start

Minimal usage – render the tour component with a steps array:

```jsx
import React from "react";
import { createRoot } from "react-dom/client";
import { CtrlcanOrbit, useOrbit } from '@ctrlcan/orbit';

function App() {
  const steps = [
    { id: 'intro', modal: { enabled: true }, title: 'Welcome', content: 'This is a tour intro.' },
    { id: 'feature', selector: '[data-tour="feature"]', title: 'Feature', content: 'This element is important.' }
  ];

  return (
    <>
      <CtrlcanOrbit
        steps={steps}
        options={{ i18n: { locale: 'en' } }}
      />
      {/* rest of your app */}
    </>
  );
}

createRoot(document.getElementById('root')).render(<App />);
```

Programmatic control via hook:

```jsx
import { useOrbit } from '@ctrlcan/orbit';

function Toolbar() {
  const tour = useOrbit();
  return <button onClick={() => tour.start('intro')}>Start Tour</button>;
}
```

## Concepts

- Steps: An ordered array describing each guided step.
- Tooltip vs Modal: Steps can either highlight a page element and show a tooltip, or render a centered modal (modal steps can be used for intros/outros).
- Spotlight: The dim/blur effect around the target element; supports mask-style modal holes.
- Cross-page: Tours can navigate routes automatically when a step has a route and a router bridge is used.
- Resume: Optionally persist runtime state to localStorage and resume the tour on page load.

---

## API Reference

### Component: CtrlcanOrbit

Signature:
```jsx
<CtrlcanOrbit
  steps={Array<Step>}
  options={Object}
  onFinish={Function}
  onCancel={Function}
/>
```

- steps (required-ish): Array of step objects (see Step shape).
- options (optional): Global defaults (merged with per-step configuration).
- onFinish(): Called when the tour completes.
- onCancel(): Called when the tour is cancelled/closed.

Exported from: src/index.js

---

### Hook: useOrbit()

Returns control methods:
```js
const { start, stop, next, prev, goTo, getState } = useOrbit();
```

- start(id?) — start the tour; if id provided, start at that step id, otherwise first step.
- stop() — stop (deactivate) the tour.
- next() — advance to the next step (if active).
- prev() — go to previous step (if active).
- goTo(id) — jump to a specific step id and mark visited.
- getState() — returns internal runtime state (active, currentStepId, visited, ...).

---

### Step object shape

Common fields (supported by CtrlcanOrbit):

- id: string — unique step id (used by programmatic APIs).
- route: string — if supplied, routerBridge will attempt to navigate to the route before resolving target.
- selector: string — querySelector for the DOM target (used by tooltip spotlight).
- dataTour: string — convenience to target elements by data attributes (used in examples).
- className: string — element class targeting (alternative to selector).
- title: string | ReactNode — step title.
- content: string | ReactNode — content or JSX for tooltip/modal.
- footer: string | ReactNode — optional footer content shown inside tooltip/modal.
- modal: { enabled: boolean, width, height, className, style, maskPadding, maskRadius } — modal configuration
- tooltip: { width, placement ('top'|'bottom'|'left'|'right'|'auto'), offset } — tooltip layout options
- spotlight: { padding, borderRadius, shape, blur, dimOpacity } — surround mask styling
- backdrop: { blur, opacity } — used primarily for modal-style mask dims
- controls: { hidePrevOnFirst?: boolean, showClose?: boolean } — step-level control visibility
- classNames: { root?, tooltip?, modal?, actions?, btnPrev?, btnNext?, btnClose?, spotlightBlur?, spotlightDim? } — custom class names for styling
- advance: { by?: 'next' | 'clickTarget' } — when to automatically advance (clickTarget will advance when the target element is clicked)
- highlightOnly: boolean — if true, only the spotlight is shown (no tooltip/modal) and step resolves target if found
- wait: optional per-step wait config override
- onMissing: { behavior: 'skip' | 'halt' | 'fallbackSelector', fallbackSelector?: string } — behavior when the target is not found (see Advanced → onMissing)

Notes:
- Step-level fields override options object values for the same keys.
- Deep merging only applies to specific keys (tooltip, spotlight, backdrop, controls, modal, wait, navigation, classNames). Non-plain objects (DOM nodes, React elements, functions) are never deeply merged.

---

### options (global defaults)

A summary of supported option keys and defaults (component applies sensible defaults; these keys override global behavior):

- i18n: { locale?: string, messages?: Record<string, Record<string, string>> }
  - Uses built-in dictionary (en, tr, de, fr). You can pass messages to override.
  - Keys used: next, prev, close, ok, cancel, title
- tooltip: { width, placement, offset }
- spotlight: { padding = 12, borderRadius = 12, blur = 10, dimOpacity = 0.62, shape = 'rounded' }
- backdrop: { blur, opacity }
- modal: { enabled?, style, backgroundImage, width, height, maskPadding, maskRadius }
- controls: { hidePrevOnFirst: boolean, showClose: boolean }
- wait: { timeoutMs: number, intervalMs: number, scroll?: 'smooth'|'auto' } — wait for elements to appear and scroll behavior
- storage: { key?: string, userKey?: string } — used by resumeOnLoad; default key is "ctrlcan:orbit:v1"
- resumeOnLoad: boolean — if true, runtime state may be read from localStorage and resume the tour
- navigation: { escToClose: boolean, keybinds: { next?: string, prev?: string } }
- classNames: global classNames map (same shape as step.classNames)

---

## Advanced behavior & notes

Router bridging
- The library supports cross-page tours. By default `createRouterBridge('auto')` patches history and emits a synthetic `locationchange` event (used by examples/spa-basic).
- If using a custom router (react-router, next/router, etc), you can provide a custom bridge via createRouterBridge('custom', customBridge) with methods:
  - getPath(): string
  - push(path: string): void
  - listen(cb: (path) => void): () => void

Resume / storage
- If options.resumeOnLoad is true, runtime state is read from localStorage using a key derived from options.storage.key and options.storage.userKey. State contains currentStepId and visited array.

onMissing (step behavior when target not found)
- 'skip' (default in code paths): advance to next step
- 'halt': stay on the same step (target missing)
- 'fallbackSelector': attempt a fallback selector in step.onMissing.fallbackSelector

Click-to-advance
- If a step has advance.by === 'clickTarget' and a target resolves, Orbit attaches a capture click listener to advance the tour when the target is clicked.

Highlight-only mode
- If `highlightOnly === true` and the step has a selector/dataTour/className, the component will only render a Spotlight (no UI), useful to draw attention silently.

i18n
- Built-in locales: en, tr, de, fr
- Default keys: next, prev, close, ok, cancel, title
- Use options.i18n to override locale or messages.

Accessibility
- Live announcements are made using LiveAnnouncer messages like "Tour: 1/4 — <title>" for screen reader feedback.
- Focus restoration is attempted after tour ends (opener element is remembered).

Styling & customization
- Use step.classNames and options.classNames to inject custom class names for different parts: tooltip, modal, actions, btnPrev, btnNext, btnClose, spotlightBlur, spotlightDim, etc.
- Steps may pass React elements for title/content/footer.

---

## Examples

Two runnable examples are included:

- examples/spa-basic — demonstrates a manual history patch approach (no React Router needed)
  - path: examples/spa-basic
  - run:
    ```bash
    cd examples/spa-basic
    npm install
    npm run dev   # or npm run build && serve
    ```
- examples/router-react — demonstrates integration with react-router
  - path: examples/router-react
  - run:
    ```bash
    cd examples/router-react
    npm install
    npm run dev
    ```

See example source for full usage patterns:
- examples/spa-basic/src/App.jsx
- examples/router-react/src/App.jsx

---

## Development & publishing

Repository scripts (from package.json):

- npm run build — bundle with tsup
- npm run dev — watch build
- npm run test — run tests (Jest)
- npm run cov — run coverage
- npm run re — (helper) cleanup, install, build, bump patch and publish to private registry (project-specific registry configured)
- npm run pub — build and publish

Docker
- A Dockerfile is provided to run a reproducible builder/test stage and execute tests/coverage. Useful for CI or reproducible builds:
  - The builder image installs deps and runs `npm run build` and defaults to `npm run cov`.

Notes
- The package.json config references a private registry in some publish scripts. Adjust or remove these for public npm publishing.

---

## Contributing

- Clone the repo
- Install dependencies: npm ci
- Run tests: npm run test
- Run example apps for manual QA
- PRs welcome. Follow the code style in existing files (JSX, JOTAI usage, and jest tests included).

---

## License

MIT

---
