# Eternal Incense

Personal memorial space. The existing static application is served from `index.html`.

## Local preview

Run `python3 -m http.server 4173 --bind 127.0.0.1` in this directory and open `http://127.0.0.1:4173/`. Individual memorials retain their hash URLs. The `m/<id>/` sharing pages redirect relatively, so they also work locally and under a hosted subdirectory.

## Using the space

- Select a framed photograph to visit a memorial. Scroll the shelf, use its edge controls, or move between photos with the keyboard.
- Select an observance for its calendar export. The management drawer also exports all upcoming rites and annual memorials.
- Open **Prayer book / 기도표** for the existing prayer intentions.
- Open **Tend this space** for memorial creation, removal/hiding and restoration of permanent memorials.
- Individual memorials retain flower offerings, daily offering limits, neighboring memorial links, swipe navigation, and additional dates/remembrance/family details.

## Preservation and dates

All 17 permanent records, original photograph paths, seed prayers and storage keys are unchanged. Dexi's `images/dexi-clean.png` is byte-identical to the supplied original photograph. Existing local additions, hidden records and prayers continue using their original keys. Older-format migration merges with existing additions.

Death day is day one: the weekly offsets are 6, 13, 20, 27, 34, 41 and 48 days. This fixes the former six weekly offsets that were one day later than the established inclusive 49th-day rule. Existing weekly reminder opt-in and 49th/100th/one-year/three-year schedules remain. Annual memorials stay current throughout their calendar day. Unknown passing dates never produce invented observances.

## Verification

Run `TZ=America/Chicago node --test tests/rituals.test.cjs`. The eleven tests cover inclusive dates, month/year/DST boundaries, annual dates, all-record aggregation, calendar event/alarm integrity, escaping and UTF-8 folding, storage lifecycle flower limits, successful/rejected writes and duplicate submission protection. The original eight date/storage tests also passed with `TZ=Asia/Seoul`.

The hall and individual views were inspected at desktop and mobile sizes, with additional 1366×768 and 1920×1080 memorial checks. The browser reported no errors during tested flows. Flower saving and confirmation were verified against Firebase. Saved offerings now show photographic flowers on the shelf. Smoke wisps travel upward; reduced motion leaves still smoke.

## Visual assets

The architectural backgrounds contain only scenery. Memorial photographs, names, dates, incense sticks and smoke remain live application elements. The ceramic bowl and empty wooden frame are separate reusable assets. Paths and exact built-in ImageGen prompts are in `images/environment/PROVENANCE.md`. The final font direction is **sans-serif only**, following the owner's latest instruction.

The owner approved the reconstruction and requested publication after the flower/smoke fixes on September 19, 2026.
