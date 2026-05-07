# Whitelabel Changes

This file documents every change made on top of the upstream
[`TryGhost/Koenig`](https://github.com/TryGhost/Koenig) repo for the
`@iliad.dev/koenig-lexical` fork (Ghost Atlas Whitelabel project). It exists
so future merges from upstream are easy: when a conflict appears, find the
file/feature here and re-apply the diff intentionally rather than guessing.

> **Maintenance rule (also in [CLAUDE.md](CLAUDE.md)):** every time Claude
> changes something in this repo, the change must be added to this file in
> the same commit. If a change is reverted, remove the corresponding entry.

## How to use this file when merging from upstream

1. `git fetch upstream && git log iliad/main..upstream/main --oneline` — see
   what is new upstream.
2. `git merge upstream/main` (or rebase). For every conflict, look up the
   file in the **Inventory** below to see *why* the local side differs.
3. After merge, run:
   - `yarn setup`
   - `yarn workspace @iliad.dev/koenig-lexical test:unit`
   - `yarn workspace @iliad.dev/koenig-lexical test:e2e`
4. Verify the items in the **Smoke checklist** at the bottom of this file.

## Fork identity

Upstream package `@tryghost/koenig-lexical` is republished as
`@iliad.dev/koenig-lexical`. The fork is kept as a *drop-in replacement* —
the UMD global stays `window['@tryghost/koenig-lexical']` so Ghost Admin's
runtime lookup keeps working.

- [packages/koenig-lexical/package.json](packages/koenig-lexical/package.json)
  — `name`, `repository`, `author`, `publishConfig.access: public`, `version`
- [packages/koenig-lexical/vite.config.js](packages/koenig-lexical/vite.config.js)
  — `lib.name` pinned to literal string `'@tryghost/koenig-lexical'` so the
  `.` in `@iliad.dev` does not produce a nested UMD global.
- [package.json](package.json) — adds `"atlas:push"` script
  (`yarn lerna run build … && npm publish`).

## Inventory of changes (by area)

### 1. CI / release pipeline

- **New:** [.github/workflows/iliad-release.yml](.github/workflows/iliad-release.yml)
  - Builds and runs unit tests on pushes to `iliad/*`.
  - Publishes to npm on `v*` tag pushes via `NPM_TOKEN` secret.
  - Writes `.npmrc` directly in the publish step
    (`setup-node`'s `registry-url` + `NODE_AUTH_TOKEN` left the token unset).
  - Runs `npm whoami` before publish for clearer auth errors.
  - Does **not** use `actions/setup-node`'s yarn cache (post-cache step
    fails in this lerna monorepo and breaks the pipeline).
  - The `ci` job has no `if:` gate — the workflow `on:` triggers already
    scope correctly to branches+tags. A previous `if:` on `refs/heads/iliad/**`
    blocked tag pushes and prevented publishes.

### 2. Brand palette (Atlas purple)

The Atlas brand replaces Ghost's green accent.

- [packages/koenig-lexical/tailwind.config.cjs](packages/koenig-lexical/tailwind.config.cjs)
  — `green` scale (DEFAULT/100/400/500/600) remapped to Atlas purple
  (`#4945FF` family).
- [packages/koenig-lexical/src/styles/index.css](packages/koenig-lexical/src/styles/index.css)
  — `--green` CSS variable updated to `#4945FF`.
- Inline `rgba(48,207,67,...)` literals replaced with the Atlas purple
  equivalent in:
  - [packages/koenig-lexical/src/components/DesignSandbox.jsx](packages/koenig-lexical/src/components/DesignSandbox.jsx)
  - [packages/koenig-lexical/src/components/ui/ColorPicker.jsx](packages/koenig-lexical/src/components/ui/ColorPicker.jsx)
  - [packages/koenig-lexical/src/components/ui/Input.jsx](packages/koenig-lexical/src/components/ui/Input.jsx)
  - [packages/koenig-lexical/src/components/ui/LinkInputWithSearch.jsx](packages/koenig-lexical/src/components/ui/LinkInputWithSearch.jsx)
  - [packages/koenig-lexical/src/components/ui/MultiSelectDropdown.jsx](packages/koenig-lexical/src/components/ui/MultiSelectDropdown.jsx)

> When merging upstream changes that touch any of those five files, search
> the new lines for `rgba(48,207,67` and the Tailwind `green-*` literal
> hex codes (`#30CF43`, `#E1F9E4`, `#58DA67`, `#2AB23A`) and re-apply the
> Atlas swap. Built bundle should contain **zero** Ghost-green literals.

### 3. Image card — numeric `maxWidthPx`

Adds a numeric max-width input to the image toolbar **alongside** the
upstream regular/wide/full preset buttons. Persists `maxWidthPx` on the
`ImageNode` subclass and emits it to rendered HTML.

- [packages/koenig-lexical/src/nodes/ImageNode.jsx](packages/koenig-lexical/src/nodes/ImageNode.jsx)
  — adds `maxWidthPx`, wired through `exportJSON` / `importJSON` /
  `exportDOM` / `importDOM`. When set, the `<img>` gets inline
  `max-width: …px`; the `<figure>` gets `data-kg-max-width` for CSS hooks.
  *Inline style is on the `<img>`, not the `<figure>`, so captions don't
  squish.*
- [packages/koenig-lexical/src/nodes/ImageNodeComponent.jsx](packages/koenig-lexical/src/nodes/ImageNodeComponent.jsx)
  — applies the same inline style in WYSIWYG.
- [packages/koenig-lexical/src/components/ui/cards/ImageCard.jsx](packages/koenig-lexical/src/components/ui/cards/ImageCard.jsx)
  and [ImageCard.stories.jsx](packages/koenig-lexical/src/components/ui/cards/ImageCard.stories.jsx)
  — toolbar UI for the numeric input; `cardWidth` plumbing for the
  upstream presets is preserved.
- `image-card-widths.js` util: kept (upstream) but with the additional
  whitelabel exports — **do not delete in a merge**.
- Tests:
  - [packages/koenig-lexical/test/unit/imageNode.test.js](packages/koenig-lexical/test/unit/imageNode.test.js)
  - [packages/koenig-lexical/test/unit/utils/image-card-widths.test.js](packages/koenig-lexical/test/unit/utils/image-card-widths.test.js)
  - [packages/koenig-lexical/test/e2e/cards/image-card.test.js](packages/koenig-lexical/test/e2e/cards/image-card.test.js)
    — preset-click test (upstream) **and** new numeric-input test.
  - [packages/koenig-lexical/test/e2e/editors/email-editor.test.js](packages/koenig-lexical/test/e2e/editors/email-editor.test.js)
    — asserts presets hidden + numeric input visible in the email editor.

> Downstream consumers (Ghost backend `image-renderer.js`) read
> `data-kg-max-width` for email/site rendering. Coordinated via the
> consumer repo's `whitelabel-changes.md` §14.

### 4. Text alignment for paragraphs and headings

Re-introduces `kg-align-center` / `kg-align-right` classes (Ghost's classic
behaviour) end-to-end: HTML import, in-editor toolbar, transforms, and
HTML render. `left` is treated as the implicit default and is not
persisted (no `kg-align-left` class is emitted, and the transform strips
`format: 'left'` to `''`).

#### kg-default-nodes

- [packages/kg-default-nodes/lib/utils/alignment.js](packages/kg-default-nodes/lib/utils/alignment.js)
  *(new)* — `formatFromClassList(classList)` → `'center' | 'right' | 'left' | ''`.
- [packages/kg-default-nodes/lib/serializers/paragraph.js](packages/kg-default-nodes/lib/serializers/paragraph.js)
  — `<p class="kg-align-*">` import sets paragraph format and preserves
  text-indent.
- [packages/kg-default-nodes/lib/nodes/ExtendedHeadingNode.js](packages/kg-default-nodes/lib/nodes/ExtendedHeadingNode.js)
  — wraps the upstream heading converters for `h1`–`h6` to read
  `kg-align-*`. Bumps priority above the stock HeadingNode converter.

#### kg-default-transforms

- [packages/kg-default-transforms/src/transforms/normalize-default-alignment.ts](packages/kg-default-transforms/src/transforms/normalize-default-alignment.ts)
  *(new)* — strips redundant `format: 'left'` on paragraphs/headings.
- [packages/kg-default-transforms/src/default-transforms.ts](packages/kg-default-transforms/src/default-transforms.ts)
  — **removes** `registerRemoveAlignmentTransform` for paragraphs/headings;
  registers `registerNormalizeDefaultAlignmentTransform` instead. Quotes
  still strip alignment via `registerRemoveAlignmentTransform`.
- [packages/kg-default-transforms/test/transforms/normalize-default-alignment.test.ts](packages/kg-default-transforms/test/transforms/normalize-default-alignment.test.ts)
  *(new)*, plus updates in
  [kg-default-transforms.test.ts](packages/kg-default-transforms/test/kg-default-transforms.test.ts)
  to assert headings/paragraphs **keep** non-default alignment.

> ⚠ This intentionally diverges from upstream's "strip all alignment"
> behaviour. If a future upstream change re-introduces
> `registerRemoveAlignmentTransform` for `ParagraphNode` / `HeadingNode` /
> `ExtendedHeadingNode`, do **not** accept it.

#### kg-html-to-lexical

- [packages/kg-html-to-lexical/test/html-to-lexical.test.ts](packages/kg-html-to-lexical/test/html-to-lexical.test.ts)
  — adds a `Text alignment` block asserting `kg-align-*` and inline
  `style="text-align"` both produce the right `format`.

#### kg-lexical-html-renderer

- [packages/kg-lexical-html-renderer/lib/utils/alignment-class.ts](packages/kg-lexical-html-renderer/lib/utils/alignment-class.ts)
  *(new)* — `format` → `kg-align-center` / `kg-align-right` (default and
  `'left'` produce no class).
- [packages/kg-lexical-html-renderer/lib/transformers/element/heading.ts](packages/kg-lexical-html-renderer/lib/transformers/element/heading.ts)
  — appends the class to `<h1>`–`<h6>`.
- [packages/kg-lexical-html-renderer/lib/transformers/element/paragraph.ts](packages/kg-lexical-html-renderer/lib/transformers/element/paragraph.ts)
  — appends the class to `<p>`.
- [packages/kg-lexical-html-renderer/test/headings.test.js](packages/kg-lexical-html-renderer/test/headings.test.js)
  and
  [render.test.js](packages/kg-lexical-html-renderer/test/render.test.js)
  — assertions for the emitted classes (and that plain paragraphs emit
  no class).

#### koenig-lexical (editor UI)

- [packages/koenig-lexical/src/components/ui/FormatToolbar.jsx](packages/koenig-lexical/src/components/ui/FormatToolbar.jsx)
  — alignment state + three new toolbar buttons (`align-left`,
  `align-center`, `align-right`). Hidden inside quotes (`showAlignment`
  is true only for paragraph + `h1`–`h6`).
- [packages/koenig-lexical/src/components/ui/ToolbarMenu.jsx](packages/koenig-lexical/src/components/ui/ToolbarMenu.jsx)
  — registers the three align icons in `TOOLBAR_ICONS`.
- [packages/koenig-lexical/src/assets/icons/kg-align-right.svg](packages/koenig-lexical/src/assets/icons/kg-align-right.svg)
  *(new)* — `kg-align-left.svg` and `kg-align-center.svg` already
  existed upstream.
- [packages/koenig-lexical/test/e2e/floating-toolbar.test.js](packages/koenig-lexical/test/e2e/floating-toolbar.test.js)
  — adds `aligns paragraph center then back to default` and
  `hides alignment buttons inside a quote`.
- [packages/koenig-lexical/test/e2e/paste-behaviour.test.js](packages/koenig-lexical/test/e2e/paste-behaviour.test.js)
  — flips the two old "stripped on paste" tests to "preserved on paste",
  adds `default text alignment (left) is normalized away on paste`, and
  adds `text alignment is preserved from kg-align-* class on paste`.

### 5. Email-safe fallback for non-video embeds

Upstream's embed renderer only produces an email-safe fallback when
`embedType === 'video'`. Every other oEmbed `type: 'rich'` (Spotify,
SoundCloud, Apple Music, Mixcloud, Bandcamp, CodePen, Instagram, GitHub
Gist, Reddit, etc.) falls through to the default branch, which emits the
provider's raw `<iframe>` HTML. Ghost's email pipeline strips iframes, so
the embed arrives in the inbox as nothing.

This change extends the email branch with a three-way decision:

1. **Playable thumbnail (image + play-button overlay)** — when
   `embedType === 'video'` *or* `metadata.provider_name` is in the
   `PLAYABLE_MEDIA_PROVIDERS` allow-list (Spotify / SoundCloud / Apple
   Music / Mixcloud / Bandcamp), and `metadata.thumbnail_url` is present.
   Reuses the existing video MSO/VML template; the `aria-label` toggles
   between "Play video" and "Play media".
2. **Plain thumbnail with link** — any other embed with
   `metadata.thumbnail_url`. Linked image inside a `kg-embed-thumbnail`
   anchor, no play-button overlay.
3. **Bookmark-style text card** — when no thumbnail is available. Mirrors
   the bookmark renderer's `<!--[if !mso !vml]-->` / `<![endif]-->`
   conditional-comment structure so Outlook also gets a usable layout.
   Populated from `metadata.title`, `metadata.provider_name`,
   `metadata.author_name`, and `node.url`.

All metadata used in the templates is now run through `escapeHtml`
(provider responses are not trusted input). When `thumbnail_width` /
`thumbnail_height` are missing, the aspect ratio defaults to 16:9 for
videos and 1:1 for everything else (album artwork tends to be square).

- [packages/kg-default-nodes/lib/nodes/embed/embed-renderer.js](packages/kg-default-nodes/lib/nodes/embed/embed-renderer.js)
  — extended `renderTemplate` with the three-way email branch; added
  `PLAYABLE_MEDIA_PROVIDERS` set, `isPlayableMediaProvider`,
  `getThumbnailAspectRatio`, and three template helpers
  (`playableThumbnailTemplate`, `thumbnailLinkTemplate`,
  `bookmarkFallbackTemplate`). Web rendering path is untouched.
- [packages/kg-default-nodes/test/nodes/embed.test.js](packages/kg-default-nodes/test/nodes/embed.test.js)
  — adds four new email-rendering tests: Spotify with thumbnail (playable
  template), generic rich embed with thumbnail (plain template), rich
  embed without thumbnail (bookmark fallback), and an escaping check.

> Out of scope: the matching gap in the legacy mobiledoc card at
> [packages/kg-default-cards/src/cards/embed.ts](packages/kg-default-cards/src/cards/embed.ts).
> If old mobiledoc-format posts also need fixing, port the same
> three-way branch there.

## Smoke checklist after an upstream merge

- [ ] `window['@tryghost/koenig-lexical']` is defined in the built UMD
      bundle (check `dist/koenig-lexical.umd.js`).
- [ ] No `rgba(48,207,67` or `#30CF43` literals in the built CSS / JS.
- [ ] Image toolbar shows regular/wide/full **and** the numeric
      max-width input.
- [ ] Pasting `<p style="text-align:center">` or
      `<p class="kg-align-center">` keeps the centering in the editor
      and round-trips through `kg-lexical-html-renderer` to
      `<p class="kg-align-center">`.
- [ ] Floating toolbar shows align L/C/R for paragraphs + headings,
      hidden in quotes.
- [ ] `yarn workspace @iliad.dev/koenig-lexical test:unit` passes.
- [ ] `yarn workspace @iliad.dev/koenig-lexical test:e2e` passes.
- [ ] `.github/workflows/iliad-release.yml` still present and untouched
      (or intentionally updated).
