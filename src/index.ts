import convertWithAdguard from './converters/adguard.js';
import convertWithAbp from './converters/abp.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const convert = async (rules: string[], converter: 'adguard' | 'abp', options: any) => {
  if (converter === 'adguard') {
    return convertWithAdguard(rules, options);
  }
  return convertWithAbp(rules);
};

export { convertWithAdguard, convertWithAbp };
