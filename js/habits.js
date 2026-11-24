import { db } from "./firebase.js";

import { collection, addDoc, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc, increment } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

import { $, CATS, catOptions, esc, avatar } from "./ui.js"; import { logActivity } from "./feed.js";

const LOG_POINTS = 5; const FINISH_BONUS = 25; const CIRC = 264;

let habits = [];

const daysLeft = d => Math.ceil((new Date(d + "T23:59:59") - Date.now()) / 864e5);

// ====================================== // عرض العادة // ======================================

function card(h, me) {

const userProgress = h.progress?.[me.uid];

const mine = userProgress?.value || 0;

const target = Number(h.target) || 1;

const pct = Math.min( 100, Math.round((mine / target) * 100) );

const left = daysLeft(h.deadline);

const finished = mine >= target;

const c = (CATS[h.category] || CATS.personal).color;

const perDay = left > 0 ? Math.ceil((target - mine) / left) : target - mine;

// المشاركون الآخرون const others = Object.entries(h.progress || {}) .filter(([id]) => id !== me.uid) .map(([, user]) => user);

const note = finished ? "مبروك، خلّصتها! 🎉" : left < 0 ? "الديدلاين عدّى" : باقي ${left} يوم · المطلوب ${perDay} ${esc(h.unit)}/يوم;

return ` <article class="habit 
𝑓
𝑖
𝑛
𝑖
𝑠
ℎ
𝑒
𝑑
?
"
𝑑
𝑜
𝑛
𝑒
"
:
"
"
"
𝑑
𝑎
𝑡
𝑎
−
𝑖
𝑑
=
"
{h.id}">

  <i class="tag" style="background:${c}"></i>

  <div class="ring">

    <svg viewBox="0 0 100 100" width="132" height="132">

      <circle
        class="bg"
        cx="50"
        cy="50"
        r="42"
      />

      <circle
        class="fg"
        cx="50"
        cy="50"
        r="42"
        stroke="${finished ? "#16B28A" : c}"
        style="stroke-dashoffset:${CIRC}"
        data-to="${CIRC * (1 - pct / 100)}"
      />

    </svg>

    <span class="pct">${pct}%</span>

  </div>

  <h3>${esc(h.title)}</h3>

  <small>${mine} / ${target} ${esc(h.unit)}</small>

  <small>${note}</small>

  <span class="stack" title="${others.length} مشارك">

    ${others.slice(0, 4).map(u => avatar(u, 24)).join("")}

  </span>

  ${
    finished
      ? ""
      : `
        <form class="log">

          <input
            type="number"
            min="1"
            required
            placeholder="خلّصت كام؟"
          >

          <button class="btn small primary" type="submit">
            سجّل
          </button>

        </form>
      `
  }

  ${
    h.createdBy === me.uid
      ? `<button class="del" type="button" aria-label="حذف">×</button>`
      : ""
  }

</article>


`; }

// ====================================== // تهيئة العادات // ======================================

