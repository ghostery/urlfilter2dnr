import { Filter, FilterConverter } from '@adguard/dnr-converter';
import { findRedirectResource, normalizeFilter, normalizeRule } from './helpers.js';

const converter = new FilterConverter();

// Stands in for a resource AdGuard does not have while its filter goes through the converter
const PLACEHOLDER_RESOURCE = 'noopjs';

type Batch = {
  lines: string[];
  // The converter output cannot be traced back to a filter, so filters redirecting to
  // a resource without an AdGuard name are converted separately, one batch per resource
  redirect?: { name: string; resource?: string; filters: string[] };
};

function createBatches(filters: string[]) {
  const main: Batch = { lines: [] };
  const redirects = new Map<string, Required<Batch>>();

  for (const filter of filters) {
    const redirect = findRedirectResource(filter);
    if (!redirect || redirect.adg) {
      main.lines.push(normalizeFilter(filter));
      continue;
    }

    let batch = redirects.get(redirect.name);
    if (!batch) {
      batch = {
        lines: [],
        redirect: { name: redirect.name, resource: redirect.ubo, filters: [] },
      };
      redirects.set(redirect.name, batch);
    }
    batch.redirect.filters.push(filter);
    batch.lines.push(
      normalizeFilter(
        redirect.ubo
          ? `${filter.slice(0, redirect.start)}${PLACEHOLDER_RESOURCE}${filter.slice(redirect.end)}`
          : filter,
      ),
    );
  }

  return [main, ...redirects.values()].filter((batch) => batch.lines.length > 0);
}

async function convertBatch({ lines, redirect }: Batch, resourcesPath: string) {
  const results = await converter.convert([new Filter(0, lines.join('\n'))], { resourcesPath });
  const errors = results.flatMap((result) => result.errors.map((e) => e.toString()));
  let rules = results.flatMap((result) => result.ruleset.getDeclarativeRules());

  // The converter does not report a resource it cannot resolve
  const unresolvedPath = `${resourcesPath}/undefined`;
  if (redirect && rules.some((rule) => rule.action.redirect?.extensionPath === unresolvedPath)) {
    rules = [];
    errors.push(
      ...redirect.filters.map(
        (filter) => `Error: Unknown redirect resource "${redirect.name}" in the rule: "${filter}"`,
      ),
    );
  }

  return {
    rules,
    errors,
    limitations: results.flatMap((result) => result.limitations),
    redirectResource: redirect?.resource,
  };
}

export default async function convert(
  rules: string[],
  { resourcesPath = '/prefix' }: { resourcesPath?: string } = {},
) {
  const batches = await Promise.all(
    createBatches(rules).map((batch) => convertBatch(batch, resourcesPath)),
  );

  const normalizeRules = [];
  const errors = batches.flatMap((batch) => batch.errors);
  let id = 0;

  for (const { rules: declarativeRules, redirectResource } of batches) {
    for (const rule of declarativeRules) {
      id += 1;
      try {
        normalizeRules.push(normalizeRule(rule, { resourcesPath, id, redirectResource }));
      } catch (e) {
        errors.push(
          `Could not normalize rule: ${JSON.stringify(rule)} - ${e instanceof Error ? e.message : e}`,
        );
      }
    }
  }

  return {
    rules: normalizeRules,
    errors,
    limitations: batches.flatMap((batch) => batch.limitations),
  };
}
