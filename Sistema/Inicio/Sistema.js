// ======================= SISTEMA.JS (REESCRITO) =========================
// Amigão: este arquivo busca contratos do cliente, preenche o dropdown com cards,
// atualiza o cabeçalho com o nome do cliente e carrega detalhes do contrato.
//
// Depende de duas rotas no backend:
// GET  /api/contratos/:idCliente
// GET  /api/contrato/:idContrato

const API_BASE = "http://localhost:3000";

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const params = new URLSearchParams(window.location.search);
    const qpContrato = params.get("contrato");
    const qpCpf = params.get("cpf");

    // Se veio via URL (login redirecionando), salva no localStorage
    if (qpContrato && qpCpf) {
      localStorage.setItem("cpfCliente", qpCpf);
      localStorage.setItem("idContrato", qpContrato);
    }

    // Preferência: idCliente salvo (se existir). Senão, tenta cpf (fluxo legado)
    const idCliente = localStorage.getItem("idCliente")
      || localStorage.getItem("cpfCliente")
      || qpCpf;

    if (!idCliente) {
      // Não tem cliente definido — redireciona pro login
      console.warn("Cliente não identificado. Voltando para login.");
      window.location.href = "../../pages/Area Login/index.html";
      return;
    }

    // Buscar todos os contratos do cliente (rota /api/contratos/:idCliente)
    const contratos = await fetchContratosDoCliente(idCliente);
    if (!contratos) return;

    // Preenche o dropdown com cards (divs)
    preencherDropdownContratos(contratos);

    // Atualiza cabeçalho com nome do cliente / contrato atual
    atualizarCabecalhoComCliente(contratos);

    // Se já existir um contrato selecionado no localStorage, usa ele;
    // senão define o primeiro contrato como selecionado
    let idContratoSelecionado = localStorage.getItem("idContrato");
    if (!idContratoSelecionado && contratos.length > 0) {
      idContratoSelecionado = String(contratos[0].idContrato);
      localStorage.setItem("idContrato", idContratoSelecionado);
    }

    if (idContratoSelecionado) {
      carregarDadosContrato(idContratoSelecionado);
    }

    // configurar menus, botões e comportamento do dropdown (fechar ao clicar fora)
    configurarMenusEInteracoes();
  } catch (err) {
    console.error("Erro no boot do sistema:", err);
  }
});

/* -------------------- fetchContratosDoCliente -------------------- */
async function fetchContratosDoCliente(idCliente) {
  try {
    const resp = await fetch(`${API_BASE}/api/contratos/${encodeURIComponent(idCliente)}`);
    if (!resp.ok) {
      console.error("Resposta não OK ao buscar contratos:", resp.status);
      return null;
    }
    const data = await resp.json();
    // Esperamos um array (pode vir vazio)
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("Erro ao buscar contratos do cliente:", err);
    return null;
  }
}

