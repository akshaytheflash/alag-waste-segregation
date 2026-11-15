"use client";
import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/components/I18nProvider";
import type { MessageKey } from "@/lib/i18n";

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

const ISSUE_OPTIONS: { id: string; label: MessageKey }[] = [
  { id: "mixed-collection", label: "escalate.issue.mixed-collection" },
  { id: "burning", label: "escalate.issue.burning" },
  { id: "dumping", label: "escalate.issue.dumping" },
  { id: "missed", label: "escalate.issue.missed" },
  { id: "no-separate-bin", label: "escalate.issue.no-separate-bin" },
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
  const { t } = useI18n();
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
      <p className="sheet-lede">{t("escalate.intro")}</p>

      <div className="grid-2">
        <div className="field">
          <label className="label" htmlFor="issue">
            {t("escalate.whatWrong")}
          </label>
          <select id="issue" className="select" value={issue} onChange={(e) => setIssue(e.target.value)}>
            {ISSUE_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>
                {t(o.label)}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label className="label" htmlFor="lang">
            {t("escalate.complaintLanguage")}
          </label>
          <select id="lang" className="select" value={lang} onChange={(e) => setLang(e.target.value as "en" | "hi")}>
            <option value="en">English</option>
            <option value="hi">हिंदी</option>
          </select>
        </div>
      </div>

      <div className="field">
        <label className="label" htmlFor="details">
          {t("escalate.details")}
        </label>
        <textarea
          id="details"
          className="textarea"
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder={t("escalate.detailsPlaceholder")}
          maxLength={400}
        />
      </div>

      <div className="grid-2">
        <div className="field">
          <label className="label" htmlFor="cname">
            {t("escalate.name")}
          </label>
          <input
            id="cname"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("escalate.namePlaceholder")}
          />
        </div>
        <div className="field">
          <label className="label" htmlFor="cphone">
            {t("escalate.phone")}
          </label>
          <input
            id="cphone"
            className="input"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
            inputMode="numeric"
            placeholder={t("escalate.phonePlaceholder")}
          />
        </div>
      </div>

      {target ? (
        <div className="portal">
          <div className="portal-body">{target.body}</div>
          <div className="portal-meta">
            {t("escalate.portalMeta", { scope: target.scope, helpline: target.helpline })}
          </div>
          <a className="portal-link" href={target.url} target="_blank" rel="noreferrer">
            {target.url.replace(/^https?:\/\//, "")}
          </a>
        </div>
      ) : (
        <div className="notice">
          <span className="notice-title">{t("escalate.noPortalTitle")}</span>
          {t("escalate.noPortalBody")}
        </div>
      )}

      <div className="row between" style={{ marginTop: 10 }}>
        <span className="label" style={{ margin: 0 }}>
          {t("escalate.draft")}
        </span>
        <span className="source">{loading ? t("escalate.building") : t("escalate.ready")}</span>
      </div>
      <pre className="copy-box" aria-live="polite" lang={lang}>
        {result?.complaint || "—"}
      </pre>

      <div className="btn-row two" style={{ marginTop: 10 }}>
        <button className="btn btn-quiet" type="button" onClick={copy} disabled={!result?.complaint}>
          {copied ? t("escalate.copied") : t("escalate.copy")}
        </button>
        {target ? (
          <a className="btn btn-primary" href={target.url} target="_blank" rel="noreferrer">
            {portal ? t("escalate.openCorporation") : t("escalate.openMission")}
          </a>
        ) : (
          <span />
        )}
      </div>
      <p className="source" style={{ marginTop: 8 }}>
        {t("escalate.footnote")}
      </p>

      <div className="sheet" id="kabadi" style={{ marginTop: 22 }}>
        <div className="sheet-head">
          <h3>{t("escalate.kabadiTitle")}</h3>
          <span className="sheet-meta">{t("escalate.kabadiMeta")}</span>
        </div>
        <p className="small" style={{ color: "var(--ink-2)", marginBottom: 10 }}>
          {t("escalate.kabadiBody")}
        </p>
        <div className="grid-2">
          <div className="field">
            <label className="label" htmlFor="kphone">
              {t("escalate.kabadiPhone")}
            </label>
            <input
              id="kphone"
              className="input"
              value={kabadiPhone}
              onChange={(e) => setKabadiPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              inputMode="numeric"
              placeholder={t("escalate.phonePlaceholder")}
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="kg">
              {t("escalate.kabadiKg")}
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
            {t("escalate.openWa")}
          </a>
        ) : (
          <button className="btn btn-quiet btn-wide" type="button" disabled>
            {t("escalate.enterNumber")}
          </button>
        )}
        <p className="source" style={{ marginTop: 8 }}>
          {t("escalate.kabadiFootnote")}
        </p>
      </div>
    </div>
  );
}
