import { describe, it, expect } from 'bun:test';

import convertWithAdguard from '../../../src/converters/adguard.js';

describe('adguard converter', () => {
  it('||t.a3cloud.net/AM-141112/tag.js', async () => {
    const { rules } = await convertWithAdguard(['||t.a3cloud.net/AM-141112/tag.js']);
    expect(rules[0]).toEqual({
      action: {
        type: 'block',
      },
      id: 1,
      priority: 1,
      condition: {
        isUrlFilterCaseSensitive: false,
        urlFilter: '||t.a3cloud.net/am-141112/tag.js',
      },
    });
  });

  // to be fixed with https://github.com/AdguardTeam/tsurlfilter/pull/109
  it('/baynote(-observer)?([0-9]+).js/', async () => {
    const { rules } = await convertWithAdguard([String.raw`/baynote(-observer)?([0-9]+)\.js/`]);
    expect(rules[0]).toEqual({
      action: {
        type: 'block',
      },
      condition: {
        isUrlFilterCaseSensitive: false,
        regexFilter: String.raw`baynote(-observer)?([0-9]+)\.js`,
      },
      id: 1,
      priority: 1,
    });
  });

  it('handles regexp with ?', async () => {
    const { rules } = await convertWithAdguard(['/a?/']);
    expect(rules[0]).toEqual({
      action: {
        type: 'block',
      },
      condition: {
        isUrlFilterCaseSensitive: false,
        regexFilter: 'a?',
      },
      id: 1,
      priority: 1,
    });
  });

  it('handles regexp escaping', async () => {
    const { rules } = await convertWithAdguard([String.raw`/\\d/$doc`]);
    expect(rules[0]).toEqual({
      action: {
        type: 'block',
      },
      condition: {
        isUrlFilterCaseSensitive: false,
        regexFilter: String.raw`\\d`,
        resourceTypes: ['main_frame'],
      },
      id: 1,
      priority: 101,
    });
  });
});
