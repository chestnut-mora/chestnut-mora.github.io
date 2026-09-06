# 栗子森林 Chestnut Mora Website Specification

## Status and release gate

- Product: 栗子森林 Chestnut Mora official brand homepage.
- Routes: `/` plus statically generated `/products/[slug]` detail pages.
- Experience: public-ready design with a local Preview and public GitHub Pages release.
- Release target: `https://chestnut-mora.github.io/`, from the public
  `chestnut-mora/chestnut-mora.github.io` repository.
- Release gate: the user has explicitly approved this GitHub Pages publication. Do not
  publish to another host or GitHub account.
- This is not a checkout, account area, or full ecommerce store.

## Product goal and conversion flow

The homepage should let a new visitor understand the brand within seconds, understand
what 萌栗 means, see products in real-life contexts, feel trust in the handmade process,
and then continue to Instagram.

```text
Instagram / Search / Social
        ↓
Official homepage
        ↓
Understand 栗子森林 → Understand 萌栗 → See lifestyle / details
        ↓
Product detail page → Visit official shop / Instagram → View current items / ask / purchase
```

Primary CTA: `逛逛最新萌栗` → `https://www.instagram.com/chestnut_mora/`

Secondary CTA: `追蹤 @chestnut_mora` → the same official profile URL.

Additional approved shop link: the user-provided 7-11 賣貨便 URL in `CONTENT.md`.
The homepage keeps the purchase journey light and sends visitors to the brand's
Instagram and shop links rather than reproducing a dense store interface.

Live shop availability is refreshed by `scripts/sync-myship.mjs` through the
`Sync MyShip products` GitHub Action. It runs every 30 minutes and can also be
started manually; when product, price, image, or availability data changes, the
Action commits the new JSON snapshot and deploys the updated homepage. Variants
marked sold out or unselectable are excluded from the visible collection.

### MyShip product lifecycle and retention

The sync data uses these lifecycle states:

```text
available → soldout → removed → archived
```

- `available`: shown in the homepage collection and treated as `InStock`.
- `soldout`: hidden from the homepage collection, but the source record remains.
- `removed`: the source record was absent from successful MyShip syncs for a full
  24-hour grace period; it remains retained for historical product pages.
- `archived`: an explicitly preserved historical work, labeled as a past/sold work,
  and not removed by later syncs.

`unknown` may still appear as an ingestion-safety state when MyShip provides a
present option without enough stock information to classify it. It is not a
lifecycle transition and is never used as evidence that a product is missing.

A failed request, parse failure, abnormal response, or suspiciously empty result is
not a successful sync. It keeps the last known good snapshot and cannot start or
advance a product's missing-period clock. A product missing only once therefore is
not immediately marked `removed`, and no automatic product-page deletion is part of
this retention policy.

## Information architecture

Keep this order on the single homepage. Each section should have one job and a stable
anchor id for navigation:

1. `Header` — logo/wordmark, Instagram icon, 7-11 賣貨便 shopping-bag CTA immediately
   to its right, menu, and sticky soft-cream treatment. Do not add a floating side CTA.
2. `Hero` — a left-side carousel of all approved local brand images, primary message,
   and primary CTA. Images advance from right to left every 3.5 seconds; visitors can
   swipe or drag manually, with no visible carousel indicator or control icons.
3. `BrandIntro` (`#about`) — what the studio is and why the collection exists.
4. `WhatIsMengLi` (`#mengli`) — three values: 正版角色、手工搭配、小量收藏.
5. `FeaturedProducts` (`#collection`) — the current available MyShip variants in a
   horizontal swipe, with each card linking to its SEO detail page and official shop.
6. `ProductDetail` (`/products/[slug]`) — one static, indexable page per retained
   lifecycle record; available and sold-out records expose their matching offer state.
