import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import adguardDialects from '@adguard/scriptlets/dist/redirects.json';

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

function extractRedirects(data) {
  console.log('Extracting resources...');

  /**
   * @type {Array<{ dialects: { adg: string; ubo: string; }; hints: string[]; }>}
   */
  const mappings = [];

  /**
   * @type {{ redirects: Array<{ name: string; aliases: string[]; body: string; contentType: string; }> }}
   */
  const { redirects } = JSON.parse(data);
  for (const redirect of redirects) {
    /**
     * @type {Set<string>}
     */
    const hints = new Set();
    hints.add(redirect.name);
    for (const alias of redirect.aliases) {
      hints.add(alias);
    }

    // Register AdGuard dialects
    /**
     * @type {{ title: string; aliases: string[]; isBlocking: boolean; contentType: string; content: string; }}
     */
    const adguardDialect = adguardDialects.find((dialect) =>
      [dialect.title, ...(dialect.aliases ?? [])].includes(redirect.name),
    );
    if (adguardDialect !== undefined) {
      hints.add(adguardDialect.title);
      if (adguardDialect.aliases !== undefined) {
        for (const alias of adguardDialect.aliases) {
          hints.add(alias);
        }
      }
    }

    if (hints.size === 1) {
      continue;
    }

    mappings.push({
      dialects: {
        adg: adguardDialect?.title,
        ubo: redirect.name,
      },
      hints: Array.from(hints),
    });
  }

  return JSON.stringify(mappings, null, 2);
}

const mappingsPath = join(CWD, '..', 'src', 'mappings.json');
const oldMappings = readFileSync(mappingsPath, { encoding: 'utf-8' });
const newMappings = extractRedirects(await downloadResource('ublock-resources-json'));

if (oldMappings === newMappings) {
  console.error('No changes - exiting');
  process.exit(1);
}

writeFileSync(mappingsPath, newMappings, 'utf-8');
