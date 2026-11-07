"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CityContext, { type CityData } from "@/components/CityContext";
import LandfillPanel from "@/components/LandfillPanel";
import Escalate from "@/components/Escalate";
import { CameraIcon } from "@/components/Icons";

type Lang = "en" | "hi";
type Verdict = "wet" | "dry" | "mixed" | "hazardous";

type Bin = {
  id: number;
  household_name: string;
  house_no: string;
  street: string;
  pincode: string;
  rwa: string;
  phone: string;
  language: string;
};

type Inspection = {
  id: number;
  bin_id: number;
  household_name: string;
  rwa: string;
  date: string;
  classification: Verdict;
  wet_kg: number;
  dry_kg: number;
  mixed_kg: number;
  hazardous_kg: number;
  source: string;
  created_at: string;
};

type ClassifyResult = {
  classification?: Verdict;
  confidence?: number;
  wet_kg?: number;
  dry_kg?: number;
  mixed_kg?: number;
  hazardous_kg?: number;
  note?: string;
  source?: string;
  needsManualConfirm?: boolean;
  attempts?: number;
  latencyMs?: number;
  fallbackReason?: string;
  llmDown?: boolean;
  error?: string;
};

const VERDICT: Record<Verdict, { en: string; hi: string; help: string }> = {
  wet: { en: "Wet", hi: "गीला", help: "Food scraps, peels, tea leaves" },
  dry: { en: "Dry", hi: "सूखा", help: "Plastic, paper, metal, glass" },
  mixed: { en: "Mixed", hi: "मिला हुआ", help: "Wet and dry in one bin" },
  hazardous: { en: "Hazardous", hi: "ख़तरनाक", help: "Batteries, bulbs, sharps" },
};

const STR = {
  en: {
    title: "One bin. One photo. One proof.",
    sub: "The collector already sees every bin. Alag turns that look into a dated, photo-backed register the ward can act on.",
    route: "Round",
    today: "Today",
    household: "Household",
    choose: "Choose a household",
    book: "Household book",
    photo: "Photograph the bin",
    retake: "Retake photo",
    photoHint: "One photo per bin, per pickup. Camera opens on a phone.",
    read: "Read this bin",
    reading: "Reading the bin",
    readHint: "BharatCode vision. If the model is down, you confirm the category yourself.",
    register: "Today's register",
    registerNote: "Every row is one photo-backed read. The rail colour is the verdict.",
    city: "Your city, on the record",
    cityNote: "PIN resolved through India Post, then matched to a published Swachh Survekshan row.",
    dumpsites: "Mapped dumpsites",
    dumpsitesNote: "Real OSM landfill elements near the round. Nothing is drawn from memory.",
    escalate: "When the bin stays mixed",
    escalateNote: "Send the record to the corporation that owns the ward.",
    kit: "Field kit",
    kitNote: "Route, air and place lookups. Live upstreams, honest failures.",
    save: "Record in the register",
    saved: "Recorded",
    nudge: "Send WhatsApp nudge",
    confirm: "Confirm the read",
    confidence: "confidence",
    manual: "Manual confirm",
    kg: "Estimated kg",
    add: "Add household",
    lookup: "Look up PIN",
    name: "Household name",
    house: "House / flat",
    street: "Street",
    pin: "PIN code",
    rwa: "RWA / colony",
    phone: "Mobile for the nudge",
    language: "Nudge language",
    offline: "Offline. The read is queued on this device and syncs when the network returns.",
    queue: "Offline queue",
    sync: "Sync now",
    queued: "Queued on this device",
    noHousehold: "Add or choose a household before recording.",
    noPhoto: "Take a photo first.",
  },
  hi: {
    title: "एक कूड़ेदान। एक फ़ोटो। एक सबूत।",
    sub: "कलेक्टर हर कूड़ेदान रोज़ देखता है। अलग उस नज़र को तारीख़ वाली, फ़ोटो-आधारित रजिस्टर में बदलता है जिस पर वार्ड काम कर सके।",
    route: "राउंड",
    today: "आज",
    household: "घर",
    choose: "घर चुनें",
    book: "घरों की किताब",
    photo: "कूड़ेदान की फ़ोटो लें",
    retake: "फिर फ़ोटो लें",
    photoHint: "हर कूड़ेदान की एक फ़ोटो, हर पिकअप पर। फ़ोन पर कैमरा खुलेगा।",
    read: "इस कूड़ेदान को पढ़ें",
    reading: "कूड़ेदान पढ़ा जा रहा है",
    readHint: "BharatCode vision। मॉडल बंद हो तो आप ख़ुद श्रेणी की पुष्टि करें।",
    register: "आज का रजिस्टर",
    registerNote: "हर पंक्ति एक फ़ोटो-आधारित पढ़ाई है। रेल का रंग नतीजा बताता है।",
    city: "आपका शहर, रिकॉर्ड पर",
    cityNote: "पिन India Post से, फिर प्रकाशित स्वच्छ सर्वेक्षण पंक्ति से मिलाया गया।",
    dumpsites: "मैप किए डंपसाइट",
    dumpsitesNote: "राउंड के पास असली OSM लैंडफ़िल। कुछ भी याद से नहीं बनाया गया।",
    escalate: "जब कूड़ेदान मिला हुआ ही रहे",
    escalateNote: "रिकॉर्ड उस निगम को भेजें जिसका यह वार्ड है।",
    kit: "फ़ील्ड किट",
    kitNote: "रूट, हवा और जगह की जानकारी। लाइव स्रोत, साफ़ गलती की स्थिति।",
    save: "रजिस्टर में दर्ज करें",
    saved: "दर्ज हुआ",
    nudge: "WhatsApp रिमाइंडर भेजें",
    confirm: "पढ़ाई की पुष्टि करें",
    confidence: "भरोसा",
    manual: "ख़ुद पुष्टि करें",
    kg: "अनुमानित किलो",
    add: "घर जोड़ें",
    lookup: "पिन देखें",
    name: "घर का नाम",
    house: "घर / फ्लैट",
    street: "गली",
    pin: "पिन कोड",
    rwa: "RWA / कॉलोनी",
    phone: "रिमाइंडर के लिए मोबाइल",
    language: "रिमाइंडर की भाषा",
    offline: "ऑफ़लाइन। पढ़ाई इस डिवाइस पर कतार में है और नेटवर्क आने पर सिंक होगी।",
    queue: "ऑफ़लाइन कतार",
    sync: "अब सिंक करें",
    queued: "इस डिवाइस पर कतार में",
    noHousehold: "दर्ज करने से पहले घर जोड़ें या चुनें।",
    noPhoto: "पहले फ़ोटो लें।",
  },
};

