import convertWithAdguard from './converters/adguard.js';
import convertWithAbp from './converters/abp.js';

export const convert = async (rules: string[], converter: 'adguard' | 'abp', options: any) => {
  if (converter === 'adguard') {
    return convertWithAdguard(rules, options);
  }
  return convertWithAbp(rules);
};

export { convertWithAdguard, convertWithAbp };
