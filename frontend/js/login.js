const senhaInput = document.getElementById('senha');
const toggleIcon = document.getElementById('toggleSenha');
const contratoContainer = document.getElementById('contrato-container');
const selectContratos = document.getElementById('contratos');
const esqueceuSenhaLink = document.querySelector('.esqueci a');
const cpfInput = document.getElementById('cpf');

let etapa = 'login';
let cooldownAtivo = false;

// 🔒 Mostrar/ocultar senha
toggleIcon.addEventListener('click', () => {
  const isPassword = senhaInput.type === 'password';
  senhaInput.type = isPassword ? 'text' : 'password';
  toggleIcon.src = isPassword
    ? 'Assets/olho.png'
    : 'Assets/fechar-o-olho.png';
});

// 🧼 Máscara de CPF
cpfInput.addEventListener('input', (e) => {
  let valor = e.target.value.replace(/\D/g, '');
  if (valor.length > 11) valor = valor.slice(0, 11);

  if (valor.length <= 3) {
    e.target.value = valor;
  } else if (valor.length <= 6) {
    e.target.value = valor.replace(/(\d{3})(\d+)/, '$1.$2');
  } else if (valor.length <= 9) {
    e.target.value = valor.replace(/(\d{3})(\d{3})(\d+)/, '$1.$2.$3');
  } else {
    e.target.value = valor.replace(/(\d{3})(\d{3})(\d{3})(\d+)/, '$1.$2.$3-$4');
  }
});

// ✅ Fluxo de login → seleção de contrato → redirecionamento
document.querySelector('.login').addEventListener('submit', async (e) => {
  e.preventDefault();

  const cpfLimpo = cpfInput.value.replace(/\D/g, '').trim();
  const senha = senhaInput.value.trim();

  if (etapa === 'login') {
    if (!cpfLimpo || !senha) {
      alert('Preencha CPF e senha!');
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpf: cpfLimpo, senha })
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'CPF ou senha incorretos.');
        return;
      }

      // ✅ Salva dados essenciais do cliente
      localStorage.setItem('cliente', JSON.stringify(data.cliente));
      localStorage.setItem('idCliente', String(data.cliente.idCliente));
      localStorage.setItem('nomeCliente', data.cliente.nome);
      localStorage.setItem('cpfCliente', cpfLimpo);
      localStorage.setItem('loginAt', new Date().toISOString());

      // ✅ Exibe seleção de contratos
      contratoContainer.style.display = 'block';
      etapa = 'selecionar-contrato';

      selectContratos.innerHTML = '<option value="">Selecione um contrato</option>';

      // Sugerir o "Ativo" por padrão (sem selecionar automaticamente)
      const contratos = Array.isArray(data.contratos) ? data.contratos : [];
      contratos.forEach(c => {
        const option = document.createElement('option');
        option.value = c.idContrato;
        option.textContent = `#${c.idContrato} - ${c.descricao}`;
        selectContratos.appendChild(option);
      });

      // Desabilita os campos de login após sucesso
      cpfInput.disabled = true;
      senhaInput.disabled = true;

    } catch (err) {
      console.error(err);
      alert('Erro ao conectar com o servidor.');
    }

  } else if (etapa === 'selecionar-contrato') {
    const contratoSelecionado = selectContratos.value;
    if (!contratoSelecionado) {
      alert('Selecione um contrato!');
      return;
    }

    // 🔖 Guarda o contrato escolhido para a tela do sistema
    localStorage.setItem('idContrato', String(contratoSelecionado));
    const textoSelecionado = selectContratos.options[selectContratos.selectedIndex]?.textContent || '';
    localStorage.setItem('contratoDescricao', textoSelecionado);

    // 👉 Vai para a área do sistema (sem parâmetros na URL)
    window.location.href = './index.html';
  }
});

// 🔁 Esqueci minha senha (mantido como está, com cooldown)
esqueceuSenhaLink.addEventListener('click', async (e) => {
  e.preventDefault();

  if (cooldownAtivo) {
    alert('Aguarde um momento antes de tentar novamente.');
    return;
  }

  const cpf = cpfInput.value.replace(/\D/g, '').trim();

  if (!cpf) {
    alert('Digite o CPF para redefinir a senha.');
    return;
  }

  cooldownAtivo = true;
  esqueceuSenhaLink.style.pointerEvents = 'none';
  esqueceuSenhaLink.style.opacity = '0.5';

  setTimeout(() => {
    cooldownAtivo = false;
    esqueceuSenhaLink.style.pointerEvents = 'auto';
    esqueceuSenhaLink.style.opacity = '1';
  }, 60000);

  try {
    const response = await fetch('http://localhost:3000/esqueci-senha', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cpf })
    });

    const data = await response.json();

    if (response.ok) {
      alert(data.message || 'Nova senha enviada ao seu e-mail.');
    } else {
      alert(data.error || 'Erro ao redefinir senha.');
    }
  } catch (err) {
    console.error(err);
    alert('Erro ao conectar com o servidor.');
  }
});
