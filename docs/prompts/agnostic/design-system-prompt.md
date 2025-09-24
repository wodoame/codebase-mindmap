# Universal UI Design System Prompt for AI Assistants

Use this as a blueprint when generating UI for any project. It defines a calm, modern visual language and common component patterns (headers, cards, grids, forms, empty states, etc.) while staying framework-agnostic. If a specific framework is required, adapt the syntax but preserve these conventions.

## Core Principles

- Neutral, minimal, and readable by default; content-first design.
- Utility-first classes or lean CSS; avoid heavy component frameworks.
- Consistent spacing, typography scales, and border/shadow tokens.
- Semantic HTML and accessible interactions by default.
- Progressive enhancement: works without JS; JS adds polish, not essentials.

## Visual Language

- Palette: neutral grays for text and surfaces; strong but restrained primary for emphasis.
- Typography: 16px base, scale to 14/16/18/24; semibold headings, regular body.
- Spacing: 4px grid; common paddings `8px, 12px, 16px, 24px`.
- Radii: small rounding on containers and controls.
- Shadows: subtle on hover/focus for elevation (no heavy drop shadows).

## Component Blueprints

- Page Shell

  ```html
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Page</title>
    <!-- Include your CSS bundle here -->
    <style>body { margin: 2rem; }</style>
  </head>
  <body>
    <main class="container">
      <!-- Content here -->
    </main>
    <!-- Optional: your JS bundle -->
  </body>
  </html>
  ```

- Header

  ```html
  <header class="mb-6 flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-semibold">Page Title</h1>
      <p class="muted">Short description or subtitle.</p>
    </div>
    <div class="flex items-center gap-2">
      <a class="btn btn-secondary" href="#">Secondary</a>
      <a class="btn btn-primary" href="#">Primary</a>
    </div>
  </header>
  ```

- Card

  ```html
  <article class="card">
    <div class="card-header flex items-start justify-between gap-4">
      <h2 class="text-lg font-medium line-clamp-1" title="Card title">Card title</h2>
      <span class="text-xs muted nowrap">Meta</span>
    </div>
    <p class="mt-1 text-sm muted-strong line-clamp-2">Optional supporting paragraph with 1–2 lines.</p>
    <div class="mt-3 flex items-center gap-2">
      <a href="#" class="btn btn-primary btn-xs">Open</a>
      <a href="#" class="btn btn-outline btn-xs">Edit</a>
    </div>
  </article>
  ```

- Grid

  ```html
  <section class="grid grid-1 grid-sm-2 grid-lg-3 gap-4">
    <!-- repeat cards/items here -->
  </section>
  ```

- Empty State

  ```html
  <section class="card text-center p-10">
    <h2 class="text-lg font-medium">Nothing here yet</h2>
    <p class="muted mt-1">Add your first item to get started.</p>
    <div class="mt-4">
      <a href="#" class="btn btn-outline">Create</a>
    </div>
  </section>
  ```

- Forms

  ```html
  <form class="space-y-4" method="post">
    <div>
      <label class="label" for="title">Title</label>
      <input id="title" name="title" type="text" class="input" placeholder="Enter a title" />
      <p class="error" role="alert" hidden>Validation message here</p>
    </div>
    <div>
      <label class="label" for="description">Description</label>
      <textarea id="description" name="description" rows="4" class="textarea" placeholder="Optional description"></textarea>
      <p class="error" role="alert" hidden>Validation message here</p>
    </div>
    <div class="pt-2 flex items-center gap-2">
      <button type="submit" class="btn btn-primary">Save</button>
      <a href="#" class="btn btn-outline">Cancel</a>
    </div>
  </form>
  ```

- Modal (minimal)

  ```html
  <div class="modal" role="dialog" aria-modal="true" aria-labelledby="m-title" hidden>
    <div class="modal-content">
      <header class="flex items-center justify-between mb-3">
        <h2 id="m-title" class="text-lg font-semibold">Modal title</h2>
        <button class="icon-btn" aria-label="Close">×</button>
      </header>
      <div class="modal-body">
        <!-- content -->
      </div>
      <footer class="mt-4 flex items-center gap-2">
        <button class="btn btn-outline">Cancel</button>
        <button class="btn btn-primary">Confirm</button>
      </footer>
    </div>
  </div>
  ```

