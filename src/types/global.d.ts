// Extend the Window interface to include our custom function
declare global {
  interface Window {
    registerClearCart?: (
      callback: (clearCart: () => void) => (() => void) | void
    ) => (() => void) | void;
  }
}

export {}; // This file needs to be a module
