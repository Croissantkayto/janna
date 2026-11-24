import { auth, googleProvider } from "./firebase.js";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, updateProfile }
  from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { $ } from "./ui.js";

const MSG = {
  "auth/invalid-credential": "الإيميل أو كلمة السر غلط.",
  "auth/email-already-in-use": "الإيميل ده مسجّل قبل كده.",
  "auth/weak-password": "كلمة السر ضعيفة، استخدم 6 حروف على الأقل.",
  "auth/invalid-email": "صيغة الإيميل غير صحيحة.",
  "auth/popup-closed-by-user": "اتقفلت نافذة Google قبل ما تكمّل."
};

export function initAuth() {
  let mode = "login";
  const err = m => ($("#auth-error").textContent = m || "");

  document.querySelectorAll(".tab").forEach(b => b.onclick = () => {
    mode = b.dataset.mode; err();
    document.querySelectorAll(".tab").forEach(x => x.classList.toggle("on", x === b));
    $("#auth-name").hidden = mode !== "signup";
    $("#auth-name").required = mode === "signup";
    $("#auth-submit").textContent = mode === "signup" ? "إنشاء الحساب" : "دخول";
  });

  $("#auth-form").onsubmit = async e => {
    e.preventDefault(); err();
    const email = $("#auth-email").value.trim(), pass = $("#auth-pass").value;
    try {
      if (mode === "signup") {
        const { user } = await createUserWithEmailAndPassword(auth, email, pass);
        await updateProfile(user, { displayName: $("#auth-name").value.trim() });
      } else await signInWithEmailAndPassword(auth, email, pass);
    } catch (x) { err(MSG[x.code] || "حصلت مشكلة، حاول تاني."); }
  };

  $("#google-btn").onclick = async () => {
    try { await signInWithPopup(auth, googleProvider); }
    catch (x) { err(MSG[x.code] || "تعذّر الدخول بـ Google."); }
  };
}