- Table (responsive wrapper)

  ```html
  <div class="card overflow-auto">
    <table class="w-full text-sm">
      <thead>
        <tr>
          <th class="th">Name</th>
          <th class="th">Updated</th>
          <th class="th">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="td">Item A</td>
          <td class="td">Today</td>
          <td class="td"><a href="#" class="btn btn-xs btn-outline">Open</a></td>
        </tr>
      </tbody>
    </table>
  </div>
  ```

## Utility Class Tokens (example mapping)

### Buttons

Core intent: keep a consistent ergonomic base (inline-flex, vertical centering, radius, readable size, hover affordance, accessible focus).

Recommended token layers:

- Base (implicit for all buttons):
  - `inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2`
- Primary (emphasis / main action):
  - Add: `bg-slate-900 text-white hover:bg-slate-800 focus-visible:ring-slate-400`
- Secondary (neutral outlined surface — the style already used in the existing “Edit” button):
  - Add: `border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus-visible:ring-slate-400`
  - Optional alias class: `.btn-secondary`
- Outline (very light / ghost variant — if kept distinct from secondary, keep no fill until hover):
  - Add: `border border-slate-300 bg-transparent text-slate-700 hover:bg-slate-50 focus-visible:ring-slate-400`
- Destructive (danger):
  - Add: `border border-red-500 text-red-600 hover:bg-red-50 focus-visible:ring-red-400`
- XS size modifier:
  - Add: `text-xs px-2.5 py-1.5`
- Default size:
  - `text-sm px-3 py-1.5`

Example (utility-only usage):

```html
<button class="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2">
  Secondary
</button>
```

Optional semantic alias mapping (if you introduce lightweight CSS):

```css
.btn { @apply inline-flex items-center gap-2 rounded-md font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2; }
.btn-primary { @apply bg-slate-900 text-white hover:bg-slate-800 focus-visible:ring-slate-400; }
.btn-secondary { @apply border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus-visible:ring-slate-400; }
.btn-outline { @apply border border-slate-300 bg-transparent text-slate-700 hover:bg-slate-50 focus-visible:ring-slate-400; }
.btn-xs { @apply text-xs px-2.5 py-1.5; }
```

Guidelines:

- Use Secondary for neutral actions (Edit, Manage, Cancel).
- Prefer Outline only when you intentionally want less visual weight than Secondary.
- Keep icon + label with `gap-2`; omit gap if icon-only.

### Inputs
  - `.input`: `block w-full rounded-md border px-3 py-4 text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none`
  - `.textarea`: `block w-full rounded-md border px-3 py-4 text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none resize-none`
- Surfaces
  - `.card`: `rounded-lg border p-4 bg-white shadow-sm`
  - `.muted`: subdued text color; `.muted-strong`: slightly stronger
  - `.shadow-hover`: increase elevation on hover
- Layout
  - `.container`: centered, max-width with horizontal padding
  - `.grid`: CSS grid; `grid-1 grid-sm-2 grid-lg-3` responsive columns
  - `.gap-4`, `.mb-6`, `.mt-3`: spacing utilities

Use your project’s utility system (Tailwind, UnoCSS, custom) to map these tokens appropriately.

## Accessibility & Semantics

- Use correct landmarks and roles; every input has an explicit label.
- Ensure focus states are visible and keyboard interactions are supported.
- Provide `aria-*` attributes where needed (dialogs, tabs, toasts).
- Announce dynamic changes (e.g., toasts) to assistive tech with live regions.

## Interaction & Motion

- Keep transitions subtle (150–200ms) for hover/focus/enter/leave.
- Debounce expensive interactions; avoid layout shift.
- Prefer native controls when possible; polyfill only if necessary.

## Delivery Guidelines

- Be framework-agnostic by default; if a framework is requested, adapt syntax without changing the visual/UX rules.
- Keep dependencies minimal; avoid new libraries unless explicitly asked.
- Provide responsive behavior (mobile-first) and sensible empty/loading states.
- Include only necessary comments; keep generated code focused and clean.

## Acceptance Checklist

- Uses semantic HTML and accessible labels/focus management.
- Visuals follow the neutral, minimal style; consistent spacing and typography.
- Buttons, cards, headers, and forms use the tokenized class patterns.
- Responsive layouts with graceful empty states.
- Minimal JS, progressive enhancement where needed.
