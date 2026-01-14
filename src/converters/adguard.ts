declare global {
  var chrome: {
    runtime?: {
      lastError: null;
    };
    declarativeNetRequest?: {
      isRegexSupported: (regexOptions: { regex: string; flags: string }, callback: (result: { isSupported: boolean }) => void) => void;
    };
  };
  var terminateAlternativeDnrApi: undefined | (() => Promise<void>);
}

import { DeclarativeFilterConverter, Filter } from '@adguard/tsurlfilter/es/declarative-converter';
import { FilterListPreprocessor } from '@adguard/tsurlfilter';
import { normalizeFilter, normalizeRule } from './helpers.js';

import type { Browser, WebWorker } from 'puppeteer';
import type { RE2 as RE2Class } from '@adguard/re2-wasm';

// Bytes
const DEFAULT_RE2_MAXMEM = 1990;

export function createRE2Validator(maxMem: number = DEFAULT_RE2_MAXMEM) {
  let RE2: typeof RE2Class | null = null;

  function setMaxMem(newMaxMem: number) {
    if (newMaxMem > 0) {
      maxMem = newMaxMem;
    }
  }

  async function bootstrap() {
    const dep = await import('@adguard/re2-wasm');
    return dep.RE2;
  }

  async function validate(regex: string, flags: string) {
    if (RE2 === null) {
      RE2 = await bootstrap();
    }

    try {
      new RE2(regex, 'u' + flags, maxMem);
    } catch (e) {
      console.error('failed to validate regex:', e);
      return false;
    }
    return true;
  }

  return {
    setMaxMem,
    validate,
  };
}

export function createChromiumValidator() {
  let browser: Browser | null = null;
  let serviceWorker: WebWorker | null = null;

  async function bootstrap(): Promise<{ browser: Browser, worker: WebWorker }> {
    const puppeteer = await import('puppeteer');
    const path = await import('node:path');

    const pathToExtension = path.join(import.meta.dirname, 'dnr-validator-extension');
    const browser = await puppeteer.launch({
      pipe: true,
      enableExtensions: [pathToExtension],
    });

    const workerTarget = await browser.waitForTarget(
      (target) => target.type() === 'service_worker',
    );
    const worker = await workerTarget.worker();

    if (worker === null) {
      throw new Error('Failed to retrieve the extension service worker context!');
    }

    return {browser, worker};
  }

  async function validate(regex: string, flags: string) {
    if (serviceWorker === null) {
      const deps = await bootstrap();
      browser = deps.browser;
      serviceWorker = deps.worker;
    }

    return await serviceWorker.evaluate(function (opts) {
      return new Promise<boolean>(function (resolve) {
        chrome.declarativeNetRequest?.isRegexSupported(opts, function (result) {
          resolve(result.isSupported);
        });
      })
    }, { regex, flags });
  }

  async function terminate() {
    await browser?.close();
  }

  return {
    validate,
    terminate,
  }
}

if (typeof globalThis.chrome === 'undefined') {
  globalThis.chrome = {
    runtime: {
      lastError: null,
    }
  };
}

if (typeof globalThis.chrome.declarativeNetRequest === 'undefined') {
  const validator =
    typeof process !== 'undefined' ? createChromiumValidator() : createRE2Validator();

  globalThis.chrome.declarativeNetRequest = {
    async isRegexSupported({ regex, flags }, callback) {
      callback({
        isSupported: await validator.validate(regex, flags),
      });
    }
  };

  if ('terminate' in validator) {
    globalThis.terminateAlternativeDnrApi = validator.terminate;
  }
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

export default async function convert(rules: string[], { resourcesPath = '/prefix' }: { resourcesPath?: string } = {}) {
  if (rules.length === 0) {
    return {
      rules: [],
      errors: [],
      limitations: [],
    };
  }
  const filter = createFilter(rules.map((rule) => normalizeFilter(rule) ?? ''));
  const conversionResult = await converter.convertStaticRuleSet(filter, { resourcesPath });
  const declarativeRules = await conversionResult.ruleSet.getDeclarativeRules();

  const normalizeRules = [];
  const errors = conversionResult.errors.map(e => e.toString());

  for (const [index, rule] of declarativeRules.entries()) {
    try {
      normalizeRules.push(normalizeRule(rule, { resourcesPath, id: index + 1 }))
    } catch (e) {
      errors.push(`Could not normalize rule: ${JSON.stringify(rule)} - ${e instanceof Error ? e.message : e}`);
    }
  }

  return {
    rules: normalizeRules,
    errors,
    limitations: conversionResult.limitations,
  };
}
