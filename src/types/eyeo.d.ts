declare module '@eyeo/webext-ad-filtering-solution/adblockpluscore/lib/filters/index.js' {
  export class FilterParsingError extends Error {}
  export function normalize(filter: string): string;
}

declare module '@eyeo/webext-ad-filtering-solution/adblockpluscore/lib/dnr/index.js' {
  export function createConverter(options: {
    isRegexSupported: () => boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }): (filter: string) => any[] | FilterParsingError;
}
