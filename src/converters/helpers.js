export function normalizeFilter(filter) {
  let [front, ...back] = filter.split("$");
  let params = back.join(',').split(',');

  params.forEach((param, index) => {
    if (param === '3p') {
      params[index] = 'third-party';
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

export function normalizeRule(rule) {
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
  return newRule;
}
