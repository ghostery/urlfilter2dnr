# @ghostery/urlfilter2dnr

This project aims to provide a utility to convert urlfilters (in Easylist syntaxt) to the DNR (declarative net request) format, in a browser. It uses 3rd party libraries for the conversions.

The tool is publicaly available on a github [page](https://ghostery.github.io/urlfilter2dnr/).

## Converters

* AdGuard - [@adguard/tsurlfilter](https://github.com/AdguardTeam/tsurlfilter) licenses under [GPLv3](https://github.com/AdguardTeam/tsurlfilter/blob/master/LICENSE)
* AdBlockPlus - [@adguard/tsurlfilter](https://github.com/kzar/abp2dnr) licenses under [GPLv3](https://github.com/kzar/abp2dnr/blob/main/LICENSE.txt)

## Local development

Install `bunjs` with a tool like `asdf` or `rtx`, eg.:

```sh
rtx install
```

Install node modules

```sh
bun install --frozen-lockfile
```

Build static page:

```sh
bun run build
```

Start development server:

```sh
bun run serve
```

Running tests:

```sh
bun run test.unit
bun run test.e2e
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
