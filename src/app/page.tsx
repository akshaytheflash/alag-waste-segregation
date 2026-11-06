"use client";
import { useEffect, useState } from "react";

type Lang = "en" | "hi";
const STR = {
  en: {
    title: "One photo per bin. Proof of segregation.",
    sub: "Alag turns the collector’s daily round into household-level evidence for Swachh Bharat 2.0. No hardware — just this PWA.",
    household: "Household",
    householdName: "Household name",
    houseNo: "House / flat no.",
    street: "Street",
    pincode: "PIN code",
    lookup: "Lookup PIN → district/state (India Post, live)",
    rwa: "RWA / colony",
    phone: "Household mobile (for WhatsApp nudge)",
    language: "Nudge language",
    addBin: "Add household",
    photo: "🟢 Take / upload bin photo",
    photoHint: "Mobile camera opens on phones. One photo per bin, per day.",
    classify: "Classify with BharatCode vision →",
    classifying: "Classifying… (vision LLM, retries with backoff)",
    llmDown: "LLM unavailable — deterministic fallback engaged. Confirm below:",
    wet: "Wet / गीला",
    dry: "Dry / सूखा",
    mixed: "Mixed / मिला हुआ",
    hazardous: "Hazardous / ख़तरनाक",
    wetKg: "Wet kg",
    dryKg: "Dry kg",
    mixedKg: "Mixed kg",
    save: "Save inspection",
    saved: "Saved ✓",
    whatsapp: "Send WhatsApp nudge (deep link)",
    whatsappHint: "Opens WhatsApp with a prefilled multilingual message. We never fake a send — you tap Send in WhatsApp.",
    kabadi: "♻️ Request kabadi pickup (dry waste)",
    kabadiDone: "Kabadi request saved ✓",
    queue: "Offline queue",
    offline: "You’re offline — photos will queue on this device and sync when back.",
    routeTitle: "Collection route (live OSRM)",
    from: "From (lat,lng)",
    to: "To (lat,lng)",
    calcRoute: "Compute live distance",
    aqiTitle: "Local AQI (live Open-Meteo)",
    langToggle: "हिंदी / EN",
    picker: "Saved households",
    select: "Select household…",
    geocodeTitle: "Find coordinates (live Nominatim)",
    searchPlace: "Search city / area…",
  },
  hi: {
    title: "हर कूड़ेदान की एक फ़ोटो। पृथक्कीकरण का सबूत।",
    sub: "अलग कलेक्टर के रोज़ के राउंड को स्वच्छ भारत 2.0 के लिए घर-स्तर की रिपोर्ट में बदलता है। कोई हार्डवेयर नहीं — बस यह PWA।",
    household: "घर-परिवार",
    householdName: "घर का नाम",
    houseNo: "घर / फ्लैट नं.",
    street: "गली",
    pincode: "पिन कोड",
    lookup: "पिन कोड से ज़िला/राज्य देखें (India Post, लाइव)",
    rwa: "RWA / कॉलोनी",
    phone: "घर का मोबाइल (WhatsApp रिमाइंडर के लिए)",
    language: "रिमाइंडर की भाषा",
    addBin: "घर जोड़ें",
    photo: "🟢 कूड़ेदान की फ़ोटो लें / डालें",
    photoHint: "मोबाइल पर कैमरा खुलेगा। हर कूड़ेदान की दिन में एक फ़ोटो।",
    classify: "BharatCode vision से छाँटें →",
    classifying: "छाँट रहे हैं… (vision LLM, बैकऑफ़ के साथ)",
    llmDown: "LLM उपलब्ध नहीं — डिटर्मिनिस्टिक फ़ॉलबैक चालू। नीचे पुष्टि करें:",
    wet: "गीला",
    dry: "सूखा",
    mixed: "मिला हुआ",
    hazardous: "ख़तरनाक",
    wetKg: "गीला (kg)",
    dryKg: "सूखा (kg)",
    mixedKg: "मिला (kg)",
    save: "जाँच सहेजें",
    saved: "सहेजा गया ✓",
    whatsapp: "WhatsApp रिमाइंडर भेजें (डीप लिंक)",
    whatsappHint: "पहले से लिखा हुआ मल्टीलिंगुअल संदेश WhatsApp में खुलेगा। हम भेजा हुआ नहीं दिखाएँगे — आप WhatsApp में Send दबाएँगे।",
    kabadi: "♻️ कचरे के कबाड़ी को बुलाएँ (सूखा कचरा)",
    kabadiDone: "कबाड़ी अनुरोध सहेजा गया ✓",
    queue: "ऑफ़लाइन कतार",
    offline: "आप ऑफ़लाइन हैं — फ़ोटो इस डिवाइस में सहेजेंगे और ऑनलाइन होते ही सिंक होंगे।",
    routeTitle: "संग्रह मार्ग (लाइव OSRM)",
    from: "से (lat,lng)",
    to: "तक (lat,lng)",
    calcRoute: "लाइव दूरी निकालें",
    aqiTitle: "स्थानीय AQI (लाइव Open-Meteo)",
    langToggle: "EN / हिंदी",
    picker: "सहेजे गए घर",
    select: "घर चुनें…",
    geocodeTitle: "कोऑर्डिनेट खोजें (लाइव Nominatim)",
    searchPlace: "शहर / इलाका खोजें…",
  },
};

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

