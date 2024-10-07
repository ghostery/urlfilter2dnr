import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const CWD = dirname(fileURLToPath(import.meta.url));

async function downloadResource(resourceName) {
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
  const resources = JSON.parse(data);
  const mappings = resources.redirects.map(redirect => redirect.names);
  return JSON.stringify(mappings);
}

writeFileSync(
  join(CWD, '..', 'src', 'mappings.json'),
  extractRedirects(await downloadResource('ublock-resources-json')),
  'utf-8',
);
