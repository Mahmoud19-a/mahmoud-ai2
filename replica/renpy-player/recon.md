# Recon map: Spark – Ren'Py Novels (iOS)

Scope: an iOS app that runs **PC Ren'Py visual novels** on iPhone/iPad. Core slice: import a game, keep a library, launch it with a suitable engine version, play with touch controls, and manage saves (backup, restore, import, delete).
For: the user's own app, sideloaded with SideStore. It gets an original name, icon and art, and the same kind of functionality.
Date: 2026-11-11
Previous recon (Lawha / design editor) moved to `replica/lawha/`.

> **Evidence note.** This session's network blocks apps.apple.com and appadvice.com. The facts come from three places:
> - the App Store screenshot the user sent (`screens/S00-appstore-listing.png`, kept locally and not committed)
> - web search snippets of the App Store listing
> - a third-party SourceForge listing
>
> Anything not visible there is marked `guess`. The user has the app installed through TestFlight. Screenshots of each screen from their own phone would raise most guesses to `high`.

## Sources

| # | source | URL | notes |
| --- | --- | --- | --- |
| 1 | App Store listing (search snippet) | https://apps.apple.com/us/app/-/id6474479684 | $6.99 paid + in-app purchases. Utilities. iOS 15.5+. "Data Not Collected". Says it is an independent tool, not affiliated with Ren'Py. |
| 2 | App Store listing (user screenshot) | `replica/screens/S00-appstore-listing.png` | 4.8★ from 223 ratings, #47 Utilities. Icon row shows translate, book, wrench, import and settings icons. Screenshot "Manage Games & Saves" shows the game screen with back, "Game" chip and gear, plus an "All Saves" list with slots like `auto-7-LT1` and **+** / **…** buttons. |
| 3 | SourceForge mirror listing | https://sourceforge.net/app/spark-renpy-novels/iphone/ | Library: import, organise, launch. **Several Ren'Py engine versions**, chosen per novel. Per-novel performance and compatibility settings. Saves: manual and automatic backups, restore, import from other installs, delete. Languages: EN, RU, KO, ZH-Hans, JA. |
| 4 | Similar apps in the category | https://renpy-pocket-faq.pages.dev, https://mwm.ai/apps/renpyemu-for-ren-py/6751824770 | Import a game as a .zip from Files/Safari. Import PC saves. Warnings: PC save tokens may not match on another device; games with native Python extensions may not run. |
| 5 | Ren'Py itself (open source, MIT) | https://www.renpy.org, https://github.com/renpy/renpy, https://github.com/renpy/renpy-build | The engine. Official iOS builds go through `renios` / `renpy-build`. **This is the part we build on.** |
| 6 | The user's own TestFlight install | (on the user's phone) | To do: screenshot every screen into `replica/screens/` |

## Core loop

Get a PC Ren'Py game (.zip) into the app, then tap it in the library, then it runs full-screen with touch controls. Saves stay safe and can be backed up or moved.

## Screens

