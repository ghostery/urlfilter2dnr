export function normalizeFilter(filter) {
  let [front, back = ''] = filter.split("$");
  let params = back.split('$').join(',').split(',');

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

  if (!back) {
    return front;
  }

  return `${front}$${params.join(',')}`;
}
