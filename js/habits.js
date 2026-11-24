import { db } from "./firebase.js";
import { collection, addDoc, setDoc, onSnapshot, query, where, doc, updateDoc, increment }
  from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { $, CATS, catOptions, esc } from "./ui.js";
import { logActivity } from "./feed.js";

const LOG_POINTS = 5, FINISH_BONUS = 25, CIRC = 264; // محيط الدائرة (2πr, r=42)
let habits = [];

const daysLeft = d => Math.ceil((new Date(d + "T23:59:59") - Date.now()) / 864e5);

function card(h) {
  const pct = Math.min(100, Math.round(h.progress / h.target * 100)), left = daysLeft(h.deadline);
  const finished = h.progress >= h.target, c = (CATS[h.category] || CATS.personal).color;
  const perDay = left > 0 ? Math.ceil((h.target - h.progress) / left) : h.target - h.progress;
  const note = finished ? "مبروك، خلّصتها! 🎉" : left < 0 ? "الديدلاين عدّى" : `باقي ${left} يوم · المطلوب ${perDay} ${esc(h.unit)}/يوم`;
  return `<article class="habit ${finished ? "done" : ""}" data-id="${h.id}">
    <i class="tag" style="background:${c}"></i>
    <div class="ring"><svg viewBox="0 0 100 100" width="132" height="132">
      <circle class="bg" cx="50" cy="50" r="42"/>
      <circle class="fg" cx="50" cy="50" r="42" stroke="${finished ? "#16B28A" : c}" style="stroke-dashoffset:${CIRC}" data-to="${CIRC * (1 - pct / 100)}"/>
    </svg><span class="pct">${pct}%</span></div>
    <h3>${esc(h.title)}</h3>
    <small>${h.progress} / ${h.target} ${esc(h.unit)}</small>
    <small>${note}</small>
    ${finished ? "" : `<form class="log"><input type="number" min="1" required placeholder="خلّصت كام؟"><button class="btn small primary">سجّل</button></form>`}
  </article>`;
}

export function initHabits(uid, getMe) {
  $("#h-cat").innerHTML = catOptions();
  const dlg = $("#habit-dialog");
  $("#add-habit-btn").onclick = () => {
    $("#habit-form").reset();
    $("#h-deadline").min = new Date().toISOString().slice(0, 10);
    dlg.showModal();
  };

  let all = [];   // كل العادات (مشتركة بين الكل)
  let mine = {};  // تقدمي أنا بس: { habitId: number }

  const render = () => {
    habits = all.map(h => ({ ...h, progress: mine[h.id] || 0 }));
    $("#habits").innerHTML = habits.map(card).join("") || `<div class="empty">ضيف أول عادة وحدد لها ديدلاين.</div>`;
    requestAnimationFrame(() => requestAnimationFrame(() =>
      document.querySelectorAll(".ring .fg").forEach(c => (c.style.strokeDashoffset = c.dataset.to))));
  };

  // إضافة عادة جديدة (تعريفها مشترك، من غير progress)
  $("#habit-form").addEventListener("submit", async e => {
    if (e.submitter?.value !== "save") return;
    await addDoc(collection(db, "habits"), {
      ownerId: uid, title: $("#h-title").value.trim(), target: +$("#h-target").value, unit: $("#h-unit").value.trim(),
      deadline: $("#h-deadline").value, category: $("#h-cat").value, createdAt: Date.now()
    });
  });

  // تسجيل تقدم: بيتخزن في وثيقة خاصة بيك أنت بس
  $("#habits").addEventListener("submit", async e => {
    e.preventDefault();
    const h = habits.find(x => x.id === e.target.closest(".habit").dataset.id), me = getMe();
    if (!h) return;
    const n = +e.target.querySelector("input").value; if (!n || n < 1) return;
    const done = h.progress + n >= h.target, pts = LOG_POINTS + (done ? FINISH_BONUS : 0);
    await setDoc(doc(db, "habitProgress", `${h.id}_${uid}`),
      { habitId: h.id, uid, progress: increment(n) }, { merge: true });
    await updateDoc(doc(db, "users", uid), { points: increment(pts) });
    logActivity(me, done ? `أنهى «${h.title}» بالكامل 🏆` : `سجّل ${n} ${h.unit} في «${h.title}»`, "habit");
  });

  const u1 = onSnapshot(collection(db, "habits"), s => {
    all = s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => b.createdAt - a.createdAt);
    render();
  });
  const u2 = onSnapshot(query(collection(db, "habitProgress"), where("uid", "==", uid)), s => {
    mine = {};
    s.docs.forEach(d => { const x = d.data(); mine[x.habitId] = x.progress; });
    render();
  });

  return () => { u1(); u2(); };
}
