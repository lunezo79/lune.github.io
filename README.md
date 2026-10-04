# lune.github.io

My personal portfolio — a fast, dependency-free static site hosted on GitHub Pages.

<!-- TODO: Replace the site URL below with your live URL (see the Deployment section for which one applies). -->
**Live site:** https://lunezo79.github.io/lune.github.io/

---

## About

This repository holds the source for my personal portfolio. It is intentionally
built as a plain static site: no framework, no bundler, no build step. Every file
committed here is exactly what the browser downloads, which makes the site fast to
load and trivial to deploy.

The portfolio introduces Lune as a UI designer and 3D modeler, with expandable
2D and 3D project case studies, partner credits, social links, and live Discord
presence.

## Features

- Fully static — the repo contents *are* the deployed artifact
- Zero runtime dependencies and no build pipeline
- Responsive layout that works from small phones up to wide desktops
- Accessible markup (semantic HTML, keyboard-navigable, readable contrast)
- Hash-addressable page views keep the home, About, portfolio, and partners separate
- Expandable project cards for detailed 2D and 3D case studies
- Sliding render and wireframe gallery for the traffic cone model
- Matching black-and-purple social icons and quick animated page transitions
- Live Discord status and activity through the public Lanyard API
- Deployed automatically on every push to `main` via GitHub Pages
- Plain CSS with custom properties for theming and easy customization

## Tech Stack

| Layer | Choice | Why |
| --- | --- | --- |
| Markup | HTML5 | Native to GitHub Pages, no compilation |
| Styling | CSS3 (custom properties, Flexbox, Grid) | No preprocessor or build step required |
| Behaviour | Vanilla JavaScript (ES modules) | Keeps the payload tiny and avoids tooling |
| Hosting | GitHub Pages | Free, HTTPS, deploys straight from the repo |
| Tooling | None required | Optional: any static file server for local preview |

There is deliberately no `package.json`, no `node_modules`, and no CI beyond the
GitHub Pages publisher. If the project grows to need templating or a CSS
preprocessor, that decision should be revisited rather than assumed.

## Project Structure

The current layout is:

```
lune.github.io/
├── index.html          # Intro, socials, portfolio, partners, and contact
├── css/
│   ├── tokens.css      # Theme custom properties
│   ├── base.css        # Layout and shared primitives
│   ├── components.css  # Navigation, buttons, and footer
│   └── sections.css    # Page sections and responsive layouts
├── js/
│   ├── main.js         # Initializes page behavior
│   ├── discord.js      # Live Discord presence
│   ├── galleries.js    # Keyboard-accessible sliding model galleries
│   └── nav.js          # Navigation and scroll behavior
├── assets/
│   ├── images/         # Portfolio artwork
│   └── icons/          # SVG icons and favicon
└── README.md
```

The site is static and has no build step. Discord presence is fetched from
Lanyard; if the service is unavailable, the rest of the page remains usable.

## Getting Started

### Prerequisites

- [Git](https://git-scm.com/downloads)
- A modern browser
- *Optional:* Python 3 or Node.js, used only to serve files locally

### Clone

```bash
git clone https://github.com/lunezo79/lune.github.io.git
cd lune.github.io
```

### Run locally

Opening `index.html` directly works, but a local server is preferred so that
relative paths and ES modules behave exactly as they do in production.

With Python 3:

```bash
python -m http.server 8000
```

With Node.js:

```bash
npx serve .
```

Then visit http://localhost:8000.

## Development

Because there is no build step, the workflow is simply:

1. Edit the HTML, CSS, or JS files directly.
2. Reload the browser to see the change.
3. Commit and push to `main` — GitHub Pages redeploys automatically.

Conventions used in this repository:

- Semantic HTML elements over generic `div` soup
- CSS custom properties declared once on `:root` and reused everywhere
- Small, focused files — styles and scripts are split by responsibility
- Descriptive class names (`site-header`, `project-card`), no presentational
  names (`red-box`, `left-col`)
- Progressive enhancement: the site must remain readable and navigable with
  JavaScript disabled

## Deployment

Deployment is handled by GitHub Pages and requires no manual upload.

1. Push your changes:

   ```bash
   git add .
   git commit -m "Describe the change"
   git push origin main
   ```

2. In the repository, go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to *Deploy from a branch*.
4. Select branch `main` and folder `/ (root)`, then save.
5. Wait for the Actions run to complete — the URL appears at the top of the
   Pages settings screen.

### Which URL will the site get?

GitHub decides this purely from the repository **name** and **owner**:

| Repository | Owner | Resulting URL | Type |
| --- | --- | --- | --- |
| `lunezo79.github.io` | `lunezo79` | `https://lunezo79.github.io/` | User site |
| `lune.github.io` | `lunezo79` | `https://lunezo79.github.io/lune.github.io/` | Project site |

This repository is currently named `lune.github.io` while the owner is
`lunezo79`, so it publishes as a **project site**. To get the cleaner
`https://lunezo79.github.io/` root URL, rename the repository to
`lunezo79.github.io` (Settings → General → Repository name) and re-check the
Pages settings.

If you use a custom domain, add a `CNAME` file containing the bare domain at the
repository root and configure it under **Settings → Pages → Custom domain**.

## Customization

Personal content lives in `index.html`. Update these areas as work and links are
ready:

- [ ] Replace the starter content in the expandable 2D and 3D project cards
- [ ] Add Telegram and Roblox profile links
- [ ] Add partner names and collaboration descriptions
- [ ] Add any additional content to the More about me section
- [ ] Change accent colours in `css/tokens.css`
- [ ] Replace the favicon in `assets/icons/`
- [ ] Update the live-site URL at the top of this README

## Roadmap

- [ ] Add finished 2D and 3D portfolio projects
- [ ] Add Telegram and Roblox profile URLs
- [ ] Add an Open Graph preview image

## Contributing

This is a personal portfolio, so it is not generally open to outside
contributions. Issues pointing out accessibility problems, broken links, or
typos are welcome.

## License

<!-- TODO: Choose a licence. MIT is a permissive default; if you want to reserve
     all rights on the design and content, delete this section instead. -->

Released under the [MIT License](https://opensource.org/licenses/MIT). The
written content, images, and personal branding in this repository remain the
property of the site owner.

## Contact

- GitHub: [@lunezo79](https://github.com/lunezo79)
- Discord: [Lune](https://discord.com/users/762121502698242054)
- Website: *(add your live site URL here)*
