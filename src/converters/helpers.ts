import resourceMapping from '../mappings.js';

type ResourceMapping = {
  [key: string]: {
    adg?: string;
    ubo?: string;
  };
};

const typedResourceMapping = resourceMapping as ResourceMapping;

const FIRST_OPTION_PATTERN = /\$[a-z0-9-]+(?:[,=]|$)/;
// Options follow the last `$` of a filter
const REDIRECT_OPTION_PATTERN = /(\$(?:[^$]*,)?redirect(?:-rule)?=)([^,$]+)[^$]*$/;
// uBO syntax allows a priority after the resource name: `$redirect=noop.js:10`
const REDIRECT_PRIORITY_PATTERN = /:-?\d+$/;
export const DEFAULT_PARAM_MAPPING = {
  '3p': 'third-party',
  xhr: 'xmlhttprequest',
  frame: 'subdocument',
  from: 'domain',
};

/**
 * Finds the index of first filter option
 * @param filter The filter line
 * @returns The index of '$' sign followed by options
 */
function findOptionIndex(filter: string) {
  const match = FIRST_OPTION_PATTERN.exec(filter);
  if (match === null) {
    return -1;
  }
  return match.index;
}

/**
 * Translates resource name
 * @param {string} name The source resource name
 * @param {'ubo' | 'adg'} dialect The destination dialect
 * @returns Translated dialect or passes given name in case of not found
 */
function convertName(name: string, dialect: 'ubo' | 'adg') {
  return typedResourceMapping[name]?.[dialect] ?? name;
}

/**
 * Finds the resource of `$redirect` or `$redirect-rule` option
 * @param filter The filter line
 * @returns The resource name, its position in the filter and its known dialects
 */
export function findRedirectResource(filter: string) {
  const match = REDIRECT_OPTION_PATTERN.exec(filter);
  const [, prefix, value] = match ?? [];
  if (!match || !prefix || !value) {
    return undefined;
  }

  const name = value.replace(REDIRECT_PRIORITY_PATTERN, '');
  const start = match.index + prefix.length;

  return { name, start, end: start + name.length, ...typedResourceMapping[name] };
}

/**
 * Replaces `$redirect` and `$redirect-rule` option value with preferred dialect
 * @param {string} line line The filter line
 * @param {'ubo' | 'adg'} dialect The destination dialect
 * @returns A filter line after resource translation
 */
function convertRedirectFilterOptions(line: string, dialect: 'ubo' | 'adg') {
  const redirect = findRedirectResource(line);
  if (!redirect) {
    return line;
  }

  return `${line.slice(0, redirect.start)}${convertName(redirect.name, dialect)}${line.slice(redirect.end)}`;
}

export function normalizeFilter(
  filter: string,
  { mapping = DEFAULT_PARAM_MAPPING }: { mapping?: Record<string, string> } = {},
) {
  filter = convertRedirectFilterOptions(filter, 'adg');

  const index = findOptionIndex(filter);
  if (index === -1) {
    if (!(filter.startsWith('/') && filter.endsWith('/'))) {
      return filter.toLowerCase();
    }

    return filter;
  }

  let front = filter.slice(0, index);
  const back = filter.slice(index + 1).split(',');
  let params = back.join(',').split(',');

  params.forEach((param, index) => {
    const [key, value] = param.split('=');
    const alias = mapping[key as keyof typeof mapping];
    if (alias) {
      params[index] = value ? `${alias}=${value}` : alias;
    }
  });
  // remove duplicates
  params = params.filter((param, index) => {
    return params.indexOf(param) === index;
  });

  // by default easylist syntax is case-insensitve
  if (!(front.startsWith('/') && front.endsWith('/')) && !params.find((p) => p === 'match-case')) {
    front = front?.toLowerCase();
  }

  return `${front}$${params.join(',')}`;
}

export function normalizeRule(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rule: any,
  {
    resourcesPath = '',
    id,
    redirectResource,
  }: { resourcesPath?: string; id?: number; redirectResource?: string } = {},
) {
  if (!rule) {
    return;
  }
  const newRule = structuredClone(rule);

  if (id) {
    newRule.id = id;
  }

  if (newRule.condition.urlFilter?.endsWith('*')) {
    newRule.condition.urlFilter = newRule.condition.urlFilter.slice(0, -1);
  }

  // Empty `RuleCondition.urlFilter` is not allowed
  // > *$xhr,removeparam=ad_config_id,domain=telequebec.tv
  // refs https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/declarativeNetRequest/RuleCondition#urlfilter
  if (!newRule.condition.urlFilter) {
    delete newRule.condition.urlFilter;
  }

  if (rule.condition.isUrlFilterCaseSensitive !== true) {
    delete newRule.condition.isUrlFilterCaseSensitive;
  }

  if (
    newRule.condition.regexFilter?.startsWith('/') &&
    newRule.condition.regexFilter?.endsWith('/')
  ) {
    newRule.condition.regexFilter = newRule.condition.regexFilter.slice(1, -1);
  }

  if (newRule.condition.excludedDomains) {
    newRule.condition.excludedInitiatorDomains = newRule.condition.excludedDomains;
    delete newRule.condition.excludedDomains;
  }

  if (newRule.condition.domains) {
    newRule.condition.initiatorDomains = newRule.condition.domains;
    delete newRule.condition.domains;
  }

  if (newRule.action.type === 'redirect') {
    if (newRule.action.redirect?.extensionPath) {
      const resourceName = newRule.action.redirect.extensionPath.slice(
        resourcesPath.length + 1 /* Adguard always adds slash after the resourcesPath */,
      );
      newRule.action.redirect.extensionPath = `${resourcesPath}/${redirectResource ?? convertName(resourceName, 'ubo')}`;
    }
  }

  return newRule;
}

/**
 * Maximum memory in bytes for the regex.
 * This value is lower than 2MB as required by chrome, but it was determined empirically.
 */
const MAX_MEMORY_BYTES = 1990;

declare global {
  var chrome: {
    runtime?: {
      lastError: null;
    };
    declarativeNetRequest?: {
      isRegexSupported: (
        regexOptions: { regex: string; isCaseSensitive?: boolean; requireCapturing?: boolean },
        callback: (result: { isSupported: boolean }) => void,
      ) => void;
    };
  };
}

// Chrome API mocks required by AdGuard converter
export function mockChromeApi() {
  globalThis.chrome = {
    runtime: {
      lastError: null,
    },
    declarativeNetRequest: {
      isRegexSupported: async (regexOptions, callback) => {
        try {
          let RE2Class;
          if (typeof process !== 'undefined' && process.versions && process.versions.node) {
            // Node.js: dynamic import
            const mod = await import('@adguard/re2-wasm');
            RE2Class = mod.RE2;
          } else {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            RE2Class = (globalThis as any).RE2;
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
    },
  };
}
