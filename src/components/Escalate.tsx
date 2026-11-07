"use client";
import { useEffect, useMemo, useState } from "react";

type GrievanceResult = {
  portal: {
    id: string;
    city: string;
    body: string;
    url: string;
    helpline: string;
    scope: string;
  } | null;
  fallback: { body: string; url: string; helpline: string; scope: string } | null;
  complaint: string;
};

const ISSUE_OPTIONS = [
  { id: "mixed-collection", en: "Wet and dry collected together", hi: "गीला और सूखा एक साथ" },
  { id: "burning", en: "Waste burned in the open", hi: "कचरा खुले में जलाया" },
  { id: "dumping", en: "Garbage dumped on the street", hi: "सड़क पर कचरा" },
  { id: "missed", en: "Bin not collected", hi: "कूड़ेदान नहीं उठा" },
  { id: "no-separate-bin", en: "No separate wet/dry bin", hi: "अलग कूड़ेदान नहीं" },
];

export default function Escalate({
  address,
  pincode,
  city,
  state,
  verdict,
  recordRef,
}: {
  address: string;
  pincode: string;
  city: string;
  state: string;
  verdict: string;
  recordRef: string;
}) {
  const [issue, setIssue] = useState("mixed-collection");
  const [details, setDetails] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [lang, setLang] = useState<"en" | "hi">("en");
  const [result, setResult] = useState<GrievanceResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const [kabadiPhone, setKabadiPhone] = useState("");
  const [kabadiKg, setKabadiKg] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const q = new URLSearchParams({
          city,
          state,
          pincode,
          address,
          issue,
          details,
          lang,
          verdict,
          ref: recordRef,
          name,
          phone,
          date: new Date().toISOString().slice(0, 10),
        });
        const res = await fetch(`/api/grievance?${q.toString()}`, { signal: controller.signal });
        setResult(await res.json());
      } catch {
        // Aborted or offline; keep the previous draft.
      }
      setLoading(false);
    }, 260);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [city, state, pincode, address, issue, details, lang, verdict, recordRef, name, phone]);

  async function copy() {
    if (!result?.complaint) return;
    try {
      await navigator.clipboard.writeText(result.complaint);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  }

  const portal = result?.portal;
  const target = portal || result?.fallback;
  const wa = useMemo(() => {
    const digits = kabadiPhone.replace(/\D/g, "").slice(-10);
    if (digits.length !== 10) return "";
    const kg = kabadiKg ? `${kabadiKg} kg ` : "";
    const msg = `Namaste, Alag pilot se. ${address || city}${pincode ? `, PIN ${pincode}` : ""} par ${kg}sookha kachra (plastic, paper, metal, glass) ready hai. Kabadi pickup ho sakta hai?${name ? ` — ${name}` : ""}`;
    return `https://wa.me/91${digits}?text=${encodeURIComponent(msg)}`;
  }, [kabadiPhone, kabadiKg, address, city, pincode, name]);

  return (
    <div>
      <p className="sheet-lede">
        A photo register is evidence, not a fix. When a bin stays mixed or waste is burned, send the record to the corporation that
        owns the ward. Alag prepares the text and opens the official portal; you submit it and keep the complaint number.
      </p>

      <div className="grid-2">
        <div className="field">
          <label className="label" htmlFor="issue">
            What is wrong
          </label>
          <select id="issue" className="select" value={issue} onChange={(e) => setIssue(e.target.value)}>
            {ISSUE_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>
                {lang === "hi" ? o.hi : o.en}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label className="label" htmlFor="lang">
            Complaint language
          </label>
          <select id="lang" className="select" value={lang} onChange={(e) => setLang(e.target.value as "en" | "hi")}>
            <option value="en">English</option>
            <option value="hi">हिंदी</option>
          </select>
        </div>
      </div>

      <div className="field">
        <label className="label" htmlFor="details">
          What did you see (optional)
        </label>
        <textarea
          id="details"
          className="textarea"
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="Example: the same handcart mixed the green and blue bins on the morning round, twice this week."
          maxLength={400}
        />
      </div>

      <div className="grid-2">
        <div className="field">
          <label className="label" htmlFor="cname">
            Your name (optional)
          </label>
          <input id="cname" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Collector name" />
        </div>
        <div className="field">
          <label className="label" htmlFor="cphone">
            Contact number (optional)
          </label>
          <input
            id="cphone"
            className="input"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
            inputMode="numeric"
            placeholder="10-digit mobile"
          />
        </div>
      </div>

      {target ? (
        <div className="portal">
          <div className="portal-body">{target.body}</div>
          <div className="portal-meta">
            {target.scope} Helpline {target.helpline}.
          </div>
          <a className="portal-link" href={target.url} target="_blank" rel="noreferrer">
            {target.url.replace(/^https?:\/\//, "")}
          </a>
        </div>
      ) : (
        <div className="notice">
          <span className="notice-title">No portal matched this city</span>
          Use the national mission page to find the state SBM cell, then file there.
        </div>
      )}

      <div className="row between" style={{ marginTop: 10 }}>
        <span className="label" style={{ margin: 0 }}>
          Draft complaint
        </span>
        <span className="source">{loading ? "Building…" : "Ready to copy"}</span>
      </div>
      <pre className="copy-box" aria-live="polite">
        {result?.complaint || "—"}
      </pre>

      <div className="btn-row two" style={{ marginTop: 10 }}>
        <button className="btn btn-quiet" type="button" onClick={copy} disabled={!result?.complaint}>
          {copied ? "Copied to clipboard" : "Copy complaint text"}
        </button>
        {target ? (
          <a className="btn btn-primary" href={target.url} target="_blank" rel="noreferrer">
            Open the {portal ? "corporation" : "mission"} portal
          </a>
        ) : (
          <span />
        )}
      </div>
      <p className="source" style={{ marginTop: 8 }}>
        Alag does not file on your behalf and does not invent a complaint number. The portal issues the reference. Drafts are built in
        this browser from the fields above; nothing is sent to a third party.
      </p>

      <div className="sheet" id="kabadi" style={{ marginTop: 22 }}>
        <div className="sheet-head">
          <h3>Kabadi pickup for dry waste</h3>
          <span className="sheet-meta">Your number, your kabadi</span>
        </div>
        <p className="small" style={{ color: "var(--ink-2)", marginBottom: 10 }}>
          There is no kabadi marketplace here. Enter the number of a scrap dealer you already use; Alag writes the message and opens
          WhatsApp. You send it.
        </p>
        <div className="grid-2">
          <div className="field">
            <label className="label" htmlFor="kphone">
              Kabadi WhatsApp number
            </label>
            <input
              id="kphone"
              className="input"
              value={kabadiPhone}
              onChange={(e) => setKabadiPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              inputMode="numeric"
              placeholder="10-digit mobile"
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="kg">
              Dry waste ready (kg)
            </label>
            <input
              id="kg"
              className="input"
              value={kabadiKg}
              onChange={(e) => setKabadiKg(e.target.value.replace(/[^\d.]/g, "").slice(0, 5))}
              inputMode="decimal"
              placeholder="2.5"
            />
          </div>
        </div>
        {wa ? (
          <a className="btn btn-ochre btn-wide" href={wa} target="_blank" rel="noreferrer">
            Open WhatsApp with the pickup message
          </a>
        ) : (
          <button className="btn btn-quiet btn-wide" type="button" disabled>
            Enter a 10-digit number to build the link
          </button>
        )}
        <p className="source" style={{ marginTop: 8 }}>
          A wa.me deep link to the number you supplied. No listing, no matching, no fee, and no message is claimed sent until you tap
          Send in WhatsApp.
        </p>
      </div>
    </div>
  );
}
