# Recon map: Aspect – AI-Only Social Media (iOS)

Scope: the core loop of a social network where **you are the only human**. You post text or photos, and AI characters like, comment, follow and DM you. They also post their own content to a feed you can browse and comment on, and you can create your own characters.
For: a **personal** version for the user only, sideloaded with SideStore. It has no other humans and no paywall: the things Aspect gates behind Aspect Pro are unlimited here.
Date: 2026-11-20
Previous recons moved to `replica/lawha/` (design editor) and `replica/renpy-player/` (Ren'Py player).

> **Evidence note.** This session's network blocks apps.apple.com, so the facts come from web search snippets of the App Store listing, press coverage, Product Hunt and review aggregators. Anything not confirmed there is marked `guess`. Screenshots of each screen (without a Pro login trick) from the user's own install would raise most guesses to `high`.

## Sources

| # | source | URL | notes |
| --- | --- | --- | --- |
| 1 | App Store listing | https://apps.apple.com/us/app/aspect-ai-only-social-media/id6502742786 | "AI-only social media where you are the only human". Free with in-app purchases (Aspect Pro weekly / yearly). Developer Arch Platforms, Inc. |
| 2 | Swiss App Store listing (prices) | https://apps.apple.com/ch/app/aspect-ai-only-social-media/id6502742786?l=en-GB | Pro Yearly CHF 40, Pro Weekly CHF 7 |
| 3 | Paywall library | https://adapty.io/paywall-library/aspect/ | Pro Yearly $39.99 (US). Share posts and photos, chat with AI characters, **create your own characters**. |
| 4 | Press: BGR | https://bgr.com/tech/in-this-bizarre-new-social-media-app-every-user-other-than-you-is-ai/ | Every user other than you is AI. Likes, comments, followers, notifications. |
| 5 | Product Hunt (launch July 2, 2024) | https://www.producthunt.com/products/aspect-an-ai-social-app | Maker: share posts, browse your feed, **chat via DMs**, and more |
| 6 | User reviews | https://justuseapp.com/en/app/6502742786/aspect-nur-ki-social-media/reviews | Complaints: "almost everything is paywalled", "only THREE DMs without Pro". Praise: "it's like actual people". |
| 7 | Similar app (SocialAI) | https://techcrunch.com/2024/09/17/socialai-offers-a-twitter-like-diary-where-ai-bots-respond-to-your-posts/ | Pattern: AI replies, replies to replies, likes on comments |

## Core loop

You post something, and within seconds to minutes AI characters react: likes, comments in their own voices, follows. You reply, and they reply back. Between your posts, the feed is full of the characters' own posts.

## Screens

| ID | screen | how to reach | purpose | key components | states seen |
| --- | --- | --- | --- | --- | --- |
| S01 | Onboarding | first launch | Name, photo, interests | Steps, avatar picker, chips | each step, skip |
| S02 | **Home feed** | tab 1 | Posts from AI characters (and yours) | Post cards (avatar, name, @handle, text, photo, like/comment counts), pull to refresh | loading, filled, generating new posts |
| S03 | Post detail | tap a post | Comments thread | Post, comment list, nested replies, like on comment, reply box | no comments yet, AI typing (guess) |
| S04 | Compose | + tab / button | Write a post, attach a photo | Text field, photo picker, post button | empty, with photo, posting |
| S05 | Notifications | tab | New likes, comments, followers | Grouped rows with avatars | empty, filled, unread dots |
| S06 | DMs list | tab | Conversations with characters | Rows with last message, time | empty, filled |
| S07 | DM chat | tap a conversation | One-to-one chat with a character | Bubbles, input, typing indicator, photo send (guess) | empty, typing, **limit reached (Pro paywall)** |
| S08 | Character profile | tap an avatar | Bio, followers/following, their posts, follow + message buttons | Header, stats, grid/list | — |
| S09 | My profile | tab | My posts, followers count | Header, edit button, posts | no posts |
| S10 | Edit profile | from S09 | Name, bio, photo | Form | — |
| S11 | Create character | from explore/profile (#3) | Name, look, personality, bio | Form, avatar generate/upload | — |
| S12 | Explore / search (guess) | tab | Find characters, trending | Search, suggested characters | — |
| S13 | Paywall | DM limit, locked feature | Aspect Pro weekly/yearly | Plan cards | — |
| S14 | Settings | from profile | Account, notifications, delete data | List | — |

## Flows

```
F01 Post and get reactions (the core)
    S02 -> S04 write + photo -> post -> S02 (my post on top) -> likes/comments trickle in -> S05 badge -> S03
    happy path taps: 3
    edge: no network / AI error, inappropriate text, photo too big, offline post

F02 Reply in a comment thread
    S03 -> reply to a character -> character replies back (and others join)
    edge: long threads, several characters arguing

F03 DM a character
    S08 -> Message -> S07 -> chat
    edge: Aspect limits free users to 3 DMs (#6) -> ours: unlimited

F04 Browse and comment on AI posts
    S02 -> like / S03 comment -> author replies

F05 Create a character
    S11 -> name, personality, avatar -> it starts posting and reacting

F06 Follow / get followed
    new characters follow you over time -> S05 "X followed you" -> S08
```

## Components

| component | variants | states | used on |
| --- | --- | --- | --- |
| Post card | text, text + photo, mine | liked, loading image | S02, S08, S09 |
| Avatar | small, large, with ring (new) | loading | everywhere |
| Comment row | top-level, reply | liked, typing placeholder | S03 |
| Action bar | like, comment, share | counts animate | S02, S03 |
| Tab bar | home, explore, +, notifications/DMs, profile | badge | all |
| Chat bubble | mine, theirs, photo | sending, typing dots | S07 |
| Notification row | like, comment, follow | unread | S05 |
| Composer | text, photo | posting | S04, S03, S07 |
| Follow button | follow, following | — | S08 |
| Sheet / toast | — | — | various |

## Inferred data model

```
User (me)    name, handle, avatar, bio, interests[]
             evidence: onboarding/profile in #4 · confidence: medium

Character    id, name, handle, avatar, bio, personality (prompt), interests[], is_custom, followed_by_me, follows_me
             evidence: #3 create your own characters, #4 · confidence: high (fields: medium)

Post         id, author_id (me | character), text, image?, created_at, like_count, liked_by_me
             evidence: #1, #4 · confidence: high

Comment      id, post_id, parent_id?, author_id, text, created_at, likes
             evidence: #4, #7 replies to replies · confidence: high

Like         target (post|comment), author_id, created_at
Follow       follower_id, followee_id, created_at
Notification id, kind (like|comment|follow|dm), actor_id, target_id, read, created_at
DMThread     character_id, messages[] (id, from, text, image?, created_at)
             evidence: #5 DMs, #6 DM limit · confidence: high
```

## Feature matrix

See `features.csv`. Must: 17, should: 9, could: 4, skip: 4.

## Out of scope / not copied

- **The name "Aspect", its logo, its characters, its texts and its prompts.** We write our own characters and our own prompts.
- **Their AI service.** Aspect runs its own paid AI backend. Our version needs **an AI model of its own**. That is the one thing that is not free by default: either the user's own API key (Claude or another provider; the cost is small for one person) or a free API tier, which has limits.
- **Paywall and subscription.** None; the app is personal.
- **Other real people.** None, by design.

## Size

Screens 14, flows 6, entities 8.

Hard parts:
1. **The AI behaviour.** Many characters with distinct voices that stay in character, react at believable times (not all at once), reply in threads, and remember context in DMs. This is mostly prompt design plus a small scheduler.
2. **Where the AI runs, and its key.** A personal sideloaded app can call the AI API directly with the user's own key, stored in the iPhone Keychain. That needs no server, but the key must never be committed to the repo.
3. **Photos.** The characters need to see your photo, which needs a vision-capable model. Characters' own photo posts need image generation or a free stock-photo source.

Size: **M** (a few weeks) for a personal, local-only version: data on the phone, AI called directly, no server or accounts. Reusing the Lawha setup (web app inside an iOS shell, IPA built by GitHub Actions) makes the first IPA quick.
