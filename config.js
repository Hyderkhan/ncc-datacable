/* Site configuration for Next Century Communications.
   Edit the values here; nothing else needs to change. */
window.NCC_CONFIG = {
  business: {
    name: "Next Century Communications",
    shortName: "NCC",
    phone: "0415 669 617",
    phoneHref: "tel:+61415669617",
    email: "info@nextcc.com.au",
    hours: "7 days a week",
    area: "Sydney's Eastern Suburbs",
    /* ACMA cabler registration number. Leave empty until supplied; when set it
       is appended wherever the site says "ACMA registered cabler". */
    registration: ""
  },

  /* On WordPress the ncc-site plugin sets window.NCC_CONFIG.endpoint and sends
     the emails itself; nothing here needs filling in.
     For static hosting (GitHub Pages) the form can send from the browser with
     EmailJS (https://www.emailjs.com) instead. Leave these empty and, without
     the plugin, the form runs in demo mode: it shows the confirmation screen and
     previews both emails without sending anything. See README.md.
     These are the EmailJS account's public IDs (meant to be visible in the page);
     the templates are emails/business-notification.html and
     emails/customer-confirmation.html, pasted into EmailJS. */
  emailjs: {
    publicKey: "sAlph9CQ4ce6g7y3R",
    serviceId: "service_d7xx66p",
    ownerTemplateId: "template_3gbo8ij",
    customerTemplateId: "template_6r7e6d2"
  }
};
