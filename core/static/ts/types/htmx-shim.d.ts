// Minimal local shim for htmx typings
// Provides a global `htmx` and `window.htmx` as `any` to satisfy TypeScript

declare global {
  // Access via global const
  const htmx: any;

  // Access via window.htmx
  interface Window {
    htmx: any;
  }
}

export {};
