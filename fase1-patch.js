// ================================================================
// FASE1-PATCH.JS — Substituições para fase1.html
// Copie estas funções e SUBSTITUA as originais no fase1.html
// ================================================================

// ── ONDE SUBSTITUIR ──────────────────────────────────────────────
// No fase1.html, localize a seção "// ── PERSISTÊNCIA ──"
// e substitua as funções save() e load() pelas versões abaixo.
// Também substitua confirmarImp() e salvarCol() conforme indicado.

// ── SUBSTITUIÇÃO 1: Função save() ────────────────────────────────
// Substitui a função que começa com "function save(){"

async function save() {
  // 1. Salva no Firestore (e localStorage como backup)
  await salvarColaboradores(cols);
  await salvarInconsistencias(incs);
  // 2. Atualiza a tela
  updKPIs();
  renderCols();
  renderIncs();
}

// ── SUBSTITUIÇÃO 2: Função load() ────────────────────────────────
// Substitui a função que começa com "function load(){"

async function load() {
  // Mostra indicador de carregamento
  const tb = document.getElementById("tb-col");
  if (tb) tb.innerHTML = '<tr><td colspan="12" style="text-align:center;padding:32px;color:#aaa">⏳ Carregando colaboradores...</td></tr>';

  // Carrega do Firestore (com fallback localStorage)
  cols = await carregarColaboradores();
  incs = await carregarInconsistencias();

  // Carrega alinhamento
  try {
    const a = await carregarAlinhamento();
    if (a.data)  document.getElementById("al-data").value  = a.data;
    if (a.part)  document.getElementById("al-part").value  = a.part;
    if (a.enc)   document.getElementById("al-enc").value   = a.enc;
  } catch(e) {}

  updKPIs();
  renderCols();
  renderIncs();
}

// ── SUBSTITUIÇÃO 3: Função confirmarImp() ────────────────────────
// Substitui a função que começa com "function confirmarImp(){"
// ADICIONA o save para Firestore após importação

async function confirmarImp() {
  if (!impData.length) return;
  document.getElementById("pw").style.display = "block";
  let n = 0;
  impData.forEach((c, i) => {
    const ct = (c.cargoCtps || "").toLowerCase().trim();
    const fr = (c.funcaoReal || "").toLowerCase().trim();
    c.temI = ct && fr && ct !== fr;
    c.tipoI = c.temI ? "Cargo diferente da função" : null;
    cols.push(c); n++;
    document.getElementById("pb").style.width = Math.round(n / impData.length * 100) + "%";
    document.getElementById("pt").textContent = "Importando " + n + " de " + impData.length + "...";
    const el = document.getElementById("ist_" + i);
    if (el) el.textContent = "✓";
  });

  // ✅ NOVO: salva no Firestore
  await salvarColaboradores(cols);
  updKPIs();
  document.getElementById("pt").textContent = "✅ " + n + " colaboradores importados e salvos na nuvem!";
  document.getElementById("chk1").checked = true;
  updProg();
  setTimeout(() => {
    cancelImp();
    document.getElementById("pw").style.display = "none";
    showTab("colabs", document.querySelector(".tb"));
    renderCols();
  }, 2000);
}

// ── SUBSTITUIÇÃO 4: Função salvarCol() ───────────────────────────
// Encontre "function salvarCol(){"
// Na linha que tem: "if(editId){... else cols.push(r); save();"
// Substitua apenas "save();" por "save().then();"
// OU substitua a função inteira:

async function salvarCol() {
  const nome = document.getElementById("mn").value.trim();
  if (!nome) { alert("Nome é obrigatório."); return; }
  const cargo = document.getElementById("mct").value.trim();
  const func  = document.getElementById("mfr").value.trim();
  const sit   = document.getElementById("m-sit").value;
  const grat  = parseFloat(document.getElementById("m-grat").value) || 0;
  const temI  = (cargo && func && cargo.toLowerCase() !== func.toLowerCase()) || (grat > 0) || sit.includes("Aguardando");
  let tipoI = "";
  if (cargo && func && cargo.toLowerCase() !== func.toLowerCase()) tipoI = "Cargo diferente da função";
  else if (grat > 0) tipoI = "Remuneração informal";
  else if (sit.includes("Aguardando")) tipoI = "Trabalhando sem registro";

  const r = {
    id: editId || "c_" + Date.now(),
    nome, cpf: document.getElementById("mc").value.trim(),
    dataAdm1: document.getElementById("ma1").value,
    dataAdm2: document.getElementById("ma2").value,
    dataAdmissao: document.getElementById("ma1").value,
    numAcordos: parseInt(document.getElementById("m-acordos").value) || 0,
    obsAcordos: document.getElementById("m-obs-acordos").value,
    cargoCtps: cargo, funcaoReal: func || cargo,
    departamento: document.getElementById("mdp").value,
    vinculo: document.getElementById("mv").value,
    situacao: sit, obsSituacao: document.getElementById("m-obs-sit").value,
    salario: parseFloat(document.getElementById("msl").value) || 0,
    gratificacao: grat,
    beneficios: parseFloat(document.getElementById("mb").value) || 0,
    temI, tipoI,
    observacoes: document.getElementById("m-obs").value,
    atualizadoEm: new Date().toISOString(),
    criadoEm: editId ? (cols.find(c => c.id === editId) || {}).criadoEm : new Date().toISOString()
  };

  if (editId) { const i = cols.findIndex(c => c.id === editId); if (i >= 0) cols[i] = r; }
  else cols.push(r);

  // ✅ NOVO: salva no Firestore
  await save();
  fecharM();
}

