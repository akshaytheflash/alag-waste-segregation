"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CityContext, { type CityData } from "@/components/CityContext";
import LandfillPanel from "@/components/LandfillPanel";
import Escalate from "@/components/Escalate";
import { CameraIcon } from "@/components/Icons";
import FloatingRegister from "@/components/FloatingRegister";
import { useI18n } from "@/components/I18nProvider";
import type { MessageKey } from "@/lib/i18n";

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

const VERDICT_KEY: Record<Verdict, MessageKey> = {
  wet: "field.verdict.wet",
  dry: "field.verdict.dry",
  mixed: "field.verdict.mixed",
  hazardous: "field.verdict.hazardous",
};

const VERDICT_HELP_KEY: Record<Verdict, MessageKey> = {
  wet: "field.verdict.wetHelp",
  dry: "field.verdict.dryHelp",
  mixed: "field.verdict.mixedHelp",
  hazardous: "field.verdict.hazardousHelp",
};

// English and Hindi verdict words are part of the generated WhatsApp message,
// not the interface; the interface label comes from the catalog above.
const VERDICT_EN: Record<Verdict, string> = {
  wet: "Wet",
  dry: "Dry",
  mixed: "Mixed",
  hazardous: "Hazardous",
};
const VERDICT_HI: Record<Verdict, string> = {
  wet: "गीला",
  dry: "सूखा",
  mixed: "मिला हुआ",
  hazardous: "ख़तरनाक",
};

