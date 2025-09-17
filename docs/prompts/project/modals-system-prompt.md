# Codebase Mindmap — Modal System Prompt

This prompt is designed to onboard any AI assistant (or future you) to the modal system in this project. Provide this as context before asking the assistant to build, change, or debug modals.

---

You are working in the Codebase Mindmap project. Modals are built by composing a Django Components server-rendered wrapper with an Alpine.js client-side instance registered in a global ModalManager. There is also a thin TypeScript proxy layer for higher-level modal behaviors.

Goals for you, the assistant:

- Understand the architecture and moving parts of the modal system
- Follow the existing conventions
- Only change what’s necessary; avoid breaking the public API

## Architecture Overview

- Django Components
  - Base component name: `baseModal` (class `BaseModal` in `core/templates/core/components/modals/baseModal.py`)
  - Editor modal wrapper: `editorModal` (class in `core/templates/core/components/modals/editorModal.py`)

- Alpine.js Instance
  - Bound via `x-data="baseModal('{{id}}')"` in the modal template (`baseModal.html`)
  - Alpine registration happens in `core/static/ts/initAlpineComponents.ts`:
    - `Alpine.data('baseModal', createModalInstance)`
    - `createModalInstance(id)` returns `{ isOpen, init, open, close, toggleSideEffects, handleClickOutside }`
  - `open()` pushes a history state, sets `localStorage.modalOpen = 'true'`, shows the backdrop, and locks scroll
  - `close()` reverses side effects and clears localStorage keys

- ModalManager + Proxies (TypeScript)
  - Manager file: `core/static/ts/modals.ts`
  - `ModalManager` (singleton) registers modal instances by id
  - `BaseModal` is a thin proxy to call `open()`/`close()` on the Alpine instance
  - Higher-level proxies (e.g., `EditorModal`) compose features atop `BaseModal` and are exposed through globals like `window.getEditorModal()`

## Base Modal Template (Server-side)

File: `core/templates/core/components/modals/baseModal.html`

- Required context: `id` (used in `x-data` and as the element id)
- Optional context: `placement`, `animation` (used as data attributes for styling/animation)
- Slots:
  - `title`: replaces the entire header section
  - `title_text`: just the header text inside the default header
  - `body`: modal body content
- Behavior:
  - `:class="{'show': isOpen}"` toggles visibility
  - `@click="handleClickOutside"` closes when clicking the backdrop area

Example usage:

```django
{% load component_tags %}

{% component 'baseModal' id='my-modal' placement='center' animation='translate' %}
  {% slot 'title_text' %}My Modal Title{% endslot %}
  {% slot 'body' %}
    <div class="p-4 md:p-5">
      <p>Content here…</p>
      <button class="btn" @click="close">Close</button>
    </div>
  {% endslot %}
{% endcomponent %}
```

Important:

- Ensure a backdrop exists in the base layout:
  - `<div id="animated-backdrop" class="hidden"></div>`
  - `createModalInstance.toggleSideEffects` shows/hides this and toggles `body.overflow-hidden`
- CSS should show/hide `.modal` when `.show` is present, and may leverage `data-placement` and `data-animation`

## Alpine Modal Instance

File: `core/static/ts/initAlpineComponents.ts`

Key API in `createModalInstance(id)`:

- `init()`: logs initialization and registers the modal with `modalManager.registerModal(id, this)`
- `open()`: sets `isOpen=true`, toggles side effects, pushes history, sets `localStorage.modalOpen='true'`, updates `modalManager.currentlyOpenModal`
- `close()`: sets `isOpen=false`, toggles side effects, clears `localStorage` flags (`modalOpen`, `forwarded`)
- `handleClickOutside(e)`: closes when clicking the backdrop (`e.target == e.currentTarget`)

Alpine registration:

```ts
document.addEventListener('alpine:init', () => {
  Alpine.data('baseModal', createModalInstance);
  // other Alpine components…
});
```

## Modal Manager and Proxies (TypeScript)

File: `core/static/ts/modals.ts`

- `ModalManager` stores modal instances by id
  - `registerModal(id, instance)`, `getModal(id)`
- `BaseModal` is a proxy wrapper around the underlying Alpine modal instance
  - Methods: `open()`, `close()`
- Specialized example: `EditorModal` (singleton bound to id `editor-modal`)
  - Holds:
    - `df: DataFields` for named DOM references (like the title element)
    - `activeNode: ExtendedHierarchyNode | null`
  - Methods:
    - `show(node)`: sets `activeNode`, updates modal title via `df`, sets the editor HTML via `getEditor()?.setHTML`, then `open()`
    - `save()`: persists editor HTML back to the node and PATCHes the full tree
    - `openAddChildForm()` / `openSetLinkForm()`: opens small focused overlays via `componentManager`
    - `setLink(url)`: sets link in editor, closes overlay, toasts
    - `addChildNode()`: reads form, adds a child node via `treeManager`, closes overlay, toasts
    - `deleteNode()`: deletes current node by id, toasts, closes

