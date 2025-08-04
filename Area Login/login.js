const senhaInput = document.getElementById('senha');
const toggleIcon = document.getElementById('toggleSenha');
const contratoContainer = document.getElementById('contrato-container');
const selectContratos = document.getElementById('contratos');
let etapa = 'login';

toggleIcon.addEventListener('click', () => {
  const isPassword = senhaInput.type === 'password';
  senhaInput.type = isPassword ? 'text' : 'password';
  toggleIcon.src = isPassword 
    ? 'Assets/cadeado-aberto.png'    
    : 'Assets/iconi2.png';        
});

document.querySelector('.login').addEventListener('submit', async (e) => {
  e.preventDefault();

  const cpf = document.getElementById('cpf').value.trim();
  const senha = document.getElementById('senha').value.trim();

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
        // Exibe o campo de seleção de contrato
        contratoContainer.style.display = 'block';
        etapa = 'selecionar-contrato';

        // Preenche o select
        selectContratos.innerHTML = '<option value="">Selecione um contrato</option>';
        data.contratos.forEach(c => {
          const option = document.createElement('option');
          option.value = c.idContrato;
          option.textContent = c.descricao; // ou plano, ou endereço, etc.
          selectContratos.appendChild(option);
        });

        // Bloqueia os campos para evitar edição
        document.getElementById('cpf').disabled = true;
        document.getElementById('senha').disabled = true;
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
    // Redirecione ou mostre o painel aqui...
  }
});
