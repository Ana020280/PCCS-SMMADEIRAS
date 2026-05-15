// ============================================================
// CONFIGURAÇÃO FIREBASE — PCS SM MADEIRAS
// Instituto Primazia · 2026
// ============================================================

const firebaseConfig = {
  apiKey: "AIzaSyB0Pb6TaMuCe4-xNZFUvNgWv1T0KgvXj6I",
  authDomain: "pccs-sm-madeiras.firebaseapp.com",
  projectId: "pccs-sm-madeiras",
  storageBucket: "pccs-sm-madeiras.firebasestorage.app",
  messagingSenderId: "432646597780",
  appId: "1:432646597780:web:9cdb4ff90d2325ad919881",
  measurementId: "G-DJGYQP2X6Z"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ── PERFIS PRÉ-DEFINIDOS ──────────────────────────────────
const PERFIS = {
  "anakatia@institutoprimazia.com.br": { nome: "Ana Kátia", role: "admin" },
  "consultoria@institutoprimazia.com.br": { nome: "Karine", role: "user" }
};

// ── UTILITÁRIOS ───────────────────────────────────────────
function requireAuth(callback) {
  auth.onAuthStateChanged(user => {
    if (!user) {
      window.location.href = "index.html";
    } else {
      db.collection("users").doc(user.uid).get().then(doc => {
        const perfil = doc.exists ? doc.data() : { nome: user.email, role: "user" };
        callback(user, perfil);
      });
    }
  });
}

function logout() {
  auth.signOut().then(() => window.location.href = "index.html");
}

function isAdmin(perfil) {
  return perfil && perfil.role === "admin";
}

function formatDate(ts) {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("pt-BR");
}

function showToast(msg, tipo = "ok") {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg;
  t.className = "toast show " + tipo;
  setTimeout(() => t.classList.remove("show"), 3000);
}
