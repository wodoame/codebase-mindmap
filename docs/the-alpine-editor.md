# The Alpine Editor

A lightweight wrapper around the TipTap editor that exposes a simple Alpine.js component API. It lets us build and control a UI with declarative HTML while using TipTap under the hood for rich text, code blocks, links, images, and embeds.

## Overview
- Alpine component: `editor(content: string)` creates and manages a TipTap `Editor` instance.
- Two modes: `edit` (content-editable) and `preview` (read-only HTML with syntax highlighting).
- Paste intelligence: images, website link previews (OpenGraph), and YouTube embeds.

## Features
- Rich text: bold, italic, underline, strike, headings, lists, blockquotes.
- Code blocks: syntax highlighting via `highlight.js`/`lowlight`.
- Links: open-on-click, autolink, link-on-paste, set/unset via API.
- Images: paste a direct image URL to insert an image node.
- Link previews: paste a website URL to insert a preview card (title/description/thumbnail) using `/api/link-preview/`.
- YouTube embeds: paste a YouTube URL to insert a responsive iframe.
- Events and state: easy toolbar reactivity via `updatedAt`.

## Architecture
- Entry: `core/static/ts/editor.ts` defines the Alpine component and TipTap configuration.
- Extensions:
	- `StarterKit` (base nodes/marks; `codeBlock` disabled to use lowlight version)
	- `Link`, `Underline`, `Highlight`
	- `Image` (inline images)
	- `CodeBlockLowlight` (syntax highlighting)
	- Custom `LinkPreview` node: `core/static/ts/extensions/linkPreview.ts`
	- Custom `YouTube` node: `core/static/ts/extensions/youtube.ts`
- Backend endpoint for previews: `GET /api/link-preview/?url=...`

## Initialization
1) Include the bundle in your template (already present in `base.html`):
```
<script type="module" crossorigin src="{% static 'js/vite/bundle.js' %}"></script>
```

2) Mount the Alpine component and provide a mount target for TipTap:
```
<div x-data="editor('<p>Hello world</p>')">
	<!-- Toolbar would go here -->
	<div x-ref="element"></div>

	<!-- Optional preview -->
	<template x-if="isPreviewMode()">
		<div x-html="previewContent"></div>
	</template>
</div>
```
TipTap binds to `this.$refs.element` from the Alpine component.

## Paste Behavior
On paste, the component inspects plain text from the clipboard:
- Image URL (`.png .jpg .jpeg .gif .webp .bmp .svg`): inserts an `image` node with `src`.
- YouTube URL (`youtu.be/<id>`, `youtube.com/watch?v=<id>`, `youtube.com/embed/<id>`): inserts a `youtube` node with a responsive iframe.
- Other URL: requests `/api/link-preview/?url=...`.
	- If response is `{ type: 'image', image }`: inserts an `image` node.
	- If response includes OpenGraph data: inserts a `linkPreview` card (thumbnail, title, description, site name).
	- Fallback: inserts a normal hyperlink.

Notes:
- The preview endpoint sanitizes and reads up to 256KB to extract OpenGraph/Twitter meta tags. Consider allowlists/timeouts for production.

## Public API (Alpine component)
- State
	- `state: 'edit' | 'preview'`
	- `updatedAt: number` (trigger toolbar reactivity)
	- `previewContent: string` (rendered HTML when in preview)
- Lifecycle
	- `init()`, `isLoaded()`
- Mode & preview
	- `switchToEdit()`, `switchToPreview()`, `isEditMode()`, `isPreviewMode()`, `updatePreview()`
- Formatting
	- `toggleHeading({ level })`, `toggleBold()`, `toggleItalic()`, `toggleUnderline()`, `toggleStrike()`
	- `toggleBulletList()`, `toggleOrderedList()`, `toggleBlockquote()`
	- `toggleCodeBlock()`, `setCodeBlock(language)`
	- `toggleHighlight()`
- Links
	- `setLink(url)`, `unsetLink()`
- Content
	- `getHTML()`, `getJSON()`, `getText()`
	- `setHTML(html)`, `setJSON(json)`
	- `focus()`

These methods delegate to TipTap chains or commands. Use them from your toolbar buttons via Alpine directives.

## Example Toolbar Button
```
<button @click="toggleBold()" :class="{ 'is-active': isActive('bold', updatedAt) }">Bold</button>
```

## Styling
- Preview card and YouTube iframe use inline styles for portability. You can replace them with classes and move styles to your CSS.
- Code blocks in preview are highlighted via `highlight.js` and set to a monospaced font.

## Backend: Link Preview Endpoint
- Path: `/api/link-preview/?url=ENCODED_URL`
- Returns one of:
	- `{ type: 'image', url, image }`
	- `{ type: 'link', url, title?, description?, image?, siteName? }`
- Security: For production, consider allowlists, IP blocking (no private ranges), stricter timeouts, and caching.

## Build & Run
```
npm run build
python manage.py runserver
```
Open http://127.0.0.1:8000/ and paste a URL to test image insertion, link preview cards, and YouTube embeds.

## Troubleshooting
- Paste does nothing:
	- Ensure the editor is in focus and `x-ref="element"` exists.
	- Check the console network tab for `/api/link-preview/` responses.
- No thumbnail:
	- Site may not provide OpenGraph tags, or blocks the request. The fallback inserts a link.
- YouTube not embedding:
	- Verify the URL shape; supported forms include `youtu.be/<id>`, `youtube.com/watch?v=...`, `youtube.com/embed/...`.

