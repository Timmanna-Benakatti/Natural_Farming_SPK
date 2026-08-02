# ಶೂನ್ಯ ಬಂಡವಾಳ ನೈಸರ್ಗಿಕ ಕೃಷಿ — Website

A static, no-build-step, **data-driven** website for the ZBNF episode documentation series.

## Structure

```
site/
├── index.html               ← homepage shell (renders itself from data/episodes.json)
├── glossary.html            ← glossary shell (renders itself from data/glossary.json)
├── data/
│   ├── episodes.json        ← ⭐ THE ONLY FILE YOU EDIT to add/remove an episode
│   └── glossary.json        ← ⭐ THE ONLY FILE YOU EDIT to add/remove glossary terms
├── assets/
│   ├── style.css            ← shared stylesheet
│   └── site.js               ← reads the JSON files and renders homepage, glossary, and prev/next pagination
├── episodes/
│   ├── ep01-parichaya-kannada.html
│   ├── ...
│   └── ep18-tengu-panchatarangini-anushtana.html
```

## How to add a new episode (no code changes)

1. Build the new episode's styled HTML page the same way the existing ones look, and drop it into `episodes/`. Name it `epNN-slug.html` (two-digit number, e.g. `ep19-something.html`) — **the number prefix is how the site figures out ordering and prev/next**, so keep that convention.
2. Open `data/episodes.json` and add one new object to the array:
   ```json
   {
     "num": 19,
     "file": "ep19-slug.html",
     "title": "...",
     "teaser": "...",
     "duration": "~40 ನಿಮಿಷಗಳು",
     "group": "ಒಂದು ಗುಂಪಿನ ಹೆಸರು",
     "groupSub": "ಒಂದು ಸಾಲಿನ ಉಪಶೀರ್ಷಿಕೆ"
   }
   ```
3. If the episode introduced new glossary terms, add them to `data/glossary.json`:
   ```json
   {
     "kannada": "...",
     "translit": "...",
     "meaning": "...",
     "epNums": [19]
   }
   ```
4. Done. **Nothing else changes** — no other episode's HTML, no `index.html`, no `glossary.html`, no JS/CSS. The homepage grid, the group it appears under, the site stats (episode count / hours / term count), the glossary table, and the Previous/Next pager on the neighboring episode pages are all computed automatically at page-load time from these two JSON files.

## How to remove an episode

Delete its entry from `data/episodes.json` (and its glossary rows from `data/glossary.json` if you want them gone too), and optionally delete the `.html` file from `episodes/`. Everything re-derives itself — the episode before it will automatically point "next" at whatever now follows it.

## How to reorder / regroup

Just edit the `"group"` / `"groupSub"` fields in `episodes.json`. Episodes sharing the same `"group"` string are automatically clustered together on the homepage, in the order their `"num"` ascends. A brand-new group name just appears as a new section — no template changes needed.

## Deploying

Still 100% static — HTML/CSS/vanilla JS, `fetch()` reads the two JSON files at runtime. No build step, no server code.

**Azure Static Web Apps** (matches your school-project setup):
- App location: `/` (or wherever this `site/` folder sits in your repo)
- Output location: *(leave blank)*

**GitHub Pages:** Settings → Pages → source = branch/folder containing `index.html`.

**Note:** because pages fetch the JSON files via `fetch()`, opening `index.html` directly from your local filesystem (`file://...`) will usually fail due to browser CORS restrictions on local file reads. This works correctly once deployed to any real static host (Azure SWA, GitHub Pages, Netlify, etc.) — test it there, not by double-clicking the file.

## Files you should basically never need to touch again

- `assets/site.js`, `assets/style.css`
- `index.html`, `glossary.html`
- Any existing episode's `.html` file in `episodes/`

The only ongoing editing is `data/episodes.json` (+ `data/glossary.json` for new terms) and dropping in the new episode's own HTML file.
