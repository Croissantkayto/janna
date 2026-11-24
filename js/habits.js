import { db } from "./firebase.js";
import { collection, addDoc, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc, deleteField, increment }
  from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { $, CATS, catOptions, esc, avatar } from "./ui.js";
import { logActivity } from "./feed.js";

const LOG_POINTS = 5, FINISH_BONUS = 25, CIRC = 264;
let habits = [];

const daysLeft = d => Math.ceil((new Date(d + "T23:59:59") - Date.now()) / 864e5);

function card(h, me) {
  const mine = h.progress?.[me.uid] || 0;
  const target = h.target;
  const pct = Math.min(100, Math.round(mine / target * 100));
  const left = daysLeft(h.deadline);
  const finished = mine >= target;
  const c = (CATS[h.category] || CATS.personal).color;
  const perDay = left > 0 ? Math.ceil((target - mine) / left) : target - mine;

  // باقي المشاركين
  const others = Object.entries(h.progress || {})
    .filter(([id]) => id !== me.uid)
    .map(([, v]) => v);

  const note = finished
    ? "مبروك، خلّصتها! 🎉"
    : left < 0
      ? "الديدلاين عدّى"
      : `باقي ${left} يوم · المطلوب ${perDay} ${esc(h.unit)}/يوم`;

  return `<article class="habit ${finished ? "done" : ""}" data-id="${h.id}">
    <i class="tag" style="background:${c}"></i>
    <div class="ring"><svg viewBox="0 0 100 100" width="132" height="132">
      <circle class="bg" cx="50" cy="50" r="42"/>
      <circle class="fg" cx="50" cy="50" r="42" stroke="${finished ? "#16B28A" : c}" style="stroke-dashoffset:${CIRC}" data-to="${CIRC * (1 - pct / 100)}"/>
    </svg><span class="pct">${pct}%</span></div>
    <h3>${esc(h.title)}</h3>
    <small>${mine} / ${target} ${esc(h.unit)}</small>
    <small>${note}</small>
    <span class="stack" title="${others.length} مشارك">${others.slice(0,4).map(u => avatar(u, 24)).join("")}</span>
    ${finished ? "" : `<form class="log"><input type="number" min="1" required placeholder="خلّصت كام؟"><button class="btn small primary">سجّل</button></form>`}
    ${h.createdBy === me.uid ? `<button class="del" aria-label="حذف">×</button>` : ""}
  </article>`;
}

export function initHabits(getMe) {
  $("#h-cat").innerHTML = catOptions();
  const dlg = $("#habit-dialog");
  $("#add-habit-btn").onclick = () => {
    $("#habit-form").reset();
    $("#h-deadline").min = new Date().toISOString().slice(0, 10);
    dlg.showModal();
  };

  // إنشاء عادة مشتركة
  $("#habit-form").addEventListener("submit", async e => {
    if (e.submitter?.value !== "save") return;
    const me = getMe();
    await addDoc(collection(db, "habits"), {
      title: $("#h-title").value.trim(),
      target: +$("#h-target").value,
      unit: $("#h-unit").value.trim(),
      deadline: $("#h-deadline").value,
      category: $("#h-cat").value,
      createdBy: me.uid,
      createdAt: Date.now(),
      progress: {}            // ← map { uid: number }
    });
  });

  // تسجيل تقدّم المستخدم الحالي
  $("#habits").addEventListener("submit", async e => {
    e.preventDefault();
    const me = getMe();
    const h = habits.find(x => x.id === e.target.closest(".habit").dataset.id);
    const n = +e.target.querySelector("input").value;
    if (!h || !n || n < 1) return;

    const current = h.progress?.[me.uid] || 0;
    const next = current + n;
    const done = next >= h.target;
    const pts = LOG_POINTS + (done ? FINISH_BONUS : 0);

    // نحدّث تقدّم المستخدم جوّه الـ map، مع بياناته عشان نعرض الآفاتار
    await updateDoc(doc(db, "habits", h.id), {
      [`progress.${me.uid}`]: {
        value: next,
        name: me.name,
        nickname: me.nickname || "",
        photoURL: me.photoURL || "",
        at: Date.now(),
      }
    });
    await updateDoc(doc(db, "users", me.uid), { points: increment(pts) });
    logActivity(
      me,
      done
        ? `أنهى «${h.title}» بالكامل 🏆`
        : `سجّل ${n} ${h.unit} في «${h.title}»`,
      "habit"
    );
  });

  // حذف عادة (اللي أنشأها بس)
  $("#habits").addEventListener("click", async e => {
    const btn = e.target.closest(".del");
    if (!btn) return;
    const me = getMe();
    const h = habits.find(x => x.id === e.target.closest(".habit").dataset.id);
    if (h && h.createdBy === me.uid) {
      await deleteDoc(doc(db, "habits", h.id));
    }
  });

  // كل المستخدمين يشوفوا كل العادات (مش مفلترة بـ ownerId)
  return onSnapshot(
    query(collection(db, "habits"), orderBy("createdAt", "desc")),
    s => {
      const me = getMe();
      habits = s.docs.map(d => ({ id: d.id, ...d.data() }));
      $("#habits").innerHTML =
        habits.map(h => card(h, me)).join("") ||
        `<div class="empty">ضيف أول عادة وحدد لها ديدلاين.</div>`;
      requestAnimationFrame(() =>
        requestAnimationFrame(() =>
          document.querySelectorAll(".ring .fg").forEach(
            c => (c.style.strokeDashoffset = c.dataset.to)
          )
        )
      );
    }
  );
}
