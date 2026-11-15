// English source strings. Every other locale is a Partial of this map, so a
// missing translation falls back to English rather than showing a key.
// Add new keys here and run: node scripts/check-i18n.mjs
//
// Conventions:
//  - Whole sentences with {placeholders}; never concatenate fragments around a
//    translated string (Indic word order differs from English).
//  - Official complaint/draft bodies, source names, place names and numbers stay
//    in English elsewhere in the code; only display copy lives here.

export const en = {
  "language.label": "Language",
  "language.select": "Choose a language",

  // ---------------------------------------------------------------- common
  "common.online": "Online",
  "common.offline": "Offline",
  "common.queued": "{count} queued",
  "common.search": "Search",
  "common.openSource": "Open the source",
  "common.openRow": "Open the row",
  "common.notPublished": "Not published",
  "common.noRow": "no row",
  "common.sourceNote": "Source note",

  // ---------------------------------------------------------------- masthead
  "layout.skip": "Skip to content",
  "layout.homeLabel": "Alag home",
  "layout.tagline": "household segregation proof",
  "layout.metaTitle": "Alag — one bin, one photo, one proof",
  "layout.metaDescription":
    "Collector-side household segregation proof for Swachh Bharat 2.0. A photo per bin, a vision read, a WhatsApp nudge, and a ward register that shows what changed.",
  "nav.primary": "Primary",
  "nav.fieldLong": "Field tool",
  "nav.fieldShort": "Field",
  "nav.pilotLong": "Pilot ledger",
  "nav.pilotShort": "Pilot",
  "nav.wardsLong": "Ward register",
  "nav.wardsShort": "Wards",

  // ---------------------------------------------------------------- footer
  "layout.colophonTitle": "What the numbers on this page are, and are not",
  "layout.colophonBody":
    "Government and map figures are pulled live and carry their source and date. Pilot figures come from photos recorded in this app; until the seed is replaced they are labelled template. No ward number, rank, coordinate, or complaint number is invented. Where a source has no row for a place, the page says so.",
  "layout.srcNational":
    "National waste context: ~1.7 lakh tonnes/day generated, ~20% processed — CPCB Annual Report 2021-22 / 2022-23.",
  "layout.srcRank":
    "City rank: Swachh Survekshan 2017, MoHUA / PIB release of 4 May 2017, or the data.gov.in resource when the API key is not rate-limited.",
  "layout.srcWaste":
    "City solid waste: data.gov.in, Solid Waste Management ULB returns (2015-16 to 2017-18). Missing rows are shown as not published.",
  "layout.srcComposition":
    "Waste composition: 50% wet, 30% dry, 20% inert — CPCB, typical Indian municipal solid waste.",
  "layout.srcImpact":
    "Impact model: 0.45 kg/person/day (CPHEEO Manual on MSW Management, 2016) × 4.4 persons/household (NFHS-5, 2019-21).",
  "layout.srcDumpsites":
    "Dumpsites: OpenStreetMap contributors, ODbL 1.0, queried through the Overpass API; no coordinates are generated.",
  "layout.srcLookups":
    "PIN and place lookups: India Post and OpenStreetMap Nominatim. Routing: OSRM. Air: Open-Meteo / CAMS.",
  "layout.colophonMeaning":
    "{brand} means separate. Built for the collector who sees every bin, every day.",

  // ---------------------------------------------------------------- field tool
  "field.title": "One bin. One photo. One proof.",
  "field.titleBin": "One bin.",
  "field.titlePhoto": "One photo.",
  "field.titleProof": "One proof.",
  "field.dekLead": "The collector already sees every bin every day.",
  "field.dekBody":
    "Alag turns that look into a dated, photo-backed register: one photo a bin, one verdict the collector confirms, and the ward can act on the record.",
  "field.route": "Round",
  "field.household": "Household",
  "field.chooseHousehold": "Choose a household",
  "field.householdBook": "Household book",
  "field.photographBin": "Photograph the bin",
  "field.retakePhoto": "Retake photo",
  "field.photoHint": "One photo per bin, per pickup. Camera opens on a phone.",
  "field.readBin": "Read this bin",
  "field.readingBin": "Reading the bin",
  "field.readingEllipsis": "Reading the bin…",
  "field.readHint":
    "BharatCode vision. If the model is down, you confirm the category yourself.",
  "field.register": "Today's register",
  "field.registerNote": "Every row is one photo-backed read. The rail colour is the verdict.",
  "field.city": "Your city, on the record",
  "field.cityNote":
    "PIN resolved through India Post, then matched to a published Swachh Survekshan row.",
  "field.dumpsites": "Mapped dumpsites",
  "field.dumpsitesNote":
    "Real OSM landfill elements near the round. Nothing is drawn from memory.",
  "field.escalate": "When the bin stays mixed",
  "field.escalateNote": "Send the record to the corporation that owns the ward.",
  "field.kit": "Field kit",
  "field.kitNote": "Route, air and place lookups. Live upstreams, honest failures.",
  "field.save": "Record in the register",
  "field.saved": "Recorded",
  "field.savedLine": "Recorded: {verdict} · {kg} kg",
  "field.nudge": "Send WhatsApp nudge",
  "field.confirm": "Confirm the read",
  "field.confidence": "confidence",
  "field.manual": "Manual confirm",
  "field.estimatedKg": "Estimated kg",
  "field.addHousehold": "Add household",
  "field.lookupPin": "Look up PIN",
  "field.name": "Household name",
  "field.house": "House / flat",
  "field.street": "Street",
  "field.pin": "PIN code",
  "field.rwa": "RWA / colony",
  "field.phone": "Mobile for the nudge",
  "field.language": "Nudge language",
  "field.offline":
    "Offline. The read is queued on this device and syncs when the network returns.",
  "field.queuedOnDevice": "Queued on this device",
  "field.noHousehold": "Add or choose a household before recording.",
  "field.noPhoto": "Take a photo first.",
  "field.capture": "Capture",
  "field.noHouseholdYet": "No household yet",
  "field.houseFallback": "House",
  "field.usAqi": "US AQI {value}",
  "field.optionNoNumber": "no number",
  "field.selectAbove": "Select a household above",
  "field.photosOne": "1 photo",
  "field.photosOther": "{count} photos",
  "field.emptyHint": "One bin, one frame. No gallery search, no stock photo.",
  "field.photoAlt": "The bin photographed at this pickup",
  "field.verdict.wet": "Wet",
  "field.verdict.dry": "Dry",
  "field.verdict.mixed": "Mixed",
  "field.verdict.hazardous": "Hazardous",
  "field.verdict.wetHelp": "Food scraps, peels, tea leaves",
  "field.verdict.dryHelp": "Plastic, paper, metal, glass",
  "field.verdict.mixedHelp": "Wet and dry in one bin",
  "field.verdict.hazardousHelp": "Batteries, bulbs, sharps",
  "field.sourceVision": "BharatCode vision",
  "field.sourceVisionAttemptOne": "BharatCode vision, 1 attempt",
  "field.sourceVisionAttempts": "BharatCode vision, {count} attempts",
  "field.sourceVisionLatency": "BharatCode vision, {seconds} s",
  "field.sourceVisionAttemptOneLatency": "BharatCode vision, 1 attempt, {seconds} s",
  "field.sourceVisionAttemptsLatency": "BharatCode vision, {count} attempts, {seconds} s",
  "field.sourceFallback": "deterministic fallback",
  "field.sourceManual": "manual read",
  "field.sourceVisionShort": "vision",
  "field.needsConfirmTitle": "The model did not return a confident read.",
  "field.needsConfirmBody":
    "The category below is a safe starting point, not a verdict. Tap the bin you actually saw.",
  "field.upstreamNote": "Upstream: {reason}",
  "field.visionFailedTitle": "Vision read failed",
  "field.kgFor": "{verdict} kg",
  "field.recording": "Recording…",
  "field.noHouseholdRecording": "Add or choose a household before recording.",
  "field.photoRecord": "Photo record {ref}.",
  "field.askKabadi": "Ask a kabadi",
  "field.fileComplaint": "File a complaint",
  "field.whatsappNote":
    "WhatsApp opens with a prefilled Hindi + English message. Alag never claims a send you did not make.",
  "field.recordsInDb": "{count} records in this database",
  "field.ledgerHeadHousehold": "Household / read",
  "field.ledgerHeadAmount": "Amount",
  "field.noInspections": "No inspections yet.",
  "field.noInspectionsBody":
    "The first photo you record appears here with its verdict, source and kg.",
  "field.binFallback": "Bin {id}",
  "field.ledgerMeta": "{verdict} · {rwa} · {date} {time} · {source}",
  "field.stillMixed": "still mixed",
  "field.ledgerFoot":
    "Showing the latest {shown}. Photos are hashed; the image is not stored by the server.",
  "field.queueTitle": "Offline queue · {count}",
  "field.queueRow": "{label} · {verdict}, queued {time}",
  "field.bin": "Bin",
  "field.pinMeta": "PIN {pin}",
  "field.dumpsitesMeta": "25 km box",
  "field.bookIntro":
    "A household is a real address on the round. The PIN is checked against India Post before it is saved.",
  "field.placeholderName": "Sharma Residence",
  "field.placeholderHouse": "B-42",
  "field.placeholderStreet": "MG Road",
  "field.placeholderPhone": "10-digit",
  "field.checking": "Checking…",
  "field.savedHouseholds": "Saved households",
  "field.savedMeta": "{house} · {rwa} · PIN {pin}",
  "field.selected": "Selected",
  "field.use": "Use",
  "field.escalateMeta": "Official portal + copyable text",
  "field.routeTitle": "Collection route · OSRM driving",
  "field.fromCoords": "From, lat,lng",
  "field.toCoords": "To, lat,lng",
  "field.measureDrive": "Measure the drive",
  "field.routeLive": "OSRM driving profile, live.",
  "field.airTitle": "Air at the round · Open-Meteo",
  "field.readAir": "Read air at {place}",
  "field.aqiMeta": "PM2.5 {pm25} · PM10 {pm10} · {time} · Open-Meteo / CAMS.",
  "field.placeTitle": "Place search and map centre · Nominatim",
  "field.areaPlaceholder": "Area, city",
  "field.centreMap": "Centre the map here",
  "field.noHiddenTitle": "No hidden numbers",
  "field.noHiddenBody":
    "A missing upstream shows its error and a retry. The register never fills a gap with a plausible value. Template pilot figures live only on the pilot ledger, where they are labelled.",
  "field.openLedger": "Open the pilot ledger",
  "field.errRegister":
    "The register could not be read from this device's database. Retry after a save.",
  "field.errPin6": "Enter a 6-digit PIN to resolve the city.",
  "field.errCityStatus": "City lookup failed (HTTP {status}).",
  "field.errCity": "City lookup failed. India Post or data.gov.in may be unreachable.",
  "field.errLookupStatus": "Lookup failed (HTTP {status}).",
  "field.errIndiaPost": "India Post is unreachable. Retry when the network is back.",
  "field.errName": "A household name is needed.",
  "field.errAddHousehold": "The household could not be added.",
  "field.added": "{name} added. The camera is ready.",
  "field.errAddNetwork": "Network failed. The household was not saved.",
  "field.errVisionStatus": "The vision service returned HTTP {status}.",
  "field.errClassifier":
    "The photo could not reach the classifier. Confirm the category yourself; nothing was guessed.",
  "field.errNetwork": "Network failed",
  "field.errCoords": "Enter two coordinates as lat,lng.",
  "field.errOsrmStatus": "OSRM returned HTTP {status}.",
  "field.errOsrm": "OSRM is unreachable. Distances are never estimated locally.",
  "field.errMeteoStatus": "Open-Meteo returned HTTP {status}.",
  "field.errMeteo": "Open-Meteo is unreachable. Retry.",
  "field.errNominatimStatus": "Nominatim returned HTTP {status}.",
  "field.errNominatim": "Nominatim is unreachable. Retry.",
  "field.syncNow": "Sync now",

  // ---------------------------------------------------------------- city context
  "city.resolving":
    "Resolving PIN {pin} through India Post, then checking the Swachh Survekshan register…",
  "city.rank": "City rank",
  "city.checking": "Checking",
  "city.unavailable": "City context unavailable",
  "city.pinUnresolved": "The PIN could not be resolved.",
  "city.noGuess": "No rank is shown rather than a guessed one.",
  "city.ofCities": "of {of} cities, {year}",
  "city.notPublished": "Not published for this city",
  "city.rankNoteDelhi":
    "{district} spans more than one Delhi municipal body, so no single city rank is published. The 2017 ranks: NDMC 7, South MCD 202, East MCD 196, North MCD 279.",
  "city.rankNoteNone":
    "No Swachh Survekshan row matches \"{district}\" in the published data.",
  "city.noSolidWasteRow":
    "data.gov.in has no solid-waste row published for {district} in the ULB returns.",
  "city.liveFetched": "live row fetched {date}",
  "city.verifiedExtract": "verified extract",
  "city.solidWasteYear": "City solid waste, {year}",
  "city.generated": "generated",
  "city.forThisCity": "for this city",
  "city.collected": "Collected by the ULB",
  "city.ulbReturn": "ULB return",
  "city.processed": "Processed or recycled",
  "city.nationalTitle": "National context, not this city",
  "city.footnote":
    "PIN {pin} → {district}, {state} (India Post). City rank is a 2017 survey figure; it is context, not a measure of this pilot.",

  // ---------------------------------------------------------------- floating register
  "float.progress": "Progress on this round",
  "float.thisRound": "This round",
  "float.logged": "{logged} of {total} households logged",
  "float.pct": "{pct}% of the round logged",

  // ---------------------------------------------------------------- dumpsites
  "dump.querying":
    "Querying OpenStreetMap Overpass for landuse=landfill inside a 25 km box…",
  "dump.mirrors":
    "Mirrors are tried in order with backoff. Nothing is drawn until OSM returns a real element.",
  "dump.unavailable": "Map data unavailable",
  "dump.noAnswer": "No answer from the Overpass mirrors.",
  "dump.noCoords": "No coordinates are generated here.",
  "dump.checkArea": "Check this area on OpenStreetMap",
  "dump.allFailed": "All three Overpass mirrors failed. {error}",
  "dump.openArea": "Open this area on OpenStreetMap",
  "dump.mapTitle": "OpenStreetMap around {label}",
  "dump.countOne": "{count} mapped landfill within 25 km",
  "dump.countMany": "{count} mapped landfills within 25 km",
  "dump.none": "No mapped landfill in this 25 km box",
  "dump.larger": "Larger map",
  "dump.fromCentre": "from centre",
  "dump.emptyTitle": "OpenStreetMap has no landfill mapped here.",
  "dump.emptyBody":
    "That is a gap in OSM, not proof that no dumpsite exists. Add one from a survey, or check the city's SWM plan.",
  "dump.lookupFailed": "Landfill lookup failed",
  "dump.footnoteCached":
    "{source}. Cached answer for a 25 km box around {label} ({lat}, {lng}).",
  "dump.footnoteFetched":
    "{source}. Fetched now for a 25 km box around {label} ({lat}, {lng}).",
  "dump.mirror": "Mirror: {host}.",
  "dump.footnoteTail": "Coordinates are OSM element centres; none are estimated.",

  // ---------------------------------------------------------------- escalate
  "escalate.intro":
    "A photo register is evidence, not a fix. When a bin stays mixed or waste is burned, send the record to the corporation that owns the ward. Alag prepares the text and opens the official portal; you submit it and keep the complaint number.",
  "escalate.whatWrong": "What is wrong",
  "escalate.issue.mixed-collection": "Wet and dry collected together",
  "escalate.issue.burning": "Waste burned in the open",
  "escalate.issue.dumping": "Garbage dumped on the street",
  "escalate.issue.missed": "Bin not collected",
  "escalate.issue.no-separate-bin": "No separate wet/dry bin",
  "escalate.complaintLanguage": "Complaint language",
  "escalate.details": "What did you see (optional)",
  "escalate.detailsPlaceholder":
    "Example: the same handcart mixed the green and blue bins on the morning round, twice this week.",
  "escalate.name": "Your name (optional)",
  "escalate.namePlaceholder": "Collector name",
  "escalate.phone": "Contact number (optional)",
  "escalate.phonePlaceholder": "10-digit mobile",
  "escalate.portalMeta": "{scope} Helpline {helpline}.",
  "escalate.noPortalTitle": "No portal matched this city",
  "escalate.noPortalBody":
    "Use the national mission page to find the state SBM cell, then file there.",
  "escalate.draft": "Draft complaint",
  "escalate.building": "Building…",
  "escalate.ready": "Ready to copy",
  "escalate.copied": "Copied to clipboard",
  "escalate.copy": "Copy complaint text",
  "escalate.openCorporation": "Open the corporation portal",
  "escalate.openMission": "Open the mission portal",
  "escalate.footnote":
    "Alag does not file on your behalf and does not invent a complaint number. The portal issues the reference. Drafts are built in this browser from the fields above; nothing is sent to a third party.",
  "escalate.kabadiTitle": "Kabadi pickup for dry waste",
  "escalate.kabadiMeta": "Your number, your kabadi",
  "escalate.kabadiBody":
    "There is no kabadi marketplace here. Enter the number of a scrap dealer you already use; Alag writes the message and opens WhatsApp. You send it.",
  "escalate.kabadiPhone": "Kabadi WhatsApp number",
  "escalate.kabadiKg": "Dry waste ready (kg)",
  "escalate.openWa": "Open WhatsApp with the pickup message",
  "escalate.enterNumber": "Enter a 10-digit number to build the link",
  "escalate.kabadiFootnote":
    "A wa.me deep link to the number you supplied. No listing, no matching, no fee, and no message is claimed sent until you tap Send in WhatsApp.",

  // ---------------------------------------------------------------- dashboard
  "dashboard.kicker": "Pilot ledger · 7 days",
  "dashboard.kickerCount": "Pilot ledger · 7 days · {count} households",
  "dashboard.loadingTitle": "Reading the register…",
  "dashboard.loadingLead": "Loading the pilot rows.",
  "dashboard.loadingBody":
    "The compliance line and the impact arithmetic are computed from the same inspection table.",
  "dashboard.statsRouteError": "The pilot stats route did not answer.",
  "dashboard.seedFailed": "Seeding failed.",
  "dashboard.emptyTitle": "No pilot rows yet.",
  "dashboard.emptyBody":
    "The ledger is empty. Seed the labelled template to see the full Day-1 to Day-7 loop, or collect live inspections from the field tool. Government figures are never seeded.",
  "dashboard.errorTitle": "Could not read the ledger",
  "dashboard.twoWays": "Two honest ways to start.",
  "dashboard.seedingRows": "Seeding 1,400 rows…",
  "dashboard.seedTemplate": "Seed the template pilot (200 × 7)",
  "dashboard.collectLive": "Collect a live inspection",
  "dashboard.title": "What changed, one bin at a time.",
  "dashboard.intro":
    "Baseline and endline from the collector's own photo register. Compliance means a bin recorded as wet or dry; mixed and hazardous bins do not count.",
  "dashboard.register": "Register:",
  "dashboard.registerTemplate": "template pilot",
  "dashboard.registerLive": "live inspections",
  "dashboard.rows": "Rows:",
  "dashboard.days": "Days:",
  "dashboard.templateTitle": "Template pilot — a demonstration, not a real ward",
  "dashboard.templateBodySeeded":
    "Seeded on {date} as 200 households × 7 days. Every compliance and kg row below is generated by src/lib/pilotSeed.ts; no government figure is used. Replace it with live inspections before quoting any impact.",
  "dashboard.templateBodyDemo":
    "Seeded for this demo as 200 households × 7 days. Every compliance and kg row below is generated by src/lib/pilotSeed.ts; no government figure is used. Replace it with live inspections before quoting any impact.",
  "dashboard.collectLivePlural": "Collect live inspections",
  "dashboard.reseeding": "Re-seeding…",
  "dashboard.reseed": "Re-seed template",
  "dashboard.ledgerError": "Ledger error",
  "dashboard.day1to7": "Day 1 to Day 7",
  "dashboard.templateRows": "Template rows",
  "dashboard.photoRows": "Photo-proven rows",
  "dashboard.day1Baseline": "Day 1 baseline",
  "dashboard.binsPhotographed": "{count} bins photographed",
  "dashboard.sevenDays": "7 days",
  "dashboard.day7Compliance": "Day 7 compliance",
  "dashboard.points": "{points} points",
  "dashboard.deltaNote":
    "Change from the first to the last day in the register. Not an annual rate and not a claim about the city.",
  "dashboard.complianceByDay": "Compliance by day",
  "dashboard.complianceFormula": "Wet or dry ÷ all inspections",
  "dashboard.barAria": "Day {day}: {pct}% compliant",
  "dashboard.barNote":
    "Each bar is {count} inspections. The rail colour changes at 50% and 70% so a bad day is legible at a glance, not only in the number.",
  "dashboard.kgDetails": "Day-by-day kg behind the bars",
  "dashboard.dayN": "Day {day}",
  "dashboard.thDay": "Day",
  "dashboard.thBins": "Bins",
  "dashboard.thWetKg": "Wet kg",
  "dashboard.thDryKg": "Dry kg",
  "dashboard.thMixedKg": "Mixed kg",
  "dashboard.divertedTitle": "What the week diverted",
  "dashboard.estimateNotWeighbridge": "Estimate, not a weighbridge",
  "dashboard.divertedIntro":
    "Every factor is on its own line. Change the household count or the Day-7 compliance and the result changes with it. The factors are published national planning figures, not measurements from this ward.",
  "dashboard.formulaHouseholds": "{households} households × {size} people",
  "dashboard.formulaPeople": "{people} people",
  "dashboard.formulaWaste": "{people} people × {kg} kg/day × {days} days",
  "dashboard.formulaWasteResult": "{collected} kg waste",
  "dashboard.formulaWet": "{collected} kg × 50% wet",
  "dashboard.formulaWetResult": "{wet} kg wet",
  "dashboard.formulaDiverted": "{wet} kg wet × {compliance}% segregated",
  "dashboard.formulaDivertedResult": "{diverted} kg diverted",
  "dashboard.formulaComplianceSource":
    "Compliance from the photo register on this dashboard",
  "dashboard.wetDiverted": "wet waste diverted in 7 days",
  "dashboard.atSegregation": "at {pct}% segregation",
  "dashboard.estimate": "Estimate",
  "dashboard.annualised": "Annualised, per 1,000 households at {pct}%",
  "dashboard.annualValue": "{tonnes} t wet/yr",
  "dashboard.sameFactors": "same factors, 365 days",
  "dashboard.measured": "Measured in the template photo register",
  "dashboard.measuredValue": "{kg} kg",
  "dashboard.measuredNote": "wet kg in non-mixed bins, 7 days",
  "dashboard.stillMixed": "Still mixed in the template register",
  "dashboard.factorsNote":
    "The measured row comes from the seeded inspection rows. The estimate above it is a ceiling built from {size} people/household ({householdSource}), {perCapita} kg/person/day ({perCapitaSource}) and a 50% wet fraction ({compositionSource}). The two numbers are not interchangeable.",
  "dashboard.problemTitle": "The problem this sits inside",
  "dashboard.problemMeta": "National context, not this pilot",
  "dashboard.problemNoticeTitle":
    "India generates about 1.7 lakh tonnes of municipal solid waste a day.",
  "dashboard.problemNoticeBody":
    "CPCB reports that only about 20% is processed; the rest is dumped or unaccounted. That is why a per-household record matters: a city-level tonnage cannot tell a ward which bins are actually separated. Source: CPCB Annual Report 2021-22 / 2022-23.",
  "dashboard.problemNote":
    "The 1.7 lakh figure and the 20% figure are national. They are not used to compute this pilot's diverted kg, which is built from the household count and the published per-capita and composition factors above.",
  "dashboard.loopTitle": "How the loop works",
  "dashboard.loopMeta": "A sequence, not a feature list",
  "dashboard.step1Title": "One photo at pickup",
  "dashboard.step1Body":
    "The collector photographs the bin already in front of them. No new hardware, no household app.",
  "dashboard.step2Title": "A vision read, then a human confirm",
  "dashboard.step2Body":
    "BharatCode classifies wet, dry, mixed or hazardous. The collector confirms or overrides; the source is stored.",
  "dashboard.step3Title": "A nudge the same morning",
  "dashboard.step3Body":
    "A mixed bin produces a prefilled Hindi + English WhatsApp message. The collector taps Send; Alag never fakes it.",
  "dashboard.step4Title": "Day 1 against Day 7",
  "dashboard.step4Body":
    "The same register, the same households, a week apart. The ward sees movement, not a one-off survey.",
  "dashboard.openField": "Open the field tool",
  "dashboard.seeWard": "See the ward register",

  // ---------------------------------------------------------------- leaderboard
  "leaderboard.kicker": "Ward register · ranked by photo-proven compliance",
  "leaderboard.title": "Who is actually separating.",
  "leaderboard.intro":
    "Ranked by the share of photographed bins recorded as wet or dry. Not a citizen survey, not a self-report: the collector stands in front of the bin.",
  "leaderboard.source": "Source:",
  "leaderboard.rows": "Rows:",
  "leaderboard.liveRegister": "live register",
  "leaderboard.templateSource": "template pilot",
  "leaderboard.wardLabels": "Ward labels:",
  "leaderboard.pilotCollected": "pilot-collected",
  "leaderboard.templateTitle": "These ranks come from the seeded template pilot.",
  "leaderboard.templateBody":
    "The RWA names are demonstration names, not real associations, and the ward column says pilot-collected because no municipal ward number was supplied. Replace the seed with live inspections before showing this to a ward officer.",
  "leaderboard.errorTitle": "Register unavailable",
  "leaderboard.errorBody": "The ward register could not be read.",
  "leaderboard.registerTitle": "The register",
  "leaderboard.formula": "Wet or dry ÷ all photos",
  "leaderboard.loadingTitle": "Reading the ward register…",
  "leaderboard.loadingBody": "Ranking the photo rows by compliance.",
  "leaderboard.emptyTitle": "No RWA rows yet.",
  "leaderboard.emptyBody":
    "Seed the template pilot on the pilot ledger, or collect live inspections in the field tool. The register fills itself from the inspection table; nothing is typed in by hand.",
  "leaderboard.openLedger": "Open the pilot ledger",
  "leaderboard.collect": "Collect an inspection",
  "leaderboard.rankRwa": "Rank / RWA",
  "leaderboard.compliance": "Compliance",
  "leaderboard.rowMeta":
    "Ward {ward} · {households} households · {inspections} photos · {wetKg} kg wet",
  "leaderboard.volume": "{pct}% of top volume",
  "leaderboard.noPhotos": "no photos",
  "leaderboard.foot":
    "{count} RWA rows. The rail turns ochre below 75% and red below 50%. A rank is only comparable within this pilot; household counts differ.",
  "leaderboard.measuresTitle": "What the rank measures",
  "leaderboard.measuresMeta": "And what it does not",
  "leaderboard.measuresH3": "It measures",
  "leaderboard.measuresBody":
    "The share of bins in this RWA that a collector photographed and recorded as wet or dry. Mixed and hazardous bins count against. The denominator is every photo in the register, so an RWA cannot improve by skipping bad bins.",
  "leaderboard.notMeasuresH3": "It does not measure",
  "leaderboard.notMeasuresBody":
    "Cleanliness of the street, the ward's official Swachh Survekshan score, or whether the waste was processed after pickup. Ward labels are pilot-collected; no municipal ward number is invented. A high rank is evidence of separation at the bin, nothing more.",
  "leaderboard.whyTitle": "Why the collector is the right sensor",
  "leaderboard.whyBody":
    "The collector is the only person who sees every household's bin every day. A citizen report samples the angry; a city dashboard samples the aggregate. The photo register samples the actual bin, household by household.",
} as const;

export type MessageKey = keyof typeof en;
export type Messages = Record<MessageKey, string>;
export type LocaleMessages = Partial<Messages>;
