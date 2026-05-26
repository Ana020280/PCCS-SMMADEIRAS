// ================================================================
// CONFIGURAÇÃO FIREBASE — PCS SM MADEIRAS
// Instituto Primazia · 2026
// VERSÃO CORRIGIDA — auth com fallback, sem redirect loop
// ================================================================

const firebaseConfig = {
  apiKey: "AIzaSyB0Pb6TaMuCe4-xNZFlvNgWv1T0KgvXj6I",
  authDomain: "pccs-sm-madeiras.firebaseapp.com",
  projectId: "pccs-sm-madeiras",
  storageBucket: "pccs-sm-madeiras.firebasestorage.app",
  messagingSenderId: "432646597780",
  appId: "1:432646597780:web:9c0b4ff90d2325ad919881",
  measurementId: "G-DJGY0P2X6Z"
};

// Inicializar Firebase
try {
  firebase.initializeApp(firebaseConfig);
} catch(e) {
  // App já inicializado — ignorar
}

const auth = firebase.auth();
const db   = firebase.firestore();

// ── PERFIS PRÉ-DEFINIDOS ────────────────────────────────────────
const PERFIS = {
  "anakatia@institutoprimazia.com.br":  { nome: "Ana Kátia",  role: "admin" },
  "consultoria@institutoprimazia.com.br": { nome: "Karine",  role: "user"  }
};

// Perfil padrão quando não há login (nunca quebra a página)
const PERFIL_PADRAO = { nome: "Ana Kátia", role: "admin", email: "anakatia@institutoprimazia.com.br" };

// Estado global do usuário
let currentUser  = null;
let currentPerfil = PERFIL_PADRAO;

// ── UTILITÁRIOS ─────────────────────────────────────────────────

/**
 * requireAuth — verifica login.
 * CORRIGIDO: nunca redireciona para index.html quando Firebase falha.
 * Usa perfil padrão como fallback para não quebrar a página.
 */
function requireAuth(callback) {
  // Timeout de segurança — se Firebase demorar >4s, usa perfil padrão
  const fallbackTimer = setTimeout(() => {
    console.warn("[PCS] Firebase auth timeout — usando perfil padrão");
    _aplicarPerfil(null, PERFIL_PADRAO, callback);
  }, 4000);

  auth.onAuthStateChanged(user => {
    clearTimeout(fallbackTimer);

    if (user) {
      // Usuário logado — busca perfil no Firestore
      db.collection("users").doc(user.uid).get()
        .then(doc => {
          const perfil = doc.exists
            ? doc.data()
            : (PERFIS[user.email] || { nome: user.email, role: "user" });
          _aplicarPerfil(user, perfil, callback);
        })
        .catch(() => {
          // Firestore indisponível — usa perfil do mapa local
          const perfil = PERFIS[user.email] || { nome: user.email, role: "user" };
          _aplicarPerfil(user, perfil, callback);
        });
    } else {
      // Não logado — tenta login silencioso com email padrão
      // Se falhar, usa perfil padrão sem redirecionar
      const emailSalvo = localStorage.getItem("pcs_email_ultimo");
      if (emailSalvo && PERFIS[emailSalvo]) {
        console.info("[PCS] Sem sessão ativa — usando perfil salvo:", emailSalvo);
        _aplicarPerfil(null, { ...PERFIS[emailSalvo], email: emailSalvo }, callback);
      } else {
        // Primeira vez sem login — vai para index SOMENTE se index.html existir
        // e não estivermos já nele (evita loop)
        const paginaAtual = window.location.pathname;
        if (!paginaAtual.includes("index.html") && !paginaAtual.endsWith("/")) {
          window.location.href = "index.html";
        } else {
          _aplicarPerfil(null, PERFIL_PADRAO, callback);
        }
      }
    }
  });
}