/* -------------------- preencherDropdownContratos --------------------
   Preenche #listaContratos (que no seu HTML é uma <div>) com cards
   semelhantes ao visual que você mostrou.
*/
function preencherDropdownContratos(contratos) {
  const lista = document.getElementById("listaContratos");
  if (!lista) return;

  // limpa
  lista.innerHTML = "";

  // topo com nome do cliente (se houver)
  const nomeCliente = contratos[0] && contratos[0].nomeCliente
    ? contratos[0].nomeCliente
    : localStorage.getItem("nomeCliente");

  if (nomeCliente) {
    const clienteBox = document.createElement("div");
    clienteBox.className = "cliente-info-dropdown";
    clienteBox.innerHTML = `<strong>Cliente:</strong> ${escapeHtml(nomeCliente)}`;
    lista.appendChild(clienteBox);
  }

  if (contratos.length === 0) {
    const vazio = document.createElement("div");
    vazio.className = "contrato-vazio";
    vazio.textContent = "Nenhum contrato encontrado.";
    lista.appendChild(vazio);
    return;
  }

  // criar card para cada contrato
  contratos.forEach(contrato => {
    const card = document.createElement("div");
    card.className = "contrato-card-dropdown";
    card.tabIndex = 0; // acessível por teclado

    // montar endereço (se houver campos específicos)
    const endereco = buildEndereco(contrato);

    // plano e velocidade (fallback p/ descricao)
    const plano = contrato.nomePlano || contrato.descricao || "Serviço";
    const velocidade = contrato.velocidade || contrato.velocidadeDownload || "N/D";

    // preço formatado (se numérico)
    const preco = formatarPreco(contrato.preco);

    // status (badge)
    const statusText = contrato.status || "N/D";
    const statusClass = String(statusText).toLowerCase().includes("ativo") ? "status-ativo" : "status-inativo";

    card.innerHTML = `
      <div class="card-top">
        <div class="card-titulo">
          <div class="card-contrato-id">#${escapeHtml(String(contrato.idContrato))}</div>
          <div class="card-plano">${escapeHtml(plano)}</div>
        </div>
        <div class="card-status ${statusClass}">${escapeHtml(statusText)}</div>
      </div>

      <div class="card-body">
        <div class="card-row"><strong>Endereço:</strong> ${escapeHtml(endereco || "Não informado")}</div>
        <div class="card-row"><strong>Velocidade:</strong> ${escapeHtml(String(velocidade))}</div>
        <div class="card-row"><strong>Valor:</strong> ${preco}</div>
      </div>
    `;

    // clique: seleciona contrato, salva e carrega detalhes
    card.addEventListener("click", () => {
      localStorage.setItem("idContrato", String(contrato.idContrato));
      localStorage.setItem("contratoDescricao", plano);
      localStorage.setItem("nomeCliente", contrato.nomeCliente || localStorage.getItem("nomeCliente") || "");
      // atualiza cabeçalho
      const contaInfoEl = document.getElementById("contaInfo");
      const contaNomeEl = document.getElementById("contaNome");
      if (contaInfoEl) contaInfoEl.textContent = `#${contrato.idContrato} - ${contrato.nomeCliente || ""}`;
      if (contaNomeEl) contaNomeEl.textContent = contrato.nomeCliente || "";
      // fecha dropdown (mantendo o mesmo estilo que você usa: display none)
      const dropdown = document.getElementById("dropdownContratos");
      if (dropdown) dropdown.style.display = "none";

      carregarDadosContrato(contrato.idContrato);
    });

    // tecla Enter também seleciona
    card.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") card.click();
    });

    lista.appendChild(card);
  });
}

/* -------------------- buildEndereco -------------------- */
function buildEndereco(contrato) {
  // o server retorna: e.rua, e.numero, e.bairro, e.cidade, e.estado, e.cep
  const parts = [];
  if (contrato.rua) parts.push(contrato.rua);
  if (contrato.numero) parts.push(contrato.numero);
  const bairroCidade = [];
  if (contrato.bairro) bairroCidade.push(contrato.bairro);
  if (contrato.cidade) bairroCidade.push(contrato.cidade);
  if (bairroCidade.length) parts.push(bairroCidade.join(" - "));
  if (contrato.estado) parts.push(contrato.estado);
  if (contrato.cep) parts.push(String(contrato.cep));
  return parts.join(", ");
}

/* -------------------- carregarDadosContrato --------------------
   Busca detalhes de 1 contrato (rota /api/contrato/:idContrato) e preenche
   a área principal (aqui eu atualizo o H2 dentro de .descricao, que seu HTML tem).
*/
async function carregarDadosContrato(idContrato) {
  try {
    if (!idContrato) return;

    const resp = await fetch(`${API_BASE}/api/contrato/${encodeURIComponent(idContrato)}`);
    if (!resp.ok) {
      console.error("Erro ao buscar contrato:", resp.status);
      return;
    }

    const c = await resp.json();
    console.log("Dados do contrato selecionado:", c);

    // Atualiza o título em .descricao h2 (existente no seu HTML)
    const servicoH2 = document.querySelector(".descricao h2");
    if (servicoH2) {
      const plano = c.nomePlano || c.descricao || "Serviço";
      servicoH2.textContent = `Serviço: ${plano}`;
    }

    // Se tiver um container específico para detalhes, atualiza (id opcional)
    const detalheEl = document.getElementById("contratoDetalhes"); // opcional
    if (detalheEl) {
      const endereco = buildEndereco(c);
      detalheEl.innerHTML = `
        <p><strong>ID Contrato:</strong> ${escapeHtml(String(c.idContrato))}</p>
        <p><strong>Titular:</strong> ${escapeHtml(c.nomeTitular || c.nomeCliente || "")}</p>
        <p><strong>CPF:</strong> ${escapeHtml(formatarCPF(c.cpfTitular || ""))}</p>
        <p><strong>Plano:</strong> ${escapeHtml(c.nomePlano || c.descricao || "")}</p>
        <p><strong>Velocidade:</strong> ${escapeHtml(c.velocidade || "N/D")}</p>
        <p><strong>Endereço:</strong> ${escapeHtml(endereco || "N/D")}</p>
        <p><strong>Status:</strong> ${escapeHtml(c.status || "N/D")}</p>
      `;
    }

  } catch (err) {
    console.error("Erro ao carregar dados do contrato:", err);
  }
}

