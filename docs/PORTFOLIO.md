# Interactive portfolio

First-time Macfolio visits start in dark mode. An existing saved light or dark preference is preserved, including preferences migrated from the previous storage namespace. The initial HTML theme follows the saved preference before the app loads.

Macfolio opens only **About Hamid** automatically on desktop and mobile. Its previous content is replaced by the fully English interactive portfolio, also available directly at `/portfolio`. **Open full portfolio** sits in the window title bar (or mobile app header) and opens the standalone page in a new tab. Safari remains available for manual use. The desktop, its existing apps, music and original résumé viewer remain available. Mobile visitors can use **Home** to return to the existing home screen. The explicit `/?view=desktop` destination opens the shell without an automatic app.

The portfolio reconstructs the layout, colors and interaction sequence of the reference site and its public LinkedIn video. It uses Hamid's English PDF, verified information and actual screenshots for nine projects. The centered portrait shows his head, shoulders and torso; its aligned mechanical alternate covers the face, neck, chest and arms. Dika Asia is identified as an employment contribution; Tanpoosh and the public financial interface identify their demo status. To Do List presents a native React Native / Expo Android app with a demonstration APK and a separate web PWA; its screenshots show the web interface. Hamnava presents an installable music PWA backed by Audius, with browser-local accounts and online streaming. Both are included in the shared Macfolio project collection, GitHub view, Safari project list and search. The journey now has four entries, starting with App Developer under independent projects. Scroll lengths scale with project and journey counts. Barg, To Do List, Hamnava and Personal Finance link to their same-domain standalone routes. Personal Finance is a separate encrypted local ledger, not the older Financial Panel.

## Run locally

```bash
npm ci
npm run dev
```

- Desktop and automatic About Hamid: `http://localhost:4173/`
- Standalone portfolio: `http://localhost:4173/portfolio`
- Section link: `http://localhost:4173/portfolio#work`

```bash
npm test
npx tsc --noEmit --noUnusedLocals --noUnusedParameters
npm run build
npm run preview
npx playwright test tests/browser/portfolio.spec.mjs
```

The browser tests run against the production build on port 5180. On Windows, they use installed Google Chrome for Chromium; WebKit must be installed with `npm run test:browser:install` if it is not available.

## Integration

`src/portfolio/PortfolioExperience.tsx` is shared between About Hamid, Safari and the standalone entry. It owns a bounded native scroll container. Navigating sections inside About scrolls within that window without changing the desktop URL. A ResizeObserver measures the container, CSS container queries choose the layout, and scoped animation-frame work responds to scrolling and pointer events. Project and career scenes remain pinned and scroll-driven on phones, tablets, iPads and desktop. Compact layouts use a vertical project card; short landscape viewports use a horizontal card. Reduced motion uses explicit project selection and all career entries in normal document flow.

Safari starts on **Favorites**, with Portfolio added as a favorite and bookmark. It maintains independent internal navigation history, including portfolio section addresses. Back, forward, homepage and reload work within that history without changing the desktop route. The homepage button returns to Favorites, and **Full portfolio** opens `/portfolio` on the current origin. Closing Safari disposes any mounted experience; minimizing preserves its position without a continuous graphics loop.

Case studies load as a separate component and stay inside the portfolio rectangle. The entire project card is a keyboard-accessible button; external project links remain separately clickable. The pointer changes to pink corner brackets over the card. Dialogs have their own scroll area, background inertness, Escape handling, a focus trap and restoration to the original card button.

Two small WebGL programs produce a soft, curling liquid trail and blend the aligned natural and mechanical portraits on devices with a mouse. Touch devices render the portrait with native image layers, avoiding device-specific transparent texture artifacts on iOS while retaining the same reveal and shutter wipe. Desktop portrait textures use premultiplied alpha consistently, high precision when supported and pixel-density-aware resolution. The fluid field also drives the portrait reveal. Only the hero has an automatic two-second zigzag: it begins after ten seconds without pointer activity and repeats on a ten-second cadence. Actual pointer motion immediately takes control. Each right-hand label responds independently to proximity to its card or portrait anchor; distant rows become faint. Line particles travel left to right on continuous paths with distinct phases and durations. **Inspect portrait** locks the mechanical image by keyboard or touch. HTML image layers also provide a reveal if desktop WebGL is unavailable or its context is lost. Rendering stops once a trail dissipates, and idle sweeps pause when hidden, minimized, inactive, reduced motion is enabled or a case study is open.

Profile cards fly in from outside the viewport and assemble as the visitor scrolls; four counters animate from zero when visible inside the profile stage. The résumé downloads only from a clicked download link. The 99% satisfaction figure was supplied by Hamid in the design review. The technology matrix rotates and advances its active module with scrolling. Project scenes change images, copy and background colors together. Three journey entries cover the verified professional role, education and independent product development; personal projects are not presented as another employment role. The journey fades at its end. The rail's dot measures the entire bounded scroll, including the footer. The header progress uses the reference's measured #62F5B7 to #54D9FF gradient.

