# 栗子森林 Chestnut Mora Site Rules

## Scope

These instructions apply to the official brand homepage for 栗子森林 Chestnut Mora.
The site is a Mobile First, single-route brand landing page whose primary job is to
introduce 萌栗 and send visitors to the official Instagram. It is not an ecommerce
checkout.

## Source-of-truth order

Before changing code or content, read these files in order:

1. `AGENTS.md`
2. `docs/BRAND.md`
3. `docs/SITE_SPEC.md`
4. `docs/CONTENT.md`
5. `docs/ASSET_MANIFEST.md`
6. The current user brief
7. Existing implementation

If sources conflict, follow the order above. `BRAND.md` owns brand direction,
`CONTENT.md` owns approved visible copy and social destinations, and
`ASSET_MANIFEST.md` owns image approval and usage. `SITE_SPEC.md` owns product and
technical behavior.

## Non-negotiable rules

- Keep the experience Mobile First. Check at least 360, 390, and 430px before review.
- The current release is approved for the public GitHub Pages root
  `https://chestnut-mora.github.io/` under the `chestnut-mora` account. Do not publish
  to another host or GitHub account. Future releases still require explicit approval.
- Use only approved local assets listed in `docs/ASSET_MANIFEST.md`. The selected local
  captures from the official Instagram account are approved image assets for this
  preview; never hotlink remote Instagram media or add stock, Pinterest, Google, or
  AI-generated images.
- Keep the homepage image-led. Do not turn an Instagram capture into a maintained
  product-style, price, or inventory catalog; visitors follow the official links for
  the current conversation and purchase flow.
- Do not invent a brand story, address, phone, email, legal name, founding date,
  delivery time, repair promise, customization policy, discount, warranty, or overseas
  shipping policy beyond the user-approved copy in `docs/CONTENT.md`.
- Keep external links limited to the approved Instagram profile/post links and 7-11
  賣貨便 URL in `docs/CONTENT.md`. Use `target="_blank"` and
  `rel="noopener noreferrer"`.
- Keep content in data structures or data files rather than scattering product copy
  through layout markup. Product, FAQ, navigation, and social data must be easy to
  replace.
- Preserve semantic HTML, visible keyboard focus, informative `alt` text, touch
  targets of at least 44px (prefer 48px), and `prefers-reduced-motion` behavior.
- Do not add checkout, payment, account, database, authentication, CMS, wishlist,
  search, cart, or other speculative features without a later explicit request.
- Avoid console logging, broken imports, dead links, horizontal page overflow,
  stretched/cropped product subjects, heavy shadows, dense ecommerce grids, neon or
  blue-purple gradients, and excessive emoji.

## Working convention

Use the generated Sites/Vinext project already in this folder. Prefer `apply_patch`
for source edits. Keep supplied images in `public/assets/` with stable descriptive
names. Run `npm.cmd run build` after implementation changes; run `npm.cmd run lint`
when lint coverage is needed. Report unknowns rather than silently filling them in.
