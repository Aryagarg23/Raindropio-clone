// Global JSX namespace declaration to fix react-markdown compatibility
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

export {};
