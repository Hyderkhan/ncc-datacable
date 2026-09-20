/* Next Century Communication — site behaviour
   1. Navigation (scroll state, mobile menu)
   2. Hero fibre canvas
   3. Signal rail: pulse follows scroll, lights junctions
   4. NBN technology tabs and diagram
   5. Booking form: validation, EmailJS (owner + requester) or demo mode
   6. Mobile call bar
*/
(function () {
  "use strict";

  const CONFIG = window.NCC_CONFIG || {};
  const BIZ = CONFIG.business || {};
  const EJ = CONFIG.emailjs || {};
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  /* ---------------- 1. Navigation ---------------- */
  function initNav() {
    const nav = $(".nav");
    const toggle = $(".nav-toggle");
    const links = $("#nav-links");
    if (!nav) return;

    const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    if (toggle && links) {
      const setOpen = (open) => {
        nav.classList.toggle("is-open", open);
        toggle.setAttribute("aria-expanded", String(open));
        document.body.style.overflow = open ? "hidden" : "";
      };
      toggle.addEventListener("click", () => setOpen(!nav.classList.contains("is-open")));
      links.addEventListener("click", (e) => { if (e.target.closest("a")) setOpen(false); });
      document.addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });
      window.matchMedia("(min-width: 1024px)").addEventListener("change", (e) => { if (e.matches) setOpen(false); });
    }
  }

  /* ---------------- 2. Hero fibre canvas ---------------- */
  function initHero() {
    const hero = $(".hero");
    const canvas = $(".hero-canvas");
    if (!hero || !canvas) return;
    const ctx = canvas.getContext("2d");
    const STRANDS = 44;
    let w = 0, h = 0, strands = [], focal = { x: 0, y: 0 };
    const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
    const start = performance.now();
    let running = true, raf = 0;

    const rnd = (a, b) => a + Math.random() * (b - a);
    const bez = (p0, p1, p2, p3, t) => {
      const mt = 1 - t;
      return {
        x: mt * mt * mt * p0.x + 3 * mt * mt * t * p1.x + 3 * mt * t * t * p2.x + t * t * t * p3.x,
        y: mt * mt * mt * p0.y + 3 * mt * mt * t * p1.y + 3 * mt * t * t * p2.y + t * t * t * p3.y
      };
    };

    function build() {
      const rect = hero.getBoundingClientRect();
      w = Math.max(1, rect.width); h = Math.max(1, rect.height);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      canvas.style.width = w + "px"; canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const mobile = w < 760;
      focal = { x: mobile ? w * 0.84 : w * 0.74, y: mobile ? h * 0.32 : h * 0.5 };
      strands = [];
      for (let i = 0; i < STRANDS; i++) {
        const y0 = h * (0.04 + 0.92 * (i / (STRANDS - 1))) + rnd(-h * 0.02, h * 0.02);
        const p0 = { x: -40, y: y0 };
        const p1 = { x: w * rnd(0.22, 0.45), y: y0 + rnd(-h * 0.12, h * 0.12) };
        const p2 = { x: focal.x - w * rnd(0.1, 0.3), y: focal.y + rnd(-h * 0.08, h * 0.08) };
        const p3 = { x: focal.x + rnd(-8, 8), y: focal.y + rnd(-8, 8) };
        const pts = [];
        const S = 72;
        for (let k = 0; k <= S; k++) pts.push(bez(p0, p1, p2, p3, k / S));
        strands.push({
          pts,
          alpha: rnd(0.14, 0.34),
          width: rnd(0.9, 2.0),
          t: Math.random(),
          speed: rnd(0.0022, 0.0052) * (mobile ? 0.8 : 1),
          len: Math.floor(rnd(5, 9))
        });
      }
    }

    function draw(now) {
      const elapsed = (now - start) / 1000;
      const reveal = reduceMotion ? 1 : Math.min(1, elapsed / 1.6);
      const e = 1 - Math.pow(1 - reveal, 3);
      ctx.clearRect(0, 0, w, h);

      mouse.x += (mouse.tx - mouse.x) * 0.05;
      mouse.y += (mouse.ty - mouse.y) * 0.05;
      const ox = (mouse.x - 0.5) * 18, oy = (mouse.y - 0.5) * 12;
      ctx.save();
      ctx.translate(ox, oy);

      // strands
      ctx.lineCap = "round";
      for (const s of strands) {
        const n = Math.max(2, Math.floor(s.pts.length * e));
        ctx.beginPath();
        ctx.moveTo(s.pts[0].x, s.pts[0].y);
        for (let k = 1; k < n; k++) ctx.lineTo(s.pts[k].x, s.pts[k].y);
        ctx.strokeStyle = "rgba(126,231,236," + s.alpha + ")";
        ctx.lineWidth = s.width;
        ctx.stroke();
      }

      // focal glow
      const r = Math.max(w, h) * 0.22;
      const g = ctx.createRadialGradient(focal.x, focal.y, 0, focal.x, focal.y, r);
      g.addColorStop(0, "rgba(160,240,245," + (0.42 * e) + ")");
      g.addColorStop(0.3, "rgba(34,184,204," + (0.14 * e) + ")");
      g.addColorStop(1, "rgba(11,18,48,0)");
      ctx.fillStyle = g;
      ctx.fillRect(focal.x - r, focal.y - r, r * 2, r * 2);
      ctx.beginPath();
      ctx.arc(focal.x, focal.y, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(230,252,255," + (0.95 * e) + ")";
      ctx.fill();

      // pulses
      if (reveal >= 1 && !reduceMotion) {
        for (const s of strands) {
          s.t += s.speed;
          if (s.t > 1.08) s.t = -rnd(0, 0.7);
          const idx = Math.floor(s.t * (s.pts.length - 1));
          if (idx < 1) continue;
          const from = Math.max(0, idx - s.len), to = Math.min(s.pts.length - 1, idx);
          if (to <= from) continue;
          const grad = ctx.createLinearGradient(s.pts[from].x, s.pts[from].y, s.pts[to].x, s.pts[to].y);
          grad.addColorStop(0, "rgba(207,250,255,0)");
          grad.addColorStop(1, "rgba(235,253,255,0.95)");
          ctx.beginPath();
          ctx.moveTo(s.pts[from].x, s.pts[from].y);
          for (let k = from + 1; k <= to; k++) ctx.lineTo(s.pts[k].x, s.pts[k].y);
          ctx.strokeStyle = grad;
          ctx.lineWidth = s.width + 1.6;
          ctx.shadowColor = "rgba(126,231,236,0.9)";
          ctx.shadowBlur = 14;
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
      }
      ctx.restore();
    }

    function loop(now) {
      if (!running) return;
      draw(now);
      raf = requestAnimationFrame(loop);
    }

    function startLoop() {
      if (reduceMotion) { draw(performance.now()); return; }
      cancelAnimationFrame(raf);
      running = true;
      raf = requestAnimationFrame(loop);
    }
    function stopLoop() { running = false; cancelAnimationFrame(raf); }

    build();
    startLoop();

    let resizeTimer = 0;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => { build(); if (reduceMotion) draw(performance.now()); }, 120);
    });
    hero.addEventListener("pointermove", (e) => {
      const rect = hero.getBoundingClientRect();
      mouse.tx = (e.clientX - rect.left) / rect.width;
      mouse.ty = (e.clientY - rect.top) / rect.height;
    });
    if ("IntersectionObserver" in window && !reduceMotion) {
      new IntersectionObserver((entries) => {
        entries.forEach((en) => (en.isIntersecting ? startLoop() : stopLoop()));
      }, { threshold: 0.02 }).observe(hero);
    }
    document.addEventListener("visibilitychange", () => {
      if (reduceMotion) return;
      document.hidden ? stopLoop() : startLoop();
    });
  }

  /* ---------------- 3. Signal rail ---------------- */
  function initRail() {
    const main = $("#main");
    const pulse = $(".rail-pulse");
    const endEl = $("#book");
    if (!main || !pulse || !endEl) return;
    const junctions = $$(".junction");
    let mainTop = 0, railEnd = 0, jTops = [];

    function measure() {
      mainTop = main.getBoundingClientRect().top + window.scrollY;
      railEnd = endEl.getBoundingClientRect().bottom + window.scrollY - mainTop;
      jTops = junctions.map((j) => j.getBoundingClientRect().top + window.scrollY - mainTop + 7);
      update();
    }
    function update() {
      const vh = window.innerHeight;
      const sy = Math.max(0, window.scrollY - mainTop);
      const maxScroll = railEnd - vh;
      const t = maxScroll > 0 ? Math.min(1, Math.max(0, sy / maxScroll)) : 1;
      const startOffset = jTops.length ? Math.min(jTops[0], vh * 0.4) : vh * 0.22;
      let y = sy + startOffset + (vh * 0.78 - startOffset) * t;
      y = Math.max(8, Math.min(y, railEnd - 8));
      pulse.style.transform = "translateY(" + y.toFixed(1) + "px)";
      for (let i = 0; i < junctions.length; i++) junctions[i].classList.toggle("is-lit", jTops[i] <= y);
    }

    let ticking = false;
    window.addEventListener("scroll", () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { update(); ticking = false; });
    }, { passive: true });
    window.addEventListener("resize", measure);
    window.addEventListener("load", measure);
    if ("ResizeObserver" in window) new ResizeObserver(measure).observe(main);
    measure();
  }

  /* ---------------- 4. NBN tabs ---------------- */
  const NBN = {
    fttp: {
      name: "Fibre to the Premises", mid: "pit", midLabel: "Street pit", matA: "fibre", matB: "fibre", device: "NTD",
      desc: "Fibre runs from the exchange, through the pit outside and straight into an NBN network termination device (NTD) inside your home or office. Nothing between you and the exchange but glass.",
      work: "Lead-in fibre from the pit to the wall, NTD installation and relocation, and internal fibre or Cat6 runs from the NTD to where you actually use the internet."
    },
    fttn: {
      name: "Fibre to the Node", mid: "cabinet", midLabel: "Node cabinet", matA: "fibre", matB: "copper", device: "VDSL modem",
      desc: "Fibre stops at a node cabinet on your street. From there the old copper phone line carries the connection to your first socket and a VDSL modem. Speed depends on the length and condition of that copper.",
      work: "Fault finding on the copper run, moving or replacing the first socket, and Cat6 from the modem to every room so Wi-Fi isn't doing all the work."
    },
    fttc: {
      name: "Fibre to the Curb", mid: "pit", midLabel: "Street pit with DPU", matA: "fibre", matB: "copper", device: "NCD",
      desc: "Fibre reaches a distribution point unit in the pit outside your place. A short copper lead-in then carries it to an NBN connection device (NCD) inside, which also powers the unit in the pit.",
      work: "NCD installation and relocation, copper lead-in repairs, and getting the internal cabling ready for a full FTTP upgrade."
    },
    hfc: {
      name: "Hybrid Fibre Coaxial", mid: "tap", midLabel: "Street tap", matA: "fibre", matB: "coax", device: "Connection box",
      desc: "Fibre reaches a node in your area, then coaxial cable, the old pay-TV network, runs from the street tap to an NBN connection box inside.",
      work: "Coax installation, relocation and re-termination, moving the connection box to a better spot, and Cat6 from the modem onwards."
    }
  };
  const MAT_LABEL = { fibre: "Fibre", copper: "Copper", coax: "Coax" };

  function initNbn() {
    const tabs = $$(".tabs [role=tab]");
    const svg = $(".nbn-svg");
    if (!tabs.length || !svg) return;
    const segA = $("#segA"), segB = $("#segB"), flowA = $("#flowA"), flowB = $("#flowB");
    const lblA = $("#lblA"), lblB = $("#lblB"), lblMid = $("#lblMid"), lblDevice = $("#lblDevice");
    const title = $("#nbn-title-text"), desc = $("#nbn-desc"), work = $("#nbn-work"), panel = $("#panel-nbn");

    function select(key, focus) {
      const d = NBN[key];
      if (!d) return;
      tabs.forEach((t) => {
        const on = t.dataset.tech === key;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        if (on) { panel.setAttribute("aria-labelledby", t.id); if (focus) t.focus(); }
      });
      svg.dataset.mid = d.mid;
      segA.dataset.mat = d.matA; segB.dataset.mat = d.matB;
      flowA.dataset.speed = d.matA === "fibre" ? "fast" : "slow";
      flowB.dataset.speed = d.matB === "fibre" ? "fast" : "slow";
      lblA.textContent = MAT_LABEL[d.matA]; lblB.textContent = MAT_LABEL[d.matB];
      lblMid.textContent = d.midLabel; lblDevice.textContent = d.device;
      title.textContent = d.name; desc.textContent = d.desc; work.textContent = d.work;
    }

    tabs.forEach((t, i) => {
      t.addEventListener("click", () => select(t.dataset.tech, false));
      t.addEventListener("keydown", (e) => {
        let n = null;
        if (e.key === "ArrowRight") n = (i + 1) % tabs.length;
        if (e.key === "ArrowLeft") n = (i - 1 + tabs.length) % tabs.length;
        if (e.key === "Home") n = 0;
        if (e.key === "End") n = tabs.length - 1;
        if (n !== null) { e.preventDefault(); select(tabs[n].dataset.tech, true); }
      });
    });
    select("fttp", false);
  }

  /* ---------------- 5. Booking form ---------------- */
  const OWNER_SUBJECT = "New booking request {{booking_ref}}: {{service}} in {{suburb}}";
  const OWNER_BODY =
