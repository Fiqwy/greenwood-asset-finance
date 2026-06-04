/* ============================================================
   GREENWOOD ASSET FINANCE — config & go-live tokens
   --------------------------------------------------------------
   The visible COPY lives in index.html (better for SEO + loads
   instantly + survives if a script ever fails).

   THIS file holds only the things that change at go-live or
   that drive generated UI. To launch, you usually only edit:
     • GW.brand.phone_display / phone_tel   (Troy's number)
     • GW.form.web3formsKey                  (lead delivery key)
     • GW.legal                              (ABN / credit licence)
     • the *.enabled flags under GW.proof    (real testimonials etc.)

   HONESTY RULE: nothing fabricated. Proof we cannot stand behind
   yet stays enabled:false and renders nothing.
   ============================================================ */
window.GW = {

  /* ───── Brand + contact tokens ─────────────────────────── */
  brand: {
    name:        "Greenwood Asset Finance",
    legalName:   "Greenwood Asset Finance Pty Ltd",
    shortName:   "Greenwood",
    email:       "troy@greenwoodaf.com.au",
    contactName: "Troy",
    /* Phone is not live yet. Leave BOTH blank until Troy supplies it.
       While blank, the engine hides call buttons and points those
       CTAs at the enquiry form, so nothing dead ever ships. */
    phone_display: "0458 982 928",
    phone_tel:     "+61458982928",
    domain: "greenwoodaf.com.au",
    url:    "https://greenwoodaf.com.au"
  },

  /* ───── Repayment estimator config ─────────────────────── */
  estimator: {
    amount: { min: 5000, max: 500000, step: 1000, value: 50000 },
    term:   { min: 12,   max: 84,     step: 12,   value: 60 },     // months
    rate:   { min: 6,    max: 18,     step: 0.1,  value: 8.5 }     // % p.a. indicative
  },

  /* ───── Enquiry form ───────────────────────────────────── */
  form: {
    web3formsKey: "",   // paste Web3Forms access key; blank => mailto fallback
    whatOptions: [
      "A vehicle or fleet",
      "Equipment or machinery",
      "Multiple assets",
      "Working capital",
      "Something else",
      "Not sure yet"
    ],
    messages: {
      sending:        "Sending...",
      success:        "Thank you. We have your details and Troy will be in touch shortly.",
      fallbackLead:   "We could not send that automatically. Tap below to email it across, or give us a call.",
      fallbackButton: "Open in email"
    }
  },

  /* ───── Compliance line (footer) ───────────────────────── */
  /* Renders ONLY when enabled. Do not switch on until the real ABN
     and Australian Credit Licence / authorisation exist. */
  legal: {
    enabled: false,
    abn: "",
    acl: "",
    licenseeNote: ""
  },

  /* ───── Proof slots — all OFF until Troy supplies real data ─ */
  proof: {
    testimonials:  { enabled: false, items: [] },
    lenders:       { enabled: false, items: [] },   // specific lender logos
    accreditation: { enabled: false, items: [] }    // MFAA / FBAA badges
  }
};
