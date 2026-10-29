// Gera perguntas de múltipla escolha a partir dos registros de edições.
// Usa apenas dados que vêm da API. Textos são inseridos com textContent.

const TOTAL_PERGUNTAS = 10;

function embaralhar(lista) {
  const copia = lista.slice();
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

// Escolhe 3 alternativas erradas, diferentes da correta e entre si.
function alternativas(correta, candidatas) {
  const outras = Array.from(new Set(candidatas.filter(function (v) { return v && v !== correta; })));
  return embaralhar([correta].concat(embaralhar(outras).slice(0, 3)));
}

function gerarPerguntas(edicoes) {
  const campeoes = edicoes.map(function (e) { return e.campeao; });
  const vices = edicoes.map(function (e) { return e.vice; });
  const sedes = edicoes.map(function (e) { return e.sede; });
  const bolas = edicoes.map(function (e) { return e.bola_de_ouro; }).filter(Boolean);
  const artilheiros = edicoes
    .filter(function (e) { return e.artilheiro && e.artilheiro.length === 1; })
    .map(function (e) { return e.artilheiro[0]; });

  const perguntas = [];
  edicoes.forEach(function (e) {
    const base = { ano: e.ano, fonte: e.fonte };
    perguntas.push(Object.assign({}, base, {
      texto: "Quem foi o campeão da Copa de " + e.ano + "?",
      correta: e.campeao,
      opcoes: alternativas(e.campeao, campeoes),
    }));
    perguntas.push(Object.assign({}, base, {
      texto: "Quem foi o vice-campeão da Copa de " + e.ano + "?",
      correta: e.vice,
      opcoes: alternativas(e.vice, vices),
    }));
    perguntas.push(Object.assign({}, base, {
      texto: "Onde foi disputada a Copa de " + e.ano + "?",
      correta: e.sede,
      opcoes: alternativas(e.sede, sedes),
    }));
    if (e.bola_de_ouro) {
      perguntas.push(Object.assign({}, base, {
        texto: "Quem ganhou a Bola de Ouro da Copa de " + e.ano + "?",
        correta: e.bola_de_ouro,
        opcoes: alternativas(e.bola_de_ouro, bolas),
      }));
    }
    if (e.artilheiro && e.artilheiro.length === 1) {
      perguntas.push(Object.assign({}, base, {
        texto: "Quem foi o artilheiro da Copa de " + e.ano + "?",
        correta: e.artilheiro[0],
        opcoes: alternativas(e.artilheiro[0], artilheiros),
      }));
    }
  });
  return perguntas;
}

function iniciarQuiz(edicoes) {
  const area = document.getElementById("quiz");
  const todas = gerarPerguntas(edicoes);
  let perguntas = [];
  let indice = 0;
  let acertos = 0;

  function reiniciar() {
    perguntas = embaralhar(todas).slice(0, TOTAL_PERGUNTAS);
    indice = 0;
    acertos = 0;
    mostrar();
  }

  function mostrar() {
    area.replaceChildren();

    if (indice >= perguntas.length) {
      area.appendChild(criarElemento("h2", "quiz-fim", "Fim do quiz"));
      area.appendChild(criarElemento("p", "quiz-placar", "Você acertou " + acertos + " de " + perguntas.length + "."));
      const botao = criarElemento("button", "quiz-botao", "Jogar de novo");
      botao.type = "button";
      botao.addEventListener("click", reiniciar);
      area.appendChild(botao);
      return;
    }

    const p = perguntas[indice];
    const cabecalho = criarElemento("div", "quiz-cabecalho");
    cabecalho.appendChild(criarElemento("span", null, "Pergunta " + (indice + 1) + " de " + perguntas.length));
    cabecalho.appendChild(criarElemento("span", null, "Acertos: " + acertos));
    area.appendChild(cabecalho);

    area.appendChild(criarElemento("h2", "quiz-pergunta", p.texto));

    const lista = criarElemento("div", "quiz-opcoes");
    const feedback = criarElemento("div", "quiz-feedback");
    feedback.hidden = true;
    const botoes = p.opcoes.map(function (valor) {
      const b = criarElemento("button", "quiz-opcao", valor);
      b.type = "button";
      b.addEventListener("click", function () {
        botoes.forEach(function (x) { x.disabled = true; });
        const certa = valor === p.correta;
        if (certa) {
          acertos++;
          b.classList.add("certa");
        } else {
          b.classList.add("errada");
          botoes.forEach(function (x) { if (x.textContent === p.correta) x.classList.add("certa"); });
        }
        feedback.replaceChildren(
          criarElemento("p", null, certa ? "Resposta certa!" : "A resposta era: " + p.correta + "."),
          criarElemento("p", "fonte", "Fonte: " + p.fonte)
        );
        feedback.hidden = false;
        const proxima = criarElemento("button", "quiz-botao", indice + 1 < perguntas.length ? "Próxima" : "Ver resultado");
        proxima.type = "button";
        proxima.addEventListener("click", function () { indice++; mostrar(); });
        feedback.appendChild(proxima);
        feedback.querySelector("button").focus();
      });
      lista.appendChild(b);
      return b;
    });

    area.appendChild(lista);
    area.appendChild(feedback);
  }

  reiniciar();
}