7. `LifestyleGallery` (`#lifestyle`) — editorial mosaic, not an Instagram grid.
8. `DetailGrid` — close-up photography plus short editorial notes.
9. `BrandStory` (`#story`) — brown background, cream text, restrained handwritten accent.
10. `HowToBuy` (`#how-to-buy`) — three steps and approved Instagram/shop links.
11. `TrustStrip` — five safe trust statements with simple line icons.
12. `FAQ` (`#faq`) — accordion using the conversational answers approved in
    `CONTENT.md`.
13. `InstagramCTA` (`#instagram`) — final editorial collage and Instagram CTA.
14. `Footer` (`#site-footer`) — logo, tagline, Instagram, approved shop link, copyright.
15. `MobileStickyCTA` — mobile-only latest-Meng-Li CTA; hide or fade near footer.

Do not add search, cart, account, checkout, payment form, wishlist, database, CMS, or
authentication. Product detail routes are limited to the requested SEO and purchase
handoff flow.

## Responsive contract

Mobile is the source design, not a shrunken desktop layout.

| Viewport | QA target |
| --- | --- |
| 360 × 800 | Small phone |
| 375 × 812 | Small/medium phone |
| 390 × 844 | Primary design viewport |
| 393 × 852 | Common phone |
| 414 × 896 | Large phone |
| 430 × 932 | Large phone |
| 768px wide | Tablet |
| 1280px wide | Desktop |
| 1440px / 1920px wide | Wide desktop containment |

Rules:

- Mobile horizontal padding: 20px, with a safe range of 16–24px.
- Content max width: 1200px; editorial sections may use a narrower max width.
- Section spacing: approximately 72–110px on mobile.
- Card gaps: 12–18px.
- Buttons and interactive controls: minimum 44px, preferably 48px high.
- Featured product cards: 76–82vw on mobile so the next card is visibly peeking in.
- Tablet may show two product cards; desktop should show no more than 3–4 at once.
- No horizontal page overflow. The product carousel may scroll inside its own region.
- Headings use semantic `<br />` only when needed to preserve intentional Chinese line
  breaks; never allow ugly mid-word or character fragmentation.

## Component and data architecture

The page should be composed from maintainable components, not one oversized component:

```text
Header
MobileMenu
Hero
BrandIntro
WhatIsMengLi
FeaturedProducts
ProductCard
LifestyleGallery
DetailGrid
BrandStory
HowToBuy
TrustStrip
FAQ
InstagramCTA
Footer
MobileStickyCTA
```

Keep replaceable content separate from layout. Preferred data boundaries:

```text
data/navigation.ts
data/products.ts
data/faq.ts
data/social.ts
```

Minimum gallery fields: `id`, `caption`, `image`, `alt`, `instagramUrl`, `featured`,
and `accent`. Captions are short editorial mood lines, not product names or inventory
claims. Do not add price, stock, or status fields to the homepage gallery.

## Image rules

- Render only approved assets in `ASSET_MANIFEST.md`. Selected local captures from the
  official Instagram account may be rendered because they were explicitly approved for
  this project.
- Keep Instagram images local and stable; do not hotlink remote post media.
- Prefer user-provided lifestyle photography. Keep the product physically connected to
  a phone, bag, tray, or other object; never make 萌栗 appear to float.
- Use `object-fit: cover` only when the crop preserves the main character and product.
- Do not stretch, recolor, add aggressive filters, or change the physical direction of
  a hanging chain.
- If an approved image is missing for a section, use another approved user-provided or
  locally captured account image and mark the substitution in the final QA report; do
  not use web, stock, or generated imagery.
- Hero image is eager/high priority. Other images are lazy-loaded.
- Every informative image has a useful `alt`; purely decorative images use `alt=""`.
- Supply `width`, `height`, `aspect-ratio`, `loading`, and `decoding` where applicable.
- Use AVIF/WebP when a reliable local conversion pipeline exists. Do not block Preview
  on a conversion tool that is unavailable; retain the approved source image safely.

## Interaction contract

