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
  function adicionarBalao(texto, tipo, pergunta) {
    const balao = document.createElement("div");
    balao.className = "balao " + tipo;
    balao.textContent = texto;

    // Só as respostas do bot que vieram de uma pergunta podem ser compartilhadas.
    if (tipo === "bot" && pergunta) {
      const botao = document.createElement("button");
      botao.type = "button";
      botao.className = "botao-compartilhar";
      botao.textContent = "Compartilhar imagem";
      botao.addEventListener("click", async function () {
        botao.disabled = true;
        try {
          await compartilharImagem(pergunta, texto);
        } catch (erro) {
          adicionarBalao("Não foi possível gerar a imagem: " + erro.message, "erro");
        } finally {
          botao.disabled = false;
        }
      });
      balao.appendChild(botao);
    }

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
      adicionarBalao(resposta, "bot", texto);
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
