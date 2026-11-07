# Next Century Communications — website

Redesign of [nccdatacable.com](https://nccdatacable.com) as a fast, static, single-page site.
No build step, no framework: `index.html`, `styles.css`, `main.js`, `config.js` and an `assets/` folder.
It runs anywhere that serves static files, including GitHub Pages.

Live mockup: https://hyderkhan.github.io/ncc-datacable/

## What's on the page

The page runs in one focused order: main message, services, why choose NCC, areas, reviews, FAQ, then call or request a quote. Each fact appears once; the suburb list lives only in the Areas section.

1. **Main message.** Hero with an animated fibre-strand canvas over full-bleed photography, a light pulse sweeping through the slogan, parallax on the photo and magnetic buttons. The SEO H1 sits beneath the slogan. Buttons: "Request a quote" and "Call 0415 669 617".
2. **Services.** Four cards (NBN, optical fibre, Cat6/Cat6A data cabling, NBN fault finding and Wi-Fi) written around the owner's search terms: NBN fibre installation from the street to the house, NTD installation and relocation, Ethernet cable installation, data points, NBN fault finding. Underneath, a fold-out "How NCC gets you connected" card opens the interactive FTTP, FTTN, FTTC and HFC diagram.
3. **Why choose NCC.** Six promises beside a photo.
4. **Areas.** "Servicing Sydney's Eastern Suburbs" over Sydney Harbour, naming the eleven suburbs (no Greater Sydney claim, by the owner's request).
5. **Reviews.** A pinboard of five real job photos as polaroids with the three reviews as handwritten notes (drop-in reveal, 3D tilt, cursor spotlight, draggable on desktop).
6. **FAQ** with FAQPage structured data, led by "My NBN isn't working. Should I call you or my internet provider?" and "How much does it cost?".
7. **Call or request a quote.** A large click-to-call card ("Call a licensed data cabler, 0415 669 617"), the three steps of what happens next, and the quote request form that emails the business and sends the customer a confirmation.

The footer carries click-to-call, email and an independence line about NBN Co. A signal pulse runs down the left rail as you scroll and lights each section. On phones a bar pinned to the bottom of the screen keeps "Call now" and "Request a quote" one tap away until the quote section is in view.

SEO: title and H1 targeted at "NBN & Data Cabling" plus "Sydney's Eastern Suburbs", LocalBusiness JSON-LD with `areaServed` listing each suburb, FAQPage JSON-LD, Open Graph tags, `robots.txt`, `sitemap.xml`, semantic headings, descriptive alt text.

## Deploying to WordPress (sends the quote emails)

The `wordpress/` folder packages this site as a WordPress plugin, **NCC Site and Quote Form** (`ncc-site`). It shows the page as the homepage and sends every quote request to **info@nextcc.com.au** through WordPress itself: no EmailJS account, no keys, no monthly cap.

**Plan requirement.** nccdatacable.com is currently a WordPress.com site on a plan without plugins (checked 7 Nov 2026: a "Simple" site, not plugin-enabled). Uploading a plugin, and running the page's JavaScript, needs a WordPress.com plan that allows plugins (Business or higher) or any self-hosted WordPress.

1. Build the plugin: `bash wordpress/build.sh` creates `dist/ncc-site.zip`.
2. In WordPress: Plugins, Add New, Upload Plugin, choose `ncc-site.zip`, Install, Activate.
3. Settings, NCC Site: check that "Send quote requests to" says `info@nextcc.com.au`, click **Send test email**, and look for it in that inbox (and in spam).
4. Open the homepage and send a test request from the form.

To update the site later, rebuild the zip and upload it again; WordPress offers "Replace current with uploaded".

**What happens on submit.** The form posts to `/wp-json/ncc/v1/quote`. The plugin checks the fields, emails the request to the address in Settings with Reply-To set to the customer (so replying goes straight to them), and emails the customer a confirmation with their reference number. A hidden honeypot field and a per-connection rate limit (8 requests per 10 minutes) keep bots out. Nothing in `config.js` needs filling in.

**Getting the emails delivered.** WordPress sends from its own address, which Gmail can treat as suspicious. For reliable delivery:

- Install **WP Mail SMTP** (or FluentSMTP) and connect it to the `info@nextcc.com.au` Google Workspace mailbox. The form then sends from that mailbox with no change to the plugin.
- `nextcc.com.au` has no SPF or DMARC record (checked 7 Nov 2026). In the domain's DNS add a TXT record `v=spf1 include:_spf.google.com ~all`, and a DMARC record such as `_dmarc` TXT `v=DMARC1; p=none; rua=mailto:info@nextcc.com.au`. This helps all of the business's email, not only the website's.

## Static hosting only: EmailJS setup

Skip this on WordPress; the plugin sends the emails.

GitHub Pages has no server, so the browser sends the emails through [EmailJS](https://www.emailjs.com) (free tier: 200 emails a month).
Until it's configured, the form runs in **demo mode**: it shows the confirmation screen and previews both emails without sending anything.

1. Create an EmailJS account and add an **Email Service** (Gmail, Outlook or the business mailbox). Note the **Service ID**.
2. Create two **Email Templates**:

   **Template 1: owner notification**
   - To email: `info@nextcc.com.au`
   - Reply to: `{{reply_to}}`
   - Subject: `New quote request {{booking_ref}}: {{service}} in {{suburb}}`
   - Content:
     ```
     New quote request from the website

     Reference: {{booking_ref}}
     Received: {{submitted_at}}

     Customer
     Name: {{from_name}}
     Phone: {{phone}}
     Email: {{reply_to}}

     Job
     Service: {{service}}
     Property: {{property_type}}
     Location: {{suburb}}
     NBN connection: {{nbn_type}}
     Preferred: {{preferred_date}}, {{preferred_time}}

     Details
     {{message}}

     Call the customer back with a price and to confirm a time.
     ```

   **Template 2: customer confirmation**
   - To email: `{{reply_to}}`
   - Reply to: `info@nextcc.com.au`
   - Subject: `We've received your quote request ({{booking_ref}})`
   - Content:
     ```
     Hi {{from_name}},

     Thanks for contacting {{business_name}}. We've received your quote request and will call you soon.

     Your reference: {{booking_ref}}

     What you asked for
     Service: {{service}}
     Location: {{suburb}}
     Preferred: {{preferred_date}}, {{preferred_time}}

     What happens next
     We'll call you on {{phone}} to talk through the job, give you a price and confirm a time, usually the same day. If it's urgent, call us on {{business_phone}}.

     {{business_name}}
     Licensed data cabler and NBN technician, Sydney's Eastern Suburbs
     {{business_phone}}
     {{business_email}}
     ```
3. In EmailJS, open **Account** and copy the **Public Key**.
4. Paste the four values into `config.js`:
   ```js
   emailjs: {
     publicKey: "your_public_key",
     serviceId: "service_xxxxxxx",
     ownerTemplateId: "template_xxxxxxx",
     customerTemplateId: "template_xxxxxxx"
   }
   ```
5. Commit and push. The form now sends both emails on every quote request.

Variables available in the templates: `booking_ref`, `submitted_at`, `from_name`, `phone`, `reply_to`, `suburb`, `property_type`, `service`, `nbn_type`, `preferred_date`, `preferred_time`, `message`, `to_email`, `business_name`, `business_phone`, `business_email`.

The EmailJS public key is meant to be visible in the browser. Restrict it to your domain in the EmailJS dashboard (Account, Security) once the site is live.

## Hosting on GitHub Pages (preview)

The GitHub Pages copy is the preview mockup; the production site goes on WordPress (see above). This repo is set up to serve from the `main` branch, root folder. Any push to `main` redeploys within a minute or two.

To use the real domain later:

1. Add a file named `CNAME` at the repo root containing `nccdatacable.com`.
2. At the domain registrar, point `A` records to GitHub's Pages IPs (185.199.108.153, .109.153, .110.153, .111.153) and a `CNAME` for `www` to `hyderkhan.github.io`.
3. In the repo, Settings, Pages, set the custom domain and enable HTTPS.
4. Update the Open Graph URLs in `index.html` to the real domain.

## Before launch: content to confirm

- **Cabler registration number.** The site says "ACMA registered cabler" in the hero, the promises and the footer. Put the number in `config.js` under `business.registration` and every mention becomes "ACMA registered cabler No. XXXXX" automatically.
- **Photos.** The five photos in the "Recent jobs" strip are the business's own (cropped to remove the GPS-camera watermark). The hero and the four service blocks still use Unsplash photography (free under the [Unsplash licence](https://unsplash.com/license)); replace those as real photos come in by keeping the same file names in `assets/`.
- **Reviews.** The three quotes are from the current site. Link them to Google Business Profile reviews when possible.
- **Opening hours.** Currently "7 days a week" with no times; add them if the business wants to publish them.
- **Suburb list.** The Areas section and the structured data (`areaServed` in `index.html`) name Randwick, Coogee, Maroubra, Bondi, North Bondi, Bellevue Hill, Double Bay, Rose Bay, Woollahra, Paddington and Vaucluse. Edit both places together if the list changes.
- **Logo artwork.** The logo images in `assets/` (`logo-96.png`, `logo-192.png`, `logo-512.png`, `favicon-64.png`) still spell "Next Century Communication" around the ring. The text on the site says "Communications"; the artwork needs a new export with the "s".

## Wording rules from the owner

- Cat6 and Cat6A only. Never Cat7.
- Eastern Suburbs only. No Greater Sydney or Sydney-wide claims.
- The business name is Next Century Communications, with the "s".
- NCC is a private company: headings say NCC, buttons say "Request a quote" or "Call", never "NBN job", and the footer states it is not affiliated with NBN Co.
- The apartment-block photo shows fibre distribution, not HFC.

## Editing

- Business details and the ACMA registration number: `config.js` (used by the booking form and the registration line) and the matching text in `index.html`.
- Colours and type: the token block at the top of `styles.css`.
- NBN diagram copy: the `NBN` object near the top of `main.js`.
- After changing `styles.css`, `main.js` or `config.js`, bump the `?v=` number on their links at the top and bottom of `index.html` so visitors' browsers fetch the new files instead of a cached copy (GitHub Pages caches them for 10 minutes). The WordPress plugin versions them automatically.

## Design notes

The concept is the signal path: one fibre rail runs down the left margin from the hero to the booking form, a pulse follows the visitor's scroll, and each section heading is a junction that lights as the pulse passes. Dark sections are the network layer (hero, the NBN diagram card, the service area, the quote section) and light sections are the customer layer. Type is Barlow Condensed for headings and Barlow for body. Colours come from the existing logo: deep navy and cyan, with orange reserved for the signal pulse and the primary button.

Full spec: `docs/superpowers/specs/2026-09-06-ncc-website-redesign-design.md`.
