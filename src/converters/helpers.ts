import resourceMapping from '../mappings.js';

type ResourceMapping = {
  [key: string]: {
    adg?: string;
    ubo?: string;
  };
};

const typedResourceMapping = resourceMapping as ResourceMapping;

export const DEFAULT_PARAM_MAPPING = {
  '3p': 'third-party',
  xhr: 'xmlhttprequest',
  frame: 'subdocument',
};

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
 * Replaces `$redirect` and `$redirect-rule` option value with preferred dialect
 * @param {string} line line The filter line
 * @param {'ubo' | 'adg'} dialect The destination dialect
 * @returns A filter line after resource translation
 */
function convertRedirectFilterOptions(line: string, dialect: 'ubo' | 'adg') {
  const normalizeFilterProperty = (line: string, property: string) => {
    const redirectStartsAt = line.indexOf(`${property}=`);
    if (redirectStartsAt === -1) {
      return line;
    }

    let redirectEndsAt = line.indexOf(',', redirectStartsAt);
    if (redirectEndsAt === -1) {
      redirectEndsAt = line.length;
    }

    return `${line.slice(0, redirectStartsAt)}${property}=${convertName(
      line.slice(
        redirectStartsAt + property.length + 1 /* `${property}=`.length */,
        redirectEndsAt,
      ),
      dialect,
    )}${line.slice(redirectEndsAt)}`;
  };

  if (
    // This covers both redirect= and redirect-rule=:
    !line.includes('redirect')
  ) {
    return line;
  }

  line = normalizeFilterProperty(line, 'redirect');
  line = normalizeFilterProperty(line, 'redirect-rule');

  return line;
}

export function normalizeFilter(filter: string, { mapping = DEFAULT_PARAM_MAPPING }: { mapping?: Record<string, string> } = {}) {
  filter = convertRedirectFilterOptions(filter, 'adg');

  let [front, ...back] = filter.split('$');
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
  if (!params.find((p) => p === 'match-case')) {
    front = front?.toLowerCase();
  }

  if (back.length === 0) {
    return front;
  }

  return `${front}$${params.join(',')}`;
}

export function normalizeRule(rule: any, { resourcesPath = '', id }: { resourcesPath?: string; id?: number } = {}) {
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
  if (newRule.condition.urlFilter?.length === 0) {
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
      newRule.action.redirect.extensionPath = `${resourcesPath}/${convertName(resourceName, 'ubo')}`;
    }
  }

  return newRule;
}
