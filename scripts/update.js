import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

// Read AdGuard dialects from yml as they emit the `file` property after the conversion.
const adGuardRedirects = parse(
  readFileSync(resolve(require.resolve('@adguard/scriptlets'), '..', '..', 'redirects.yml'), {
    encoding: 'utf-8',
  }),
);

const CWD = dirname(fileURLToPath(import.meta.url));

async function downloadResource(resourceName) {
  console.log('Downloading resources...');

  const { revisions } = await fetch(
    `https://cdn.ghostery.com/adblocker/resources/${resourceName}/metadata.json`,
  ).then((result) => {
    if (!result.ok) {
      throw new Error(
        `Failed to fetch ${resourceName} metadata: ${result.status}: ${result.statusText}`,
      );
    }
    return result.json();
  });
  const latestRevision = revisions.at(-1);
  return fetch(
    `https://cdn.ghostery.com/adblocker/resources/${resourceName}/${latestRevision}/list.txt`,
  ).then((result) => {
    if (!result.ok) {
      throw new Error(`Failed to fetch ${resourceName}: ${result.status}: ${result.statusText}`);
    }
    return result.text();
  });
}

function generateMapping(data) {
  console.log('Extracting resources...');

  const resources = JSON.parse(data);
  const mappings = {};

  for (const redirect of resources.redirects) {
    for (const alias of [redirect.name, ...redirect.aliases]) {
      mappings[alias] = { ubo: redirect.name };
    }
  }

  for (const redirect of adGuardRedirects) {
    // The conversion doesn't take any role in this case:
    // If there's no alias, it's AdGuard exclusive and will do nothing.
    if (redirect.aliases === undefined || redirect.aliases.length === 0) {
      continue;
    }

    const aliases = [
      redirect.title,
      ...redirect.aliases,
      // AdGuard converter emits `[].file` property in the output.
      redirect.file,
    ];

    // Try to find a registered uBlock Origin dialect.
    // Not all of the AdGuard dialects are aliased from uBlock Origin: e.g. `[].file`.
    // This loop is commonly expected to complete in first loop.
    /**
     * @type {string | undefined}
     */
    let ubo;
    for (const alias of aliases) {
      const name = mappings?.[alias]?.ubo;
      if (name !== undefined) {
        ubo = name;
        break;
      }
    }

    for (const alias of aliases) {
      mappings[alias] = {
        adg: redirect.title,
        ubo,
      };
    }
  }

  return JSON.stringify(mappings, null, 2);
}

writeFileSync(
  join(CWD, '..', 'src', 'mappings.json'),
  generateMapping(await downloadResource('ublock-resources-json')),
  'utf-8',
);
