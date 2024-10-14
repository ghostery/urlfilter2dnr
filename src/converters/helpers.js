import definition from '../mappings.json' with { type: 'json' }

function getPathBasename(path) {
  const lastIndex = path.lastIndexOf('/');
  if (lastIndex === -1) {
    return path;
  }
  return path.slice(lastIndex + 1);
}

export function generateResourcesMapping() {
  const resourcesMapping = new Map();
  for (const names of definition) {
    for (const name of names.slice(1)) {
      resourcesMapping.set(name, names[0]);
    }
  }
  return resourcesMapping;
}

export const DEFAULT_PARAM_MAPPING = {
  '3p': 'third-party',
  'xhr': 'xmlhttprequest',
  'frame': 'subdocument'
};
export const DEFAULT_RESOURCES_MAPPING = generateResourcesMapping();

export function normalizeFilter(filter, {
  mapping = DEFAULT_PARAM_MAPPING,
  resourcesMapping = DEFAULT_RESOURCES_MAPPING,
} = {}) {
  let [front, ...back] = filter.split("$");
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
  if (!params.find(p => p === 'match-case')) {
    front = front.toLowerCase();
  }

  // adguard converter doesn't work with $redirect with slash value
  // replace possible $redirect params including a slash
  const indexOfRedirect = params.findIndex(p => p.startsWith('redirect=') && p.includes('/'));
  if (indexOfRedirect !== -1) {
    const name = resourcesMapping.get(params[indexOfRedirect].slice(9));
    if (name !== undefined) {
      params[indexOfRedirect] = 'redirect=' + name;
    }
  }

  const indexOfRedirectRule = params.findIndex(p => p.startsWith('redirect-rule=') && p.includes('/'));
  if (indexOfRedirectRule !== -1) {
    const name = resourcesMapping.get(params[indexOfRedirectRule].slice(14));
    if (name !== undefined) {
      params[indexOfRedirectRule] = 'redirect-rule=' + name;
    }
  }

  if (back.length === 0) {
    return front;
  }

  return `${front}$${params.join(',')}`;
}

export function normalizeRule(rule, {
  resourcesMapping = DEFAULT_RESOURCES_MAPPING
} = {}) {
  if (!rule) {
    return;
  }
  const newRule = structuredClone(rule);

  if (newRule.condition && newRule.condition.urlFilter) {
    if (newRule.condition.urlFilter.endsWith("*")) {
      newRule.condition.urlFilter = newRule.condition.urlFilter.slice(0, -1);
    }
    if (newRule.condition.isUrlFilterCaseSensitive === undefined) {
      newRule.condition.isUrlFilterCaseSensitive = false;
    }
  }

  if (
    newRule.condition &&
    newRule.condition.regexFilter &&
    !(
      newRule.condition.regexFilter.startsWith("/") &&
      newRule.condition.regexFilter.endsWith("/")
    )
  ) {
    newRule.condition.regexFilter = `/${newRule.condition.regexFilter}/`;
  }

  if (newRule.condition && newRule.condition.excludedDomains) {
    newRule.condition.excludedInitiatorDomains =
      newRule.condition.excludedDomains;
    delete newRule.condition.excludedDomains;
  }

  if (newRule.condition && newRule.condition.domains) {
    newRule.condition.initiatorDomains = newRule.condition.domains;
    delete newRule.condition.domains;
  }

  if (newRule.action && newRule.action.type === 'redirect') {
    const filename = getPathBasename(newRule.action.redirect.extensionPath);
    const preferredFilename =
      resourcesMapping.get(filename) ??
      // try searching without an extension
      // adguard converter attaches an file extension at the end
      resourcesMapping.get(filename.slice(0, filename.lastIndexOf('.')));
    if (preferredFilename !== undefined) {
      newRule.action.redirect.extensionPath =
        newRule.action.redirect.extensionPath.slice(0, -filename.length) + preferredFilename;
    }
  }

  return newRule;
}
