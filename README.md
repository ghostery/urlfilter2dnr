# @ghostery/urlfilter2dnr

This project aims to provide a utility to convert urlfilters (in Easylist syntaxt) to the DNR (declarative net request) format, in a browser. It uses 3rd party libraries for the conversions.

The tool is publicaly available on a github [page](https://ghostery.github.io/urlfilter2dnr/).

## Converters

* AdGuard - [@adguard/tsurlfilter](https://github.com/AdguardTeam/tsurlfilter) licenses under [GPLv3](https://github.com/AdguardTeam/tsurlfilter/blob/master/LICENSE)
* AdBlockPlus - [@eyeo/abp2dnr](https://gitlab.com/eyeo/adblockplus/abc/abp2dnr) licenses under [GPLv3](https://gitlab.com/eyeo/adblockplus/abc/abp2dnr/-/blob/main/LICENSE.txt?ref_type=heads)

## Local development

Install `nodejs` with a tool like `asdf`, `rtx` or `mise`, eg.:

```sh
rtx install
```

Install node modules

```sh
npm ci
```

Build static page:

```sh
npm run build:page
```

Start development server:

```sh
npm run serve
```

Running tests:

```sh
npm run test.unit
npm run test.e2e
```

NOTE: to run e2e tests playwright needs to install instumented browser. To do that run:

```sh
npx playwright install --with-deps
```

## postMessage API

The conversion tool can be used in any page or web-extension when embeded in an iframe.

Example:

```html
<iframe id="urlfilter2dnr" src="https://ghostery.github.io/urlfilter2dnr/" height="0" width="0"></iframe>
```

```js
window.addEventListener("message", (event) => {
    console.log('DNR rules', event.data.rules);
});

document.getElementById("urlfilter2dnr").contentWindow.postMessage({
    action: 'convert',
    converter: 'adguard',
    filters: ['||test.com'],
}, "*");
```
