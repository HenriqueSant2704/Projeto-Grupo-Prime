const senhaInput = document.getElementById('senha');
const toggleIcon = document.getElementById('toggleSenha');
const contratoContainer = document.getElementById('contrato-container');
const selectContratos = document.getElementById('contratos');
const esqueceuSenhaLink = document.querySelector('.esqueci a'); // link do "Esqueci a senha"
const cpfInput = document.getElementById('cpf');

let etapa = 'login';
let cooldownAtivo = false;


toggleIcon.addEventListener('click', () => {
  const isPassword = senhaInput.type === 'password';
  senhaInput.type = isPassword ? 'text' : 'password';
  toggleIcon.src = isPassword
    ? 'Assets/olho.png'
    : 'Assets/fechar-o-olho.png';
});

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


document.querySelector('.login').addEventListener('submit', async (e) => {
  e.preventDefault();

  const cpf = cpfInput.value.replace(/\D/g, '').trim(); 
  const senha = senhaInput.value.trim();

  if (etapa === 'login') {
    if (!cpf || !senha) {
      alert('Preencha CPF e senha!');
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpf, senha })
      });

      const data = await response.json();

      if (response.ok) {
        contratoContainer.style.display = 'block';
        etapa = 'selecionar-contrato';

        selectContratos.innerHTML = '<option value="">Selecione um contrato</option>';
        data.contratos.forEach(c => {
          const option = document.createElement('option');
          option.value = c.idContrato;
          option.textContent = c.descricao;
          selectContratos.appendChild(option);
        });

        cpfInput.disabled = true;
        senhaInput.disabled = true;
      } else {
        alert(data.error || 'CPF ou senha incorretos.');
      }
    } catch (err) {
      alert('Erro ao conectar com o servidor.');
      console.error(err);
    }

  } else if (etapa === 'selecionar-contrato') {
    const contratoSelecionado = selectContratos.value;
    if (!contratoSelecionado) {
      alert('Selecione um contrato!');
      return;
    }

    alert(`Login realizado com sucesso!\nContrato selecionado: ${contratoSelecionado}`);
  }
});

// Esqueci a senha
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
    alert('Erro ao conectar com o servidor.');
    console.error(err);
  }
});
