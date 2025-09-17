# Alpine Scope: Calling Ancestor Methods from Child Templates

Alpine.js evaluates expressions (in `x-show`, `:class`, `@click`, etc.) against the current element’s `x-data`. If a property or method isn’t found, Alpine walks up the DOM to the nearest ancestor that defines `x-data`. This lets child templates call methods and read state defined on a parent component.

## Why `isEditMode()` works in children

- The editor wrapper defines `x-data="editor(...)"`, exposing methods like `isEditMode()` and `isPreviewMode()`.
- Child templates (e.g., `toolbar.html`) do not declare their own `x-data`, so Alpine resolves `isEditMode()` on the nearest ancestor that does — the editor wrapper.
- In this repo:
  - Wrapper: `core/templates/core/components/editor/editor.html` sets `x-data="editor('<p>Hello world! :-)</p>')"`.
  - Child: `core/templates/core/components/editor/toolbar.html` uses `x-show="isEditMode()"`.
  - Result: The toolbar can call `isEditMode()` via Alpine’s scope chain.

## How scope resolution works

1. Evaluate on the element’s own `x-data` (if present).
2. If not found, look up to the closest ancestor with `x-data`.
3. Continue ascending until a match is found or the root is reached.

## Recommended patterns

- Centralize shared state and actions on the wrapper:
  - Define editor state (`state`, `isEditMode()`, `toggleBold()`, etc.) on the parent.
  - Keep child templates “dumb”: no `x-data` unless they truly need local state.
- Use events to decouple when needed:
  - Child ➜ Parent: `$dispatch('event-name', payload)`, handle with `@event-name` on an ancestor (or `@event-name.window`).

## Patterns to avoid

- Shadowing names:
  - If a child defines its own `x-data` with the same method names, the child’s names shadow the parent’s within that subtree.
- Assuming global access:
  - Methods are not global; moving a partial outside the wrapper removes access to the ancestor’s `x-data`.

## Practical examples

- Toolbar controlled by parent editor:

```html
<div x-data="editor('<p>…</p>')">
  {% component "toolbar" / %}
  <div x-show="isEditMode()" x-ref="element"></div>
</div>
```

- Child with local state still calling parent methods:

```html
<div x-data="editor('…')">
  <div x-data="{ localOpen: false }">
    <button @click="toggleBold()">Bold</button>
  </div>
</div>
```

## Debugging tips

- Ensure the child is nested under an element that declares `x-data`.
- Quick check: add `x-init="console.log(!!isEditMode)"` on a child element.
- Use `$watch('state', …)` on the wrapper to reactively update children that depend on state changes.

## Takeaway

Seeing `isEditMode()` (or similar) in a child template usually means it’s resolved from an ancestor’s `x-data`. This is Alpine’s intended scoping model and enables clean, declarative child templates driven by a single parent component.
