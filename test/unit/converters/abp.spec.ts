import assert from 'node:assert';
import { describe, it } from 'mocha';

import convertWithAbp from '../../../src/converters/abp.js';

describe('abp converter', () => {
  it('handles 3p rules', async () => {
    const { rules: rules1 } = await convertWithAbp(['||sync.extend.tv^$3p']);
    assert.notStrictEqual(rules1[0], undefined);

    const { rules: rules2 } = await convertWithAbp(['||d3pkntwtp2ukl5.cloudfront.net^$3p']);
    assert.notStrictEqual(rules2[0], undefined);
  });

  it('handles trailing wildcard', async () => {
    const { rules } = await convertWithAbp(['/js/tealium/*']);
    assert.notStrictEqual(rules[0], undefined);
  });

  it('||tinypass.com^$3p,domain=~foreignpolicy.com', async () => {
    const { rules } = await convertWithAbp(['tinypass.com$3p,domain=x.z']);
    assert.deepStrictEqual(rules[0], {
      action: {
        type: 'block',
      },
      condition: {
        domainType: 'thirdParty',
        initiatorDomains: ['x.z'],
        urlFilter: 'tinypass.com',
      },
      priority: 2000,
      id: 1,
    });
  });

  it('handles regexp rules', async () => {
    const { rules } = await convertWithAbp(['/js/']);
    assert.notStrictEqual(rules[0], undefined);
  });

  context.skip('bugs', () => {
    it('does not modify regex metacharacter', async () => {
      const {rules } = await convertWithAbp(['/foo\\D.com/']);
      assert.strictEqual(rules[0].condition.regexFilter, 'foo\\D.com');
    })
  });
});