Allowed: subtle fade-up, soft image reveal, product horizontal swipe, FAQ accordion,
and quiet hover/tap feedback. The mobile menu must be keyboard accessible and expose
`aria-expanded` and an accessible label. FAQ controls must expose `aria-expanded` and
`aria-controls`.

Not allowed: scroll hijacking, auto-playing music, aggressive parallax, cursor effects,
continuous floating, bouncing or pulsing CTAs, auto-scrolling carousels, large loading
animations, or unnecessary 3D.

When `prefers-reduced-motion: reduce` is active, remove non-essential animation and
smooth scrolling.

## Accessibility and semantics

- Use `header`, `nav`, `main`, `section`, `article`, `figure`, and `footer` appropriately.
- The homepage has exactly one `<h1>`; sections use `<h2>` and cards use `<h3>`.
- Every icon-only control has an accessible name. Buttons have visible focus styles.
- Body copy remains readable at 200% text enlargement and does not rely on color alone.
- Maintain reasonable contrast between brown text, cream surfaces, and the brown story
  section.
- Use `target="_blank"` and `rel="noopener noreferrer"` for external links.

## Metadata and structured data

Title: `栗子森林 Chestnut Mora｜正版角色手作萌栗手機鍊`

Meta description: `栗子森林 Chestnut Mora，以正版角色搭配串珠與配件，手工製作一條條獨特萌栗，把喜歡的小角色掛進每天的日常。`

Open Graph title: `栗子森林 Chestnut Mora`

Open Graph description: `把喜歡的小角色，掛進每天的日常。`

Use `summary_large_image` for Twitter/X when an approved OG image is available. The
specified Hero may be used as OG image only after its production URL/path is stable.
The approved canonical domain is `https://chestnut-mora.github.io/`; set the canonical
URL to the root path when publishing this release.

If Organization/Brand JSON-LD is added, use only the confirmed name, logo asset, and
Instagram `sameAs`. Do not invent address, telephone, legal name, or founding date.

Implementation:

- The homepage emits `Organization`, `WebSite`, `ItemList`, and `Product` JSON-LD for
  currently available variants.
- Each `/products/mori-yymmdd-001` page emits `Product` and `BreadcrumbList` JSON-LD.
  Available and sold-out pages expose `InStock` or `OutOfStock`; removed and archived
  pages remain indexable without claiming a current offer.
- The sync workflow preserves product slugs across lifecycle updates, regenerates the
  SEO data snapshot, and keeps all retained product pages in `sitemap.xml`.

## QA checklist before review

### Functional

- Header, menu, anchor links, Instagram links, 7-11 shop link, carousel swipe, FAQ
  accordion, and footer all work.
- Hero image carousel advances every 3.5 seconds, moves left, supports pointer/touch
  swiping, and has no visible guide icons or indicator controls.
- Sticky CTA is mobile-only and hides/fades before the footer.
- The gallery stays image-led and does not display a maintained price or inventory
  field; FAQ copy matches the approved service details in `CONTENT.md`.

### Technical

- `npm.cmd run build` passes.
- No TypeScript errors, hydration errors, console errors, broken imports, dead links,
  missing images, stale price cards, or horizontal page overflow.
- Images reserve layout space and are not visibly stretched.

### Visual

- Review 360, 390, and 430px first, then tablet and 1280/1440px desktop.
- Chinese headings break intentionally, CTA is never covered, and the carousel exposes
  a next card.
- Visual result feels like a warm collectible studio, not a dense ecommerce template.
- Huninn is used consistently for the Chinese UI and headings; verify the Google Fonts
  fallback stack when testing offline.

## Release report format

Before any release request, report:

1. Completed sections.
2. Actual approved assets used.
3. Missing assets.
4. Placeholder or uncertain copy.
5. Mobile QA results for 360/390/430px.
6. Tablet QA result.
7. Desktop QA result.
8. Known issues.
9. Recommended next improvements.

The current release has explicit approval for the GitHub Pages target listed above.
