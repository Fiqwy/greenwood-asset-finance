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
    phone_display: "0458 982 928",
    phone_tel:     "+61458982928",
    domain: "greenwoodaf.com.au",
    url:    "https://greenwoodaf.com.au"
  },

  /* ───── Repayment estimator config ─────────────────────── */
  /* financed = price − deposit; monthly amortises that amount
     with a future value (balloon/residual) owed at term end. */
  estimator: {
    amount:  { min: 5000, max: 500000, step: 1000, value: 50000 },  // purchase price
    deposit: { min: 0,    max: 100000, step: 1000, value: 0 },      // initial deposit ($)
    balloon: { min: 0,    max: 100000, step: 1000, value: 0 },      // balloon / residual ($)
    term:    { min: 12,   max: 84,     step: 12,   value: 60 },     // months
    rate:    { min: 6,    max: 18,     step: 0.1,  value: 8.5 }     // % p.a. indicative
  },

  /* ───── Enquiry form ───────────────────────────────────── */
  form: {
    web3formsKey: "",   // paste Web3Forms access key; blank => mailto fallback
    messages: {
      sending:        "Sending...",
      success:        "Thank you. We have your details and Troy will be in touch shortly.",
      fallbackLead:   "We could not send that automatically. Tap below to email it across, or give us a call.",
      fallbackButton: "Open in email"
    }
  },

  /* ───── Compliance line (footer) ───────────────────────── */
  /* ABN shows now. The "Authorised Credit Representative … of Viking …"
     line only appears once arNumber is filled (Troy's AR number, ~2 wks
     away). Until then nothing untrue is displayed. Just paste arNumber
     when issued — no code change needed. */
  legal: {
    enabled: true,
    abn: "50 698 565 105",                          // Greenwood Asset Finance Pty Ltd
    aggregator: "Viking Asset Aggregation Pty Ltd",
    aggregatorAcl: "543046",                        // Viking's ACL — held until AR number exists
    arNumber: ""                                    // Troy's Authorised Credit Representative number — paste when issued
  },

  /* ───── Proof slots ────────────────────────────────────── */
  proof: {
    testimonials:  { enabled: false, items: [] },

    /* Lender panel — Troy works across the same broad panel of
       bank and non-bank lenders. Real brand logos render full-colour.
       Each item: { name, file } -> assets/brands/<file>. */
    lenders: {
      enabled: true,
      note: "A selection of the lenders we work across.",
      items: [
        { name: "NAB", file: "nab.webp" },
        { name: "Westpac", file: "westpac.webp" },
        { name: "Pepper Money", file: "pepper-money.webp" },
        { name: "Liberty", file: "liberty.webp" },
        { name: "Resimac", file: "resimac.webp" },
        { name: "Latitude", file: "latitude.webp" },
        { name: "NOW Finance", file: "now-finance.webp" },
        { name: "Plenti", file: "plenti.webp" },
        { name: "Wisr", file: "wisr.webp" },
        { name: "MoneyMe", file: "moneyme.webp" },
        { name: "Money3", file: "money3.webp" },
        { name: "Finance One", file: "finance-one.webp" },
        { name: "Angle Finance", file: "angle.webp" },
        { name: "Metro", file: "metro.webp" },
        { name: "ScotPac", file: "scotpac.webp" },
        { name: "Prospa", file: "prospa.webp" },
        { name: "Banjo Loans", file: "banjo.webp" },
        { name: "Moneytech", file: "moneytech.webp" },
        { name: "Shift", file: "shift.webp" },
        { name: "Earlypay", file: "earlypay.webp" },
        { name: "Lumi", file: "lumi.webp" },
        { name: "Dynamoney", file: "dynamoney.webp" },
        { name: "Capital Finance", file: "capital-finance.webp" },
        { name: "Firstmac", file: "firstmac.webp" },
        { name: "RACV", file: "racv.webp" },
        { name: "Rapid Loans", file: "rapid-loans.webp" },
        { name: "Flexi", file: "flexi.webp" },
        { name: "Multiply", file: "multiply.webp" },
        { name: "Azora", file: "azora.webp" },
        { name: "Branded Financial", file: "branded.webp" },
        { name: "Moula", file: "moula.webp" },
        { name: "Maple", file: "maple.webp" },
        { name: "TruePillars", file: "truepillars.webp" },
        { name: "Alex Bank", file: "alex.webp" },
        { name: "BICAP", file: "bicap.webp" },
        { name: "Booq", file: "booq.webp" },
        { name: "CFI", file: "cfi.webp" },
        { name: "CarStart", file: "carstart.webp" },
        { name: "Morris Finance", file: "morris.webp" },
        { name: "Affordable", file: "affordable.webp" }
      ]
    },

    /* Accreditations are rendered in index.html (hero) via the
       .brandmark CSS mask. Troy has confirmed membership of each. */
    accreditation: { enabled: true, items: ["Viking", "FBAA", "AFCA"] }
  }
};
