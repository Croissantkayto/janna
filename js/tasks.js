import { db } from "./firebase.js";
import { collection, addDoc, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc, deleteField, increment, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { $, CATS, catOptions, esc, avatar } from "./ui.js";
import { logActivity } from "./feed.js";

const TASK_POINTS = 10;
let tasks = [], filter = "all";

export function initTasks(getMe) {
  $("#task-cat").innerHTML = catOptions();
  const render = () => {
    const me = getMe(); if (!me) return;
    $("#filters").innerHTML = [["all", "الكل"], ...Object.entries(CATS).map(([k, c]) => [k, c.label])]
      .map(([k, l]) => `<button class="chip ${filter === k ? "on" : ""}" data-f="${k}">${l}</button>`).join("");
    const list = tasks.filter(t => filter === "all" || t.category === filter);
    $("#tasks").innerHTML = list.map(t => {
      const others = Object.entries(t.done || {}).filter(([id]) => id !== me.uid).map(([, u]) => u);
      const c = CATS[t.category] || CATS.personal;
      return `<li class="task ${t.done?.[me.uid] ? "mine" : ""}" data-id="${t.id}">
        <button class="check" aria-label="تم"><svg viewBox="0 0 20 20"><path d="M4 10l4 4 8-8"/></svg></button>
        <span class="t">${esc(t.title)}</span>
        <span class="cat" style="background:${c.color}">${c.label}</span>
        <span class="stack" title="${others.map(u => esc(u.name)).join("، ")}">${others.slice(0, 4).map(u => avatar(u, 26)).join("")}</span>
        ${t.createdBy === me.uid ? `<button class="del" aria-label="حذف">×</button>` : ""}
      </li>`;
    }).join("") || `<li class="empty">مفيش مهام لسه. ابدأ بأول واحدة!</li>`;
  };

  $("#filters").onclick = e => { const f = e.target.dataset.f; if (f) { filter = f; render(); } };

  $("#task-form").onsubmit = async e => {
    e.preventDefault(); const me = getMe();
    const title = $("#task-title").value.trim(); if (!title) return;
    await addDoc(collection(db, "tasks"), {
      title, category: $("#task-cat").value, points: TASK_POINTS, createdBy: me.uid, createdAt: serverTimestamp(), done: {}
    });
    $("#task-title").value = "";
  };

  $("#tasks").onclick = async e => {
    const li = e.target.closest(".task"); if (!li) return;
    const t = tasks.find(x => x.id === li.dataset.id), me = getMe();
    if (e.target.closest(".del")) return deleteDoc(doc(db, "tasks", t.id));
    if (!e.target.closest(".check")) return;
    const was = !!t.done?.[me.uid];
    await updateDoc(doc(db, "tasks", t.id), {
      [`done.${me.uid}`]: was ? deleteField() : { name: me.name, nickname: me.nickname || "", photoURL: me.photoURL || "", at: Date.now() }
    });
    await updateDoc(doc(db, "users", me.uid), { points: increment(was ? -t.points : t.points) });
    if (!was) logActivity(me, `خلّص مهمة «${t.title}»`, "task");
  };

  return onSnapshot(query(collection(db, "tasks"), orderBy("createdAt", "desc")), s => {
    tasks = s.docs.map(d => ({ id: d.id, ...d.data() })); render();
  });
}