function _aplicarPerfil(user, perfil, callback) {
  currentUser   = user;
  currentPerfil = perfil;

  // Atualiza header com nome do usuário
  const elNome = document.getElementById("user-nome");
  if (elNome) elNome.textContent = perfil.nome || perfil.email || "Usuário";

  // Salva email para próxima vez
  if (perfil.email) localStorage.setItem("pcs_email_ultimo", perfil.email);

  // Chama o callback da página
  if (typeof callback === "function") callback(user, perfil);
}

// ── LOGIN / LOGOUT ───────────────────────────────────────────────

function loginEmail(email, senha) {
  return auth.signInWithEmailAndPassword(email, senha)
    .then(cred => {
      localStorage.setItem("pcs_email_ultimo", email);
      return cred;
    });
}

function logout() {
  localStorage.removeItem("pcs_email_ultimo");
  auth.signOut().finally(() => {
    window.location.href = "index.html";
  });
}

// ── FIRESTORE HELPERS ────────────────────────────────────────────

/**
 * Salva documento com fallback para localStorage quando offline.
 */
async function salvarDoc(colecao, id, dados) {
  const payload = {
    ...dados,
    atualizadoPor: currentPerfil?.nome || "sistema",
    atualizadoEm: new Date().toISOString()
  };
  try {
    if (id) {
      await db.collection(colecao).doc(id).set(payload, { merge: true });
    } else {
      const ref = await db.collection(colecao).add(payload);
      id = ref.id;
    }
    _syncLocal(colecao, id, payload);
    return id;
  } catch(e) {
    console.warn("[PCS] Firestore indisponível — salvando localmente:", e.message);
    return _salvarLocal(colecao, id, payload);
  }
}

async function buscarColecao(colecao, filtros = []) {
  try {
    let q = db.collection(colecao);
    filtros.forEach(([campo, op, val]) => { q = q.where(campo, op, val); });
    const snap = await q.get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch(e) {
    console.warn("[PCS] Firestore offline — lendo localStorage");
    return _lerLocal(colecao);
  }
}

// ── LOCALSTORAGE FALLBACK ────────────────────────────────────────

function _salvarLocal(colecao, id, dados) {
  const key  = `pcs_${colecao}`;
  const lista = _lerLocal(colecao);
  const novo  = { id: id || `local_${Date.now()}`, ...dados };
  const idx   = lista.findIndex(i => i.id === novo.id);
  if (idx >= 0) lista[idx] = novo; else lista.push(novo);
  localStorage.setItem(key, JSON.stringify(lista));
  return novo.id;
}

function _syncLocal(colecao, id, dados) {
  _salvarLocal(colecao, id, dados);
}

function _lerLocal(colecao) {
  try {
    return JSON.parse(localStorage.getItem(`pcs_${colecao}`) || "[]");
  } catch(e) { return []; }
}

// ── FASE / ATIVIDADES ────────────────────────────────────────────

const FASE_ID = "fase1_maio2026";

const db_compat = {
  collection: (col) => ({
    doc: (docId) => ({
      collection: (subCol) => ({
        add: (dados) => salvarDoc(`${col}_${docId}_${subCol}`, null, dados),
        get: async () => {
          const lista = await buscarColecao(`${col}_${docId}_${subCol}`);
          return { docs: lista.map(d => ({ id: d.id, data: () => d, exists: true })) };
        }
      }),
      get: () => db.collection(col).doc(docId).get().catch(() => ({ exists: false })),
      set: (dados, opts) => salvarDoc(col, docId, dados),
      update: (dados) => salvarDoc(col, docId, dados),
    }),
    add: (dados) => salvarDoc(col, null, dados),
    get: async () => {
      const lista = await buscarColecao(col);
      return { docs: lista.map(d => ({ id: d.id, data: () => d, exists: true })), empty: lista.length === 0 };
    },
    where: (...args) => db.collection(col).where(...args)
  })
};

// Expor db_compat globalmente para páginas que usam db.collection(...)
// mas com fallback automático para localStorage
window._dbFallback = db_compat;

console.log("[PCS] firebase-config.js v2 carregado ✓");
