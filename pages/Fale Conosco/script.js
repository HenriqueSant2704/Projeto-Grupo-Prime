const telefoneInput = document.getElementById("telefone");
telefoneInput.addEventListener("input", function () {
  let valor = telefoneInput.value.replace(/\D/g, "");
  if (valor.length === 0) {
    telefoneInput.value = "";
    return;
  }
  if (valor.length > 11) {
    valor = valor.slice(0, 11);
  }
  if (valor.length <= 2) {
    telefoneInput.value = `(${valor}`;
  } else if (valor.length <= 6) {
    telefoneInput.value = `(${valor.slice(0, 2)}) ${valor.slice(2)}`;
  } else if (valor.length <= 10) {
    telefoneInput.value = `(${valor.slice(0, 2)}) ${valor.slice(2, 6)}-${valor.slice(6)}`;
  } else {
    telefoneInput.value = `(${valor.slice(0, 2)}) ${valor.slice(2, 7)}-${valor.slice(7)}`;
  }
});

const form = document.getElementById('formContato');
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());
  try {
    const res = await fetch('http://localhost:3000/enviar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (res.ok) {
      alert('Mensagem enviada com sucesso!');
      form.reset();
    } else {
      alert('Erro ao enviar. Tente novamente.');
    }
  } catch (error) {
    alert('Erro de conexão com o servidor.');
    console.error(error);
  }
});