import { auth } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { initAuth } from "./auth.js";
import { ensureProfile, watchProfile, initProfileDialog } from "./profile.js";
import { initTasks } from "./tasks.js";
import { initHabits } from "./habits.js";
import { initFeed } from "./feed.js";
import { $, avatar, countTo } from "./ui.js";

let me = null, stops = [];
const getMe = () => me;

initAuth();
initProfileDialog(getMe, () => signOut(auth));

onAuthStateChanged(auth, async user => {
  stops.forEach(f => f()); stops = [];
  $("#auth-view").hidden = !!user;
  $("#app-view").hidden = !user;
  if (!user) { me = null; return; }

  await ensureProfile(user);
  stops.push(
    watchProfile(user.uid, p => {
      me = { uid: user.uid, ...p };
      $("#me-btn").innerHTML = avatar(me, 40);
      countTo($("#pts"), p.points || 0);
    }),
    initTasks(getMe),
    initHabits(user.uid, getMe),
    initFeed(user.uid)
  );
});