// The bin, named the way the person at the gate would say it. The four-way
// confirm is the only control on the verdict; the blue is the collector's
// colour in the SWM Rules 2016, so a clean dry bin is stated as it is.
const VERDICT_STRONG = {
  wet: { en: "Wet", hi: "गीला" },
  dry: { en: "Dry", hi: "सूखा" },
  mixed: { en: "Mixed", hi: "मिला हुआ" },
  hazardous: { en: "Hazardous", hi: "ख़तरनाक" },
} as const;

function verdictColor(v: string) {
  if (v === "wet" || v === "dry") return "green";
  if (v === "hazardous") return "red";
  return "ochre";
}

function dated(t: Date) {
  const parts = (l: string, f: string) => new Intl.DateTimeFormat(l, {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(t).toUpperCase();
  return `${parts("en-IN", "en")} · ${parts("hi-IN", "hi")}`;
}

function kgFor(i: Inspection) {
  const v = i.classification;
  const n =
    v === "wet" ? i.wet_kg : v === "dry" ? i.dry_kg : v === "hazardous" ? i.hazardous_kg : i.mixed_kg;
  return Number(n || 0);
}

function clock(ts: string) {
  if (!ts) return "";
  const d = new Date(ts.includes("T") ? ts : ts.replace(" ", "T") + "Z");
  if (Number.isNaN(d.getTime())) return ts;
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

export default function FieldTool() {
  const [lang, setLang] = useState<Lang>("en");
  const t = STR[lang];

  const [bins, setBins] = useState<Bin[]>([]);
  const [form, setForm] = useState({
    household_name: "",
    house_no: "",
    street: "",
    pincode: "110001",
    rwa: "Pilot RWA",
    phone: "",
    language: "hi",
  });
  const [pinInfo, setPinInfo] = useState<any>(null);
  const [pinErr, setPinErr] = useState("");
  const [pinBusy, setPinBusy] = useState(false);
  const [selectedBin, setSelectedBin] = useState<number | "">("");
  const [adding, setAdding] = useState(false);
  const [addMsg, setAddMsg] = useState("");

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState("");
  const [classifying, setClassifying] = useState(false);
  const [result, setResult] = useState<ClassifyResult | null>(null);
  const [confirmed, setConfirmed] = useState<Verdict>("mixed");
  const [kgs, setKgs] = useState({ wet: "", dry: "", mixed: "", hazardous: "" });

  const [savedMsg, setSavedMsg] = useState("");
  const [lastRef, setLastRef] = useState("");
  const [saving, setSaving] = useState(false);

  const [register, setRegister] = useState<Inspection[]>([]);
  const [registerErr, setRegisterErr] = useState("");

  const [queue, setQueue] = useState<any[]>([]);
  const [online, setOnline] = useState(true);

  const [cityData, setCityData] = useState<CityData | null>(null);
  const [cityLoading, setCityLoading] = useState(true);
  const [cityError, setCityError] = useState("");

  const [center, setCenter] = useState({ lat: 28.6139, lng: 77.209, label: "Connaught Place, New Delhi" });
  const [centerTouched, setCenterTouched] = useState(false);

  const [routeFrom, setRouteFrom] = useState("28.6139,77.2090");
  const [routeTo, setRouteTo] = useState("28.6297,77.2300");
  const [routeRes, setRouteRes] = useState<any>(null);
  const [routeErr, setRouteErr] = useState("");
  const [aqi, setAqi] = useState<any>(null);
  const [aqiErr, setAqiErr] = useState("");
  const [geoQ, setGeoQ] = useState("Connaught Place, New Delhi");
  const [geoRes, setGeoRes] = useState<any[]>([]);
  const [geoErr, setGeoErr] = useState("");

  const [today, setToday] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const activeBin = useMemo(
    () => bins.find((b) => b.id === Number(selectedBin)) || null,
    [bins, selectedBin]
  );
  const pincode = activeBin?.pincode || form.pincode;

  const loadBins = useCallback(async () => {
    try {
      const r = await fetch("/api/bins");
      const j = await r.json();
      if (Array.isArray(j)) setBins(j);
    } catch {
      // keep the previous list
    }
  }, []);

  const loadRegister = useCallback(async () => {
    try {
      const r = await fetch("/api/inspections");
      const j = await r.json();
      if (Array.isArray(j)) {
        setRegister(j);
        setRegisterErr("");
      }
    } catch {
      setRegisterErr("The register could not be read from this device's database. Retry after a save.");
    }
  }, []);

  useEffect(() => {
    setToday(
      new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    );
    loadBins();
    loadRegister();
    setOnline(navigator.onLine);
    try {
      setQueue(JSON.parse(localStorage.getItem("alag_queue") || "[]"));
    } catch {
      setQueue([]);
    }
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, [loadBins, loadRegister]);

  // Auto-select the first household once the book has one, so the camera is
  // usable on a fresh visit without an extra tap.
  useEffect(() => {
    if (selectedBin === "" && bins.length) setSelectedBin(bins[0].id);
  }, [bins, selectedBin]);

  useEffect(() => {
    if (!/^\d{6}$/.test(pincode)) {
      setCityData(null);
      setCityLoading(false);
      setCityError("Enter a 6-digit PIN to resolve the city.");
      return;
    }
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      setCityLoading(true);
      setCityError("");
      try {
        const r = await fetch(`/api/city-context?pincode=${pincode}`, { signal: ctrl.signal });
        const j = await r.json();
        if (!r.ok || !j.ok) {
          setCityData(null);
          setCityError(j.error || `City lookup failed (HTTP ${r.status}).`);
        } else {
          setCityData(j);
        }
      } catch (e: any) {
        if (e?.name !== "AbortError") {
          setCityData(null);
          setCityError("City lookup failed. India Post or data.gov.in may be unreachable.");
        }
      }
      setCityLoading(false);
    }, 350);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [pincode]);

  // Move the dumpsite map to the resolved district unless the collector has
  // already chosen a centre from the geocoder.
  useEffect(() => {
    if (!cityData?.ok || centerTouched) return;
    let cancelled = false;
    fetch(`/api/geocode?q=${encodeURIComponent(`${cityData.district}, ${cityData.state}, India`)}`)
      .then((r) => r.json())
      .then((j) => {
        if (!cancelled && Array.isArray(j) && j[0]) {
          setCenter({
            lat: j[0].lat,
            lng: j[0].lng,
            label: `${cityData.district}, ${cityData.state}`,
          });
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [cityData, centerTouched]);

  async function lookupPin() {
    setPinErr("");
    setPinInfo(null);
    setPinBusy(true);
    try {
      const r = await fetch(`/api/pincode/${form.pincode}`);
      const j = await r.json();
      if (!r.ok) setPinErr(j.error || `Lookup failed (HTTP ${r.status}).`);
      else setPinInfo(j);
    } catch {
      setPinErr("India Post is unreachable. Retry when the network is back.");
    }
    setPinBusy(false);
  }

  async function addBin() {
    if (!form.household_name.trim()) {
      setAddMsg("A household name is needed.");
      return;
    }
    setAdding(true);
    setAddMsg("");
    try {
      const r = await fetch("/api/bins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const bin = await r.json();
      if (!r.ok) {
        setAddMsg(bin.error || "The household could not be added.");
      } else {
        setSelectedBin(bin.id);
        setAddMsg(`${bin.household_name} added. The camera is ready.`);
        setForm((f) => ({ ...f, household_name: "", house_no: "" }));
        await loadBins();
      }
    } catch {
      setAddMsg("Network failed. The household was not saved.");
    }
    setAdding(false);
  }

  function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    setPhotoFile(f);
    setPhotoUrl(URL.createObjectURL(f));
    setResult(null);
    setSavedMsg("");
    setLastRef("");
  }

  async function classify() {
    if (!photoFile) {
      setSavedMsg(t.noPhoto);
      return;
    }
    setClassifying(true);
    setSavedMsg("");
    const fd = new FormData();
    fd.append("image", photoFile);
    fd.append("hint", `${activeBin?.rwa || form.rwa}, ${activeBin?.house_no || form.house_no}, pin ${pincode}`);
    try {
      const r = await fetch("/api/classify", { method: "POST", body: fd });
      const j = await r.json();
      if (!r.ok || j.error) {
        setResult({
          classification: "mixed",
          confidence: 0,
          source: "fallback",
          needsManualConfirm: true,
          note: j.error || `The vision service returned HTTP ${r.status}.`,
          error: j.error,
        });
        setConfirmed("mixed");
        setKgs({ wet: "0", dry: "0", mixed: "0", hazardous: "0" });
      } else {
        setResult(j);
        const v: Verdict = j.classification || "mixed";
        setConfirmed(v);
        setKgs({
          wet: String(j.wet_kg ?? 0),
          dry: String(j.dry_kg ?? 0),
          mixed: String(j.mixed_kg ?? 0),
          hazardous: String(j.hazardous_kg ?? 0),
        });
      }
    } catch {
      setResult({
        classification: "mixed",
        confidence: 0,
        source: "fallback",
        needsManualConfirm: true,
        note: "The photo could not reach the classifier. Confirm the category yourself; nothing was guessed.",
        error: "Network failed",
      });
      setConfirmed("mixed");
      setKgs({ wet: "0", dry: "0", mixed: "0", hazardous: "0" });
    }
    setClassifying(false);
  }

  async function saveInspection() {
    if (!activeBin) {
      setSavedMsg(t.noHousehold);
      return;
    }
    setSaving(true);
    const payload = {
      bin_id: activeBin.id,
      date: new Date().toISOString().slice(0, 10),
      day_offset: 0,
      classification: confirmed,
      compliance: confirmed === "wet" || confirmed === "dry" ? 1 : 0,
      source: result?.source || "manual",
      llm_note: result?.note || "",
      kabadi_requested: 0,
      wet_kg: Number(kgs.wet) || 0,
      dry_kg: Number(kgs.dry) || 0,
      mixed_kg: Number(kgs.mixed) || 0,
      hazardous_kg: Number(kgs.hazardous) || 0,
      photo_hash: photoFile ? `${photoFile.name}-${photoFile.size}` : "",
    };
    const ref = `${activeBin.house_no || activeBin.id}-${payload.date}`;

    if (!navigator.onLine) {
      const q = [
        ...queue,
        { ...payload, queuedAt: new Date().toISOString(), _label: activeBin.household_name },
      ];
      setQueue(q);
      localStorage.setItem("alag_queue", JSON.stringify(q));
      setSavedMsg(t.queued);
      setSaving(false);
      return;
    }

    try {
      const r = await fetch("/api/inspections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setLastRef(ref);
      setSavedMsg(`${t.saved}: ${VERDICT[confirmed].en} · ${Number(kgs[confirmed]) || 0} kg`);
      await loadRegister();
    } catch {
      const q = [
        ...queue,
        { ...payload, queuedAt: new Date().toISOString(), _label: activeBin.household_name },
      ];
      setQueue(q);
      localStorage.setItem("alag_queue", JSON.stringify(q));
      setSavedMsg(t.queued);
    }
    setSaving(false);
  }

  async function syncQueue() {
    const remaining: any[] = [];
    for (const item of queue) {
      const payload = { ...item };
      delete payload.queuedAt;
      delete payload._label;
      try {
        const r = await fetch("/api/inspections", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!r.ok) remaining.push(item);
      } catch {
        remaining.push(item);
      }
    }
    setQueue(remaining);
    localStorage.setItem("alag_queue", JSON.stringify(remaining));
    await loadRegister();
  }

  function waLink() {
    const name = activeBin?.household_name || form.household_name || "ji";
    const phone = (activeBin?.phone || form.phone || "").replace(/\D/g, "").slice(-10);
    const v = VERDICT[confirmed];
    const en = `Namaste ${name}. At today's pickup your bin was ${v.en}. Please keep wet (green) and dry (blue) separate: wet becomes compost, dry is recycled, mixed goes to the landfill. — Alag`;
    const hi = `नमस्ते ${name}। आज के पिकअप पर आपका कूड़ेदान ${v.hi} था। कृपया गीला (हरा) और सूखा (नीला) अलग रखें: गीला खाद बनता है, सूखा रीसायकल होता है, मिला हुआ लैंडफ़िल जाता है। — अलग`;
    const text = encodeURIComponent(lang === "hi" ? `${hi}\n${en}` : `${en}\n${hi}`);
    return phone.length === 10 ? `https://wa.me/91${phone}?text=${text}` : `https://wa.me/?text=${text}`;
  }

  async function calcRoute() {
    setRouteErr("");
    setRouteRes(null);
    const from = routeFrom.split(",").map((n) => Number(n.trim()));
    const to = routeTo.split(",").map((n) => Number(n.trim()));
    if (from.length !== 2 || to.length !== 2 || [...from, ...to].some((n) => !Number.isFinite(n))) {
      setRouteErr("Enter two coordinates as lat,lng.");
      return;
    }
    try {
      const r = await fetch(`/api/route?fromLat=${from[0]}&fromLng=${from[1]}&toLat=${to[0]}&toLng=${to[1]}`);
      const j = await r.json();
      if (!r.ok) setRouteErr(j.error || `OSRM returned HTTP ${r.status}.`);
      else setRouteRes(j);
    } catch {
      setRouteErr("OSRM is unreachable. Distances are never estimated locally.");
    }
  }

  async function loadAqi() {
    setAqiErr("");
    setAqi(null);
    try {
      const r = await fetch(`/api/aqi?lat=${center.lat}&lng=${center.lng}`);
      const j = await r.json();
      if (!r.ok) setAqiErr(j.error || `Open-Meteo returned HTTP ${r.status}.`);
      else setAqi(j);
    } catch {
      setAqiErr("Open-Meteo is unreachable. Retry.");
    }
  }

  async function searchGeo() {
    setGeoErr("");
    setGeoRes([]);
    try {
      const r = await fetch(`/api/geocode?q=${encodeURIComponent(geoQ)}`);
      const j = await r.json();
      if (!r.ok) setGeoErr(j.error || `Nominatim returned HTTP ${r.status}.`);
      else setGeoRes(Array.isArray(j) ? j : []);
    } catch {
      setGeoErr("Nominatim is unreachable. Retry.");
    }
  }

  const rail = verdictColor(confirmed);
  const strong = VERDICT_STRONG[confirmed];

  return (
    <>
      <section className="hero">
        <div className="row between" style={{ alignItems: "flex-start" }}>
          <div className="hero-head">
            <p className="hero-date">{today ? dated(new Date()) : "—"}</p>
            <h1 aria-label={STR.en.title}>
              <span className="hi">एक कूड़ेदान।</span>
              <span>एक फ़ोटो।</span>
              <span className="lat">एक सबूत।</span>
            </h1>
          </div>
          <button
            className="btn btn-quiet btn-sm"
            type="button"
            onClick={() => setLang(lang === "en" ? "hi" : "en")}
            aria-label="Language for labels and messages. Voice stays in the collector's language."
          >
            {lang === "en" ? "हिंदी" : "English"}
          </button>
        </div>
        <p className="hero-dek">
          <b lang="hi">कलेक्टर हर कूड़ेदान रोज़ देखता है।</b>{" "}
          Alag turns that look into a dated, photo-backed register: one photo a bin, one verdict the
          collector confirms, and the ward can act on the record.
        </p>
        <div className="hero-meta">
          <span>
            {t.route}: <b>{activeBin?.rwa || form.rwa || "Pilot RWA"}</b>
          </span>
          <span>
            {t.household}: <b>{activeBin?.household_name || "—"}</b>
          </span>
          <span className={online ? "tag green" : "tag ochre"}>
            <span className="dot" /> {online ? "Online" : "Offline"}
          </span>
          {queue.length > 0 && <span className="tag ochre">{queue.length} queued</span>}
        </div>
      </section>

      <div className="field-grid">
        <div>
          <section className="sheet" id="capture">
            <div className="sheet-head">
              <h2>{lang === "hi" ? "कैमरा" : "Capture"}</h2>
              <span className="sheet-meta">
                {photoFile ? (classifying ? t.reading : t.read) : t.photoHint}
              </span>
            </div>

            <div className="plate-block">
              <div className="household-strip">
                <label className="sr-only" htmlFor="household-select">
                  {t.choose}
                </label>
                <select
                  id="household-select"
                  className="select"
                  value={selectedBin}
                  onChange={(e) => setSelectedBin(e.target.value === "" ? "" : Number(e.target.value))}
                >
                  <option value="">{bins.length ? t.choose : "No household yet"}</option>
                  {bins.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.household_name} — {b.house_no || "no number"}, {b.rwa}
                    </option>
                  ))}
                </select>
                <button
                  className="btn btn-quiet mini-btn"
                  type="button"
                  onClick={() => {
                    const el = document.getElementById("household-book");
                    el?.scrollIntoView({ behavior: "smooth", block: "start" });
                    el?.setAttribute("open", "open");
                  }}
                >
                  {t.book}
                </button>
              </div>

              <div className="plate-top">
                <span>
                  {activeBin ? (
                    <>
                      <b>{activeBin.house_no || "House"}</b> · {activeBin.street || activeBin.rwa}
                    </>
                  ) : (
                    "Select a household above"
                  )}
                </span>
                <span>{photoFile ? "1 photo" : "0 photos"}</span>
              </div>

              <div className={`plate${classifying ? " scanning" : ""}`}>
                {photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photoUrl} alt="The bin photographed at this pickup" />
                ) : (
                  <div className="plate-empty">
                    <CameraIcon />
                    <b>{t.photo}</b>
                    <span>One bin, one frame. No gallery search, no stock photo.</span>
                  </div>
                )}
                <span className="corner tl" />
                <span className="corner tr" />
                <span className="corner bl" />
                <span className="corner br" />
                {classifying && <span className="scanline" />}
              </div>

              <div className="shutter-row">
                <button
                  className="shutter"
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={classifying}
                  aria-label={photoUrl ? t.retake : t.photo}
                >
                  <CameraIcon />
                </button>
                <div className="shutter-copy">
                  <b>{photoUrl ? t.retake : t.photo}</b>
                  <span>{t.photoHint}</span>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={onPhoto}
                  className="sr-only"
                  aria-label={t.photo}
                />
              </div>

              <div style={{ padding: "0 14px 14px", background: "var(--surface)" }}>
                <button
                  className="btn btn-primary btn-wide"
                  type="button"
                  onClick={classify}
                  disabled={!photoFile || classifying}
                  style={{ minHeight: 56 }}
                >
                  {classifying ? `${t.reading}…` : t.read}
                </button>
                <p className="source" style={{ marginTop: 6 }}>
                  {t.readHint}
                </p>
              </div>
            </div>

            {result && (
              <div style={{ borderTop: "1px solid var(--line)", marginTop: 14, paddingTop: 12 }}>
                <div className="verdict-row">
                  <div className={`verdict-word ${rail}`}>
                    <span className="word" lang="hi">{strong.hi}</span>
                    <span className="sub">
                      {strong.en}
                      {result.confidence != null && ` · ${Math.round((result.confidence || 0) * 100)}%`}
                    </span>
                  </div>
                  <div className="verdict-copy">
                    <p>
                      {t.confidence} ·{" "}
                      {result.source === "llm"
                        ? `BharatCode vision${result.attempts ? `, ${result.attempts} attempt${result.attempts > 1 ? "s" : ""}` : ""}${result.latencyMs ? `, ${(result.latencyMs / 1000).toFixed(1)} s` : ""}`
                        : result.source === "fallback"
                          ? "deterministic fallback"
                          : "manual read"}
                    </p>
                  </div>
                </div>

                {result.needsManualConfirm && (
                  <div className="notice">
                    <span className="notice-title">The model did not return a confident read.</span>
                    The category below is a safe starting point, not a verdict. Tap the bin you actually saw.{" "}
                    {result.fallbackReason ? `Upstream: ${result.fallbackReason}` : ""}
                  </div>
                )}
                {result.error && !result.needsManualConfirm && (
                  <div className="notice red">
                    <span className="notice-title">Vision read failed</span>
                    {result.error}
                  </div>
                )}
                {result.note && !result.needsManualConfirm && (
                  <p className="source" style={{ marginBottom: 8 }}>
                    {result.note}
                  </p>
                )}

                <label className="label">{t.confirm}</label>
                <div className="chips" role="group" aria-label={t.confirm}>
                  {(Object.keys(VERDICT) as Verdict[]).map((v) => (
                    <button
                      key={v}
                      type="button"
                      className="chip"
                      data-verdict={v}
                      aria-pressed={confirmed === v}
                      onClick={() => setConfirmed(v)}
                    >
                      {lang === "hi" ? VERDICT[v].hi : VERDICT[v].en}
                      <span>{VERDICT[v].help}</span>
                    </button>
                  ))}
                </div>

                <label className="label">{t.kg}</label>
                <div className="kg-grid">
                  {(["wet", "dry", "mixed", "hazardous"] as Verdict[]).map((v) => (
                    <div key={v}>
                      <label className="label" htmlFor={`kg-${v}`}>
                        {VERDICT[v].en} kg
                      </label>
                      <input
                        id={`kg-${v}`}
                        className="input"
                        inputMode="decimal"
                        value={kgs[v]}
                        onChange={(e) =>
                          setKgs({ ...kgs, [v]: e.target.value.replace(/[^\d.]/g, "").slice(0, 5) })
                        }
                      />
                    </div>
                  ))}
                </div>

                <button
                  className="btn btn-primary btn-wide"
                  type="button"
                  onClick={saveInspection}
                  disabled={saving || !activeBin}
                  style={{ minHeight: 54 }}
                >
                  {saving ? "Recording…" : t.save}
                </button>
                {!activeBin && <p className="source" style={{ marginTop: 6 }}>{t.noHousehold}</p>}
                {savedMsg && (
                  <div className="notice green" style={{ marginTop: 10 }} aria-live="polite">
                    <span className="notice-title">{savedMsg}</span>
                    {lastRef ? `Photo record ${lastRef}.` : ""}
                  </div>
                )}

                <div className="btn-row two" style={{ marginTop: 10 }}>
                  <a className="btn btn-quiet" href={waLink()} target="_blank" rel="noreferrer">
                    {t.nudge}
                  </a>
                  {confirmed === "dry" ? (
                    <a className="btn btn-ochre" href="#kabadi">
                      Ask a kabadi
                    </a>
                  ) : (
                    <a className="btn btn-quiet" href="#escalate">
                      {lang === "hi" ? "शिकायत दर्ज करें" : "File a complaint"}
                    </a>
                  )}
                </div>
                <p className="source" style={{ marginTop: 6 }}>
                  WhatsApp opens with a prefilled Hindi + English message. Alag never claims a send you did not make.
                </p>
              </div>
            )}

            {!result && savedMsg && (
              <div className="notice" style={{ marginTop: 12 }} aria-live="polite">
                {savedMsg}
              </div>
            )}
          </section>

          <section className="sheet">
            <div className="sheet-head">
              <h2>{t.register}</h2>
              <span className="sheet-meta">{register.length} records in this database</span>
            </div>
            <p className="sheet-lede">{t.registerNote}</p>

            <div className="ledger">
              <div className="ledger-head">
                <span>{t.household} / read</span>
                <span>Amount</span>
              </div>
              {register.length === 0 ? (
                <div className="ledger-empty">
                  <b>No inspections yet.</b> The first photo you record appears here with its verdict, source and kg.
                </div>
              ) : (
                register.slice(0, 8).map((i) => (
                  <div className="ledger-row" key={i.id}>
                    <span className={`rail ${verdictColor(i.classification)}`} aria-hidden="true" />
                    <div className="cell">
                      <div className="house">{i.household_name || `Bin ${i.bin_id}`}</div>
                      <div className="meta">
                        {VERDICT[i.classification]?.en || i.classification} · {i.rwa || "Pilot RWA"} ·{" "}
                        {i.date} {clock(i.created_at)} · {i.source === "llm" ? "vision" : i.source}
                      </div>
                    </div>
                    <div className="cell right">
                      <div className="amount num">
                        {kgFor(i) > 0 ? `${kgFor(i).toFixed(1)} kg` : "—"}
                        <small>{i.classification === "mixed" ? "still mixed" : i.classification}</small>
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div className="ledger-foot">
                Showing the latest {Math.min(8, register.length)}. Photos are hashed; the image is not stored by the server.
                {registerErr ? ` ${registerErr}` : ""}
              </div>
            </div>

            {queue.length > 0 && (
              <div className="notice" style={{ marginTop: 12 }}>
                <span className="notice-title">
                  {t.queue} · {queue.length}
                </span>
                {queue.slice(0, 3).map((q, i) => (
                  <span key={i} style={{ display: "block" }}>
                    {q._label || "Bin"} · {q.classification}, queued {clock(q.queuedAt || "")}
                  </span>
                ))}
                <button className="btn btn-ink btn-sm" type="button" onClick={syncQueue} style={{ marginTop: 8 }}>
                  {t.sync}
                </button>
              </div>
            )}

            {!online && <div className="notice">{t.offline}</div>}
          </section>
        </div>

        <aside>
          <section className="sheet">
            <div className="sheet-head">
              <h2>{t.city}</h2>
              <span className="sheet-meta">PIN {pincode}</span>
            </div>
            <p className="sheet-lede">{t.cityNote}</p>
            <CityContext data={cityData} loading={cityLoading} error={cityError} pincode={pincode} />
          </section>

          <section className="sheet">
            <div className="sheet-head">
              <h2>{t.dumpsites}</h2>
              <span className="sheet-meta">25 km box</span>
            </div>
            <p className="sheet-lede">{t.dumpsitesNote}</p>
            <LandfillPanel lat={center.lat} lng={center.lng} label={center.label} />
          </section>

          <details className="sheet kit" id="household-book">
            <summary>
              <span>{t.book}</span>
              <span className="plus" aria-hidden="true">
                +
              </span>
            </summary>
            <div className="kit-body">
              <p className="small muted" style={{ marginBottom: 10 }}>
                A household is a real address on the round. The PIN is checked against India Post before it is saved.
              </p>
              <label className="label" htmlFor="hname">
                {t.name}
              </label>
              <input
                id="hname"
                className="input"
                value={form.household_name}
                onChange={(e) => setForm({ ...form, household_name: e.target.value })}
                placeholder="Sharma Residence"
                autoComplete="off"
              />
              <div className="grid-2" style={{ marginTop: 10 }}>
                <div>
                  <label className="label" htmlFor="hno">
                    {t.house}
                  </label>
                  <input
                    id="hno"
                    className="input"
                    value={form.house_no}
                    onChange={(e) => setForm({ ...form, house_no: e.target.value })}
                    placeholder="B-42"
                  />
                </div>
                <div>
                  <label className="label" htmlFor="hstreet">
                    {t.street}
                  </label>
                  <input
                    id="hstreet"
                    className="input"
                    value={form.street}
                    onChange={(e) => setForm({ ...form, street: e.target.value })}
                    placeholder="MG Road"
                  />
                </div>
              </div>
              <label className="label" htmlFor="hpin" style={{ marginTop: 10 }}>
                {t.pin}
              </label>
              <div className="row" style={{ gap: 8 }}>
                <input
                  id="hpin"
                  className="input"
                  style={{ maxWidth: 130 }}
                  value={form.pincode}
                  onChange={(e) =>
                    setForm({ ...form, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })
                  }
                  inputMode="numeric"
                  placeholder="110001"
                />
                <button className="btn btn-quiet btn-sm" type="button" onClick={lookupPin} disabled={pinBusy}>
                  {pinBusy ? "Checking…" : t.lookup}
                </button>
              </div>
              {pinErr && <p className="source" style={{ color: "var(--red)" }}>{pinErr}</p>}
              {pinInfo && (
                <p className="source" style={{ color: "var(--green-dark)" }}>
                  {pinInfo.district}, {pinInfo.state} · {pinInfo.offices?.[0]?.name || "India Post"}
                </p>
              )}
              <div className="grid-2" style={{ marginTop: 10 }}>
                <div>
                  <label className="label" htmlFor="hrwa">
                    {t.rwa}
                  </label>
                  <input
                    id="hrwa"
                    className="input"
                    value={form.rwa}
                    onChange={(e) => setForm({ ...form, rwa: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label" htmlFor="hphone">
                    {t.phone}
                  </label>
                  <input
                    id="hphone"
                    className="input"
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })
                    }
                    inputMode="tel"
                    placeholder="10-digit"
                  />
                </div>
              </div>
              <label className="label" htmlFor="hlang" style={{ marginTop: 10 }}>
                {t.language}
              </label>
              <select
                id="hlang"
                className="select"
                value={form.language}
                onChange={(e) => setForm({ ...form, language: e.target.value })}
              >
                <option value="hi">हिंदी</option>
                <option value="en">English</option>
              </select>
              <button
                className="btn btn-ink btn-wide"
                type="button"
                onClick={addBin}
                disabled={adding}
                style={{ marginTop: 12 }}
              >
                {adding ? "Adding…" : t.add}
              </button>
              {addMsg && (
                <p className="source" style={{ marginTop: 6 }} aria-live="polite">
                  {addMsg}
                </p>
              )}

              {bins.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <p className="label">Saved households</p>
                  <div className="ledger">
                    {bins.slice(0, 6).map((b) => (
                      <div className="ledger-row" key={b.id}>
                        <span className={`rail ${b.id === Number(selectedBin) ? "green" : ""}`} aria-hidden="true" />
                        <div className="cell">
                          <div className="house">{b.household_name}</div>
                          <div className="meta">
                            {b.house_no || "No number"} · {b.rwa} · PIN {b.pincode || "—"}
                          </div>
                        </div>
                        <div className="cell right">
                          <button
                            className="btn btn-quiet btn-sm"
                            type="button"
                            onClick={() => setSelectedBin(b.id)}
                          >
                            {b.id === Number(selectedBin) ? "Selected" : "Use"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </details>
        </aside>
      </div>

      <section className="sheet" id="escalate">
        <div className="sheet-head">
          <h2>{t.escalate}</h2>
          <span className="sheet-meta">Official portal + copyable text</span>
        </div>
        <p className="sheet-lede">{t.escalateNote}</p>
        <div style={{ maxWidth: 820 }}>
          <Escalate
            address={
              activeBin
                ? [activeBin.house_no, activeBin.street].filter(Boolean).join(", ")
                : [form.house_no, form.street].filter(Boolean).join(", ")
            }
            pincode={pincode}
            city={cityData?.city || cityData?.district || "Delhi"}
            state={cityData?.state || "Delhi"}
            verdict={VERDICT[confirmed].en}
            recordRef={lastRef}
          />
        </div>
      </section>

      <section className="sheet">
        <div className="sheet-head">
          <h2>{t.kit}</h2>
          <span className="sheet-meta">{t.kitNote}</span>
        </div>

        <details className="kit" open>
          <summary>
            <span>Collection route · OSRM driving</span>
            <span className="plus" aria-hidden="true">
              +
            </span>
          </summary>
          <div className="kit-body">
            <div className="grid-2">
              <div>
                <label className="label" htmlFor="from">
                  From, lat,lng
                </label>
                <input id="from" className="input" value={routeFrom} onChange={(e) => setRouteFrom(e.target.value)} />
              </div>
              <div>
                <label className="label" htmlFor="to">
                  To, lat,lng
                </label>
                <input id="to" className="input" value={routeTo} onChange={(e) => setRouteTo(e.target.value)} />
              </div>
            </div>
            <button className="btn btn-quiet btn-sm" type="button" onClick={calcRoute} style={{ marginTop: 10 }}>
              Measure the drive
            </button>
            {routeErr && <p className="source" style={{ color: "var(--red)" }}>{routeErr}</p>}
            {routeRes && (
              <p style={{ marginTop: 8 }}>
                <strong className="num">{routeRes.distanceKm} km</strong> ·{" "}
                <strong className="num">{routeRes.durationMin} min</strong>{" "}
                <span className="source">OSRM driving profile, live.</span>
              </p>
            )}
          </div>
        </details>

        <details className="kit">
          <summary>
            <span>Air at the round · Open-Meteo</span>
            <span className="plus" aria-hidden="true">
              +
            </span>
          </summary>
          <div className="kit-body">
            <button className="btn btn-quiet btn-sm" type="button" onClick={loadAqi}>
              Read air at {center.label}
            </button>
            {aqiErr && <p className="source" style={{ color: "var(--red)" }}>{aqiErr}</p>}
            {aqi && (
              <p style={{ marginTop: 8 }}>
                <strong className="num">US AQI {aqi.usAqi}</strong>{" "}
                <span className="source">
                  PM2.5 {aqi.pm25} · PM10 {aqi.pm10} · {aqi.time} · Open-Meteo / CAMS.
                </span>
              </p>
            )}
          </div>
        </details>

        <details className="kit">
          <summary>
            <span>Place search and map centre · Nominatim</span>
            <span className="plus" aria-hidden="true">
              +
            </span>
          </summary>
          <div className="kit-body">
            <div className="row" style={{ gap: 8 }}>
              <input
                className="input"
                style={{ flex: "1 1 200px" }}
                value={geoQ}
                onChange={(e) => setGeoQ(e.target.value)}
                placeholder="Area, city"
              />
              <button className="btn btn-quiet btn-sm" type="button" onClick={searchGeo}>
                Search
              </button>
            </div>
            {geoErr && <p className="source" style={{ color: "var(--red)" }}>{geoErr}</p>}
            {geoRes.map((g, i) => (
              <div className="context-line" key={i}>
                <span className="k">{g.name}</span>
                <span className="v">
                  {Number(g.lat).toFixed(4)}, {Number(g.lng).toFixed(4)}
                  <button
                    className="btn btn-quiet btn-sm"
                    type="button"
                    style={{ marginTop: 4 }}
                    onClick={() => {
                      setCenter({ lat: Number(g.lat), lng: Number(g.lng), label: g.name.split(",")[0] });
                      setCenterTouched(true);
                    }}
                  >
                    Centre the map here
                  </button>
                </span>
              </div>
            ))}
          </div>
        </details>

        <div className="notice" style={{ marginTop: 16 }}>
          <span className="notice-title">No hidden numbers</span>
          A missing upstream shows its error and a retry. The register never fills a gap with a plausible value. Template pilot
          figures live only on the <a href="/dashboard">pilot ledger</a>, where they are labelled.
        </div>
      </section>
    </>
  );
}
