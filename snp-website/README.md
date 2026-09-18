# SNP Consulting — website

Static marketing site for **SNP Consulting (Pty) Ltd** (trading identity of Salt & Pepper
Consulting). No build step, no framework, no dependencies — plain HTML, CSS and JavaScript,
so it can be hosted anywhere that serves files.

```
snp-website/
├── index.html      single-page site
├── styles.css      brand system (monochrome, light + dark)
├── script.js       nav, reveal animations, contact form
├── robots.txt
└── assets/
    ├── snp-mark.svg            vector mark (inherits currentColor)
    ├── favicon.svg
    ├── snp-logo-primary.jpg    supplied SNP lockup
    ├── snp-mark.jpg            supplied mark
    ├── brand-logo-sheet.jpg    supplied brand guide page
    ├── brand-businesscard.jpg  supplied mockup
    └── brand-signage.jpg       supplied mockup
```

## Positioning the copy is written to

- **Audience:** small and mid-market South African businesses — owner-managed and
  owner-adjacent, not enterprise. The copy speaks to owners, finance managers and
  operations managers, not to CIOs or enterprise architects.
- **Offer:** advisory, implementation and consulting. Advisory leads, because the
  differentiator is being willing to say a new system is not warranted.
- **Product-neutral.** No vendor or platform is named or promoted anywhere on the site.
  The systems list is generic by category (ERP, accounting, CRM, POS …) and the sectors
  section states the independence explicitly. If a product of choice is ever to be named,
  it is a deliberate change, not an oversight.
- **Referral positioning:** the About section is built on being the escalation point other
  professionals refer up to — the one an accountant, IT person or vendor calls when a
  problem sits outside what they do.
- **Credibility basis:** combined experience across integration platforms, accounting and
  finance systems, and security solutions. This is the "Where our experience comes from"
  block, and it is the stated reason referrals arrive.

## Run it locally

```bash
cd snp-website
python3 -m http.server 8000
# → http://localhost:8000
```

## Deploy

**GitHub Pages** — Settings → Pages → deploy from branch, `/` root. The site is then at
`<user>.github.io/<repo>/snp-website/`. To serve it from the domain root instead, move the
four files and `assets/` up one level.

**Netlify / Vercel / Cloudflare Pages** — drag the `snp-website` folder in, or point the
project at this directory. No build command, publish directory `snp-website`.

Then point `snpconsulting.co.za` at the host and enable HTTPS.

## Before going live — replace these placeholders

| Where | Placeholder | Needs |
|---|---|---|
| `index.html`, `script.js` (`INBOX`) | `hello@snpconsulting.co.za` | real company inbox |
| `index.html` contact + `tel:` link | `+27 (0)00 000 0000` | real number |
| `index.html` `<link rel="canonical">`, `og:url`, JSON-LD `url`, `robots.txt` | `https://www.snpconsulting.co.za/` | live domain |
| `index.html` About us | director bios | confirm wording with Henry and Andile |
| `index.html` About us | street address is deliberately **city only** | see note below |

### On the contact form

It has no backend. By default it composes a `mailto:` draft from the entered fields, which
works with zero setup but depends on the visitor having a mail client.

For a proper inbox, set `ENDPOINT` at the top of `script.js` to a form handler URL —
[Formspree](https://formspree.io), [Web3Forms](https://web3forms.com) and Netlify Forms all
accept a plain `POST` of the form data. The submit handler already branches on `ENDPOINT`
being non-empty and falls back to `mailto:` on failure.

### On the director bios and experience claims

The bios describe areas of focus (implementation/delivery, advisory/business case). The
experience block names three disciplines: integration platforms, accounting and finance
systems, security solutions.

Neither makes a **specific factual claim** — no years of experience, employers,
certifications, client names or partner statuses — because none of that was supplied and it
should not be invented. If SNP holds a vendor certification or partner status worth
advertising, add it deliberately once it can be evidenced.

### On what is deliberately *not* published

The CIPC and SARS documents supplied contain information that should not go on a public
website. Left off on purpose:

- **Directors' ID numbers** — identity-theft exposure, no business reason to publish.
- **Directors' residential addresses** — the registered office is given as *Edenvale,
  Gauteng* (city only) rather than the full street address, because that address is also a
  director's home.
- **SARS income tax reference number** — supply on request during vendor onboarding, not
  on an indexed page.
- **Personal Gmail addresses** from the registration documents.

What *is* published is standard public-record company information that procurement
departments expect: registered name, registration number, enterprise number, entity status,
and B-BBEE level and certificate number.

### On the directors' photograph

`assets/snp-founders.jpg` is a crop of the supplied photograph, not the original.

The source showed both directors in third-party branded apparel. Rather than publish that
or drop the photo, the image is cropped to the horizontal band between their faces and the
shirt graphics (source y 405–638 of a 900x1600 original), so both men are clearly visible
and no third-party mark appears in frame. It is rendered in greyscale via CSS to sit inside
the monochrome identity.

The figure is capped at `max-width: 790px` — the crop's native width — so it renders sharp
rather than upscaled. That is also its limit: it cannot go full-bleed without going soft. A
purpose-shot photograph would lift this and doubles as a LinkedIn and proposal asset.

### No third-party brand names

This is a standing rule for this site, not a one-off edit. No vendor, platform, employer or
product is named anywhere in the copy, the assets, the metadata or the image content. The
systems list is generic by category and the independence is stated explicitly.

That applies to the founders' career history too: their background is described by the kind
of work and the kind of client, never by employer name. If that ever changes, it should be
a deliberate decision, because naming an employer on a consultancy's own site tells its
prospects where the founders' day jobs are.

## Brand notes

- Monochrome only — the identity has no colour, and the site keeps it that way. Contrast
  comes from inverted sections (`.section-dark`), not accent colour.
- Display type is Poppins (closest widely-available match to the logo's geometric sans),
  body is Inter. Section labels use the wide letter-spacing of the supplied brand sheet.
- The mark is inline SVG using `currentColor`, so it flips automatically on dark sections
  and in dark mode.
- Dark mode follows the OS setting. Force one with `data-theme="light"` or `"dark"` on
  `<html>`.
- Grid column counts are set explicitly per breakpoint rather than with `auto-fit`, so the
  6-, 8- and 3-item grids never leave an orphaned empty cell. Verified clean at 1440, 1280,
  1100, 1000, 900, 860, 800, 700, 560 and 390px.

## Related

The hero links to the **readiness assessment** at the repository root (`../`) as a
lead-generation entry point. If you deploy the site on its own, update or remove that link.
