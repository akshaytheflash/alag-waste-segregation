"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/components/I18nProvider";

/**
 * How far through the round you are, kept in the corner while you walk.
 *
 * The question at every pickup is "how much is left", and the answer
 * shouldn't mean scrolling back to the top. This appears once the camera
 * block is out of view; it shows bins logged against households on the
 * round, and whether anything is still waiting to sync.
 */
export default function FloatingRegister({
  logged,
  total,
  queued,
  online,
}: {
  logged: number;
  total: number;
  queued: number;
  online: boolean;
}) {
  const [shown, setShown] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    const el = document.getElementById("capture");
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setShown(!e.isIntersecting), {
      rootMargin: "-60px 0px 0px 0px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  if (!shown) return null;

  const pct = total > 0 ? Math.min(100, Math.round((logged / total) * 100)) : 0;

  return (
    <aside className="float-reg" aria-label={t("float.progress")}>
      <div className="float-reg-head">
        <span>{t("float.thisRound")}</span>
        <span
          className={`float-reg-dot ${online ? "up" : "off"}`}
          title={online ? t("common.online") : t("common.offline")}
        >
          <span className="dot" />
          {online
            ? t("common.online")
            : queued
              ? t("common.queued", { count: queued })
              : t("common.offline")}
        </span>
      </div>
      <p className="float-reg-count">{t("float.logged", { logged, total })}</p>
      <div
        className="float-reg-track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label={t("float.pct", { pct })}
      >
        <span style={{ width: `${pct}%` }} />
      </div>
    </aside>
  );
}