The contact panel uses a curved stepped silhouette with a flat central crest and recessed lower corners. On desktop, it layers the portrait over a continuous four-copy technology marquee and underneath the Georgia closing line. On phones and tablets, the marquee comes first, followed by Pages / Connect, the signature and closing line, and the smaller portrait. The sole main footer action is **Explore Macfolio**, opening the desktop in a new tab at `/?view=desktop`, which skips automatic Safari launch. JavaScript, TypeScript and Next.js logos preserve contrasting internal details. White footer links roll their letters upward to green on hover or focus. **Telegram** opens `https://t.me/hamid_2_sh`; the **WhatsApp** link immediately beneath it opens `https://wa.me/hamid_2_sh`, using the [official username-link format](https://faq.whatsapp.com/1561101675623754/). These links use the usernames supplied by Hamid; browser tests verify their destinations, not ownership of the external accounts. Journey node circles enter from the southeast as the active entry changes. The PORTFOLIO.OS status display appears only in sections two through five.

Compact profile cards enter alternately from the right and left as they approach the viewport. Phone statistic descriptions use 13 px text and labels use 12 px text. A hamburger menu replaces the six inline header links on compact screens, with Escape handling, focus containment, an inert background and close-on-navigation behavior. Explore Macfolio remains next to the hamburger. Let's Connect remains to its left on desktop and is hidden on phone widths of 600 px and below.

Locking the mechanical portrait reveals it with a 900 ms shutter wipe from top to bottom, including the HTML fallback; reduced motion completes the wipe immediately. Profile card arrival starts while the hero is still visible, so the transition into section two has no empty viewport. Hero labels and their captions scale with the Safari container.

On desktop (a portfolio viewport wider than 1100px and at least 520px tall), the hero occupies exactly the visible portfolio height. Its portrait width is capped by the available height as well as container width, keeping the head below navigation and the approved Claude/Cursor arm chips above the lower controls. The title also respects short desktop heights. Phone and tablet framing is unchanged. The previous stylesheet, measurements and screenshots are retained in `output/rollback/hero-desktop-2026-10-13/`; its README explains how to undo only this adjustment.

The portfolio uses the reference's fixed section colors, without a theme switch. Macfolio's desktop theme remains independent. The existing reduced-motion preference is respected. Assets and fonts load locally. The supplied English PDF is separate from Macfolio's existing PDF so its original viewer continues to work.

## Files to edit

| Purpose | File |
| --- | --- |
| English project descriptions, case studies, skills and links | `src/portfolio/content.ts` |
| Sections, scrolling and navigation | `src/portfolio/PortfolioExperience.tsx` |
| Hero proximity labels and staggered line particles | `src/portfolio/HeroSignals.tsx` |
| Portrait interaction | `src/portfolio/Portrait.tsx` |
| Bounded case-study surface | `src/portfolio/CaseStudy.tsx` |
| Scoped visual design and responsive layouts | `src/portfolio/experience.css` |
| Safari integration and browser history | `src/apps/Safari.tsx` |
| About window and title-bar link | `src/apps/About.tsx`, `src/components/Window.tsx`, `src/components/Mobile.tsx` |
| Standalone static metadata | `portfolio/index.html` |
| Portraits, original English PDF and local fonts | `public/assets/portfolio/` |
| Count-up values and scoped pointer cursor | `src/portfolio/CountUp.tsx`, `src/portfolio/ExperienceCursor.tsx` |
| Liquid rendering and footer logos / letter transitions | `src/portfolio/LiquidTrail.ts`, `src/portfolio/FooterDetails.tsx` |
| Original generated PNGs and exact prompts | `output/imagegen/` |
| Regression coverage | `tests/browser/portfolio.spec.mjs`, `tests/browser/portfolio-responsive.spec.mjs` |

## Existing Vercel project

The build still uses Vite and emits both `dist/index.html` and `dist/portfolio/index.html`. The included `vercel.json` rewrites only `/portfolio` and `/portfolio/` to the portfolio HTML entry, preserving root assets and other routes. Deep-link hashes are handled by the portfolio's own scroll container. Use the existing Vercel project with `npm run build` and output directory `dist`; no new project or environment variables are needed.

Static social metadata uses the existing deployment hostname for the portrait preview; update that one `og:image` value in `portfolio/index.html` if the production domain changes. Runtime metadata and all internal navigation use the current origin. Publication has not been performed as part of this implementation.

The portraits were produced with the built-in image_gen tool, using Hamid's supplied photo and the aligned natural cutout as references. The approved electronic portrait is `output/imagegen/hamid-hardware-v6.png`, exported with alpha at 1024 and 512 pixels. It has a fully metallic face, code-symbol lenses, electric black hair, semiconductor chips with AI developer tool marks, and electronic couplers replacing clothing buttons. The previous approved face edit and exact prompts are retained in `hamid-hardware-v5.png` and `hardware-prompts-v6.json`. The natural portrait and original prompts remain in `hamid-natural-v2.png` and `prompts-v2.json`. The signature was cleaned and recolored with the same tool; its original and prompts are saved as `hamid-signature-v3.png` and `signature-prompts-v3.json`. Manrope and DM Mono are local, licensed fonts; static Manrope instances also keep text weights consistent in Windows WebKit. Browser automation covers Chrome and WebKit, twelve viewport sizes, the About startup app, and native Chrome touch input; real-device Safari has not been tested. All implementation and portrait assets are independent of the reference's source and media.
