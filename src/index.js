import convertWithAdguard from './converters/adguard.js';

const input = document.querySelector('#input textarea');
const submitButton = document.querySelector('#input input[type=submit]');
const output = document.querySelector('#output');

submitButton.addEventListener('click', async (ev) => {
  ev.preventDefault();
  const rules = input.value.split('n');
  const convertedRules = await convertWithAdguard(rules);
  output.innerHTML = JSON.stringify(convertedRules, null, 2);
});

