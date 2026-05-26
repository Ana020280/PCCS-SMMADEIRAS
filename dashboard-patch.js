// ================================================================
// DASHBOARD-PATCH.JS — Substituições para dashboard.html
// ================================================================

// ── SUBSTITUIÇÃO 1: Função updKPIs() ─────────────────────────────
// Localize "function updKPIs(){" e substitua por:

async function updKPIs() {
  try {
    // ✅ NOVO: lê do Firestore em vez de localStorage
    const cols = await carregarColaboradores();
    const cargos = [...new Set(cols.map(c => c.funcaoReal || c.cargoCtps).filter(Boolean))];
    const incs = analisarInconsistencias(cols);
    const folha = cols.reduce((s, c) => s + (parseFloat(c.salario) || 0), 0);
    const prog  = cols.length ? Math.round(cols.length / Math.max(cols.length, 1) * 30) : 0;

    document.getElementById("k-col").textContent = cols.length;
    document.getElementById("k-car").textContent = cargos.length;
    document.getElementById("k-inc").textContent = incs.length;
    document.getElementById("k-fol").textContent = "R$ " + folha.toLocaleString("pt-BR", {minimumFractionDigits: 2});

    // Atualiza barra de progresso da Fase 1
    const p1 = document.getElementById("p1");
    if (p1 && cols.length > 0) p1.style.width = Math.min(100, prog) + "%";

  } catch(e) {
    console.warn("[Dashboard] Erro ao carregar KPIs:", e);
  }
}

// ── SUBSTITUIÇÃO 2: window.addEventListener ──────────────────────

window.addEventListener("load", () => {
  requireAuth(async (user, perfil) => {
    document.getElementById("user-nome").textContent = perfil.nome || perfil.email;
    await updKPIs();
  });
});

// ── SUBSTITUIÇÃO 3: Função sair() ────────────────────────────────

function sair() {
  _clearSessaoLocal();
  try { auth.signOut(); } catch(e) {}
  window.location.href = "index.html";
}
