const senhaInput = document.getElementById('senha');
const toggleIcon = document.getElementById('toggleSenha');
const contratoContainer = document.getElementById('contrato-container');
const selectContratos = document.getElementById('contratos');
let etapa = 'login';

toggleIcon.addEventListener('click', () => {
  const isPassword = senhaInput.type === 'password';
  senhaInput.type = isPassword ? 'text' : 'password';
  toggleIcon.src = isPassword 
    ? 'Assets/olho.png'    
    : 'Assets/fechar-o-olho.png';        
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
    
        contratoContainer.style.display = 'block';
        etapa = 'selecionar-contrato';

       
        selectContratos.innerHTML = '<option value="">Selecione um contrato</option>';
        data.contratos.forEach(c => {
          const option = document.createElement('option');
          option.value = c.idContrato;
          option.textContent = c.descricao; 
          selectContratos.appendChild(option);
        });

        
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
  
  }

  document.querySelector('.esqueci a').addEventListener('click', async (e) => {
  e.preventDefault();

  const cpf = document.getElementById('cpf').value.trim();

  if (!cpf) {
    alert('Digite o CPF para redefinir a senha.');
    return;
  }

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

});
