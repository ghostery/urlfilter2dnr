import convertWithAdguard from "./converters/adguard.js";
import convertWithAbp from "./converters/abp.js";

const $input = document.querySelector("#input textarea");
const $submitButton = document.querySelector("#input input[type=submit]");
const $outputAdguard = document.querySelector("#output-adguard");
const $outputAbp = document.querySelector("#output-abp");
const $errorsAdguard = document.querySelector("#errors-adguard");
const $errorsAbp = document.querySelector("#errors-abp");

const ADGUARD_CONVERTER_OPTIONS = {
  resourcesPath: "/web_accessible_resources",
};

$submitButton.addEventListener("click", async (ev) => {
  ev.preventDefault();
  const rules = $input.value.split("\n").filter(Boolean);

  const { rules: convertedRulesAdguard, errors: errorsAdguard } =
    await convertWithAdguard(rules, ADGUARD_CONVERTER_OPTIONS);
  const { rules: convertedRulesAbp, errors: errorsAbp } = await convertWithAbp(
    rules
  );

  $outputAdguard.innerHTML = JSON.stringify(convertedRulesAdguard, null, 2);
  $outputAbp.innerHTML = JSON.stringify(convertedRulesAbp, null, 2);
  $errorsAdguard.innerHTML = errorsAdguard.join("\n");
  $errorsAbp.innerHTML = errorsAbp.join("\n");
});

window.addEventListener("message", async (event) => {
  if (!event.data || event.data.action !== "convert") {
    return;
  }

  const { converter, filters } = event.data;

  let rules, errors;

  try {
    if (converter === "adguard") {
      ({ rules, errors } = await convertWithAdguard(
        filters,
        ADGUARD_CONVERTER_OPTIONS
      ));
    } else if (converter == "abp") {
      ({ rules, errors } = await convertWithAbp(filters));
    }
  } catch (e) {
    errors.push(e);
  }

  event.source.postMessage(
    {
      rules,
      errors,
    },
    event.origin
  );
});
