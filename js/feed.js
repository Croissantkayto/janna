import { db } from "./firebase.js";
import { collection, addDoc, onSnapshot, query, orderBy, limit }
  from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { $, avatar, who, esc, toast, ago } from "./ui.js";

export const logActivity = (me, text, type) =>
  addDoc(collection(db, "activity"), {
    uid: me.uid, name: me.name, nickname: me.nickname || "", photoURL: me.photoURL || "",
    text, type, at: Date.now()
  });

export function initFeed(uid) {
  let first = true;
  const off1 = onSnapshot(query(collection(db, "activity"), orderBy("at", "desc"), limit(25)), snap => {
    // إشعار حماسي لما حد تاني يخلّص حاجة
    if (!first) snap.docChanges().forEach(c => {
      const a = c.doc.data();
      if (c.type === "added" && a.uid !== uid)
        toast(`${avatar(a, 28)}<span><b>${who(a)}</b> ${esc(a.text)} 🔥 يلا دورك!</span>`);
    });
    first = false;
    $("#feed").innerHTML = snap.docs.map(d => d.data()).map(a =>
      `<li>${avatar(a, 34)}<div><b>${who(a)}</b> ${esc(a.text)}<time>${ago(a.at)}</time></div></li>`
    ).join("") || `<li class="muted">لسه مفيش نشاط.</li>`;
  });

  const off2 = onSnapshot(query(collection(db, "users"), orderBy("points", "desc"), limit(8)), snap => {
    $("#board").innerHTML = snap.docs.map((d, i) => {
      const u = d.data();
      return `<li><span class="n">${i + 1}</span>${avatar(u, 30)}<span>${who(u)}</span><span class="p">${u.points || 0}</span></li>`;
    }).join("");
  });
  return () => { off1(); off2(); };
}
