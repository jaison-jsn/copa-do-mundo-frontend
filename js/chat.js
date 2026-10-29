(function () {
  const MAX_CARACTERES = 500;
  const CHAVE_HISTORICO = "mister-copa-historico";
  const LIMITE_HISTORICO = 50;
  const ESPERA_AVISO_MS = 4000;
  const BOAS_VINDAS = "Olá! Sou o Mister Copa. Pergunte sobre campeões, sedes, resultados, artilheiros e recordes das Copas do Mundo.";

  const mensagens = document.getElementById("mensagens");
  const formulario = document.getElementById("formulario");
  const campo = document.getElementById("pergunta");
  const contador = document.getElementById("contador");
  const botaoEnviar = document.getElementById("enviar");
  const digitando = document.getElementById("digitando");
  const sugestoes = document.querySelector(".sugestoes");
  const TEXTO_DIGITANDO = digitando.textContent;

  let historico = [];

  // ----- Histórico da sessão (sessionStorage, com try/catch) -----
  function lerHistorico() {
    try {
      const salvo = JSON.parse(sessionStorage.getItem(CHAVE_HISTORICO) || "[]");
      return Array.isArray(salvo) ? salvo : [];
    } catch (_) {
      return [];
    }
  }

  function salvarHistorico() {
    try {
      sessionStorage.setItem(CHAVE_HISTORICO, JSON.stringify(historico.slice(-LIMITE_HISTORICO)));
    } catch (_) {
      // armazenamento indisponível: a conversa continua só nesta página
    }
  }

  // ----- Balões -----
  // Usa textContent, nunca innerHTML, para que o texto da resposta não execute HTML.
  function desenharBalao(item) {
    const balao = document.createElement("div");
    balao.className = "balao " + item.tipo;
    balao.textContent = item.texto;

    // Só as respostas do bot que vieram de uma pergunta podem ser compartilhadas.
    if (item.tipo === "bot" && item.pergunta) {
      const botao = document.createElement("button");
      botao.type = "button";
      botao.className = "botao-compartilhar";
      botao.textContent = "Compartilhar imagem";
      botao.addEventListener("click", async function () {
        botao.disabled = true;
        try {
          await compartilharImagem(item.pergunta, item.texto);
        } catch (erro) {
          adicionarBalao({ texto: "Não foi possível gerar a imagem: " + erro.message, tipo: "erro" });
        } finally {
          botao.disabled = false;
        }
      });
      balao.appendChild(botao);
    }

    // Erros de uma pergunta ganham o botão "Tentar novamente" (item 15).
    if (item.tipo === "erro" && item.pergunta) {
      const botao = document.createElement("button");
      botao.type = "button";
      botao.className = "botao-tentar";
      botao.textContent = "Tentar novamente";
      botao.addEventListener("click", function () {
        botao.disabled = true;
        consultar(item.pergunta);
      });
      balao.appendChild(botao);
    }

    mensagens.appendChild(balao);
    return balao;
  }

  function adicionarBalao(item) {
    historico.push(item);
    salvarHistorico();
    const balao = desenharBalao(item);
    balao.scrollIntoView({ behavior: "smooth", block: "end" });
  }

  // ----- Contador e carregamento -----
  function atualizarContador() {
    const total = campo.value.length;
    contador.textContent = total + "/" + MAX_CARACTERES;
    contador.classList.toggle("limite", total >= MAX_CARACTERES);
  }

  function definirCarregando(ativo) {
    digitando.hidden = !ativo;
    botaoEnviar.disabled = ativo;
    campo.disabled = ativo;
    if (!ativo) digitando.textContent = TEXTO_DIGITANDO;
  }

  // ----- Chamada à API -----
  async function enviarMensagem(texto) {
    // Se a resposta demorar, avisa que o servidor gratuito pode estar acordando (item 6).
    const aviso = setTimeout(function () {
      digitando.textContent = "Ainda consultando. O servidor gratuito pode levar até um minuto para acordar.";
    }, ESPERA_AVISO_MS);
    try {
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
    } finally {
      clearTimeout(aviso);
    }
  }

  async function consultar(texto) {
    definirCarregando(true);
    try {
      const resposta = await enviarMensagem(texto);
      adicionarBalao({ texto: resposta, tipo: "bot", pergunta: texto });
    } catch (erro) {
      adicionarBalao({ texto: "Não foi possível obter a resposta: " + erro.message, tipo: "erro", pergunta: texto });
    } finally {
      definirCarregando(false);
      campo.focus();
    }
  }

  async function aoEnviar(evento) {
    evento.preventDefault();
    const texto = campo.value.trim();
    if (!texto) return;

    adicionarBalao({ texto: texto, tipo: "usuario" });
    campo.value = "";
    atualizarContador();
    consultar(texto);
  }

  // ----- Sugestões geradas a partir da base (item 17) -----
  const MODELOS_SUGESTAO = [
    (e) => "Quem foi campeão em " + e.ano + "?",
    (e) => "Quem foi o vice-campeão em " + e.ano + "?",
    (e) => "Onde foi realizada a Copa de " + e.ano + "?",
    (e) => "Qual foi o placar da final de " + e.ano + "?",
    (e) => "Quem foi o artilheiro da Copa de " + e.ano + "?",
  ];

  function escolherAleatorios(lista, quantidade) {
    const copia = lista.slice();
    const escolhidos = [];
    while (copia.length && escolhidos.length < quantidade) {
      const i = Math.floor(Math.random() * copia.length);
      escolhidos.push(copia.splice(i, 1)[0]);
    }
    return escolhidos;
  }

  function desenharSugestoes(perguntas) {
    const botoes = perguntas.map(function (pergunta) {
      const botao = document.createElement("button");
      botao.type = "button";
      botao.className = "sugestao";
      botao.dataset.pergunta = pergunta;
      botao.textContent = pergunta;
      botao.addEventListener("click", function () {
        campo.value = pergunta;
        atualizarContador();
        formulario.requestSubmit();
      });
      return botao;
    });
    sugestoes.replaceChildren(...botoes);
  }

  async function carregarSugestoes() {
    try {
      const resp = await fetch(API_URL + "/api/edicoes");
      if (!resp.ok) return;
      const dados = await resp.json();
      const edicoes = dados.edicoes || [];
      if (!edicoes.length) return;
      const perguntas = [];
      escolherAleatorios(edicoes, 3).forEach(function (edicao) {
        const modelo = MODELOS_SUGESTAO[Math.floor(Math.random() * MODELOS_SUGESTAO.length)];
        perguntas.push(modelo(edicao));
      });
      desenharSugestoes(perguntas);
    } catch (_) {
      // sem rede: mantém as sugestões fixas da página
    }
  }

  // ----- Inicialização -----
  formulario.addEventListener("submit", aoEnviar);
  campo.addEventListener("input", atualizarContador);

  document.querySelectorAll(".sugestao").forEach(function (botao) {
    botao.addEventListener("click", function () {
      campo.value = botao.dataset.pergunta;
      atualizarContador();
      formulario.requestSubmit();
    });
  });

  // Acorda o servidor gratuito do Render enquanto a pessoa lê a página (item 6).
  fetch(API_URL + "/health").catch(function () { /* ignora */ });

  historico = lerHistorico();
  if (historico.length) {
    historico.forEach(desenharBalao);
  } else {
    adicionarBalao({ texto: BOAS_VINDAS, tipo: "bot" });
  }
  atualizarContador();
  carregarSugestoes();
})();
