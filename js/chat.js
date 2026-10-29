(function () {
  const MAX_CARACTERES = 500;

  const mensagens = document.getElementById("mensagens");
  const formulario = document.getElementById("formulario");
  const campo = document.getElementById("pergunta");
  const contador = document.getElementById("contador");
  const botaoEnviar = document.getElementById("enviar");
  const digitando = document.getElementById("digitando");

  // Adiciona um balão na conversa. Usa textContent, nunca innerHTML,
  // para que o texto da resposta não execute HTML.
  function adicionarBalao(texto, tipo) {
    const balao = document.createElement("div");
    balao.className = "balao " + tipo;
    balao.textContent = texto;
    mensagens.appendChild(balao);
    balao.scrollIntoView({ behavior: "smooth", block: "end" });
  }

  function atualizarContador() {
    const total = campo.value.length;
    contador.textContent = total + "/" + MAX_CARACTERES;
    contador.classList.toggle("limite", total >= MAX_CARACTERES);
  }

  function definirCarregando(ativo) {
    digitando.hidden = !ativo;
    botaoEnviar.disabled = ativo;
    campo.disabled = ativo;
  }

  async function enviarMensagem(texto) {
    const resp = await fetch(API_URL + "/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mensagem: texto }),
    });
    let dados = {};
    try {
      dados = await resp.json();
    } catch (_) {
      // resposta sem JSON: tratada abaixo
    }
    if (!resp.ok) {
      throw new Error(dados.erro || "Erro na requisição (" + resp.status + ").");
    }
    return dados.resposta;
  }

  async function aoEnviar(evento) {
    evento.preventDefault();
    const texto = campo.value.trim();
    if (!texto) return;

    adicionarBalao(texto, "usuario");
    campo.value = "";
    atualizarContador();
    definirCarregando(true);

    try {
      const resposta = await enviarMensagem(texto);
      adicionarBalao(resposta, "bot");
    } catch (erro) {
      adicionarBalao("Não foi possível obter a resposta: " + erro.message, "erro");
    } finally {
      definirCarregando(false);
      campo.focus();
    }
  }

  formulario.addEventListener("submit", aoEnviar);
  campo.addEventListener("input", atualizarContador);

  document.querySelectorAll(".sugestao").forEach(function (botao) {
    botao.addEventListener("click", function () {
      campo.value = botao.dataset.pergunta;
      atualizarContador();
      formulario.requestSubmit();
    });
  });

  adicionarBalao(
    "Olá! Sou o Mister Copa. Pergunte sobre campeões, sedes, resultados, artilheiros e recordes das Copas do Mundo.",
    "bot"
  );
  atualizarContador();
})();
