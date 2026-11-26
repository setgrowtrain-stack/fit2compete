# Fit 2 Compete page source

The live page (`index.html` at the repo root) is built from these files:

- `v1_index.html`: the original page.
- `patch_index.py` + `patch_extra.py` + `patch_fast.py` (fast start): patch it and append the modules: `v2module.js`, `holo.js` (3D body, layers), `workout.js` (timer, warm-ups, where-mode), `wear.js` (wearables, WHOOP), `supp.js` (supplement review), `pain.js` (pain map), `setup.js` (Setup page, dark theme), `cards.js` (WHOOP detail screens, WHOOP-style scan cards, scan sheet), `water.js` (water card on Today; concatenated before wear.js), `library.js` (exercise library).
- `bp3d/`: scripts that bake `vendor/anatomy.bin` and `vendor/organs.bin` from BodyParts3D (CC BY 4.0).

Build (paths inside the scripts point to /home/claude/v2; copy these files there first):

    python3 patch_index.py v1_index.html index.html v2module.js
    cp index.html site/
    B=$(grep -oE 'F2C_BUILD="[0-9]+"' index.html | head -1 | grep -oE '[0-9]{6,}'); echo "{\"v\": \"$B\"}" > site/version.json; sed -i -E "s/^const SHELL=.*$/const SHELL=\"f2c-shell-$B\";/" site/sw.js
    node -e "new (require('vm').Script)(require('fs').readFileSync('site/sw.js','utf8'))" && echo sw.js OK

version.json must match F2C_BUILD or the app blocks plan changes. Backend is `backend/Code.gs` (Apps Script).

## Exercise library data (v2.7)
`site/lib/exercises.json` and `site/lib/img/<id>/0.jpg, 1.jpg` come from Free Exercise DB (public domain, https://github.com/yuhonas/free-exercise-db).
To rebuild: `git clone --depth 1 https://github.com/yuhonas/free-exercise-db /home/claude/ext/fedb`, then `python3 -I build_lib.py` (shrinks photos to 360 px, writes the compact JSON). Copy `lib/` into the repo root.
