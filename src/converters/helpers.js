import resourceMapping from '../mappings.json';

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
function convertName(name, dialect) {
  return resourceMapping[name]?.[dialect] ?? name;
}

/**
 * Replaces `$redirect` and `$redirect-rule` option value with preferred dialect
 * @param {string} line line The filter line
 * @param {'ubo' | 'adg'} dialect The destination dialect
 * @returns A filter line after resource translation
 */
function convertRedirectFilterOptions(line, dialect) {
  const normalizeFilterProperty = (line, property) => {
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

export function normalizeFilter(filter, { mapping = DEFAULT_PARAM_MAPPING } = {}) {
  filter = convertRedirectFilterOptions(filter, 'adg');

  let [front, ...back] = filter.split('$');
  let params = back.join(',').split(',');

  params.forEach((param, index) => {
    const [key, value] = param.split('=');
    const alias = mapping[key];
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
    front = front.toLowerCase();
  }

  if (back.length === 0) {
    return front;
  }

  return `${front}$${params.join(',')}`;
}

export function normalizeRule(rule, { resourcesPath = '' } = {}) {
  if (!rule) {
    return;
  }
  const newRule = structuredClone(rule);

  if (newRule.condition && newRule.condition.urlFilter) {
    if (newRule.condition.urlFilter.endsWith('*')) {
      newRule.condition.urlFilter = newRule.condition.urlFilter.slice(0, -1);
    }
    if (newRule.condition.isUrlFilterCaseSensitive === undefined) {
      newRule.condition.isUrlFilterCaseSensitive = false;
    }
  }

  if (
    newRule.condition &&
    newRule.condition.regexFilter &&
    newRule.condition.regexFilter.startsWith('/') &&
    newRule.condition.regexFilter.endsWith('/')
  ) {
    newRule.condition.regexFilter = newRule.condition.regexFilter.slice(1, -1);
  }

  if (newRule.condition && newRule.condition.excludedDomains) {
    newRule.condition.excludedInitiatorDomains = newRule.condition.excludedDomains;
    delete newRule.condition.excludedDomains;
  }

  if (newRule.condition && newRule.condition.domains) {
    newRule.condition.initiatorDomains = newRule.condition.domains;
    delete newRule.condition.domains;
  }

  if (newRule.action && newRule.action.type === 'redirect') {
    const resourceName = newRule.action.redirect.extensionPath.slice(
      resourcesPath.length + 1 /* Adguard always adds slash after the resourcesPath */,
    );
    newRule.action.redirect.extensionPath = `${resourcesPath}/${convertName(resourceName, 'ubo')}`;
  }

  return newRule;
}