export function initHabits(getMe) {

$("#h-cat").innerHTML = catOptions();

const dlg = $("#habit-dialog");

const habitForm = $("#habit-form");

const habitsContainer = $("#habits");

// ====================================== // فتح نافذة إضافة عادة // ======================================

$("#add-habit-btn").onclick = () => {

habitForm.reset();

$("#h-deadline").min = new Date()
  .toISOString()
  .slice(0, 10);

dlg.showModal();


};

// ====================================== // إنشاء عادة جديدة في Firestore // ======================================

habitForm.addEventListener("submit", async e => {

e.preventDefault();

try {

  const me = getMe();

  if (!me?.uid) {
    alert("يجب تسجيل الدخول أولاً");
    return;
  }

  const title = $("#h-title").value.trim();

  const target = Number($("#h-target").value);

  const unit = $("#h-unit").value.trim();

  const deadline = $("#h-deadline").value;

  const category = $("#h-cat").value;


  // التحقق من البيانات
  if (!title || !unit || !deadline || !target || target < 1) {

    alert("من فضلك أكمل جميع البيانات بشكل صحيح");

    return;
  }


  const habit = {

    title,

    target,

    unit,

    deadline,

    category,

    createdBy: me.uid,

    createdAt: Date.now(),

    progress: {}

  };


  console.log("Saving habit:", habit);


  // الحفظ في Firestore
  const result = await addDoc(
    collection(db, "habits"),
    habit
  );


  console.log("Habit saved successfully:", result.id);


  // إغلاق النافذة
  dlg.close();

  habitForm.reset();


} catch (error) {

  console.error("Error saving habit:", error);

  alert("فشل حفظ العادة: " + error.message);

}


});

// ====================================== // تسجيل تقدم المستخدم // ======================================

habitsContainer.addEventListener("submit", async e => {

const form = e.target.closest("form.log");

if (!form) return;

e.preventDefault();


try {

  const me = getMe();

  if (!me?.uid) {
    alert("يجب تسجيل الدخول أولاً");
    return;
  }


  const article = form.closest(".habit");

  const habitId = article.dataset.id;

  const h = habits.find(x => x.id === habitId);


  if (!h) return;


  const input = form.querySelector("input");

  const n = Number(input.value);


  if (!Number.isFinite(n) || n < 1) {
    alert("أدخل قيمة صحيحة");
    return;
  }


  // التقدم الحالي
  const current = h.progress?.[me.uid]?.value || 0;

  const next = current + n;

  const done = next >= h.target;


  // النقاط
  const alreadyFinished = current >= h.target;

  const pts = LOG_POINTS + (
    done && !alreadyFinished
      ? FINISH_BONUS
      : 0
  );


  // تحديث تقدم المستخدم في Firestore
  await updateDoc(
    doc(db, "habits", h.id),
    {

      [`progress.${me.uid}`]: {

        value: next,

        name: me.name || "",

        nickname: me.nickname || "",

        photoURL: me.photoURL || "",

        at: Date.now()

      }

    }
  );


  // تحديث نقاط المستخدم
  await updateDoc(
    doc(db, "users", me.uid),
    {
      points: increment(pts)
    }
  );


  // تسجيل النشاط
  logActivity(
    me,

    done
      ? `أنهى «${h.title}» بالكامل 🏆`
      : `سجّل ${n} ${h.unit} في «${h.title}»`,

    "habit"
  );


  input.value = "";


} catch (error) {

  console.error("Error updating progress:", error);

  alert("فشل تسجيل التقدم: " + error.message);

}


});

// ====================================== // حذف العادة // ======================================

habitsContainer.addEventListener("click", async e => {

const btn = e.target.closest(".del");

if (!btn) return;


try {

  const me = getMe();

  const article = btn.closest(".habit");

  const h = habits.find(
    x => x.id === article.dataset.id
  );


  if (!h || h.createdBy !== me.uid) return;


  if (!confirm("هل أنت متأكد من حذف هذه العادة؟")) {
    return;
  }


  await deleteDoc(
    doc(db, "habits", h.id)
  );


} catch (error) {

  console.error("Error deleting habit:", error);

  alert("فشل حذف العادة: " + error.message);

}


});

// ====================================== // استقبال العادات من Firestore // ======================================

return onSnapshot(

query(
  collection(db, "habits"),
  orderBy("createdAt", "desc")
),

snapshot => {

  const me = getMe();

  if (!me?.uid) return;


  habits = snapshot.docs.map(d => ({

    id: d.id,

    ...d.data()

  }));


  // عرض العادات
  habitsContainer.innerHTML =

    habits.map(h => card(h, me)).join("")

    ||

    `<div class="empty">
      ضيف أول عادة وحدد لها ديدلاين.
    </div>`;


  // تحريك دوائر التقدم
  requestAnimationFrame(() => {

    requestAnimationFrame(() => {

      document
        .querySelectorAll(".ring .fg")
        .forEach(circle => {

          circle.style.strokeDashoffset =
            circle.dataset.to;

        });

    });

  });

},

error => {

  console.error("Firestore snapshot error:", error);

  habitsContainer.innerHTML = `
    <div class="empty">
      حصل خطأ أثناء تحميل العادات.
      ${esc(error.message)}
    </div>
  `;

}


);

}