/* -------------------- configurarMenusEInteracoes -------------------- */
function configurarMenusEInteracoes() {
  // Recolher/expandir menu lateral -> botão dentro de .mais
  const btnRecolher = document.querySelector(".mais .circulo");
  if (btnRecolher) {
    btnRecolher.addEventListener("click", () => {
      document.querySelector(".guia")?.classList.toggle("recolhida");
      document.querySelector(".conteudo")?.classList.toggle("recolhida");
      document.querySelector(".menu-rapido")?.classList.toggle("recolhida");
    });
  }

  // Dropdown de contratos -> botão em .outras-contas .circulo
  const btnOutras = document.querySelector(".outras-contas .circulo");
  const dropdown = document.getElementById("dropdownContratos");
  const lista = document.getElementById("listaContratos");

  if (btnOutras && dropdown) {
    btnOutras.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
    });

    // fecha ao clicar fora do dropdown
    document.addEventListener("click", (e) => {
      if (!dropdown.contains(e.target) && !btnOutras.contains(e.target)) {
        dropdown.style.display = "none";
      }
    });

    // fecha com ESC
    document.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape") dropdown.style.display = "none";
    });
  }

  // Conta (perfil)
  const contaToggle = document.getElementById("contaToggle");
  const contaDropdown = document.getElementById("contaDropdown");
  if (contaToggle && contaDropdown) {
    contaToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      contaDropdown.classList.toggle("aberto");
    });

    document.addEventListener("click", (e) => {
      if (!contaDropdown.contains(e.target) && !contaToggle.contains(e.target)) {
        contaDropdown.classList.remove("aberto");
      }
    });

    document.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape") contaDropdown.classList.remove("aberto");
    });
  }

  // Logout
  const sairLink = document.querySelector(".opcao.sair");
  if (sairLink) {
    sairLink.addEventListener("click", (ev) => {
      ev.preventDefault();
      localStorage.clear();
      window.location.href = "../../pages/Area Login/index.html";
    });
  }
}

/* -------------------- util: formatarCPF -------------------- */
function formatarCPF(cpf) {
  if (!cpf) return "";
  const onlyDigits = String(cpf).replace(/\D/g, "");
  if (onlyDigits.length !== 11) return cpf;
  return onlyDigits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

/* -------------------- util: formatarPreco -------------------- */
function formatarPreco(valor) {
  if (valor == null || valor === "") return "R$ 0,00";
  const n = Number(String(valor).replace(",", "."));
  if (Number.isFinite(n)) {
    return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }
  return escapeHtml(String(valor));
};

/* -------------------- util: escapeHtml (simples) -------------------- */
function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

/* -------------------- atualizarCabecalhoComCliente -------------------- */
function atualizarCabecalhoComCliente(contratos) {
  if (!contratos || contratos.length === 0) return;

  const contratoSelecionado = contratos.find(
    c => String(c.idContrato) === String(localStorage.getItem("idContrato"))
  ) || contratos[0];

  const nomeCliente = contratoSelecionado.nomeCliente || localStorage.getItem("nomeCliente") || "Cliente";
  const idContrato = contratoSelecionado.idContrato || localStorage.getItem("idContrato") || "";

  // salva no localStorage (pra ficar disponível em outros pontos)
  localStorage.setItem("nomeCliente", nomeCliente);
  localStorage.setItem("idContrato", idContrato);

  // pega os elementos do cabeçalho no seu HTML
  const contaInfoEl = document.getElementById("contaInfo");
  const contaNomeEl = document.getElementById("contaNome");

  if (contaInfoEl) contaInfoEl.textContent = `#${idContrato} - ${nomeCliente}`;
  if (contaNomeEl) contaNomeEl.textContent = nomeCliente;
};

