# Notes for agents

## Emulator build

- Executor lives in `vendor/executor`, on the `wasm` branch. Our changes are in `patches/executor/`.
- After a change to Executor, commit it there and export the patch with `git format-patch -1 -o ../../patches/executor --start-number N`.
- Build: `source vendor/emsdk/emsdk_env.sh; ninja -C vendor/build-executor-wasm executor-wasm`.
- Copy `executor.js` and `executor.wasm` from the build folder to `web/executor/`.
- Set `const BUILD` in `web/executor/index.html` to the first 8 hex digits of the md5 of the new `executor.wasm`. Browsers and Cloudflare cache the wasm for one year, so a new build without a new BUILD value does not reach users.

## Deploy

The site is `web/` on Vercel, behind Cloudflare, at https://classic-mac.statico.io/. Deploy only committed files:

```sh
rm -rf .work/deploy && mkdir -p .work/deploy && git archive HEAD web | tar -x -C .work/deploy \
  && cp -R web/.vercel .work/deploy/web/ && (cd .work/deploy/web && vercel deploy --prod --scope statico --yes)
```

## Caching

`web/vercel.json` sets the cache headers. A Cloudflare cache rule makes everything under `/executor/` eligible for cache. Without that rule, Cloudflare does not cache `.wasm` or `.data` files, and each game load (up to 72 MB) comes from Vercel bandwidth.

- `executor.wasm` and `executor.js`: one year, immutable. Their URLs carry `?v=BUILD`.
- `executor/games/*` (game data): 7 days in browsers, 30 days in Cloudflare. The `.data` URLs carry no version.

CAUTION: If you change the data of a game, purge `/executor/games/` in Cloudflare after you deploy. If you do not, visitors get the old data for up to 30 days. Browsers can also keep the old data for up to 7 days.

To make sure that the cache works, request a file twice and read `cf-cache-status`. It must show `HIT` on the second request:

```sh
curl -s -o /dev/null -D - https://classic-mac.statico.io/executor/games/dark-castle.data | grep cf-cache-status
```
