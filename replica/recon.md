# Recon map: Canva (web)

Scope: the design editor core. Start a design from a size or a template, edit it on a canvas (text, shapes, images, uploads, layers, pages), then download it. Sharing is included as a light version. Video, AI generation, print ordering and the apps marketplace are left out.
For: a free design editor for the user's own audience, with Arabic/RTL support. Features Canva keeps for Pro (background remover, resize, brand kit, SVG and transparent PNG export) are free here. That is the positioning.
Date: 2026-11-11

> **Evidence note.** This session's network blocks canva.com, so I could not open any Canva page directly. The facts below come from web search results. Those results include snippets of Canva's own help article on layering, grouping and aligning, plus third-party pricing reviews. Screen details not covered by those sources come from general knowledge of the product and are marked `medium` or `guess`. Before you build, check them against your own free Canva account (step 7 in the sources table).

## Sources

| # | source | URL | notes |
| --- | --- | --- | --- |
| 1 | help center: layer, group, align | https://www.canva.com/help/layer-group-align/ | Group with Shift-click or marquee, then Group, Ctrl/⌘+G. Position menu: Forward, Backward, To front, To back. Align to page when one element is selected. (Read via search snippet.) |
| 2 | pricing page | https://www.canva.com/pricing/ | Unreachable from here. Tiers below are from #3 to #5. |
| 3 | third-party: Pro vs Free | https://www.stylefactoryproductions.com/blog/canva-pro-vs-free | Free is permanent. Pro adds background remover, brand kit, more stock, AI tools. |
| 4 | third-party: pricing 2026 | https://aumiqx.com/ai-tools/canva-pro-pricing-free-vs-pro-vs-teams/ | Free $0 / Pro ≈ $15/mo or $120/yr / Business ≈ $20/user/mo / Enterprise custom. |
| 5 | third-party: free plan limits | https://costbench.com/software/design/canva/free-plan/ | 250k+ templates on free. Free has no background remover and no brand kit. Sources disagree on storage figures. |
| 6 | app store listing | https://apps.apple.com/app/canva/id897446215 | To check: key screens in the screenshots |
| 7 | the user's own free account | https://www.canva.com | To do: open one design and capture each S-screen into `replica/screens/` |

## Core loop

Pick a size or a template, edit it on the canvas, then download it as PNG, JPG or PDF. All of it works for free.

## Screens

| ID | screen | route / how to reach | purpose | key components | states seen |
| --- | --- | --- | --- | --- | --- |
| S01 | Landing / sign up | `/` | Explain the product, get signed up | Hero, CTA, auth modal | logged out |
| S02 | Auth | modal on `/login` | Email or Google sign-in | Inputs, OAuth button, error text | default, error, loading |
| S03 | Home | `/home` | Start a new design, reopen recent ones | Search, size presets row, recent grid | empty (new user), filled |
| S04 | Create-design picker | "Create a design" button | Choose a preset or custom size | Popover, preset list, W×H inputs + unit | default, invalid size |
| S05 | Templates gallery | `/templates?q=` | Browse and search templates | Search, category chips, masonry grid, preview modal | loading, results, no results |
| S06 | Projects / folders | `/projects` | All designs and folders | Grid/list toggle, folder cards, context menu | empty, filled |
| S07 | **Editor** | `/design/:id/edit` | The product | Top bar, side panel tabs, canvas, context toolbar, page strip, zoom | new blank, filled, saving, offline, read-only |
| S08 | Editor › Templates tab | side panel | Apply a template to the design | Search, grid | loading, results |
| S09 | Editor › Elements tab | side panel | Shapes, lines, icons, photos | Search, sections, grid | loading, results, no results |
| S10 | Editor › Text tab | side panel | Add heading/subheading/body, text presets | Buttons, font combos | default |
| S11 | Editor › Uploads tab | side panel | Upload and reuse own images | Dropzone, upload progress, grid | empty, uploading, error (type/size), filled |
| S12 | Editor › Background | side panel / page click | Page colour or image | Colour swatches, picker | default |
| S13 | Context toolbar: text | select text | Font, size, colour, B/I/U, align, list, spacing, effects | Font dropdown, number stepper, colour picker | single, multi-select |
| S14 | Context toolbar: image | select image | Crop, flip, filters, adjust, bg remover, transparency | Buttons, sliders panel | default, crop mode, processing |
| S15 | Position panel | "Position" button | Layer order, align, layers list | Tabs (Arrange / Layers), drag list | one selected, many selected |
| S16 | Resize dialog | top bar "Resize" | Copy or resize to another format | Preset checklist, custom size | default |
| S17 | Share dialog | top bar "Share" | Link sharing, permissions | Link field, role select, copy button | private, link on |
| S18 | Download dialog | Share › Download | Format, pages, quality, transparent bg | Select, page picker, size slider, checkbox | default, exporting, done, error |
| S19 | Brand kit | `/brand` | Saved colours, fonts, logos | Palette editor, font pickers, logo uploads | empty, filled |
| S20 | Presentation mode | editor "Present" | Full-screen pages | Fullscreen viewer, arrow nav | default |
| S21 | Settings / account | `/settings` | Profile, language, delete account | Form | default, saved |

