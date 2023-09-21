import convertWithAdguard from './converters/adguard.js';
import convertWithAbp from './converters/abp.js';

const input = document.querySelector('#input textarea');
const submitButton = document.querySelector('#input input[type=submit]');
const outputAdguard = document.querySelector('#output-adguard');
const outputAbp = document.querySelector('#output-abp');

submitButton.addEventListener('click', async (ev) => {
  ev.preventDefault();
  const rules = input.value.split('\n');

  const convertedRulesAdguard = await convertWithAdguard(rules);
  const convertedRulesAbp = await convertWithAbp(rules);

  outputAdguard.innerHTML = JSON.stringify(convertedRulesAdguard, null, 2);
  outputAbp.innerHTML = JSON.stringify(convertedRulesAbp, null, 2);
});


window.addEventListener('message', async (message) => {
  if (!message.data || message.data.action !== 'convert') {
    return;
  }

  const { converter, filters } = message.data;

  let rules;
  const errors = [];

  try {
    if (converter === 'adguard') {
      rules = await convertWithAdguard(filters);
    } else if (converter == 'abp') {
      rules = await convertWithAbp(filters);
    }
  } catch (e) {
    errors.push(e);
  }

  message.source.postMessage({
    rules,
    errors,
  });
});

