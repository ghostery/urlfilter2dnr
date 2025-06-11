import { describe, it } from 'node:test';

import { testRule } from './helpers.js';

describe('converters', () => {
  it('generate same rules', async () => {
    await testRule('||domain.com');
    await testRule('@@||domain.com');
    await testRule(String.raw`/.*domain.com/`);
  });
});
