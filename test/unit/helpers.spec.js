import { describe, it } from 'node:test';
import assert from 'node:assert';

import { testRule } from './helpers.js';

describe('testRule', () => {
  it('passes on compatible rule', async () => {
    await testRule('domain.com');
  });

  it('throws on incompatible rules', async () => {
    await assert.rejects(
      async () => {
        await testRule('||testcases.adguard.com$removeparam=p1case6');
      },
      Error,
      'Expected testRule to throw an error',
    );
  });
});
