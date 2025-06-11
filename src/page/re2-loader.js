import { RE2 } from './re2-class.js';

window.RE2 = RE2;

let readyResolver;
const isReadyPromise = new Promise((resolve) => {
  readyResolver = resolve;
});

export { isReadyPromise };

async function initializeRE2() {
  try {
    const response = await fetch('./re2.wasm');
    const wasmBinary = await response.arrayBuffer();

    window.Module = {
      wasmBinary,
      locateFile: (path, prefix) => {
        if (path.endsWith('.wasm')) {
          return './re2.wasm';
        }
        return prefix + path;
      },
      onAbort: (what) => {
        console.error('WASM loading aborted:', what);
      },
      onRuntimeInitialized: () => {
        // from now window.module.WrappedRE2 is available
        console.log('RE2 WASM module loaded successfully');
        readyResolver();
      },
      printErr: (text) => {
        console.error(text);
      },
      print: (text) => {
        console.log(text);
      },
    };

    const script = document.createElement('script');
    script.src = './re2.js';
    script.onerror = (error) => {
      console.error('Failed to load re2.js:', error);
    };
    document.head.appendChild(script);
  } catch (error) {
    console.error('Failed to initialize RE2:', error);
  }
}

initializeRE2();
