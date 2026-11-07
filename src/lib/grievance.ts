// Curated municipal grievance directory.
// Every URL below was checked with a live request on 2026-11-06 and returned
// HTTP 200. This is a directory, not a marketplace or an aggregator: the
// complaint is copied by the person into the corporation's own portal.

export type Portal = {
  id: string;
  city: string;
  body: string;
  url: string;
  helpline: string;
  scope: string;
  states: string[];
  aliases: string[];
};

export const PORTALS: Portal[] = [
  {
    id: "delhi-mcd",
    city: "Delhi",
    body: "Municipal Corporation of Delhi",
    url: "https://mcdonline.nic.in/portal/mService",
    helpline: "155305",
    scope: "Solid waste, sanitation and civic complaints across the MCD zones.",
    states: ["Delhi"],
    aliases: ["new delhi", "central delhi", "north delhi", "south delhi", "east delhi", "west delhi", "shahdara", "ndmc", "mcd"],
  },
  {
    id: "mumbai-bmc",
    city: "Mumbai",
    body: "Brihanmumbai Municipal Corporation — MyBMC MARG",
    url: "https://portal.mcgm.gov.in/irj/portal/anonymous/qlcomplaintreg",
    helpline: "1916",
    scope: "Garbage, debris and solid waste complaints in the BMC ward.",
    states: ["Maharashtra"],
    aliases: ["mumbai", "mumbai suburban", "greater mumbai", "bombay"],
  },
  {
    id: "bengaluru-bswml",
    city: "Bengaluru",
    body: "Bengaluru Solid Waste Management Ltd (BSWML)",
    url: "https://bswml.karnataka.gov.in/174/register-complaint/en",
    helpline: "1533",
    scope: "Waste collection, segregation and black-spot complaints in Bengaluru.",
    states: ["Karnataka"],
    aliases: ["bengaluru", "bengaluru urban", "bangalore", "bbmp"],
  },
  {
    id: "chennai-gcc",
    city: "Chennai",
    body: "Greater Chennai Corporation — Public Grievance Redressal",
    url: "https://gccservices.in/pgr/registercomplaints",
    helpline: "1913",
    scope: "Solid waste, drain and sanitation complaints in the GCC zone.",
    states: ["Tamil Nadu"],
    aliases: ["chennai", "greater chennai", "madras"],
  },
  {
    id: "hyderabad-ghmc",
    city: "Hyderabad",
    body: "Greater Hyderabad Municipal Corporation",
    url: "https://greenhyderabad.ghmc.gov.in/GrievanceRegistration.aspx",
    helpline: "155304",
    scope: "Garbage, sweeping and solid waste complaints in the GHMC circle.",
    states: ["Telangana"],
    aliases: ["hyderabad", "greater hyderabad", "secunderabad", "ghmc"],
  },
  {
    id: "pune-pmc",
    city: "Pune",
    body: "Pune Municipal Corporation",
    url: "https://www.pmc.gov.in/",
    helpline: "18001030222",
    scope: "Civic and solid waste complaints in the PMC ward office.",
    states: ["Maharashtra"],
    aliases: ["pune", "pimpri chinchwad", "pimpri-chinchwad"],
  },
  {
    id: "ahmedabad-amc",
    city: "Ahmedabad",
    body: "Ahmedabad Municipal Corporation",
    url: "https://www.ahmedabadcity.gov.in/",
    helpline: "155303",
    scope: "Solid waste and sanitation complaints in the AMC zone.",
    states: ["Gujarat"],
    aliases: ["ahmedabad", "amc"],
  },
  {
    id: "kolkata-kmc",
    city: "Kolkata",
    body: "Kolkata Municipal Corporation",
    url: "https://www.kmcgov.in/",
    helpline: "155305",
    scope: "Solid waste and civic complaints in the KMC borough.",
    states: ["West Bengal"],
    aliases: ["kolkata", "calcutta", "kmc"],
  },
];

export const NATIONAL_FALLBACK = {
  body: "Swachh Bharat Mission (Urban)",
  url: "https://swachhbharatmission.ddws.gov.in/",
  helpline: "1969",
  scope:
    "National mission page. Use it to find your state SBM cell if your city corporation is not listed above.",
};

