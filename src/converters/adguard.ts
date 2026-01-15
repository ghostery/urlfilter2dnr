import { DeclarativeFilterConverter, Filter } from '@adguard/tsurlfilter/es/declarative-converter';
import { FilterListPreprocessor } from '@adguard/tsurlfilter';
import { normalizeFilter, normalizeRule } from './helpers.js';

import type { RE2 as RE2Class } from '@adguard/re2-wasm';

declare global {
  var chrome: {
    runtime?: {
      lastError: null;
    };
    declarativeNetRequest?: {
      isRegexSupported: (
        regexOptions: { regex: string; flags: string },
        callback: (result: { isSupported: boolean }) => void,
      ) => void;
    };
  };
  // `globalThis.RE2` is only available on the browser.
  var RE2: typeof RE2Class | undefined;
}

/**
 * Maximum memory in bytes for the regex.
 * This value is lower than 2MB as required by chrome, but it was determined empirically.
 */
const MAX_MEMORY_BYTES = 1990;

function createRe2Validator(maxMem = MAX_MEMORY_BYTES) {
  // Try `window.RE2`
  let RE2 = globalThis.RE2;

  function setMaxMem(newMaxMem = MAX_MEMORY_BYTES) {
    maxMem = newMaxMem;
  }

  async function validate(regex = '', flags = '') {
    if (!RE2) {
      if (globalThis.RE2) {
        RE2 = globalThis.RE2;
      } else if (typeof process !== 'undefined') {
        const dep = await import('@adguard/re2-wasm');
        RE2 = dep.RE2;
      } else {
        throw new Error('RE2 instance is not initialised yet!');
      }
    }

    try {
      new RE2(regex, `u${flags}`, maxMem);
    } catch (error) {
      return false;
    }

    return true;
  }

  return {
    setMaxMem,
    validate,
  };
}

if (typeof globalThis.chrome === 'undefined') {
  globalThis.chrome = {
    runtime: {
      lastError: null,
    },
  };
}

const validator = createRe2Validator();

if (typeof globalThis.chrome.declarativeNetRequest === 'undefined') {
  globalThis.chrome.declarativeNetRequest = {
    isRegexSupported: async (
      regexOptions: { regex: string; flags: string },
      callback: (result: { isSupported: boolean }) => void,
    ) => {
      callback({
        isSupported: await validator.validate(regexOptions.regex, regexOptions.flags),
      });
    },
  };
}

const converter = new DeclarativeFilterConverter();

const createFilter = (rules: string[], filterId = 0) => {
  return new Filter(
    filterId,
    {
      getContent: async () => Promise.resolve(FilterListPreprocessor.preprocess(rules.join('\n'))),
    },
    true,
  );
};

export default async function convert(
  rules: string[],
  {
    resourcesPath = '/prefix',
    re2MaxMem = MAX_MEMORY_BYTES,
  }: { resourcesPath?: string; re2MaxMem?: number; } = {},
) {
  if (rules.length === 0) {
    return {
      rules: [],
      errors: [],
      limitations: [],
    };
  }

  if (re2MaxMem > -1) {
    validator.setMaxMem(re2MaxMem);
  }

  const filter = createFilter(rules.map((rule) => normalizeFilter(rule) ?? ''));
  const conversionResult = await converter.convertStaticRuleSet(filter, { resourcesPath });
  const declarativeRules = await conversionResult.ruleSet.getDeclarativeRules();

  const normalizeRules = [];
  const errors = conversionResult.errors.map((e) => e.toString());

  for (const [index, rule] of declarativeRules.entries()) {
    try {
      normalizeRules.push(normalizeRule(rule, { resourcesPath, id: index + 1 }));
    } catch (e) {
      errors.push(
        `Could not normalize rule: ${JSON.stringify(rule)} - ${e instanceof Error ? e.message : e}`,
      );
    }
  }

  return {
    rules: normalizeRules,
    errors,
    limitations: conversionResult.limitations,
  };
}
