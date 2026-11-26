# Fit 2 Compete page source

The live page (`index.html` at the repo root) is built from these files:

- `v1_index.html`: the original page.
- `patch_index.py` + `patch_extra.py`: patch it and append the modules: `v2module.js`, `holo.js` (3D body, layers), `workout.js` (timer, warm-ups, where-mode), `wear.js` (wearables, WHOOP), `supp.js` (supplement review), `pain.js` (pain map), `setup.js` (Setup page, dark theme).
- `bp3d/`: scripts that bake `vendor/anatomy.bin` and `vendor/organs.bin` from BodyParts3D (CC BY 4.0).

Build (paths inside the scripts point to /home/claude/v2; copy these files there first):

    python3 patch_index.py v1_index.html index.html v2module.js
    cp index.html site/
    B=$(grep -oE 'F2C_BUILD="[0-9]+"' index.html | grep -oE '[0-9]{6,}'); echo "{\"v\": \"$B\"}" > site/version.json; sed -i "s/f2c-shell-[0-9]*/f2c-shell-$B/" site/sw.js

version.json must match F2C_BUILD or the app blocks plan changes. Backend is `backend/Code.gs` (Apps Script).
