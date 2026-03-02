import assert from 'node:assert/strict';
import { describe, it } from 'mocha';

import convertWithAbp from '../../../src/converters/abp.js';
import { normalizeRule } from '../../../src/converters/helpers.js';

describe('abp converter', () => {
  it('handles 3p rules', async () => {
    const { rules: rules1 } = await convertWithAbp(['||sync.extend.tv^$3p']);
    assert.deepEqual(rules1[0], {
      action: {
        type: 'block',
      },
      condition: {
        domainType: 'thirdParty',
        urlFilter: '||sync.extend.tv^',
      },
      id: 1,
      priority: 1000,
    });

    const { rules: rules2 } = await convertWithAbp(['||d3pkntwtp2ukl5.cloudfront.net^$3p']);
    assert.deepEqual(rules2[0], {
      action: {
        type: 'block',
      },
      condition: {
        domainType: 'thirdParty',
        urlFilter: '||d3pkntwtp2ukl5.cloudfront.net^',
      },
      id: 1,
      priority: 1000,
    });
  });

  it('handles trailing wildcard', async () => {
    const { rules } = await convertWithAbp(['/js/tealium/*']);
    assert.deepEqual(rules[0], {
      action: {
        type: 'block',
      },
      condition: {
        urlFilter: '/js/tealium/',
      },
      id: 1,
      priority: 1000,
    });
  });

  it('||tinypass.com^$3p,domain=~foreignpolicy.com', async () => {
    const { rules } = await convertWithAbp(['tinypass.com$3p,domain=x.z']);
    assert.deepEqual(rules[0], {
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
    assert.deepEqual(rules[0], {
      action: {
        type: 'block',
      },
      condition: {
        regexFilter: 'js',
      },
      id: 1,
      priority: 1000,
    });
  });
});