| ID | screen | how to reach | purpose | key components | states seen |
| --- | --- | --- | --- | --- | --- |
| S01 | Library | app start | All imported novels | Grid/list of cover cards, **+** import, **…** menu, search/sort (guess) | empty (first run), filled, importing |
| S02 | Import | **+** / import icon | Bring a game in from Files (zip or folder), share sheet or URL (guess) | Document picker, progress bar, result toast | picking, unzipping, done, error (not a Ren'Py game / no space) |
| S03 | Game detail / launch options | tap **…** on a game | Engine version, performance and compatibility settings, rename, cover, delete | Picker (engine 7.x / 8.x), toggles, sliders, destructive button | default, changed |
| S04 | **Player** | tap a game | Runs the novel full-screen | Ren'Py canvas, overlay: back, "Game" chip, gear (seen); rollback / skip / auto / hide UI (guess) | loading, playing, paused overlay, crash/error |
| S05 | In-game overlay menu | gear in S04 | Quick save/load, settings, exit to library | Sheet with buttons | open |
| S06 | Saves (per game / "All Saves") | wrench or saves entry; seen in screenshot | List of save slots with thumbnails and names (`auto-7-LT1`) | List rows with thumbnail, **+** (new backup / import), **…** (actions) | empty, filled |
| S07 | Save actions | **…** on a save | Backup, restore, export, delete | Action sheet, confirm dialog | — |
| S08 | Backups | from S06 | Manual and automatic backups, restore | List, restore button | empty, filled |
| S09 | Save editor (guess, from search result) | from S07 | Edit variables in a save / persistent data | Key-value list, search, edit field | loading, error (unsupported format) |
| S10 | Translate (guess, translate icon) | icon row | Language / translation options for a game | Language list | — |
| S11 | Guide (book icon) | icon row | How to import games and saves | Text pages | — |
| S12 | App settings (gear icon) | icon row | Global defaults, storage, about | Form | — |
| S13 | Paywall / in-app purchase (guess) | locked feature | Unlock extras | Price buttons | — |

## Flows

```
F01 Import and play a game
    S01 -> S02 (pick .zip in Files) -> unzip/validate -> S01 (new card) -> S04 playing
    happy path taps: ~4
    edge: zip contains a nested folder; not a Ren'Py game; .rpa archives; huge game (GBs, low storage);
          game made for Ren'Py 6/7 (Python 2) vs 8 (Python 3); game needs native Python modules

F02 Play with touch
    S04: tap = advance, swipe/back = rollback, long-press or 2-finger = hide UI (guess), gear -> S05
    edge: text input screens need the keyboard; landscape vs portrait; app goes to background mid-scene

F03 Back up and restore saves
    S06 -> + backup -> S08 -> restore -> S04 continues from that save
    happy path taps: ~4
    edge: restore over newer saves (confirm), auto backup before every launch (guess)

F04 Import PC saves
    S06 -> + -> Files -> pick saves folder/zip -> slots appear
    edge: save made by another engine version; PC save token mismatch (Ren'Py 8 "save security")

F05 Change engine version / compatibility for one game
    S01 -> … -> S03 -> pick engine, renderer, performance -> launch
    edge: wrong engine -> game error screen must offer "try another engine"

F06 Delete / rename a game
    S01 -> … -> S03 -> delete (confirm)
```

## Components

| component | variants | states | used on |
| --- | --- | --- | --- |
| Game card | grid, list | normal, importing (progress), broken | S01 |
| Icon button (round, glass) | back, share, gear, +, … | default, pressed | all |
| Chip | "Game", engine version | — | S04, S03 |
| Action sheet / context menu | — | — | S01, S06, S07 |
| Confirm dialog | destructive | — | delete, restore |
| Document picker (system) | zip, folder | — | S02, F04 |
| Progress bar / toast | — | — | S02 |
| Save row | with thumbnail, timestamp, slot name | selected | S06, S08 |
| Toggle / picker / slider rows | — | — | S03, S12 |
| Player overlay | — | shown, hidden | S04 |

Look and feel (screenshot): dark UI, glassy round buttons, serif display headings. **Do not copy the icon or the anime artwork.** They belong to Spark or its artist.

## Inferred data model

```
Game        id, title, folder_path, cover_path?, engine_version (e.g. "8.3"|"7.6"),
            settings {renderer, performance_mode, scale, ...}, size_bytes, added_at, last_played_at
            evidence: #3 per-novel engine + settings, S01, S03 · confidence: high (fields: medium)

SaveSlot    game_id, slot_name ("auto-7-LT1", "1-1-LT1"), file_path, thumbnail, saved_at
            evidence: S00 screenshot "All Saves" rows; Ren'Py save naming · confidence: high

Backup      id, game_id, kind (manual|auto), created_at, zip_path, slot_count
            evidence: #3 manual/automatic backups · confidence: high

Persistent  game_id, file_path (Ren'Py "persistent" file)
            evidence: Ren'Py internals; save editor (#4) · confidence: medium

Engine      version, python (2|3), bundled (bool)
            evidence: #3 several engine versions · confidence: high
```

Relationships: Game 1-n SaveSlot, Game 1-n Backup, Engine 1-n Game.

## Feature matrix

See `features.csv`. Must: 16, should: 8, could: 4, skip: 4.

## Out of scope / must not be copied

- **The name "Spark", the icon, the anime artwork, the screenshots and the App Store text.** Copying these exactly is what would cause problems (trademark and copyright). Our version gets its own name and its own art.
- **Spark's own code.** We do not decompile or inspect the app. The engine comes from Ren'Py's public open-source code instead.
- **Games themselves.** The app ships with no games. Users import games they own or that are free to download.
- **The App Store presence and ratings.** This is a sideloaded app. A public App Store release would also hit Apple rule 2.5.2 (apps may not run downloaded code), which a sideload avoids.

## Size

Screens 13, flows 6, entities 5.

Hard parts:
1. **Building the Ren'Py engine for iOS as a "player" that loads any game from a folder**, instead of one game baked into the app. This needs Ren'Py's `renpy-build` toolchain (Python, SDL2, ffmpeg, pygame_sdl2) cross-compiled for iOS on a Mac. That is hours of CI and a lot of trial and error.
2. **Several engine versions.** Ren'Py 7 runs on Python 2 and Ren'Py 8 runs on Python 3, so supporting both means shipping two full runtimes in one app.
3. **Game compatibility.** Some PC games bundle native modules or desktop-only code, and save files from a PC can carry security tokens that do not match on the phone.

Size: **XL as specified.** Rescoped MVP: the **Ren'Py 8.x engine only**, plus library, zip import, player with touch controls, and save backup/restore/import/delete. That is **L**. Ren'Py 7 support, the save editor and translation come after the MVP works.
