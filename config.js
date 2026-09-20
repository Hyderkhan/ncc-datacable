/* Site configuration for Next Century Communication.
   Edit the values here; nothing else needs to change. */
window.NCC_CONFIG = {
  business: {
    name: "Next Century Communication",
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

  /* Booking emails are sent from the browser with EmailJS (https://www.emailjs.com).
     Leave these empty and the form runs in demo mode: it shows the confirmation
     screen and previews both emails without sending anything.
     See README.md for the five-minute setup. */
  emailjs: {
    publicKey: "",
    serviceId: "",
    ownerTemplateId: "",
    customerTemplateId: ""
  }
};
