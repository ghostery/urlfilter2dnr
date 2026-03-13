import { convertWithAdguard, convertWithAbp } from '../index.js';
import { isReadyPromise } from './re2-loader.js';

const $input = document.querySelector('#input textarea');
const $submitButton = document.querySelector('#input input[type=submit]');
const $outputAdguard = document.querySelector('#output-adguard');
const $outputAbp = document.querySelector('#output-abp');
const $errorsAdguard = document.querySelector('#errors-adguard');
const $errorsAbp = document.querySelector('#errors-abp');

const ADGUARD_CONVERTER_OPTIONS = {
  resourcesPath: '/rule_resources/redirects',
};

/**
 * Maximum memory in bytes for the regex.
 * This value is lower than 2MB as required by chrome, but it was determined empirically.
 */
const MAX_MEMORY_BYTES = 1990;

if (typeof globalThis.chrome === 'undefined') {
  globalThis.chrome = {};
}

if (typeof globalThis.chrome.runtime === 'undefined') {
  globalThis.chrome.runtime = {
    lastError: null,
  };
}

if (typeof globalThis.chrome.declarativeNetRequest === 'undefined') {
  globalThis.chrome.declarativeNetRequest = {
    isRegexSupported: async (regexOptions, callback) => {
      try {
        let RE2Class;
        if (typeof process !== 'undefined' && process.versions && process.versions.node) {
          // Node.js: dynamic import
          const mod = await import('@adguard/re2-wasm');
          RE2Class = mod.RE2;
        } else {
          RE2Class = globalThis.RE2;
        }
        new RE2Class(
          regexOptions.regex,
          regexOptions.isCaseSensitive ? 'u' : 'ui',
          MAX_MEMORY_BYTES,
        );
        callback({ isSupported: true });
      } catch (e) {
        console.error(e);
        callback({ isSupported: false });
      }
    },
  };
}

$submitButton.addEventListener('click', async (ev) => {
  ev.preventDefault();
  const rules = $input.value.split('\n').filter(Boolean);

  const { rules: convertedRulesAdguard, errors: errorsAdguard } = await convertWithAdguard(
    rules,
    ADGUARD_CONVERTER_OPTIONS,
  );
  const { rules: convertedRulesAbp, errors: errorsAbp } = await convertWithAbp(rules);

  $outputAdguard.innerHTML = JSON.stringify(convertedRulesAdguard, null, 2);
  $outputAbp.innerHTML = JSON.stringify(convertedRulesAbp, null, 2);
  $errorsAdguard.innerHTML = errorsAdguard.join('\n');
  $errorsAbp.innerHTML = errorsAbp.join('\n');
});

window.addEventListener('message', async (event) => {
  if (!event.data || event.data.action !== 'convert') {
    return;
  }

  const { converter, filters } = event.data;

  let rules, errors;

  await isReadyPromise;

  try {
    if (converter === 'adguard') {
      ({ rules, errors } = await convertWithAdguard(filters, ADGUARD_CONVERTER_OPTIONS));
    } else if (converter == 'abp') {
      ({ rules, errors } = await convertWithAbp(filters));
    }
  } catch (e) {
    errors.push(e);
  }

  event.source.postMessage(
    {
      rules,
      errors,
    },
    event.origin,
  );
});