// ── SUBSTITUIÇÃO 5: Função salvarAlin() ──────────────────────────
// Encontre "function salvarAlin(){"

async function salvarAlin() {
  const dados = {
    data: document.getElementById("al-data").value,
    part: document.getElementById("al-part").value,
    enc:  document.getElementById("al-enc").value
  };
  // ✅ NOVO: salva no Firestore
  await salvarAlinhamento(dados);
  alert("✅ Alinhamento salvo na nuvem!");
}

// ── SUBSTITUIÇÃO 6: Inicialização no window.addEventListener ─────
// Localize: "window.addEventListener('load', ..."
// Substitua por:

window.addEventListener("load", () => {
  requireAuth(async (user, perfil) => {
    sessao = perfil;
    // Carrega dados do Firestore
    await load();
    // Atualiza select de departamentos
    try { updDepSelect(); } catch(e) {}
    // Aplica permissões visuais
    if (!podeEditar()) {
      const btn = document.getElementById("btn-add-col");
      if (btn) btn.style.display = "none";
    }
  });
});

// ── IMPORTANTE: TAMBÉM SUBSTITUA renderIncs() ────────────────────
// Para mostrar inconsistências automáticas detalhadas,
// adicione NO INÍCIO de renderIncs() a geração automática:

function renderIncs() {
  // Gera inconsistências automáticas detalhadas
  const autoIncs = analisarInconsistencias(cols);
  const todas = [...autoIncs, ...incs.filter(i => i.origem === "manual")];

  const tb = document.getElementById("tb-inc");
  if (!todas.length) {
    tb.innerHTML = '<tr><td colspan="6" class="empty">✅ Nenhuma inconsistência encontrada.</td></tr>';
    return;
  }

  const prioColor = { "CRÍTICO": "#dc2626", "ALTO": "#d97706", "MÉDIO": "#2563eb", "BAIXO": "#6b7280" };
  const prioIcon  = { "CRÍTICO": "🔴", "ALTO": "🟠", "MÉDIO": "🟡", "BAIXO": "🔵" };

  tb.innerHTML = todas.map(inc => `
    <tr>
      <td>
        <strong style="font-size:13px">${inc.colaborador}</strong>
        ${inc.colaboradores ? `<div style="font-size:10px;color:#aaa;margin-top:3px">${inc.colaboradores.map(c=>c.nome).join(", ")}</div>` : ""}
      </td>
      <td><span style="font-size:11px;font-weight:600;color:${prioColor[inc.prioridade]||'#666'}">${prioIcon[inc.prioridade]||''} ${inc.tipo}</span></td>
      <td style="font-size:12px;color:#555;max-width:300px">${inc.descricao}</td>
      <td style="font-size:11px;color:#777">—</td>
      <td>
        <span style="display:inline-block;padding:3px 8px;border-radius:4px;font-size:10px;font-weight:600;background:${prioColor[inc.prioridade]+'22'};color:${prioColor[inc.prioridade]||'#666'}">
          ${inc.prioridade}
        </span>
      </td>
      <td>
        <span style="font-size:10px;color:#aaa">${inc.origem || "automático"}</span>
        ${inc.onde ? `<br><a href="${inc.onde}" style="font-size:10px;color:#B8860B;text-decoration:none">→ Ir corrigir</a>` : ""}
        ${inc.acao ? `<div style="font-size:10px;color:#555;margin-top:4px;max-width:200px;line-height:1.4">${inc.acao}</div>` : ""}
      </td>
    </tr>
  `).join("");
}
