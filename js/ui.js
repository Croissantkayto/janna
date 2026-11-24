export const $ = (s, r = document) => r.querySelector(s);
export const CATS = {
  study:   { label: "دراسة", color: "#5B3DF5" },
  health:  { label: "صحة",   color: "#16B28A" },
  work:    { label: "شغل",   color: "#E08A00" },
  reading: { label: "قراءة", color: "#D6336C" },
  personal:{ label: "شخصي",  color: "#0E8FCB" }
};
export const catOptions = () => Object.entries(CATS).map(([k, c]) => `<option value="${k}">${c.label}</option>`).join("");
export const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const who = u => u?.nickname ? `${esc(u.name)} «${esc(u.nickname)}»` : esc(u?.name || "مجهول");

export function avatar(u, size = 36) {
  const st = `width:${size}px;height:${size}px;font-size:${size / 2.3}px`;
  return u?.photoURL
    ? `<img class="av" style="${st}" src="${esc(u.photoURL)}" alt="" referrerpolicy="no-referrer">`
    : `<span class="av" style="${st}">${esc((u?.name || "؟").trim().charAt(0))}</span>`;
}

export function toast(html) {
  const t = document.createElement("div");
  t.className = "toast"; t.innerHTML = html;
  $("#toasts").append(t);
  setTimeout(() => t.remove(), 4500);
}

export function countTo(el, to) {
  const from = +el.textContent || 0, t0 = performance.now();
  const step = now => {
    const k = Math.min((now - t0) / 700, 1);
    el.textContent = Math.round(from + (to - from) * k);
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
  if (to !== from) { const p = el.parentElement; p.classList.remove("bump"); void p.offsetWidth; p.classList.add("bump"); }
}

export const ago = ms => {
  const m = Math.floor((Date.now() - ms) / 60000);
  return m < 1 ? "دلوقتي" : m < 60 ? `من ${m} دقيقة` : m < 1440 ? `من ${Math.floor(m / 60)} ساعة` : `من ${Math.floor(m / 1440)} يوم`;
};
