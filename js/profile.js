import { db } from "./firebase.js";
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { $, avatar } from "./ui.js";

export async function ensureProfile(user) {
  const ref = doc(db, "users", user.uid);
  if ((await getDoc(ref)).exists()) return;
  await setDoc(ref, {
    name: user.displayName || user.email.split("@")[0],
    nickname: "", photoURL: user.photoURL || "", points: 0
  });
}

export const watchProfile = (uid, cb) => onSnapshot(doc(db, "users", uid), s => s.exists() && cb(s.data()));

export function initProfileDialog(getMe, logout) {
  const dlg = $("#profile-dialog");
  const preview = () => ($("#profile-preview").innerHTML = avatar({ name: $("#p-name").value, photoURL: $("#p-photo").value }, 72));

  $("#me-btn").onclick = () => {
    const me = getMe();
    $("#p-name").value = me.name; $("#p-nick").value = me.nickname || ""; $("#p-photo").value = me.photoURL || "";
    preview(); dlg.showModal();
  };
  ["#p-name", "#p-photo"].forEach(s => $(s).addEventListener("input", preview));
  $("#logout-btn").onclick = () => { dlg.close(); logout(); };

  $("#profile-form").addEventListener("submit", async e => {
    if (e.submitter?.value !== "save") return;
    await updateDoc(doc(db, "users", getMe().uid), {
      name: $("#p-name").value.trim(), nickname: $("#p-nick").value.trim(), photoURL: $("#p-photo").value.trim()
    });
  });
}
