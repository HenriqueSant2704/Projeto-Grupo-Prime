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