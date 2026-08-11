# Levels Refresh — Shopify theme

A custom Shopify Online Store 2.0 theme for **levelssmokeshop.com**. Apple-inspired dark UI with neon-orange accent, glass-pill nav, big rounded product cards, scroll-reveal animations, predictive search, cart drawer, and a 21+ age gate.

## What's in here

```
levels-refresh/
├── layout/
│   ├── theme.liquid                # main HTML shell
│   └── password.liquid             # "coming soon" splash
├── templates/                      # JSON templates (Online Store 2.0)
│   ├── index.json                  # homepage
│   ├── product.json
│   ├── collection.json
│   ├── cart.json
│   ├── page.json
│   ├── search.json
│   ├── 404.json
│   ├── list-collections.json
│   └── gift_card.liquid
├── sections/
│   ├── header-group.json           # announcement bar + sticky header
│   ├── footer-group.json           # footer with link blocks
│   ├── hero.liquid                 # big homepage hero
│   ├── collection-list.liquid      # category tile grid
│   ├── featured-collection.liquid  # "most-viewed" product strip
│   ├── featured-product.liquid     # spotlight product
│   ├── image-with-text.liquid      # editorial / about block
│   ├── rich-text.liquid
│   ├── newsletter.liquid
│   ├── cart-drawer.liquid
│   ├── age-gate.liquid             # 21+ overlay
│   └── main-*.liquid               # product / collection / cart / page / search / 404
├── snippets/
│   ├── product-card.liquid
│   ├── price.liquid
│   ├── icon.liquid
│   ├── pagination.liquid
│   └── meta-tags.liquid
├── assets/
│   ├── theme.css                   # full design system
│   └── theme.js                    # cart drawer, search, gallery, variant picker, age gate
├── config/
│   ├── settings_schema.json
│   └── settings_data.json
└── locales/
    └── en.default.json
```

## Install (drag-and-drop, ~3 minutes)

1. Zip the folder (a `levels-refresh.zip` is produced for you next to this directory if you used the build script — otherwise: `cd levels-refresh && zip -r ../levels-refresh.zip .`).
2. In Shopify admin → **Online Store → Themes → Add theme → Upload zip file**.
3. Once it appears in the **Theme library**, click **Customize** to preview and tune.
4. When happy: **Actions → Publish**.

> The current live theme stays untouched until you publish — preview risk = zero.

## Install via Shopify CLI (recommended for iteration)

```bash
brew install shopify-cli
cd /Users/king50.ai/levels-refresh
shopify theme dev --store=levelssmokeshop.myshopify.com   # live preview at localhost:9292
shopify theme push --unpublished                          # uploads as a draft theme
```

## What to customize after install

Open **Customize** on the theme and walk through:

### Theme settings (gear icon, top-right)
- **Brand → Logo** — upload the LEVELS logo (transparent PNG, ~260px wide)
- **Brand → Favicon** — 32×32 PNG
- **Brand → Default share image** — 1200×630 OG image
- **Colors** — accent defaults to orange `#ff6a00`; change here if they want a different identity
- **Typography → Heading font** — Shopify's font picker (Helvetica is the default; Inter, SF Pro, Söhne all work)
- **Cart → Cart note** — "Free shipping over $50"
- **Age gate** — toggle on/off (on by default)
- **Social** — IG / FB / TikTok / YouTube URLs (already pre-filled with `instagram.com/levelssmoke`)

### Header (sections panel, left)
- **Menu** — point at their existing `main-menu` (Sovereignty, Rigs, Marbles n Caps, Puffco, Quartz, Accessories, Tubes n Slides, Pendants, 3 Grams). Already wired by default.
- **Announcement bar** — currently says "Free shipping on orders over $50 · Follow @LevelsSmoke for weekly drops". Edit to match the live promo.

### Homepage sections (in order)
1. **Hero** — set heading, sub, CTAs, and a 21:9 hero image (e.g., a flagship Sovereignty piece)
2. **Categories** — collection-list block — pick the 8 collections (Sovereignty, Puffco, Marbles & Caps, Quartz, Tubes & Slides, Pendants, Accessories, 3 Grams) and override images if needed
3. **Featured collection (Puffco)** — pick the Puffco collection
4. **Image with text** — upload a shot of the shop / Joshua + friend, edit copy
5. **Featured collection (Marbles)** — pick Marbles & Caps
6. **Featured product** — spotlight a high-end piece
7. **Newsletter** — captures emails to the Customer database, taggable

### Footer
- **Tagline** under the logo
- 3 link blocks (currently: Shop, Support, Hours) — point at any link list

## Tech notes

- **Cart**: AJAX cart drawer via `/cart.js`, `/cart/add.js`, `/cart/change.js`. Falls back to native form post if JS is disabled.
- **Search**: predictive via `/search/suggest.json`, modal triggered from header; full results page at `/search`.
- **Variant picker**: client-side, parses `product.variants | json` and updates price + availability + URL `?variant=...`.
- **Performance**: single CSS file, single deferred JS file, no jQuery, no framework. Image `srcset`/`sizes` everywhere, `loading="lazy"`, `fetchpriority="high"` on hero + first product image.
- **Accessibility**: skip-to-content, aria-labels on all icon buttons, `dialog` roles on modals, `aria-current="page"` on pagination, focus-visible inherited from browser.
- **Age gate**: uses `localStorage.levels_age_ok` so it shows once. The **No** button redirects to google.com — change in `assets/theme.js` if a different fallback is preferred.

## Brand color tweak

To pick a different accent (e.g., gold or smoky cyan instead of orange), change `--signal` in `assets/theme.css` (line ~20) **or** override via Theme settings → Colors → Accent. The CSS uses the var everywhere so a single change cascades.

## Known gaps (intentional, easy to add later)

- **Blog / article templates** — using Shopify defaults. Add `templates/blog.json` + `sections/main-blog.liquid` if they want to start blogging.
- **Customer account templates** — using Shopify defaults. Override if they want branded login/register/order pages.
- **Filter UI on collection** — only sort is exposed; tag filters can be added by extending `main-collection-product-grid.liquid` with `collection.filters`.
- **Apple Pay / Shop Pay buttons** — Shopify renders these natively at checkout; the buy button on the product page intentionally uses the standard cart flow so dynamic checkout buttons can be enabled in admin if desired.

## Built by

Joshua Grams · jrgramsdev · josh@3grams.com · [joshuagrams.com](https://joshuagrams.com)
