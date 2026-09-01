/* ═══════════════════════════════════════════════════════════════
   Osteolifting — CTA click tracker (Phase 1)

   No persistent storage of any kind: no localStorage, no
   sessionStorage, no cookies. The journey lives in a plain JS
   variable for the lifetime of this tab. This works because every
   CTA on this page either scrolls to an in-page anchor (#signup),
   opens WhatsApp in a new tab, or submits via fetch — nothing here
   ever navigates the tab away, so nothing is lost by keeping the
   journey in memory only.

   Sends via GTM's dataLayer: dataLayer.push({event:'cta_click', ...}).
   GTM container GTM-55BNP66S owns actual delivery to GA4 — this file
   never calls gtag() directly, since GTM doesn't expose that global.
   Exposes window.__oslTrack.snapshot() so the signup form can
   attach the in-page journey to the lead on submit (added in a
   later phase).

   MUST NOT call preventDefault/stopPropagation anywhere in this
   file — every CTA's default behavior (anchor scroll, external
   link, form submit) must fire exactly as if this script didn't
   exist.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var journey = {
    counts: Object.create(null), // { ctaId: n }
    path: [],                    // [{c, s, t}], capped
    startedAt: Date.now()
  };
  var PATH_CAP = 40;

  function pushPath(entry) {
    journey.path.push(entry);
    if (journey.path.length > PATH_CAP) {
      // keep first 20 + last 20, drop the middle
      journey.path = journey.path.slice(0, 20).concat(journey.path.slice(-20));
    }
  }

  function sectionOf(el) {
    var s = el.closest("[data-section]");
    return s ? s.getAttribute("data-section") : "unknown";
  }

  function kindOf(el) {
    var href = el.getAttribute("href") || "";
    if (href.indexOf("https://wa.me") === 0) return "whatsapp";
    if (el.getAttribute("type") === "submit") return "form_submit";
    if (el.tagName === "BUTTON") return "button";
    if (href.indexOf("#") === 0) return "anchor";
    return "link";
  }

  function onClick(e) {
    if (!e.isTrusted) return;
    if (e.type === "click" && e.button !== 0) return;

    var el = e.target && e.target.closest ? e.target.closest("[data-cta]") : null;
    if (!el) return;

    var cta = el.getAttribute("data-cta");
    var section = sectionOf(el);
    var kind = kindOf(el);
    var t = Date.now() - journey.startedAt;

    journey.counts[cta] = (journey.counts[cta] || 0) + 1;
    pushPath({ c: cta, s: section, t: t });

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: "cta_click",
      cta_id: cta,
      cta_section: section,
      cta_kind: kind,
      cta_count: journey.counts[cta]
    });

    if (window.posthog && window.posthog.capture) {
      window.posthog.capture("cta_click", {
        cta_id: cta,
        cta_section: section,
        cta_kind: kind,
        cta_count: journey.counts[cta]
      });
    }
  }

  // Capture phase is load-bearing: #play-btn's own click handler
  // (see index.html) replaces its own subtree, detaching the button
  // from the DOM. A bubble-phase listener on document would run
  // after that and read attributes off a detached element.
  document.addEventListener("click", onClick, true);

  window.__oslTrack = {
    snapshot: function () {
      return {
        counts: journey.counts,
        path: journey.path.slice(),
        totalClicks: journey.path.length,
        distinctCtas: Object.keys(journey.counts).length,
        firstCta: journey.path.length ? journey.path[0].c : null,
        lastCta: journey.path.length ? journey.path[journey.path.length - 1].c : null,
        minutesToNow: Math.round((Date.now() - journey.startedAt) / 60000)
      };
    }
  };
})();
