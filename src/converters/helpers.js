import redirects from '@adguard/scriptlets/dist/redirects.json' with { type: 'json' }

function getPathBasename(path) {
  const lastIndex = path.lastIndexOf('/');
  if (lastIndex === -1) {
    return path;
  }
  return path.slice(lastIndex + 1);
}

function getPathDirname(path) {
  const lastIndex = path.lastIndexOf('/');
  if (lastIndex === -1) {
    return '.';
  }
  return path.slice(0, lastIndex);
}

const allowedResourceExtensions = [
  'html',
  'js',
  'css',
  'mp4',
  'mp3',
  'xml',
  'txt',
  'json',
  'png',
  'gif',
  'empty',
];

function getPreferredResource(aliases) {
  // ignore non-supported files and manually created uBO aliases by AdGuard
  return aliases.find(alias => {
    const extension = alias.split('.').pop();
    return extension !== undefined &&
      allowedResourceExtensions.includes(extension) &&
      !alias.startsWith('ubo-') &&
      !alias.includes('-transparent');
  });
}

function getFileExtensionByContentType(contentType) {
  if (contentType.includes(';')) {
    contentType = contentType.slice(0, contentType.indexOf(';'));
  }
  switch (contentType) {
    case 'text/html':
      return '.html';
    case 'text/css':
      return '.css';
    case 'text/plain':
    case 'application/javascript':
      return '.js';
    case 'application/json':
      return '.json';
  }

  return '';
}

export function generateResourcesMapping() {
  const resourcesMapping = new Map();

  for (const redirect of redirects) {
    // Skip, in case of AdGuard-only resource
    if (redirect.aliases === undefined) {
      continue;
    }

    const preferredResourceName = getPreferredResource(redirect.aliases);

    // Skip, in case of safe redirect resource name that's safe to use wasn't found
    if (preferredResourceName === undefined) {
      continue;
    }

    // Register to mapping
    resourcesMapping.set(redirect.title, preferredResourceName);
    resourcesMapping.set(redirect.title + getFileExtensionByContentType(redirect.contentType), preferredResourceName);
    for (const alias of redirect.aliases) {
      if (alias !== preferredResourceName) {
        resourcesMapping.set(alias, preferredResourceName);
      }
    }
  }

  return resourcesMapping;
}

export const DEFAULT_PARAM_MAPPING = {
  '3p': 'third-party',
  'xhr': 'xmlhttprequest',
  'frame': 'subdocument'
};

export function normalizeFilter(filter, { mapping = DEFAULT_PARAM_MAPPING } = {}) {
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

  if (back.length === 0) {
    return front;
  }

  return `${front}$${params.join(',')}`;
}

export const DEFAULT_RESOURCE_MAPPING = generateResourcesMapping();

export function normalizeRule(rule, { resourcesMapping = DEFAULT_RESOURCE_MAPPING } = {}) {
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
    const preferredFilename = resourcesMapping.get(filename);

    if (preferredFilename !== undefined) {
      newRule.action.redirect.extensionPath =
        getPathDirname(newRule.action.redirect.extensionPath) + '/' + preferredFilename;
    }
  }

  return newRule;
}
