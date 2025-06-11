/* global window, document, fetch, console */

let readyResolver;
const isReadyPromise = new Promise((resolve) => {
  readyResolver = resolve;
});

export { isReadyPromise };

// Preload WASM and initialize Module
async function initializeRE2() {
  try {
    // First, fetch the WASM file
    const response = await fetch('./re2.wasm');
    const wasmBinary = await response.arrayBuffer();

    // Set up Module configuration
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

    // Now load re2.js
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

// Initialize RE2
initializeRE2();

function escapeRegExp(pattern) {
  return pattern.replace(/(^|[^\\])((?:\\\\)*)\//g, '$1$2\\/');
}

const ALPHA_UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const HEX = '0123456789ABCDEF';

function isHexadecimal(char) {
  return HEX.indexOf(char.toUpperCase()) !== -1;
}

function translateRegExp(pattern, multiline) {
  const result = [];
  if (pattern === '') {
    return '(?:)';
  } else if (multiline) {
    result.push('(?m)');
  }
  for (let i = 0; i < pattern.length; ) {
    if (pattern[i] === '\\') {
      if (i + 1 < pattern.length) {
        switch (pattern[i + 1]) {
          case '\\':
            // Consume "\\", output "\\"
            result.push('\\\\');
            i += 2;
            break;
          case 'c':
            if (i + 2 < pattern.length) {
              const alphaIndex = ALPHA_UPPER.indexOf(pattern[i + 2]) + 1;
              if (alphaIndex >= 0) {
                // Consume "\c[upper case character]", output "\x[hex digit][hex digit]"
                result.push('\\x', HEX[Math.floor(alphaIndex / 16)], HEX[alphaIndex % 16]);
                i += 3;
                break;
              }
            }
            // Consume "\c", output "\c"
            result.push('\\c');
            i += 2;
            break;
          case 'u':
            if (i + 2 < pattern.length) {
              const ch2 = pattern[i + 2];
              if (isHexadecimal(ch2)) {
                // Consume "\u[hex digit]", output "\x{[hex digit]"
                result.push('\\x{');
                result.push(ch2);
                i += 3;
                // Consume and output up to 3 more hex digits
                for (
                  let j = 0;
                  j < 3 && i < pattern.length && isHexadecimal(pattern[i]);
                  i++, j++
                ) {
                  result.push(pattern[i]);
                }
                // Output "}"
                result.push('}');
                break;
              } else if (ch2 === '{') {
                // Consume "\u" followed by "{", output "\x"
                // The default case handles the subsequent characters
                result.push('\\x');
                i += 2;
                break;
              }
            }
            // Consume and output "\u"
            result.push('\\u');
            i += 2;
            break;
          default:
            // Consume and output "\[char]"
            result.push('\\', pattern[i + 1]);
            i += 2;
        }
        continue;
      }
    } else if (pattern[i] === '/') {
      // Consume "/"" and output "\/"
      // An existing "\/" would have been handled by the above default case
      result.push('\\/');
      i += 1;
      continue;
    } else if (pattern.substring(i, i + 3) === '(?<') {
      if (pattern[i + 3] !== '=' && pattern[i + 3] !== '!') {
        // Consume "(?<" and output "(?P<"
        result.push('(?P<');
        i += 3;
        continue;
      }
    }
    // Consume and output the next character
    result.push(pattern[i]);
    i += 1;
  }
  return result.join('');
}

class RE2 {
  constructor(pattern, flags, maxMem) {
    this._global = false;
    this._ignoreCase = false;
    this._multiline = false;
    this._dotAll = false;
    this._unicode = false;
    this._sticky = false;
    this.pattern = '(?:)';
    if (typeof pattern !== 'string') {
      if (pattern instanceof RegExp) {
        flags = flags ?? pattern.flags;
        pattern = pattern.source;
      } else {
        if (pattern === undefined) {
          pattern = '(?:)';
        } else {
          pattern = pattern + '';
        }
      }
    }
    if (pattern === '') {
      pattern = '(?:)';
    }
    pattern = escapeRegExp(pattern);
    flags = flags ?? '';
    for (const flag of flags) {
      switch (flag) {
        case 'g':
          this._global = true;
          break;
        case 'i':
          this._ignoreCase = true;
          break;
        case 'm':
          this._multiline = true;
          break;
        case 's':
          this._dotAll = true;
          break;
        case 'u':
          this._unicode = true;
          break;
        case 'y':
          this._sticky = true;
          break;
      }
    }
    if (!this._unicode) {
      throw new Error(
        'RE2 only works in unicode mode. The "u" flag must be passed when constructing a RE2 instance',
      );
    }
    this.pattern = pattern;
    this.wrapper = new window.Module.WrappedRE2(
      translateRegExp(pattern, this._multiline),
      this._ignoreCase,
      this._multiline,
      this._dotAll,
      maxMem ?? 0,
    );
    if (!this.wrapper.ok()) {
      throw new SyntaxError(
        `Invalid regular expression: /${pattern}/${flags}: ${this.wrapper.error()}`,
      );
    }
  }
}

window.RE2 = RE2;
