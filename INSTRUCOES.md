# 📋 INSTRUÇÕES DE CORREÇÃO — PCCS 360
## Instituto Primazia · Correções v3

---

## 🎯 PROBLEMAS CORRIGIDOS

1. ✅ **Dados persistem em qualquer dispositivo** — Firestore sync
2. ✅ **Cadastro de usuários com permissões** — Firebase Auth + Firestore
3. ✅ **Arquivos abrem na tela** — Visualizador inline (PDF, imagem, Excel, Word)
4. ✅ **Inconsistências detalhadas** — 6 tipos de análise automática com ação corretiva
5. ✅ **Fases interligadas** — Dados da Fase 1 fluem para o Dashboard

---

## 📁 ARQUIVOS GERADOS

- `firebase-config.js` — SUBSTITUI o arquivo atual
- `fase1-patch.js` — Contém as funções para SUBSTITUIR em fase1.html
- `dashboard-patch.js` — Contém as funções para SUBSTITUIR em dashboard.html

---

## 🔧 PASSO A PASSO

### PASSO 1 — Substituir firebase-config.js

1. Abra a pasta `PCCS-360` no Finder
2. **Apague** o arquivo `firebase-config.js` atual
3. **Cole** o novo `firebase-config.js` desta pasta na pasta PCCS-360

---

### PASSO 2 — Corrigir fase1.html

Abra `fase1.html` no editor de texto e faça as seguintes substituições:

#### 2a. Substitua a função `save()`
Encontre no arquivo:
```
function save(){
  localStorage.setItem(SK,JSON.stringify(cols));
  updKPIs();renderCols();renderIncs();
}
```
Substitua por:
```javascript
async function save() {
  await salvarColaboradores(cols);
  await salvarInconsistencias(incs);
  updKPIs(); renderCols(); renderIncs();
}
```

#### 2b. Substitua a função `load()`
Encontre:
```
function load(){
  cols=JSON.parse(localStorage.getItem(SK)||'[]');
  incs=JSON.parse(localStorage.getItem(SI)||'[]');
  updKPIs();renderCols();renderIncs();
  try{...}catch(e){}
}
```
Substitua pela versão completa do arquivo `fase1-patch.js` (função `load()`).

#### 2c. Substitua `confirmarImp()`
Adicione `await salvarColaboradores(cols);` após o loop de importação.
(Ver `fase1-patch.js` para a versão completa)

#### 2d. Substitua a função `renderIncs()`
A versão no `fase1-patch.js` usa `analisarInconsistencias()` do novo firebase-config.js.

#### 2e. Substitua o `window.addEventListener('load', ...)`
Use a versão do `fase1-patch.js` que chama `requireAuth()` em vez de `checkSessao()`.

---

### PASSO 3 — Corrigir dashboard.html

Abra `dashboard.html` e:

#### 3a. Substitua `updKPIs()`
Use a versão do `dashboard-patch.js` que lê do Firestore.

#### 3b. Substitua o `window.addEventListener('load', ...)`
Use a versão do `dashboard-patch.js`.

---

### PASSO 4 — Configurar Firebase Authentication

Para que usuários façam login, você precisa criar as contas no Firebase:

1. Acesse: **console.firebase.google.com**
2. Selecione o projeto **pccs-sm-madeiras**
3. No menu esquerdo: **Authentication → Users**
4. Clique em **"Add user"**
5. Adicione o e-mail e senha de cada pessoa

Para cada usuário criado, vá em **Firestore Database → usuarios** e crie um documento com:
```json
{
  "nome": "Nome da Pessoa",
  "email": "email@empresa.com",
  "role": "editor",
  "ativo": true
}
```

**Roles disponíveis:**
- `admin` — acesso total + gerenciar usuários
- `editor` — criar e editar dados
- `leitor` — somente visualizar

---

### PASSO 5 — Configurar visualizador de arquivos

Para visualizar arquivos na tela (PDF, imagem, Excel):

No `fase1.html`, nas células de arquivos/entregáveis,
substitua os botões de download por chamadas ao visualizador:

**Antes:**
```html
<a href="arquivo.pdf" download>⬇ Baixar</a>
```

**Depois:**
```html
<button onclick="abrirVisualizador('URL_DO_ARQUIVO', 'nome.pdf', 'pdf')">👁 Visualizar</button>
```

Para arquivos no Firebase Storage, a URL vem do `getDownloadURL()`.

---

### PASSO 6 — Publicar no Firebase Hosting

Após fazer todas as alterações, no Terminal:

```bash
cd ~/Caminho/Para/PCCS-360
firebase deploy
```

O sistema ficará disponível online para todos os dispositivos.

---

## 🔐 SEGURANÇA (LGPD)

Configure as Regras do Firestore para proteger os dados:

No Firebase Console → Firestore → Rules, use:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Usuários só acessam seus próprios perfis
    match /usuarios/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
      allow read: if request.auth != null && 
        get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.role == 'admin';
    }
    // Dados do projeto — apenas usuários autenticados
    match /projetos/{projetoId}/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.role in ['admin', 'editor'];
    }
  }
}
```

---

## ⚠️ IMPORTANT

Após substituir o `firebase-config.js`, os dados que estão no `localStorage`
do seu computador precisam ser migrados para o Firestore.

Para migrar os dados existentes, abra o `fase1.html` no navegador,
e clique em "Salvar" ou "Importar" qualquer dado — isso vai disparar o
`save()` corrigido que sincroniza tudo para o Firestore.

---

*Documento gerado automaticamente — PCCS 360 · Instituto Primazia*
