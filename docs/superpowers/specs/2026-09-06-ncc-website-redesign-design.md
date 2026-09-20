# Next Century Communication — website redesign (design spec)

Date: 2026-09-06
Status: built 2026-09-06 under the assumptions below (owner away). Mid-build the
owner asked for a more modern, traffic-driving look with strong photography, so
free-licence Unsplash photos were added to the hero, service blocks, gallery and
service-area footer, plus an FAQ and structured data for search.

## Brief

Redesign nccdatacable.com (currently a WordPress.com one-pager) as a static
single-page site that can be hosted on GitHub Pages as a mockup. Business:
Next Century Communication (NCC), licensed data cabler and NBN technician,
Sydney, 7 days a week. Phone 0415 669 617, email info@nextcc.com.au.

Services the site must present (from the owner's brief):

- NBN cabling and installation services
- Wi-Fi and internet speed troubleshooting
- Data rack installation, setup and relocation
- Cat6 & Cat7 Ethernet data cabling
- HFC installation and relocation
- Optical fibre installation and relocation, including NBN NTDs
- NBN technician services for FTTN, FTTP & FTTC
- Fibre installation from the street to the premises
- Internal fibre-optic cabling
- Internal Cat6 & Cat7 data cabling
- HFC coaxial cable installation and relocation
- NBN device installation and relocation
- Network troubleshooting, testing and fault finding

Plus a service booking form that emails the owner and sends the requester a
confirmation that the booking was received.

## Concept: the signal path

The whole page is organised around one line: a fibre strand that runs from the
hero down the left margin of the page, through every section, into the booking
form. A light pulse travels along it as the visitor scrolls, lighting a junction
at each section heading. The hero shows a bundle of fibre strands converging
from the street edge to the premises with light pulses running along them. This
is the single memorable element; everything else stays quiet.

Dark sections are the network layer (hero, NBN technology diagram, booking).
Light sections are the customer layer (services, process, work, reviews).

## Tokens

Colour

| Token         | Hex      | Use                                          |
|---------------|----------|----------------------------------------------|
| navy-900      | #0B1230  | deep ground for dark sections                |
| navy-700      | #141F4B  | raised surfaces on dark (from the logo)      |
| cyan-300      | #7EE7EC  | brand accent, fibre strands, rail on dark    |
| cyan-500      | #22B8CC  | links, rail on light                         |
| signal-orange | #FF7A2F  | the light pulse and the primary button only  |
| mist-100      | #EEF3F8  | light section ground                         |
| ink           | #0F1A3D  | text on light                                |
| ink-muted     | #4B587A  | secondary text on light                      |
| paper         | #E6ECF5  | text on dark                                 |
| paper-muted   | #9AA8C7  | secondary text on dark                       |
| copper        | #C97A3D  | copper segments in the NBN diagram           |
| coax          | #9D8FD6  | coax segments in the NBN diagram             |

Type

- Barlow Condensed 600 for display and headings. Tight, industrial, reads like
  a cable label or van signage.
- Barlow 400/500 for body and UI. Same family, clearly different width.
- Scale: 15, 17, 20, 25, 32, 44, 64, hero clamp(44px, 7.5vw, 104px).
- Body 17px / 1.55, measure under 68ch. Left aligned throughout.

Layout

- 1200px container, left aligned. The fibre rail sits 28px outside the
  container's left edge on desktop, 16px from the viewport edge on mobile.
- Section headings carry a junction dot centred on the rail.
- Services are a patch-panel list in four groups, not a card grid. Each row has
  an LED that lights on hover (link light).
- Numbering appears only in the booking process, which is a real sequence.

Motion budget

1. Page load: hero strands draw in, pulses start (one orchestrated moment).
2. Scroll: rail pulse follows scroll progress; junctions light as it passes.
3. Hover: service row LED lights.
4. NBN tabs: signal re-routes along the diagram.
5. Booking submit: progress, then a confirmation state.

No per-section fade-ins. `prefers-reduced-motion` disables 1, 2 and 4's
animation and shows static states.

## Sections

1. Sticky nav: logo mark and name, anchors, phone, Book a service.
2. Hero: "Licensed data cabler and NBN technician, Sydney" line, display
   headline "From the street to every room.", supporting copy, two buttons,
   link-light row (7 days a week, same-day service, residential and commercial,
   registered cabler).
3. Services: four photo-headed blocks in a bento grid (NBN, Optical fibre,
   Cat6 and Cat7 data cabling, Troubleshooting), each with its service rows and
   a link-light LED per row.
4. How the NBN reaches you: tabs FTTP / FTTN / FTTC / HFC over one SVG diagram
   (exchange, street, premises) whose segments change material, with "what we
   do here" copy per technology.
5. Booking in three steps.
6. What good cabling looks like: six photos (three from the current site,
   three from Unsplash) captioned by the standard they show, not as claimed jobs.
7. Why NCC and reviews: the six promises and three reviews from the current site.
8. Questions we get asked: six FAQs as a native accordion, mirrored in FAQPage
   JSON-LD.
9. Book a service: form (name, email, phone, suburb and postcode, property type,
   service, NBN type, preferred date and time, details). Success state shows a
   booking reference and what happens next.
10. Footer: service-area section over a Sydney Harbour photo with ten regions,
    then contact details and anchor links. The rail ends at the booking section.

## Booking form and email

GitHub Pages has no server, so the browser sends the emails via EmailJS. Two
templates: owner notification and requester confirmation. Configuration lives
in `config.js`. When the keys are empty the form runs in demo mode: it shows the
confirmation state and previews both emails with the submitted details, and
says clearly that no email was sent. Loading the EmailJS SDK happens only when
configured.

Validation is inline. Errors say what to fix. The confirmation state repeats
the phone number in case the requester wants to call instead.

## Revision 2026-09-20: Eastern Suburbs focus and real job photos

Owner feedback: target Sydney's Eastern Suburbs (Randwick, Double Bay, Rose Bay,
Woollahra, Paddington, North Bondi, Bellevue Hill, Bondi, Vaucluse, Coogee,
Maroubra) so search engines read it as the service area; title "NBN & Data
Cabling Eastern Suburbs Sydney | Licensed Data Cabler"; H1 "NBN & Data Cabling
Services in Sydney's Eastern Suburbs" with the slogan "From the street to every
room." kept as the kicker; extra service phrases folded into the service rows,
booking options and structured data; ACMA registration line with the number
supplied via config. Five real job photos replaced the Unsplash gallery. Second pass the same
day: the SEO H1 was too large as display type, so the slogan is the display line
(with a light sweep) and the H1 sits under it at 22 to 32px in cyan. The photos
became polaroids and the reviews handwritten notes (Caveat) pinned to a dark
pegboard: staggered drop-in reveal, straighten and 3D tilt on hover, cursor
spotlight, draggable with a mouse. Service blocks gained a matching tilt and
cyan shine; hero buttons are magnetic. All pointer effects are fine-pointer
only and off under reduced motion. Captions describe what is visible and
never a suburb or a customer. Greater Sydney stays as a secondary line.

## Search and conversion

LocalBusiness JSON-LD with the service catalogue, FAQPage JSON-LD, Open Graph
tags, canonical pointing at nccdatacable.com, robots.txt and sitemap.xml.
Click-to-call in the nav, hero, booking copy and footer; a fixed call-and-book
bar on phones that hides while the booking form is on screen.

## Out of scope

Real email delivery (needs the owner's EmailJS account), licence or
registration number (not published on the current site), pricing, privacy and
terms pages, social links (the current ones are dead placeholders).
