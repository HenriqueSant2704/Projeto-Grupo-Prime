//  Captura contrato e cpf da URL ao entrar na página do sistema
document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const contrato = params.get("contrato");
  const cpf = params.get("cpf");

  if (contrato && cpf) {
    console.log("Usuário logado com CPF:", cpf);
    console.log("Contrato selecionado:", contrato);

    // Exemplo: buscar os dados do contrato específico no backend
    fetch(`http://localhost:3000/contratos?idCliente=${cpf}`)
      .then(res => res.json())
      .then(data => {
        console.log("Dados do contrato:", data);
      })
      .catch(err => console.error("Erro ao buscar contrato:", err));
  }

  // Toggle do menu da conta (dropdown)
  const contaToggle = document.getElementById("contaToggle");
  const contaDropdown = document.getElementById("contaDropdown");

  if (contaToggle && contaDropdown) {
    const fecharDropdown = () => contaDropdown.classList.remove("aberto");

    // Abre/fecha ao clicar no cabeçalho da conta
    contaToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      contaDropdown.classList.toggle("aberto");
    });

    // Fecha ao clicar fora
    document.addEventListener("click", (e) => {
      if (!contaDropdown.contains(e.target) && !contaToggle.contains(e.target)) {
        fecharDropdown();
      }
    });

    // Fecha com ESC
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") fecharDropdown();
    });
  }
});

//  Botão para recolher/expandir menu lateral
document.querySelector('.circulo').addEventListener('click', () => {
  document.querySelector('.guia').classList.toggle('recolhida');
  document.querySelector('.conteudo').classList.toggle('recolhida');
  document.querySelector('.menu-rapido').classList.toggle('recolhida');
});

//  Dropdown para trocar de contrato
document.addEventListener("DOMContentLoaded", () => {
  const btnOutrasContas = document.querySelector(".outras-contas .circulo");
  const dropdown = document.getElementById("dropdownContratos");
  const lista = document.getElementById("listaContratos");

  let contratosCache = null; // pra não ficar chamando API toda hora

  btnOutrasContas.addEventListener("click", async () => {
    dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";

    if (contratosCache) return;

    try {
      //  Aqui futuramente podemos trocar pelo endpoint usando o CPF logado
      const response = await fetch("http://localhost:3000/contratos?idCliente=1");
      const data = await response.json();

      contratosCache = data;
      lista.innerHTML = "";

      data.forEach(contrato => {
        const li = document.createElement("li");
        li.textContent = `${contrato.descricao} (${contrato.status})`;
        
        li.addEventListener("click", () => {
          console.log("Contrato selecionado:", contrato);
          dropdown.style.display = "none";
          // aqui você pode carregar dados do contrato
        });

        lista.appendChild(li);
      });
    } catch (err) {
      console.error("Erro ao buscar contratos:", err);
      lista.innerHTML = "<li>Erro ao carregar contratos</li>";
    }
  });

  // Fechar se clicar fora
  document.addEventListener("click", (e) => {
    if (!dropdown.contains(e.target) && !btnOutrasContas.contains(e.target)) {
      dropdown.style.display = "none";
    }
  });
});

//  Menu da conta
document.addEventListener("DOMContentLoaded", () => {
  const conta = document.querySelector(".conta");
  const menuConta = document.querySelector("#menuConta");

  if (conta && menuConta) {
    conta.addEventListener("click", () => {
      menuConta.classList.toggle("ativo");
    });
  }

  document.addEventListener("click", (event) => {
    if (!conta.contains(event.target) && !menuConta.contains(event.target)) {
      menuConta.classList.remove("ativo");
    }
  });
});

//  Sistema.js
document.addEventListener("DOMContentLoaded", () => {
  // 🔎 Recupera dados do cliente e contrato do localStorage
  const nomeCliente = localStorage.getItem("nomeCliente") || "Cliente";
  const cpfCliente = localStorage.getItem("cpfCliente") || "";
  const contratoDescricao = localStorage.getItem("contratoDescricao") || "";
  const idContrato = localStorage.getItem("idContrato") || "";
  const loginAt = localStorage.getItem("loginAt");

  // Preenche as áreas da conta no topo
  const contaInfo = document.getElementById("contaInfo");
  const contaNome = document.getElementById("contaNome");

  if (contaInfo) contaInfo.textContent = `#${idContrato} - ${nomeCliente}`;
  if (contaNome) contaNome.textContent = `${nomeCliente}`;

  // Preenche lista de contratos no menu rápido
  const listaContratos = document.getElementById("listaContratos");
  if (listaContratos) {
    listaContratos.innerHTML = "";
    const contratoItem = document.createElement("li");
    contratoItem.textContent = contratoDescricao || `Contrato #${idContrato}`;
    listaContratos.appendChild(contratoItem);
  }

  // Corrige botão de sair (logout)
  const sairLink = document.querySelector(".opcao.sair");
  if (sairLink) {
    sairLink.addEventListener("click", (e) => {
      e.preventDefault();
      // localStorage.clear();
      window.location.href = "../../pages/Area Login/index.html";
    });
  }

  // Exemplo: buscar detalhes do contrato no backend
  if (idContrato) {
    carregarDadosContrato(idContrato);
  }
});

//  Função auxiliar para formatar CPF
function formatarCPF(cpf) {
  if (!cpf || cpf.length !== 11) return cpf;
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

//  Buscar dados extras do contrato
async function carregarDadosContrato(idContrato) {
  try {
    const response = await fetch(`http://localhost:3000/contrato/${idContrato}`);
    if (!response.ok) throw new Error("Erro ao buscar contrato");

    const data = await response.json();
    console.log("📄 Dados do contrato:", data);

    //  Aqui você pode exibir os dados na tela (Ex: em 'Serviço Contratado')
    const servicoContainer = document.querySelector(".descricao h2");
    if (servicoContainer) {
      servicoContainer.textContent = `Serviço: ${data.plano || "N/D"}`;
    }
  } catch (err) {
    console.error("Erro:", err);
  }
}