export default function Home() {
  const [lang, setLang] = useState<Lang>("en");
  const t = STR[lang];
  const [bins, setBins] = useState<Bin[]>([]);
  const [form, setForm] = useState({ household_name: "", house_no: "", street: "", pincode: "110001", rwa: "Pilot RWA", phone: "9876543210", language: "hi" });
  const [pinInfo, setPinInfo] = useState<any>(null);
  const [pinErr, setPinErr] = useState("");
  const [selectedBin, setSelectedBin] = useState<number | "">("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState("");
  const [classifying, setClassifying] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [confirmed, setConfirmed] = useState("wet");
  const [savedMsg, setSavedMsg] = useState("");
  const [kabadiMsg, setKabadiMsg] = useState("");
  const [queue, setQueue] = useState<any[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("alag_queue") || "[]");
    } catch {
      return [];
    }
  });
  const [online, setOnline] = useState(true);
  const [routeFrom, setRouteFrom] = useState("28.6139,77.2090");
  const [routeTo, setRouteTo] = useState("28.6297,77.2300");
  const [routeRes, setRouteRes] = useState<any>(null);
  const [routeErr, setRouteErr] = useState("");
  const [aqi, setAqi] = useState<any>(null);
  const [aqiErr, setAqiErr] = useState("");
  const [geoQ, setGeoQ] = useState("Connaught Place, New Delhi");
  const [geoRes, setGeoRes] = useState<any[]>([]);

  useEffect(() => {
    loadBins();
    setOnline(navigator.onLine);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  async function loadBins() {
    try {
      const r = await fetch("/api/bins");
      setBins(await r.json());
    } catch {}
  }

  async function lookupPin() {
    setPinErr("");
    setPinInfo(null);
    try {
      const r = await fetch(`/api/pincode/${form.pincode}`);
      const j = await r.json();
      if (!r.ok) setPinErr(j.error || "Lookup failed");
      else setPinInfo(j);
    } catch {
      setPinErr("Network error. India Post API unreachable — check connection and retry.");
    }
  }

  async function addBin() {
    const r = await fetch("/api/bins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const bin = await r.json();
    if (r.ok) {
      setSelectedBin(bin.id);
      loadBins();
    } else alert(bin.error || "Failed to add household");
  }

  function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setPhotoFile(f);
    setResult(null);
    setPhotoUrl(URL.createObjectURL(f));
  }

  async function classify() {
    if (!photoFile) {
      alert("Take a photo first");
      return;
    }
    setClassifying(true);
    const fd = new FormData();
    fd.append("image", photoFile);
    fd.append("hint", `${form.rwa}, ${form.house_no}, pin ${form.pincode}`);
    try {
      const r = await fetch("/api/classify", { method: "POST", body: fd });
      const j = await r.json();
      setResult(j);
      setConfirmed(j.classification || "wet");
    } catch {
      setResult({ error: "Network failed. Offline queue saved.", classification: "mixed", source: "fallback", note: "Offline — deterministic fallback", needsManualConfirm: true });
    }
    setClassifying(false);
  }

  async function saveInspection(kabadi = false) {
    const binId = Number(selectedBin);
    if (!binId) {
      alert("Select a household first");
      return;
    }
    const classification = confirmed;
    const payload: any = {
      bin_id: binId,
      date: new Date().toISOString().slice(0, 10),
      day_offset: 0,
      classification,
      compliance: classification !== "mixed" ? 1 : 0,
      source: result?.source || "manual",
      llm_note: result?.note || "",
      kabadi_requested: kabadi ? 1 : 0,
      wet_kg: result?.wet_kg ?? 0,
      dry_kg: result?.dry_kg ?? 0,
      mixed_kg: result?.mixed_kg ?? 0,
      hazardous_kg: result?.hazardous_kg ?? 0,
      photo_hash: photoFile ? `${photoFile.name}-${photoFile.size}` : "",
    };
    // Offline-first: queue to localStorage when offline or fetch fails
    if (!navigator.onLine) {
      const q = [...queue, { ...payload, queuedAt: new Date().toISOString(), _label: bins.find((b) => b.id === binId)?.household_name }];
      setQueue(q);
      localStorage.setItem("alag_queue", JSON.stringify(q));
      setSavedMsg(lang === "hi" ? "ऑफ़लाइन — कतार में सहेजा गया ✓" : "Offline — queued on device ✓ (will sync when online)");
      return;
    }
    try {
      const r = await fetch("/api/inspections", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (r.ok) {
        setSavedMsg(t.saved);
        if (kabadi) setKabadiMsg(t.kabadiDone);
        setTimeout(() => setSavedMsg(""), 3000);
      } else {
        const q = [...queue, payload];
        setQueue(q);
        localStorage.setItem("alag_queue", JSON.stringify(q));
        setSavedMsg(lang === "hi" ? "कतार में सहेजा गया (फिर कोशिश होगी)" : "Saved to queue (will retry)");
      }
    } catch {
      const q = [...queue, payload];
      setQueue(q);
      localStorage.setItem("alag_queue", JSON.stringify(q));
      setSavedMsg(lang === "hi" ? "ऑफ़लाइन कतार में सहेजा गया ✓" : "Offline — queued ✓");
    }
  }

  function waLink() {
    const bin = bins.find((b) => b.id === Number(selectedBin));
    const phone = bin?.phone || form.phone || "9876543210";
    const name = bin?.household_name || form.household_name || "Namaste";
    const msgEn = `Namaste ${name}! 🙏 Your bin today was *${confirmed.toUpperCase()}*. Please keep *wet (green)* and *dry (blue)* separate — wet waste becomes compost, dry waste is recycled. If mixed, it goes to landfill. Thank you for Swachh Bharat! — Alag`;
    const msgPin = `नमस्ते ${name}! 🙏 आज आपका कूड़ेदान *${confirmed.toUpperCase()}* था। कृपया *गीला (हरा)* और *सूखा (नीला)* अलग रखें — गीला खाद बनता है, सूखा रीसायकल होता है। मिला हुआ लैंडफ़िल जाता है। स्वच्छ भारत के लिए धन्यवाद! — अलग`;
    const text = encodeURIComponent(form.language === "hi" ? msgPin : `${msgEn}\n${msgPin}`.slice(0, 600));
    return `https://wa.me/91${phone.replace(/\D/g, "").slice(-10)}?text=${text}`;
  }

  async function calcRoute() {
    setRouteErr("");
    setRouteRes(null);
    const [flat, flng] = routeFrom.split(",").map(Number);
    const [tlng, tlat] = [routeTo.split(",").map(Number)[1], routeTo.split(",").map(Number)[0]];
    try {
      // routeFrom/To are "lat,lng"
      const r = await fetch(`/api/route?fromLat=${flat}&fromLng=${flng}&toLat=${tlat}&toLng=${tlng}`);
      const j = await r.json();
      if (!r.ok) setRouteErr(j.error || "Route failed");
      else setRouteRes(j);
    } catch {
      setRouteErr("OSRM unreachable. Retry — distance is never estimated.");
    }
  }

  async function loadAqi() {
    setAqiErr("");
    try {
      const r = await fetch(`/api/aqi?lat=28.6139&lng=77.2090`);
      const j = await r.json();
      if (!r.ok) setAqiErr(j.error || "AQI failed");
      else setAqi(j);
    } catch {
      setAqiErr("Open-Meteo unreachable. Retry.");
    }
  }

  async function searchGeo() {
    try {
      const r = await fetch(`/api/geocode?q=${encodeURIComponent(geoQ)}`);
      setGeoRes(await r.json());
    } catch {
      setGeoRes([]);
    }
  }

  return (
    <div>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <span className="badge badge-green">● {online ? "Live" : "Offline"} {queue.length > 0 && `• ${queue.length} queued`}</span>
        <button className="btn btn-ghost" style={{ padding: "6px 12px", fontSize: "0.85rem" }} onClick={() => setLang(lang === "en" ? "hi" : "en")}>{t.langToggle}</button>
      </div>

      {!online && <div className="offline" style={{ marginTop: 8 }}>{t.offline}</div>}

      <h1 style={{ marginTop: 10 }}>{t.title}</h1>
      <p className="muted">{t.sub}</p>

      {/* Household */}
      <div className="card">
        <h2>{t.household}</h2>
        <label>{t.householdName}</label>
        <input value={form.household_name} onChange={(e) => setForm({ ...form, household_name: e.target.value })} placeholder="Sharma Residence" />
        <div className="grid2">
          <div>
            <label>{t.houseNo}</label>
            <input value={form.house_no} onChange={(e) => setForm({ ...form, house_no: e.target.value })} placeholder="B-42" />
          </div>
          <div>
            <label>{t.street}</label>
            <input value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} placeholder="MG Road" />
          </div>
        </div>
        <label>{t.pincode}</label>
        <div className="row">
          <input style={{ maxWidth: 140 }} value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })} inputMode="numeric" />
          <button className="btn btn-ghost" onClick={lookupPin} style={{ flex: 1 }}>{t.lookup}</button>
        </div>
        {pinErr && <p style={{ color: "var(--red)", fontSize: "0.85rem" }}>⚠️ {pinErr} <span className="muted">(retry button above)</span></p>}
        {pinInfo && (
          <p style={{ fontSize: "0.9rem" }}>
            <span className="badge badge-blue">{pinInfo.district}, {pinInfo.state}</span>{" "}
            <span className="muted">Circle: {pinInfo.circle} • {pinInfo.offices?.[0]?.name}</span>
          </p>
        )}
        <div className="grid2">
          <div>
            <label>{t.rwa}</label>
            <input value={form.rwa} onChange={(e) => setForm({ ...form, rwa: e.target.value })} placeholder="Green Valley RWA" />
          </div>
          <div>
            <label>{t.phone}</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} inputMode="tel" />
          </div>
        </div>
        <label>{t.language}</label>
        <select value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })}>
          <option value="hi">हिंदी (nudge in Hindi)</option>
          <option value="en">English</option>
        </select>
        <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 12 }} onClick={addBin}>{t.addBin}</button>

        <label style={{ marginTop: 14 }}>{t.picker}</label>
        <select value={selectedBin} onChange={(e) => setSelectedBin(e.target.value === "" ? "" : Number(e.target.value))}>
          <option value="">{t.select}</option>
          {bins.map((b) => (
            <option key={b.id} value={b.id}>{b.household_name} — {b.house_no}, {b.rwa}</option>
          ))}
        </select>
      </div>

      {/* Photo */}
      <div className="card">
        <h2>📸 {t.photo}</h2>
        <p className="muted">{t.photoHint}</p>
        <input type="file" accept="image/*" capture="environment" onChange={onPhoto} />
        {photoUrl && <img src={photoUrl} alt="bin photo" className="photo-preview" />}
        <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 10 }} disabled={!photoFile || classifying} onClick={classify}>
          {classifying ? t.classifying : t.classify}
        </button>
        {result?.llmDown && <p><span className="badge badge-amber">{t.llmDown}</span> <span className="muted">{result.fallbackReason}</span></p>}
        {result?.source && (
          <p style={{ fontSize: "0.9rem" }}>
            <span className={`badge ${result.classification === "wet" || result.classification === "dry" ? "badge-green" : "badge-red"}`}>
              {result.classification.toUpperCase()} • conf {Math.round((result.confidence || 0) * 100)}% • {result.source === "llm" ? "BharatCode Vision" : "Deterministic fallback"}{result.attempts ? ` • ${result.attempts} attempts` : ""}
            </span>{" "}
            {result.note}
          </p>
        )}
        {result?.classification && (
          <>
            <label>Confirm classification (one tap)</label>
            <div className="row" style={{ gap: 6 }}>
              {(["wet", "dry", "mixed", "hazardous"] as const).map((c) => (
                <button key={c} className={`btn ${confirmed === c ? "btn-primary" : "btn-ghost"}`} style={{ padding: "8px 12px", flex: 1, justifyContent: "center" }} onClick={() => setConfirmed(c)}>
                  {c === "wet" ? t.wet : c === "dry" ? t.dry : c === "mixed" ? t.mixed : t.hazardous}
                </button>
              ))}
            </div>
          </>
        )}
        <div className="row" style={{ marginTop: 12 }}>
          <button className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }} onClick={() => saveInspection(false)}>{t.save} {savedMsg ? `✓` : ""}</button>
          <a className="btn btn-green" style={{ flex: 1.4, justifyContent: "center" }} href={waLink()} target="_blank" rel="noreferrer">{t.whatsapp}</a>
        </div>
        <p className="muted" style={{ marginTop: 6 }}>{t.whatsappHint}</p>
        {savedMsg && <p><span className="badge badge-green">{savedMsg}</span></p>}
        <button className="btn btn-amber" style={{ width: "100%", justifyContent: "center", marginTop: 8 }} onClick={() => saveInspection(true)}>{t.kabadi} {kabadiMsg ? `✓` : ""}</button>
      </div>

      {/* Route + AQI — live */}
      <div className="card">
        <h2>🗺️ {t.routeTitle}</h2>
        <div className="grid2">
          <div><label>{t.from}</label><input value={routeFrom} onChange={(e) => setRouteFrom(e.target.value)} placeholder="28.6139,77.2090" /></div>
          <div><label>{t.to}</label><input value={routeTo} onChange={(e) => setRouteTo(e.target.value)} placeholder="28.6297,77.2300" /></div>
        </div>
        <button className="btn btn-ghost" style={{ width: "100%", justifyContent: "center", marginTop: 8 }} onClick={calcRoute}>{t.calcRoute}</button>
        {routeErr && <p style={{ color: "var(--red)", fontSize: "0.85rem" }}>⚠️ {routeErr}</p>}
        {routeRes && <p><strong>{routeRes.distanceKm} km</strong> • <strong>{routeRes.durationMin} min</strong> <span className="muted">(OSRM driving, live — never estimated)</span></p>}

        <h3 style={{ marginTop: 14 }}>🌬️ {t.aqiTitle}</h3>
        <button className="btn btn-ghost" onClick={loadAqi} style={{ width: "100%", justifyContent: "center" }}>Load AQI (New Delhi)</button>
        {aqiErr && <p style={{ color: "var(--red)", fontSize: "0.85rem" }}>⚠️ {aqiErr}</p>}
        {aqi && <p><span className="badge badge-amber">AQI {aqi.usAqi}</span> <span className="muted">PM2.5 {aqi.pm25} • {aqi.time} • Open-Meteo live</span></p>}

        <h3 style={{ marginTop: 14 }}>📍 {t.geocodeTitle}</h3>
        <div className="row">
          <input value={geoQ} onChange={(e) => setGeoQ(e.target.value)} placeholder={t.searchPlace} style={{ flex: 1 }} />
          <button className="btn btn-ghost" onClick={searchGeo}>Search</button>
        </div>
        {geoRes.map((g, i) => (
          <p key={i} style={{ fontSize: "0.85rem" }}>{g.name} <span className="muted">({g.lat.toFixed(4)}, {g.lng.toFixed(4)})</span></p>
        ))}
      </div>

      {queue.length > 0 && (
        <div className="card">
          <h3>📤 {t.queue} ({queue.length})</h3>
          {queue.slice(0, 5).map((q, i) => (
            <p key={i} style={{ fontSize: "0.85rem" }}>{q._label || "Bin"} — {q.classification} <span className="muted">queued {q.queuedAt}</span></p>
          ))}
          <button
            className="btn btn-primary"
            style={{ width: "100%", justifyContent: "center" }}
            onClick={async () => {
              let remaining = [];
              for (const item of queue) {
                const payload = { ...item };
                delete payload.queuedAt;
                delete payload._label;
                try {
                  const r = await fetch("/api/inspections", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
                  if (!r.ok) remaining.push(item);
                } catch {
                  remaining.push(item);
                }
              }
              setQueue(remaining);
              localStorage.setItem("alag_queue", JSON.stringify(remaining));
            }}
          >
            Sync now
          </button>
        </div>
      )}
    </div>
  );
}
