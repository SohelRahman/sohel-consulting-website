# Sohel Rahman — Consulting Website

Static HTML/CSS/JavaScript website for Cloudflare Pages.

## Pages
- `index.html` — Home
- `services.html` — SAP MM/S/4HANA, procurement, ERP project management and training
- `case-studies.html` — Experience summaries with unconfirmed details clearly marked
- `about.html` — Profile, credentials and education
- `contact.html` — Contact details and inquiry form placeholder
- `assets/site.css` and `assets/site.js` — Responsive styling and navigation

## Deploy to Cloudflare Pages
1. In Cloudflare, open **Workers & Pages → Create → Pages → Connect to Git**.
2. Connect GitHub and select `SohelRahman/sohel-consulting-website`.
3. Set production branch to `main`.
4. Framework preset: **None**.
5. Build command: leave blank.
6. Build output directory: `.` (repository root).
7. Deploy.

## Before public launch
- Replace the Formspree placeholder in `contact.html` with a real form endpoint and test delivery.
- Replace the Calendly placeholder with the actual booking link.
- Add the correct LinkedIn profile URL.
- Confirm biography, degree titles, career timeline and case-study details.
- Keep client names and performance figures unpublished until approved.
- Add a custom domain, sitemap, robots.txt and analytics after the domain is finalised.

The site is static; it does not require PHP, WordPress or a build step.