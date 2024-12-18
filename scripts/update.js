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

  const resources = JSON.parse(data);
  const mappings = resources.redirects.map((redirect) => [redirect.name, redirect.aliases ?? []]);

  // Integrate adguard mappings
  for (const dialect of adguardDialects) {
    // Skip adguard exclusives
    if (dialect.aliases === undefined) {
      continue;
    }

    // Find an entry with adguard dialect
    const entry = mappings.find(([, aliases]) => {
      if (aliases.includes(dialect.title)) {
        return true;
      }

      for (const alias of dialect.aliases) {
        if (aliases.includes(alias)) {
          return true;
        }
      }

      return false;
    });
    if (entry === undefined) {
      continue;
    }

    for (const alias of [dialect.title, ...dialect.aliases]) {
      if (entry[1].includes(alias) === false) {
        entry[1].push(alias);
      }
    }
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