// The bin, named the way the person at the gate would say it. The four-way
// confirm is the only control on the verdict; the blue is the collector's
// colour in the SWM Rules 2016, so a clean dry bin is stated as it is.
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
  const { t } = useI18n();

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
  const [savedSummary, setSavedSummary] = useState<{ verdict: Verdict; kg: number } | null>(null);
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
      setRegisterErr(t("field.errRegister"));
    }
  }, [t]);

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
      setCityError(t("field.errPin6"));
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
          setCityError(j.error || t("field.errCityStatus", { status: r.status }));
        } else {
          setCityData(j);
        }
      } catch (e: any) {
        if (e?.name !== "AbortError") {
          setCityData(null);
          setCityError(t("field.errCity"));
        }
      }
      setCityLoading(false);
    }, 350);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [pincode, t]);

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
      if (!r.ok) setPinErr(j.error || t("field.errLookupStatus", { status: r.status }));
      else setPinInfo(j);
    } catch {
      setPinErr(t("field.errIndiaPost"));
    }
    setPinBusy(false);
  }

  async function addBin() {
    if (!form.household_name.trim()) {
      setAddMsg(t("field.errName"));
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
        setAddMsg(bin.error || t("field.errAddHousehold"));
      } else {
        setSelectedBin(bin.id);
        setAddMsg(t("field.added", { name: bin.household_name }));
        setForm((f) => ({ ...f, household_name: "", house_no: "" }));
        await loadBins();
      }
    } catch {
      setAddMsg(t("field.errAddNetwork"));
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
    setSavedSummary(null);
    setLastRef("");
  }

  async function classify() {
    if (!photoFile) {
      setSavedMsg(t("field.noPhoto"));
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
          note: j.error || t("field.errVisionStatus", { status: r.status }),
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
        note: t("field.errClassifier"),
        error: t("field.errNetwork"),
      });
      setConfirmed("mixed");
      setKgs({ wet: "0", dry: "0", mixed: "0", hazardous: "0" });
    }
    setClassifying(false);
  }

  async function saveInspection() {
    if (!activeBin) {
      setSavedMsg(t("field.noHousehold"));
      return;
    }
    setSaving(true);
    setSavedMsg("");
    setSavedSummary(null);
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
      setSavedMsg(t("field.queuedOnDevice"));
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
      setSavedSummary({ verdict: confirmed, kg: Number(kgs[confirmed]) || 0 });
      await loadRegister();
    } catch {
      const q = [
        ...queue,
        { ...payload, queuedAt: new Date().toISOString(), _label: activeBin.household_name },
      ];
      setQueue(q);
      localStorage.setItem("alag_queue", JSON.stringify(q));
      setSavedMsg(t("field.queuedOnDevice"));
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
    const en = `Namaste ${name}. At today's pickup your bin was ${VERDICT_EN[confirmed]}. Please keep wet (green) and dry (blue) separate: wet becomes compost, dry is recycled, mixed goes to the landfill. — Alag`;
    const hi = `नमस्ते ${name}। आज के पिकअप पर आपका कूड़ेदान ${VERDICT_HI[confirmed]} था। कृपया गीला (हरा) और सूखा (नीला) अलग रखें: गीला खाद बनता है, सूखा रीसायकल होता है, मिला हुआ लैंडफ़िल जाता है। — अलग`;
    const text = encodeURIComponent(form.language === "hi" ? `${hi}\n${en}` : `${en}\n${hi}`);
    return phone.length === 10 ? `https://wa.me/91${phone}?text=${text}` : `https://wa.me/?text=${text}`;
  }

  async function calcRoute() {
    setRouteErr("");
    setRouteRes(null);
    const from = routeFrom.split(",").map((n) => Number(n.trim()));
    const to = routeTo.split(",").map((n) => Number(n.trim()));
    if (from.length !== 2 || to.length !== 2 || [...from, ...to].some((n) => !Number.isFinite(n))) {
      setRouteErr(t("field.errCoords"));
      return;
    }
    try {
      const r = await fetch(`/api/route?fromLat=${from[0]}&fromLng=${from[1]}&toLat=${to[0]}&toLng=${to[1]}`);
      const j = await r.json();
      if (!r.ok) setRouteErr(j.error || t("field.errOsrmStatus", { status: r.status }));
      else setRouteRes(j);
    } catch {
      setRouteErr(t("field.errOsrm"));
    }
  }

  async function loadAqi() {
    setAqiErr("");
    setAqi(null);
    try {
      const r = await fetch(`/api/aqi?lat=${center.lat}&lng=${center.lng}`);
      const j = await r.json();
      if (!r.ok) setAqiErr(j.error || t("field.errMeteoStatus", { status: r.status }));
      else setAqi(j);
    } catch {
      setAqiErr(t("field.errMeteo"));
    }
  }

  async function searchGeo() {
    setGeoErr("");
    setGeoRes([]);
    try {
      const r = await fetch(`/api/geocode?q=${encodeURIComponent(geoQ)}`);
      const j = await r.json();
      if (!r.ok) setGeoErr(j.error || t("field.errNominatimStatus", { status: r.status }));
      else setGeoRes(Array.isArray(j) ? j : []);
    } catch {
      setGeoErr(t("field.errNominatim"));
    }
  }

  function visionSourceLabel(r: ClassifyResult) {
    const attempts = r.attempts ?? 0;
    const seconds = r.latencyMs ? (r.latencyMs / 1000).toFixed(1) : "";
    if (attempts > 1 && seconds) {
      return t("field.sourceVisionAttemptsLatency", { count: attempts, seconds });
    }
    if (attempts === 1 && seconds) {
      return t("field.sourceVisionAttemptOneLatency", { seconds });
    }
    if (attempts > 1) return t("field.sourceVisionAttempts", { count: attempts });
    if (attempts === 1) return t("field.sourceVisionAttemptOne");
    if (seconds) return t("field.sourceVisionLatency", { seconds });
    return t("field.sourceVision");
  }

  function sourceLabel(source: string) {
    if (source === "llm") return t("field.sourceVisionShort");
    if (source === "fallback") return t("field.sourceFallback");
    if (source === "manual") return t("field.sourceManual");
    return source;
  }

  const rail = verdictColor(confirmed);

  return (
    <>
      <section className="hero">
        <div className="row between" style={{ alignItems: "flex-start" }}>
          <div className="hero-head">
            <p className="hero-date">{today ? dated(new Date()) : "—"}</p>
            <h1 aria-label={t("field.title")}>
              <span className="hi">{t("field.titleBin")}</span>
              <span>{t("field.titlePhoto")}</span>
              <span className="lat">{t("field.titleProof")}</span>
            </h1>
          </div>
        </div>
        <p className="hero-dek">
          <b>{t("field.dekLead")}</b> {t("field.dekBody")}
        </p>
        <div className="hero-meta">
          <span>
            {t("field.route")}: <b>{activeBin?.rwa || form.rwa || "Pilot RWA"}</b>
          </span>
          <span>
            {t("field.household")}: <b>{activeBin?.household_name || "—"}</b>
          </span>
          <span className={online ? "tag green" : "tag ochre"}>
            <span className="dot" /> {online ? t("common.online") : t("common.offline")}
          </span>
          {queue.length > 0 && (
            <span className="tag ochre">{t("common.queued", { count: queue.length })}</span>
          )}
        </div>
      </section>

      <FloatingRegister
        logged={register.filter((i) => i.date === new Date().toISOString().slice(0, 10)).length}
        total={bins.length}
        queued={queue.length}
        online={online}
      />

      <div className="field-grid">
        <div>
          <section className="sheet" id="capture">
            <div className="sheet-head">
              <h2>{t("field.capture")}</h2>
              <span className="sheet-meta">
                {photoFile ? (classifying ? t("field.readingBin") : t("field.readBin")) : t("field.photoHint")}
              </span>
            </div>

            <div className="plate-block">
              <div className="household-strip">
                <label className="sr-only" htmlFor="household-select">
                  {t("field.chooseHousehold")}
                </label>
                <select
                  id="household-select"
                  className="select"
                  value={selectedBin}
                  onChange={(e) => setSelectedBin(e.target.value === "" ? "" : Number(e.target.value))}
                >
                  <option value="">{bins.length ? t("field.chooseHousehold") : t("field.noHouseholdYet")}</option>
                  {bins.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.household_name} — {b.house_no || t("field.optionNoNumber")}, {b.rwa}
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
                  {t("field.householdBook")}
                </button>
              </div>

              <div className="plate-top">
                <span>
                  {activeBin ? (
                    <>
                      <b>{activeBin.house_no || t("field.houseFallback")}</b> · {activeBin.street || activeBin.rwa}
                    </>
                  ) : (
                    t("field.selectAbove")
                  )}
                </span>
                <span>
                  {photoFile ? t("field.photosOne") : t("field.photosOther", { count: 0 })}
                </span>
              </div>

              <div className={`plate${classifying ? " scanning" : ""}`}>
                {photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photoUrl} alt={t("field.photoAlt")} />
                ) : (
                  <div className="plate-empty">
                    <CameraIcon />
                    <b>{t("field.photographBin")}</b>
                    <span>{t("field.emptyHint")}</span>
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
                  aria-label={photoUrl ? t("field.retakePhoto") : t("field.photographBin")}
                >
                  <CameraIcon />
                </button>
                <div className="shutter-copy">
                  <b>{photoUrl ? t("field.retakePhoto") : t("field.photographBin")}</b>
                  <span>{t("field.photoHint")}</span>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={onPhoto}
                  className="sr-only"
                  aria-label={t("field.photographBin")}
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
                  {classifying ? t("field.readingEllipsis") : t("field.readBin")}
                </button>
                <p className="source" style={{ marginTop: 6 }}>
                  {t("field.readHint")}
                </p>
              </div>
            </div>

            {result && (
              <div style={{ borderTop: "1px solid var(--line)", marginTop: 14, paddingTop: 12 }}>
                <div className="verdict-row">
                  <div className={`verdict-word ${rail}`}>
                    <span className="word">{t(VERDICT_KEY[confirmed])}</span>
                    <span className="sub">
                      {result.confidence != null
                        ? `${Math.round((result.confidence || 0) * 100)}%`
                        : t("field.manual")}
                    </span>
                  </div>
                  <div className="verdict-copy">
                    <p>
                      {t("field.confidence")} ·{" "}
                      {result.source === "llm"
                        ? visionSourceLabel(result)
                        : result.source === "fallback"
                          ? t("field.sourceFallback")
                          : t("field.sourceManual")}
                    </p>
                  </div>
                </div>

                {result.needsManualConfirm && (
                  <div className="notice">
                    <span className="notice-title">{t("field.needsConfirmTitle")}</span>
                    {t("field.needsConfirmBody")}{" "}
                    {result.fallbackReason
                      ? t("field.upstreamNote", { reason: result.fallbackReason })
                      : ""}
                  </div>
                )}
                {result.error && !result.needsManualConfirm && (
                  <div className="notice red">
                    <span className="notice-title">{t("field.visionFailedTitle")}</span>
                    {result.error}
                  </div>
                )}
                {result.note && !result.needsManualConfirm && (
                  <p className="source" style={{ marginBottom: 8 }}>
                    {result.note}
                  </p>
                )}

                <label className="label">{t("field.confirm")}</label>
                <div className="chips" role="group" aria-label={t("field.confirm")}>
                  {(Object.keys(VERDICT_KEY) as Verdict[]).map((v) => (
                    <button
                      key={v}
                      type="button"
                      className="chip"
                      data-verdict={v}
                      aria-pressed={confirmed === v}
                      onClick={() => setConfirmed(v)}
                    >
                      {t(VERDICT_KEY[v])}
                      <span>{t(VERDICT_HELP_KEY[v])}</span>
                    </button>
                  ))}
                </div>

                <label className="label">{t("field.estimatedKg")}</label>
                <div className="kg-grid">
                  {(["wet", "dry", "mixed", "hazardous"] as Verdict[]).map((v) => (
                    <div key={v}>
                      <label className="label" htmlFor={`kg-${v}`}>
                        {t("field.kgFor", { verdict: t(VERDICT_KEY[v]) })}
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
                  {saving ? t("field.recording") : t("field.save")}
                </button>
                {!activeBin && (
                  <p className="source" style={{ marginTop: 6 }}>
                    {t("field.noHouseholdRecording")}
                  </p>
                )}
                {(savedMsg || savedSummary) && (
                  <div className="notice green" style={{ marginTop: 10 }} aria-live="polite">
                    <span className="notice-title">
                      {savedSummary
                        ? t("field.savedLine", {
                            verdict: t(VERDICT_KEY[savedSummary.verdict]),
                            kg: savedSummary.kg,
                          })
                        : savedMsg}
                    </span>
                    {savedSummary && lastRef ? t("field.photoRecord", { ref: lastRef }) : ""}
                  </div>
                )}

                <div className="btn-row two" style={{ marginTop: 10 }}>
                  <a className="btn btn-quiet" href={waLink()} target="_blank" rel="noreferrer">
                    {t("field.nudge")}
                  </a>
                  {confirmed === "dry" ? (
                    <a className="btn btn-ochre" href="#kabadi">
                      {t("field.askKabadi")}
                    </a>
                  ) : (
                    <a className="btn btn-quiet" href="#escalate">
                      {t("field.fileComplaint")}
                    </a>
                  )}
                </div>
                <p className="source" style={{ marginTop: 6 }}>
                  {t("field.whatsappNote")}
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
              <h2>{t("field.register")}</h2>
              <span className="sheet-meta">
                {t("field.recordsInDb", { count: register.length })}
              </span>
            </div>
            <p className="sheet-lede">{t("field.registerNote")}</p>

            <div className="ledger">
              <div className="ledger-head">
                <span>{t("field.ledgerHeadHousehold")}</span>
                <span>{t("field.ledgerHeadAmount")}</span>
              </div>
              {register.length === 0 ? (
                <div className="ledger-empty">
                  <b>{t("field.noInspections")}</b> {t("field.noInspectionsBody")}
                </div>
              ) : (
                register.slice(0, 8).map((i) => (
                  <div className="ledger-row" key={i.id}>
                    <span className={`rail ${verdictColor(i.classification)}`} aria-hidden="true" />
                    <div className="cell">
                      <div className="house">
                        {i.household_name || t("field.binFallback", { id: i.bin_id })}
                      </div>
                      <div className="meta">
                        {t("field.ledgerMeta", {
                          verdict: t(VERDICT_KEY[i.classification]),
                          rwa: i.rwa || "Pilot RWA",
                          date: i.date,
                          time: clock(i.created_at),
                          source: sourceLabel(i.source),
                        })}
                      </div>
                    </div>
                    <div className="cell right">
                      <div className="amount num">
                        {kgFor(i) > 0 ? `${kgFor(i).toFixed(1)} kg` : "—"}
                        <small>
                          {i.classification === "mixed"
                            ? t("field.stillMixed")
                            : t(VERDICT_KEY[i.classification])}
                        </small>
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div className="ledger-foot">
                {t("field.ledgerFoot", { shown: Math.min(8, register.length) })}
                {registerErr ? ` ${registerErr}` : ""}
              </div>
            </div>

            {queue.length > 0 && (
              <div className="notice" style={{ marginTop: 12 }}>
                <span className="notice-title">
                  {t("field.queueTitle", { count: queue.length })}
                </span>
                {queue.slice(0, 3).map((q, i) => (
                  <span key={i} style={{ display: "block" }}>
                    {t("field.queueRow", {
                      label: q._label || t("field.bin"),
                      verdict:
                        q.classification in VERDICT_KEY
                          ? t(VERDICT_KEY[q.classification as Verdict])
                          : q.classification,
                      time: clock(q.queuedAt || ""),
                    })}
                  </span>
                ))}
                <button className="btn btn-ink btn-sm" type="button" onClick={syncQueue} style={{ marginTop: 8 }}>
                  {t("field.syncNow")}
                </button>
              </div>
            )}

            {!online && <div className="notice">{t("field.offline")}</div>}
          </section>
        </div>

        <aside>
          <section className="sheet">
            <div className="sheet-head">
              <h2>{t("field.city")}</h2>
              <span className="sheet-meta">{t("field.pinMeta", { pin: pincode })}</span>
            </div>
            <p className="sheet-lede">{t("field.cityNote")}</p>
            <CityContext data={cityData} loading={cityLoading} error={cityError} pincode={pincode} />
          </section>

          <section className="sheet">
            <div className="sheet-head">
              <h2>{t("field.dumpsites")}</h2>
              <span className="sheet-meta">{t("field.dumpsitesMeta")}</span>
            </div>
            <p className="sheet-lede">{t("field.dumpsitesNote")}</p>
            <LandfillPanel lat={center.lat} lng={center.lng} label={center.label} />
          </section>

          <details className="sheet kit" id="household-book">
            <summary>
              <span>{t("field.householdBook")}</span>
              <span className="plus" aria-hidden="true">
                +
              </span>
            </summary>
            <div className="kit-body">
              <p className="small muted" style={{ marginBottom: 10 }}>
                {t("field.bookIntro")}
              </p>
              <label className="label" htmlFor="hname">
                {t("field.name")}
              </label>
              <input
                id="hname"
                className="input"
                value={form.household_name}
                onChange={(e) => setForm({ ...form, household_name: e.target.value })}
                placeholder={t("field.placeholderName")}
                autoComplete="off"
              />
              <div className="grid-2" style={{ marginTop: 10 }}>
                <div>
                  <label className="label" htmlFor="hno">
                    {t("field.house")}
                  </label>
                  <input
                    id="hno"
                    className="input"
                    value={form.house_no}
                    onChange={(e) => setForm({ ...form, house_no: e.target.value })}
                    placeholder={t("field.placeholderHouse")}
                  />
                </div>
                <div>
                  <label className="label" htmlFor="hstreet">
                    {t("field.street")}
                  </label>
                  <input
                    id="hstreet"
                    className="input"
                    value={form.street}
                    onChange={(e) => setForm({ ...form, street: e.target.value })}
                    placeholder={t("field.placeholderStreet")}
                  />
                </div>
              </div>
              <label className="label" htmlFor="hpin" style={{ marginTop: 10 }}>
                {t("field.pin")}
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
                  {pinBusy ? t("field.checking") : t("field.lookupPin")}
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
                    {t("field.rwa")}
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
                    {t("field.phone")}
                  </label>
                  <input
                    id="hphone"
                    className="input"
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })
                    }
                    inputMode="tel"
                    placeholder={t("field.placeholderPhone")}
                  />
                </div>
              </div>
              <label className="label" htmlFor="hlang" style={{ marginTop: 10 }}>
                {t("field.language")}
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
                {adding ? t("field.checking") : t("field.addHousehold")}
              </button>
              {addMsg && (
                <p className="source" style={{ marginTop: 6 }} aria-live="polite">
                  {addMsg}
                </p>
              )}

              {bins.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <p className="label">{t("field.savedHouseholds")}</p>
                  <div className="ledger">
                    {bins.slice(0, 6).map((b) => (
                      <div className="ledger-row" key={b.id}>
                        <span className={`rail ${b.id === Number(selectedBin) ? "green" : ""}`} aria-hidden="true" />
                        <div className="cell">
                          <div className="house">{b.household_name}</div>
                          <div className="meta">
                            {t("field.savedMeta", {
                              house: b.house_no || t("field.optionNoNumber"),
                              rwa: b.rwa,
                              pin: b.pincode || "—",
                            })}
                          </div>
                        </div>
                        <div className="cell right">
                          <button
                            className="btn btn-quiet btn-sm"
                            type="button"
                            onClick={() => setSelectedBin(b.id)}
                          >
                            {b.id === Number(selectedBin) ? t("field.selected") : t("field.use")}
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
          <h2>{t("field.escalate")}</h2>
          <span className="sheet-meta">{t("field.escalateMeta")}</span>
        </div>
        <p className="sheet-lede">{t("field.escalateNote")}</p>
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
            verdict={VERDICT_EN[confirmed]}
            recordRef={lastRef}
          />
        </div>
      </section>

      <section className="sheet">
        <div className="sheet-head">
          <h2>{t("field.kit")}</h2>
          <span className="sheet-meta">{t("field.kitNote")}</span>
        </div>

        <details className="kit" open>
          <summary>
            <span>{t("field.routeTitle")}</span>
            <span className="plus" aria-hidden="true">
              +
            </span>
          </summary>
          <div className="kit-body">
            <div className="grid-2">
              <div>
                <label className="label" htmlFor="from">
                  {t("field.fromCoords")}
                </label>
                <input id="from" className="input" value={routeFrom} onChange={(e) => setRouteFrom(e.target.value)} />
              </div>
              <div>
                <label className="label" htmlFor="to">
                  {t("field.toCoords")}
                </label>
                <input id="to" className="input" value={routeTo} onChange={(e) => setRouteTo(e.target.value)} />
              </div>
            </div>
            <button className="btn btn-quiet btn-sm" type="button" onClick={calcRoute} style={{ marginTop: 10 }}>
              {t("field.measureDrive")}
            </button>
            {routeErr && <p className="source" style={{ color: "var(--red)" }}>{routeErr}</p>}
            {routeRes && (
              <p style={{ marginTop: 8 }}>
                <strong className="num">{routeRes.distanceKm} km</strong> ·{" "}
                <strong className="num">{routeRes.durationMin} min</strong>{" "}
                <span className="source">{t("field.routeLive")}</span>
              </p>
            )}
          </div>
        </details>

        <details className="kit">
          <summary>
            <span>{t("field.airTitle")}</span>
            <span className="plus" aria-hidden="true">
              +
            </span>
          </summary>
          <div className="kit-body">
            <button className="btn btn-quiet btn-sm" type="button" onClick={loadAqi}>
              {t("field.readAir", { place: center.label })}
            </button>
            {aqiErr && <p className="source" style={{ color: "var(--red)" }}>{aqiErr}</p>}
            {aqi && (
              <p style={{ marginTop: 8 }}>
                <strong className="num">{t("field.usAqi", { value: aqi.usAqi })}</strong>{" "}
                <span className="source">
                  {t("field.aqiMeta", { pm25: aqi.pm25, pm10: aqi.pm10, time: aqi.time })}
                </span>
              </p>
            )}
          </div>
        </details>

        <details className="kit">
          <summary>
            <span>{t("field.placeTitle")}</span>
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
                placeholder={t("field.areaPlaceholder")}
              />
              <button className="btn btn-quiet btn-sm" type="button" onClick={searchGeo}>
                {t("common.search")}
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
                    {t("field.centreMap")}
                  </button>
                </span>
              </div>
            ))}
          </div>
        </details>

        <div className="notice" style={{ marginTop: 16 }}>
          <span className="notice-title">{t("field.noHiddenTitle")}</span>
          {t("field.noHiddenBody")}{" "}
          <a href="/dashboard">{t("field.openLedger")}</a>
        </div>
      </section>
    </>
  );
}