Every screen except S20 also needs a mobile check. The editor shows a bottom sheet instead of a side panel on mobile (guess).

## Flows

```
F01 New user makes a social post from a template
    S01 -> S02 -> S03 -> S05 -> S07 -> (edit text S13) -> S18 -> file
    happy path clicks: ~8
    edge: font not loaded yet, template with missing image, export of very large size, Arabic text mixed with English

F02 Blank design at a custom size
    S03 -> S04 (custom W×H) -> S07 (blank)
    happy path clicks: 4
    edge: 0 or negative size, huge size (> 8000px), unit switch mm↔px

F03 Add and arrange elements
    S07 -> S09 add shape -> S11 upload photo -> select both -> group -> S15 align centre / send backward
    happy path clicks: ~9
    edge: group across pages (not allowed), locked element in selection, undo after group

F04 Multi-page design to PDF
    S07 -> add page -> duplicate page -> reorder -> S18 PDF all pages
    happy path clicks: ~6
    edge: 50+ pages, mixed page sizes, embedded fonts in PDF

F05 Remove a photo background (Pro in Canva, free here)
    S07 -> select image -> S14 BG remover -> processing -> result
    happy path clicks: 3
    edge: no subject found, very large image, slow device

F06 Resize a design to another format (Pro in Canva, free here)
    S07 -> S16 -> pick "Instagram Story" -> new copy opens
    happy path clicks: 3
    edge: elements off-canvas after resize, text overflow

F07 Share for view or edit
    S07 -> S17 -> link on, role -> copy
    happy path clicks: 3
    edge: viewer tries to edit, revoked link, two editors at once

F08 Reopen and continue a design
    S03 recent -> S07 (autosaved state)
    happy path clicks: 1
    edge: offline edits, conflicting tabs, deleted upload
```

## Components

| component | variants | states | used on |
| --- | --- | --- | --- |
| Button | primary, secondary, ghost, icon, danger | default, hover, focus, disabled, loading | all |
| Input / number stepper | text, number, unit | default, focus, error, disabled | S02, S04, S13 |
| Colour picker | swatches, document colours, brand colours, custom (hex/eyedropper) | open, closed | S12, S13, S19 |
| Font picker | list with preview, search, recent | loading font, selected | S13, S19 |
| Dropdown / select | | open, closed | many |
| Slider | | drag, disabled | S14, S18 |
| Modal / dialog | small, large | open, closing | S02, S16, S17, S18 |
| Popover | | | S04, S15 |
| Side panel + tab rail | desktop rail, mobile bottom sheet | collapsed, open | S07–S12 |
| Card (design / template / folder) | grid, list | hover, selected, loading skeleton | S03, S05, S06 |
| Canvas element | text, shape, line, image, group, frame | idle, hover, selected, editing, locked | S07 |
| Selection box | single, multi, group | resize/rotate handles, snapping guides | S07 |
| Page strip / thumbnails | | active, dragging | S07 |
| Toast | info, success, error | | all |
| Context menu | | | S06, S07 |
| Dropzone | | idle, drag-over, uploading, error | S11, S19 |
| Empty state | | | S03, S06, S11, S19 |