`New booking request from the website

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

Reply to this email or call the customer to confirm a time.`;

  const CUSTOMER_SUBJECT = "We've received your booking request ({{booking_ref}})";
  const CUSTOMER_BODY =
`Hi {{from_name}},

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
{{business_email}}`;

  const fill = (tpl, p) => tpl.replace(/{{\s*(\w+)\s*}}/g, (_, k) => (p[k] == null || p[k] === "" ? "" : String(p[k])));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function emailConfigured() {
    return Boolean(EJ.publicKey && EJ.serviceId && EJ.ownerTemplateId && EJ.customerTemplateId);
  }
  function loadEmailJs() {
    return new Promise((resolve, reject) => {
      if (window.emailjs) return resolve(window.emailjs);
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js";
      s.onload = () => resolve(window.emailjs);
      s.onerror = () => reject(new Error("The email service could not be loaded."));
      document.head.appendChild(s);
    });
  }
  async function sendBookingEmails(params) {
    const emailjs = await loadEmailJs();
    emailjs.init({ publicKey: EJ.publicKey });
    await emailjs.send(EJ.serviceId, EJ.ownerTemplateId, params);
    let customerSent = true;
    try { await emailjs.send(EJ.serviceId, EJ.customerTemplateId, params); }
    catch (err) { customerSent = false; console.warn("Customer confirmation failed", err); }
    return { customerSent };
  }

  const makeRef = () => "NCC-" + (Date.now().toString(36).slice(-4) + Math.random().toString(36).slice(2, 4)).toUpperCase();
  const fmtDate = (v) => {
    if (!v) return "Any date";
    const d = new Date(v + "T00:00:00");
    return isNaN(d) ? v : d.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  };
  const fmtNow = () => new Date().toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" });

  function initBooking() {
    const form = $("#booking-form");
    const success = $("#booking-success");
    if (!form || !success) return;
    const status = $("#form-status");
    const submitBtn = form.querySelector("[type=submit]");
    const submitLabel = submitBtn.innerHTML;
    const dateInput = form.elements.preferred_date;
    if (dateInput) dateInput.min = new Date().toISOString().slice(0, 10);

    function fieldWrap(el) { return el.closest(".field"); }
    function setError(el, msg) {
      const wrap = fieldWrap(el);
      if (!wrap) return;
      let err = wrap.querySelector(".field-error");
      if (!err) { err = document.createElement("p"); err.className = "field-error"; wrap.appendChild(err); }
      err.textContent = msg || "";
      wrap.classList.toggle("is-invalid", Boolean(msg));
      if (msg) { el.setAttribute("aria-invalid", "true"); err.id = err.id || el.id + "-error"; el.setAttribute("aria-describedby", err.id); }
      else { el.removeAttribute("aria-invalid"); el.removeAttribute("aria-describedby"); }
    }
    function validate() {
      let first = null;
      const check = (el, ok, msg) => { setError(el, ok ? "" : msg); if (!ok && !first) first = el; };
      const f = form.elements;
      check(f.from_name, f.from_name.value.trim().length >= 2, "Enter your name so we know who to call.");
      check(f.phone, f.phone.value.replace(/\D/g, "").length >= 8, "Enter a phone number we can reach you on.");
      check(f.reply_to, /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.reply_to.value.trim()), "Enter an email address for your confirmation.");
      check(f.suburb, f.suburb.value.trim().length >= 3, "Enter the suburb or postcode of the job.");
      check(f.service, Boolean(f.service.value), "Choose the service you need.");
      if (first) first.focus();
      return !first;
    }
    form.addEventListener("input", (e) => {
      const el = e.target;
      if (el.closest(".field.is-invalid")) setError(el, "");
    });

    function collect() {
      const f = form.elements;
      return {
        booking_ref: makeRef(),
        submitted_at: fmtNow(),
        from_name: f.from_name.value.trim(),
        phone: f.phone.value.trim(),
        reply_to: f.reply_to.value.trim(),
        suburb: f.suburb.value.trim(),
        property_type: form.querySelector("[name=property_type]:checked").value,
        service: f.service.value,
        nbn_type: f.nbn_type.value,
        preferred_date: fmtDate(f.preferred_date.value),
        preferred_time: f.preferred_time.value,
        message: f.message.value.trim() || "No extra details given.",
        to_email: BIZ.email || "",
        business_name: BIZ.name || "Next Century Communication",
        business_phone: BIZ.phone || "",
        business_email: BIZ.email || ""
      };
    }

    function renderSuccess(p, mode, customerSent) {
      const phone = esc(BIZ.phone || "");
      const phoneHref = esc(BIZ.phoneHref || "#");
      let html = `
        <div class="success">
          <h3>Booking request received</h3>
          <span class="ref">Reference ${esc(p.booking_ref)}</span>
          <dl class="summary">
            <div><dt>Service</dt><dd>${esc(p.service)}</dd></div>
            <div><dt>Where</dt><dd>${esc(p.suburb)}, ${esc(p.property_type.toLowerCase())}</dd></div>
            <div><dt>When</dt><dd>${esc(p.preferred_date)}, ${esc(p.preferred_time.toLowerCase())}</dd></div>
          </dl>
          <p class="next">Thanks ${esc(p.from_name.split(" ")[0])}. We'll call you on ${esc(p.phone)} to confirm the time, usually the same day.${customerSent ? ` A copy of this request has been emailed to ${esc(p.reply_to)}.` : ""}</p>
          <div class="actions">
            <a class="btn btn-ghost" href="${phoneHref}">Call ${phone}</a>
            <button class="btn btn-ghost" type="button" data-action="reset">Make another booking</button>
          </div>`;
      if (mode === "demo") {
        html += `
          <div class="demo-note">Demo mode: nothing was sent. Once EmailJS is connected (see README), these two emails go out automatically.</div>
          ${emailPreview("To the business", p.to_email, fill(OWNER_SUBJECT, p), fill(OWNER_BODY, p))}
          ${emailPreview("To the customer", p.reply_to, fill(CUSTOMER_SUBJECT, p), fill(CUSTOMER_BODY, p))}`;
      } else if (!customerSent) {
        html += `<div class="demo-note">Your request reached us, but the confirmation email to ${esc(p.reply_to)} could not be sent. Keep your reference handy.</div>`;
      }
      html += `</div>`;
      success.innerHTML = html;
      success.hidden = false;
      form.hidden = true;
      success.querySelector("[data-action=reset]").addEventListener("click", () => {
        form.reset();
        success.hidden = true;
        form.hidden = false;
        form.elements.from_name.focus();
      });
      success.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    }
    function emailPreview(label, to, subject, body) {
      return `
        <article class="email-preview">
          <header><span>${esc(label)}</span><strong>To: ${esc(to || "")}</strong><span>Subject: ${esc(subject)}</span></header>
          <pre>${esc(body)}</pre>
        </article>`;
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      status.textContent = "";
      if (!validate()) return;
      const params = collect();
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner" aria-hidden="true"></span> Sending your request';
      try {
        if (emailConfigured()) {
          const { customerSent } = await sendBookingEmails(params);
          renderSuccess(params, "live", customerSent);
        } else {
          await new Promise((r) => setTimeout(r, reduceMotion ? 200 : 1300));
          renderSuccess(params, "demo", true);
        }
      } catch (err) {
        console.error(err);
        status.textContent = "The request didn't go through. Please try again, or call " + (BIZ.phone || "us") + ".";
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = submitLabel;
      }
    });
  }

  /* ---------------- 6. Mobile call bar ---------------- */
  function initMobileBar() {
    const bar = $(".mobile-bar");
    const book = $("#book");
    if (!bar || !book || !("IntersectionObserver" in window)) return;
    new IntersectionObserver((entries) => {
      entries.forEach((en) => bar.classList.toggle("is-hidden", en.isIntersecting));
    }, { threshold: 0.15 }).observe(book);
  }

  /* ---------------- boot ---------------- */
  function boot() {
    initNav();
    initHero();
    initNbn();
    initBooking();
    initMobileBar();
    initRail();
    const year = $("#year");
    if (year) year.textContent = String(new Date().getFullYear());
    if (BIZ.registration) $$("[data-reg]").forEach((el) => { el.textContent = "ACMA registered cabler No. " + BIZ.registration; });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