export function findPortal(city: string, state: string): Portal | null {
  const c = city.toLowerCase().trim();
  const s = state.toLowerCase().trim();
  const byAlias = PORTALS.find(
    (p) => p.aliases.includes(c) || p.aliases.some((a) => c.includes(a) || a.includes(c))
  );
  if (byAlias) return byAlias;
  return PORTALS.find((p) => p.states.some((st) => st.toLowerCase() === s)) || null;
}

export const ISSUES = [
  {
    id: "mixed-collection",
    en: "Wet and dry waste were collected together",
    hi: "गीला और सूखा कचरा एक साथ उठाया गया",
  },
  {
    id: "burning",
    en: "Waste is being burned in the open",
    hi: "कचरा खुले में जलाया जा रहा है",
  },
  {
    id: "dumping",
    en: "Garbage is dumped on a public street",
    hi: "सार्वजनिक सड़क पर कचरा डाला गया है",
  },
  {
    id: "missed",
    en: "The bin was not collected on the scheduled day",
    hi: "तय दिन कूड़ेदान नहीं उठाया गया",
  },
  {
    id: "no-separate-bin",
    en: "No separate wet/dry bin at the collection point",
    hi: "संग्रहण स्थल पर गीले/सूखे के अलग कूड़ेदान नहीं हैं",
  },
] as const;

export type ComplaintInput = {
  lang: "en" | "hi";
  body: string;
  city: string;
  state: string;
  pincode: string;
  address: string;
  issueEn: string;
  details: string;
  date: string;
  verdict?: string;
  ref?: string;
  name?: string;
  phone?: string;
};

export function buildComplaint(input: ComplaintInput) {
  const {
    lang,
    body,
    city,
    state,
    pincode,
    address,
    issueEn,
    details,
    date,
    verdict,
    ref,
    name,
    phone,
  } = input;
  const place = [address, city, state].filter(Boolean).join(", ");
  const record = ref
    ? lang === "hi"
      ? `यह शिकायत अलग पायलट में दर्ज घरेलू पृथक्करण निरीक्षण (फ़ोटो रिकॉर्ड ${ref}) के बाद है।`
      : `This report follows a household segregation inspection in the Alag pilot (photo record ${ref}).`
    : "";
  const verdictLine = verdict
    ? lang === "hi"
      ? `कूड़ेदान की स्थिति: ${verdict}।`
      : `Bin recorded as: ${verdict}.`
    : "";

  if (lang === "hi") {
    return [
      `सेवा में: ${body}, ${city}`,
      `विषय: ठोस कचरा शिकायत — ${address || city} (${pincode})`,
      "",
      `${place} — पिन ${pincode} पर ठोस कचरे की समस्या की शिकायत दर्ज कर रहा/रही हूँ।`,
      "",
      `समस्या: ${issueEn}।`,
      `देखा गया: ${date}।`,
      details ? `विवरण: ${details}` : "",
      verdictLine,
      record,
      "ठोस अपशिष्ट प्रबंधन नियम, 2016 के तहत गीला और सूखा कचरा अलग-अलग एकत्र किया जाना चाहिए।",
      "",
      "कृपया शिकायत दर्ज कर शिकायत संख्या साझा करें।",
      "",
      name ? `शिकायतकर्ता: ${name}` : "",
      phone ? `फ़ोन: ${phone}` : "",
    ]
      .filter(Boolean)
      .join("\n");
  }

  return [
    `To: ${body}, ${city}`,
    `Subject: Solid waste complaint — ${address || city} (${pincode})`,
    "",
    `I am reporting a solid waste problem at ${place} — PIN ${pincode}.`,
    "",
    `Issue: ${issueEn}.`,
    `Observed on: ${date}.`,
    details ? `Details: ${details}` : "",
    verdictLine,
    record,
    "Under the Solid Waste Management Rules, 2016, wet and dry waste must be collected separately.",
    "",
    "Please register this complaint and share a complaint number.",
    "",
    name ? `Reported by: ${name}` : "",
    phone ? `Phone: ${phone}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}
