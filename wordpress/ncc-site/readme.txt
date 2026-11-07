=== NCC Site and Quote Form ===
Requires at least: 6.0
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPL-2.0-or-later

Serves the Next Century Communications one-page site as the homepage and emails every quote request to the business.

== Description ==

* The homepage shows the NCC one-page site in place of the theme.
* The "Request a quote" form posts to /wp-json/ncc/v1/quote. Each request is emailed to the address under Settings, NCC Site (info@nextcc.com.au by default) with Reply-To set to the customer, and the customer gets a confirmation with a reference number.
* Spam protection: a hidden honeypot field and a per-connection rate limit (8 requests per 10 minutes; filters ncc_site_rate_limit and ncc_site_rate_window).
* Settings, NCC Site has a "Send test email" button to check delivery.

Emails go through wp_mail(). For reliable delivery, install an SMTP plugin such as WP Mail SMTP and connect the business's Google Workspace mailbox.

== Installation ==

1. Plugins, Add New, Upload Plugin, choose ncc-site.zip, Install, Activate.
2. Settings, NCC Site: confirm the recipient and click "Send test email".
3. Visit the homepage and send a test request from the form.
