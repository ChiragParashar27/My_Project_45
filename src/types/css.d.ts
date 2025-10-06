// src/types/css.d.ts
// This declares the module type for CSS imports, resolving the TS2882 error.
declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}