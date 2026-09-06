# Next Century Communication — website

Redesign of [nccdatacable.com](https://nccdatacable.com) as a fast, static, single-page site.
No build step, no framework: `index.html`, `styles.css`, `main.js`, `config.js` and an `assets/` folder.
It runs anywhere that serves static files, including GitHub Pages.

Live mockup: https://hyderkhan.github.io/ncc-datacable/

## What's on the page

- Hero with an animated fibre-strand canvas over full-bleed photography
- Thirteen services grouped into NBN, optical fibre, data cabling and troubleshooting
- Interactive "How the NBN reaches you" diagram for FTTP, FTTN, FTTC and HFC
- Three-step booking process, photo gallery of the workmanship standard, six promises, three reviews
- FAQ with structured data (FAQPage) for search results
- Booking form that emails the business and sends the customer a confirmation
- Service-area section over Sydney Harbour, footer with click-to-call
- A signal pulse that runs down the left rail as you scroll and lights each section

SEO: LocalBusiness and FAQPage JSON-LD, Open Graph tags, `robots.txt`, `sitemap.xml`, semantic headings, descriptive alt text.

## Booking emails: five-minute setup

GitHub Pages has no server, so the browser sends the emails through [EmailJS](https://www.emailjs.com) (free tier: 200 emails a month).
Until it's configured, the form runs in **demo mode**: it shows the confirmation screen and previews both emails without sending anything.

1. Create an EmailJS account and add an **Email Service** (Gmail, Outlook or the business mailbox). Note the **Service ID**.
2. Create two **Email Templates**:

   **Template 1: owner notification**
   - To email: `info@nextcc.com.au`
   - Reply to: `{{reply_to}}`
   - Subject: `New booking request {{booking_ref}}: {{service}} in {{suburb}}`
   - Content:
     ```
     New booking request from the website

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

     Reply to this email or call the customer to confirm a time.
     ```

   **Template 2: customer confirmation**
   - To email: `{{reply_to}}`
   - Reply to: `info@nextcc.com.au`
   - Subject: `We've received your booking request ({{booking_ref}})`
   - Content:
     ```
     Hi {{from_name}},

     Thanks for booking with {{business_name}}. We've received your request and will be in touch soon to confirm a time.

     Your reference: {{booking_ref}}

     What you asked for
     Service: {{service}}
     Location: {{suburb}}
     Preferred: {{preferred_date}}, {{preferred_time}}

     What happens next
     We'll call you on {{phone}} to confirm the time and talk through the job, usually the same day. If it's urgent, call us on {{business_phone}}.

     {{business_name}}
     Licensed data cabler and NBN technician, Sydney
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
5. Commit and push. The form now sends both emails on every booking.

Variables available in the templates: `booking_ref`, `submitted_at`, `from_name`, `phone`, `reply_to`, `suburb`, `property_type`, `service`, `nbn_type`, `preferred_date`, `preferred_time`, `message`, `to_email`, `business_name`, `business_phone`, `business_email`.

The EmailJS public key is meant to be visible in the browser. Restrict it to your domain in the EmailJS dashboard (Account, Security) once the site is live.

## Hosting on GitHub Pages

This repo is set up to serve from the `main` branch, root folder. Any push to `main` redeploys within a minute or two.

To use the real domain later:

1. Add a file named `CNAME` at the repo root containing `nccdatacable.com`.
2. At the domain registrar, point `A` records to GitHub's Pages IPs (185.199.108.153, .109.153, .110.153, .111.153) and a `CNAME` for `www` to `hyderkhan.github.io`.
3. In the repo, Settings, Pages, set the custom domain and enable HTTPS.
4. Update the Open Graph URLs in `index.html` to the real domain.

## Before launch: content to confirm

- **Cabler registration number.** The hero and footer say "Registered cabler". Add the registration number and registrar (for example ACRS) once supplied.
- **Photos.** The hero, service blocks and gallery use Unsplash photography (free to use under the [Unsplash licence](https://unsplash.com/license)). Swap in real job photos as they become available; keep the same file names in `assets/` and nothing else changes.
- **Reviews.** The three quotes are from the current site. Link them to Google Business Profile reviews when possible.
- **Opening hours.** Currently "7 days a week" with no times; add them if the business wants to publish them.
- **Suburb list.** Edit the regions in the footer to match where the business actually travels.

## Editing

- Business details: `config.js` (used by the booking form) and the matching text in `index.html`.
- Colours and type: the token block at the top of `styles.css`.
- NBN diagram copy: the `NBN` object near the top of `main.js`.

## Design notes

The concept is the signal path: one fibre rail runs down the left margin from the hero to the booking form, a pulse follows the visitor's scroll, and each section heading is a junction that lights as the pulse passes. Dark sections are the network layer (hero, NBN diagram, booking) and light sections are the customer layer. Type is Barlow Condensed for headings and Barlow for body. Colours come from the existing logo: deep navy and cyan, with orange reserved for the signal pulse and the primary button.

Full spec: `docs/superpowers/specs/2026-09-06-ncc-website-redesign-design.md`.
