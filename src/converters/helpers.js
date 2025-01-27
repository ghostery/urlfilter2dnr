import mappings from '../mappings.json';

export const DEFAULT_PARAM_MAPPING = {
  '3p': 'third-party',
  xhr: 'xmlhttprequest',
  frame: 'subdocument',
};

/**
 * Normalizes redirect resource name into preferred format (if not found, will use 'ubo')
 * @param {string} name
 * @param {'ubo' | 'adg'} dialect
 */
function normalizeRedirect(name, dialect) {
  if (dialect !== 'ubo' && dialect !== 'adg') {
    throw new Error(`The redirect resource dialect of "${dialect}" is not supported!`);
  }

  /**
   * @type {string[]}
   */
  const candidates = [name];

  if (name.indexOf('.') !== -1) {
    candidates.push(name.slice(0, name.lastIndexOf('.')));
  }

  const mapping = mappings.find((mapping) => {
    for (const candidate of candidates) {
      const found =
        mapping.hints.includes(candidate) ||
        mapping.hints.find((hint) => hint.includes(candidate)) !== undefined;

      if (found) {
        return true;
      }
    }

    return false;
  });

  if (mapping === undefined) {
    return name;
  }

  return mapping.dialects[dialect] ?? mapping.dialects.ubo;
}

export function normalizeFilter(filter, { mapping = DEFAULT_PARAM_MAPPING } = {}) {
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

  const indexOfRedirect = params.findIndex((p) => p.startsWith('redirect='));
  if (indexOfRedirect !== -1) {
    params[indexOfRedirect] =
      'redirect=' + normalizeRedirect(params[indexOfRedirect].slice(9), 'adg');
  }

  const indexOfRedirectRule = params.findIndex((p) => p.startsWith('redirect-rule='));
  if (indexOfRedirectRule !== -1) {
    params[indexOfRedirect] =
      'redirect-rule=' + normalizeRedirect(params[indexOfRedirect].slice(14), 'adg');
  }

  if (back.length === 0) {
    return front;
  }

  return `${front}$${params.join(',')}`;
}

export function normalizeRule(rule, { resourcesPath } = {}) {
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
    newRule.action.redirect.extensionPath = `${resourcesPath}/${normalizeRedirect(newRule.action.redirect.extensionPath.slice(3 /* '/a/'.length */), 'ubo')}`;
  }

  return newRule;
}