Global access:

```ts
const getEditorModal = () => EditorModal.getInstance();
window['getEditorModal'] = getEditorModal;
```

## Editor Modal Composition (Server-side)

File: `core/templates/core/components/modals/editorModal.html`

- Composes `baseModal` with `id="editor-modal"`
- Fills `title` slot and captures the title element for TS via:
  - `x-init="getEditorModal().df.set('title', $el)"`
- Fills `body` with the editor component and two `focusedElement` overlays:
  - `fe-add-node`: small form to add a child node (Enter or button triggers `getEditorModal().addChildNode()`)
  - `fe-set-link`: form to set a link, calls `getEditorModal().setLink(url)`
- Toolbar actions call EditorModal methods (e.g., `openAddChildForm()`, `deleteNode()`)

Example (simplified excerpt):

```django
{% component "baseModal" id="editor-modal" animation='none' %}
  {% fill "title" %}
    <h3 x-init="getEditorModal().df.set('title', $el)">Title</h3>
  {% endfill %}
  {% fill "body" %}
    <div class="p-4" id="editor-container">
      {% component "editor" / %}
    </div>
    {% component "focusedElement" id="fe-add-node" %}…{% endcomponent %}
    {% component "focusedElement" id="fe-set-link" %}…{% endcomponent %}
  {% endfill %}
{% endcomponent %}
```

## Editor Component Integration

File: `core/static/ts/editor.ts`

- Alpine data: `Alpine.data('editor', (content) => { … })`
- Exposes APIs used by `EditorModal`, such as:
  - `setHTML(html)`, `getHTML()`, `setLink(url)`
  - Mode helpers: `switchToEdit()`, `switchToPreview()`, `focus()`
- `getEditor()` (exported) returns the current editor Alpine instance so TS code can control it

## Opening/Closing a Modal (Client-side)

Options:

- Inside template buttons:
  - `@click="open"` / `@click="close"`
- Programmatic via manager:
  - `modalManager.getModal('my-modal')?.open()`
- Editor modal helper:
  - `getEditorModal().show(node)` opens the modal and initializes its content

## Conventions and Gotchas

- Every modal must have a unique `id`
- Ensure Alpine is initialized (and modals registered) before calling TS proxies:
  - Typically after `alpine:init` and DOM content is ready
- Backdrop:
  - A `<div id="animated-backdrop" class="hidden"></div>` must exist in the DOM
  - `toggleSideEffects` toggles its visibility and `body.overflow-hidden`
- History and localStorage:
  - `open()` pushes a history state and sets `localStorage.modalOpen`
  - If you want back-button to close the modal, add a `window.onpopstate` handler that calls `.close()` on the currently open modal
- DataFields in `EditorModal`:
  - The template uses `x-init="getEditorModal().df.set('title', $el)"` to provide the title element
  - Keep this naming consistent (`title`) so `show(node)` can update it
- FocusedElement overlays (`fe-add-node`, `fe-set-link`) are controlled through `componentManager.getInstance(id)?.open()/close()`

## Checklist for Adding a New Modal

1. Server: Add a template using `{% component 'baseModal' id='your-id' %}` and fill slots
2. Client (Alpine): No changes needed; `baseModal` binds to `createModalInstance`
3. Manager (TS): If you need programmatic control:
   - Use `modalManager.getModal('your-id')?.open()`
   - Or create a specialized proxy class extending `BaseModal`
4. Backdrop: Ensure `#animated-backdrop` exists in your base layout
5. Styles: Add/verify CSS for `.modal.show` and any `data-placement`/`data-animation`
6. Wiring: If your proxy needs DOM refs, capture them via `x-init` and a `DataFields` instance

## Minimal Reproduction Snippet

- Template:

```django
{% load component_tags %}

{% component 'baseModal' id='sample-modal' %}
  {% slot 'title_text' %}Sample{% endslot %}
  {% slot 'body' %}
    <div class="p-4">
      <button class="btn" @click="close">Close</button>
    </div>
  {% endslot %}
{% endcomponent %}
```

- Programmatic open:

```ts
modalManager.getModal('sample-modal')?.open();
```

## What to Provide When Asking an AI to Work on Modals

- The relevant Django component template(s): `baseModal.html`, specialized modal templates
- The Alpine wiring (`initAlpineComponents.ts`), especially `createModalInstance`
- The manager/proxy code (`modals.ts`)
- Any custom CSS for `.modal.show`, `data-placement`, and `data-animation`
- How you plan to trigger the modal (buttons, programmatic, or both)