## Inferred data model

```
User        id, email, name, avatar_url, locale, created_at
            evidence: S02, S21 · confidence: high

Design      id, owner_id, folder_id?, title, width, height, unit (px|mm|in),
            thumbnail_url, created_at, updated_at, deleted_at?
            evidence: S03 recent grid, S04, S07 · confidence: high

Page        id, design_id, index, background (color | image_ref), width?, height?
            evidence: S07 page strip, S12 · confidence: high

Element     id, page_id, parent_group_id?, type (text|shape|line|image|group),
            x, y, w, h, rotation, opacity, z_index, locked, flip_x, flip_y,
            props (json: text runs + style | shape path + fill/stroke | image src + crop + filters)
            evidence: S13, S14, S15, help #1 · confidence: high (exact storage is a guess:
            most likely one JSON document per design, not rows. Recommend JSON-per-design)

Upload      id, owner_id, url, mime, width, height, bytes, created_at
            evidence: S11 · confidence: high

Template    id, title, category, tags[], width, height, design_json, thumbnail_url, published
            evidence: S05, S08 · confidence: medium

Folder      id, owner_id, name, parent_id?
            evidence: S06 · confidence: medium

BrandKit    id, owner_id, colors[], fonts {heading, body}, logo_upload_ids[]
            evidence: S19, source #3 · confidence: medium

ShareLink   id, design_id, role (view|edit), token, enabled, created_at
            evidence: S17 · confidence: medium

Comment     id, design_id, page_id, element_id?, author_id, body, resolved, created_at
            evidence: general knowledge · confidence: guess
```

Relationships: User 1-n Design, Design 1-n Page, Page 1-n Element, Element (group) 1-n Element, User 1-n Upload, User 1-n Folder, Folder 1-n Design, User 1-1 BrandKit, Design 1-n ShareLink, Design 1-n Comment.

## Feature matrix

See `features.csv`. Must: 28, should: 13, could: 6, skip: 5.

## Out of scope (cannot or should not be cloned)

- **Canva's templates, stock photos, illustrations, fonts and music.** These are licensed content owned by Canva and its contributors. Build your own starter templates and use openly licensed sources instead: Google Fonts, Lucide/Tabler icons, and the Openverse, Unsplash or Pexels official APIs with attribution.
- **The Canva name, logo, purple brand and UI copy.** `/replica-brand` covers your own identity.
- Print ordering (a partner deal), the apps marketplace (a partner network), video and animation editing, and AI generation (these need paid model APIs). Revisit them after launch.
- **Terms.** Using your own Canva account to look at screens is fine as a reference. Do not use it to copy assets or templates.

## Size

Screens 21, flows 8, entities 10.
Hard parts:
1. **The canvas editor itself.** Selection, resize and rotate handles, snapping, grouping with nested transforms, undo/redo, and text editing on canvas. Arabic/RTL text shaping is part of this. Use a mature library (Konva or Fabric.js) and do not write it from scratch.
2. **Faithful export.** PNG, JPG, multi-page PDF with embedded fonts, and SVG must match what the canvas shows.
3. **Background remover running free.** Use an open segmentation model, either in the browser (WASM/WebGPU) or on your own server, which means compute cost.
   Also: real-time co-editing (CRDT, Yjs) if it moves from could to should.

Size: **L** (a quarter) for must + should. An **M** slice exists: editor + text/shapes/uploads + pages + PNG/PDF export + 20 templates, with no sharing or brand kit.
