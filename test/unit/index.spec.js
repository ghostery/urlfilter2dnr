import { describe, it } from "bun:test";

import { testRule } from "./helpers";

describe('converters', () => {
  it('generate same rules', async () => {
    await testRule('||domain.com');
    await testRule('@@||domain.com');
  });
});
