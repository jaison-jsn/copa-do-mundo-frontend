// Gera uma imagem PNG com a pergunta e a resposta do chat, no tema da página.
// Desenhada com canvas, sem bibliotecas externas.

const LARGURA_IMAGEM = 1080;
const MARGEM = 80;
const FONTE_TEXTO = '34px "Trebuchet MS", Arial, Helvetica, sans-serif';
const FONTE_PERGUNTA = '30px "Trebuchet MS", Arial, Helvetica, sans-serif';
const FONTE_RODAPE = '26px "Trebuchet MS", Arial, Helvetica, sans-serif';
const ALTURA_LINHA = 48;

// Quebra o texto em linhas que cabem na largura, respeitando as quebras de linha do texto.
function quebrarTexto(ctx, texto, larguraMaxima) {
  const linhas = [];
  texto.split("\n").forEach(function (paragrafo) {
    if (paragrafo.trim() === "") {
      linhas.push("");
      return;
    }
    let atual = "";
    paragrafo.split(" ").forEach(function (palavra) {
      const teste = atual ? atual + " " + palavra : palavra;
      if (ctx.measureText(teste).width <= larguraMaxima) {
        atual = teste;
      } else {
        if (atual) linhas.push(atual);
        atual = palavra;
      }
    });
    if (atual) linhas.push(atual);
  });
  return linhas;
}

function desenharFundo(ctx, altura) {
  // Gramado: faixas verticais em dois tons de verde.
  const faixa = 120;
  for (let x = 0; x < LARGURA_IMAGEM; x += faixa) {
    ctx.fillStyle = (x / faixa) % 2 === 0 ? "#17572c" : "#1f7a3c";
    ctx.fillRect(x, 0, faixa, altura);
  }
  // Escurece levemente para dar contraste ao texto.
  ctx.fillStyle = "rgba(11, 61, 30, 0.85)";
  ctx.fillRect(0, 0, LARGURA_IMAGEM, altura);
  // Borda dourada.
  ctx.strokeStyle = "#d4af37";
  ctx.lineWidth = 8;
  ctx.strokeRect(24, 24, LARGURA_IMAGEM - 48, altura - 48);
}

function gerarImagem(pergunta, resposta) {
  const medidor = document.createElement("canvas").getContext("2d");
  const larguraTexto = LARGURA_IMAGEM - MARGEM * 2;

  medidor.font = FONTE_PERGUNTA;
  const linhasPergunta = quebrarTexto(medidor, "Pergunta: " + pergunta, larguraTexto);
  medidor.font = FONTE_TEXTO;
  const linhasResposta = quebrarTexto(medidor, resposta, larguraTexto);

  const topo = 170;
  const alturaPergunta = linhasPergunta.length * 42 + 40;
  const alturaResposta = linhasResposta.length * ALTURA_LINHA;
  const altura = Math.max(540, topo + alturaPergunta + alturaResposta + 200);

  const canvas = document.createElement("canvas");
  canvas.width = LARGURA_IMAGEM;
  canvas.height = altura;
  const ctx = canvas.getContext("2d");

  desenharFundo(ctx, altura);

  // Título.
  ctx.fillStyle = "#d4af37";
  ctx.font = 'bold 64px "Trebuchet MS", Arial, Helvetica, sans-serif';
  ctx.textBaseline = "top";
  ctx.fillText("Mister Copa", MARGEM, 70);

  let y = topo;
  ctx.fillStyle = "#d4af37";
  ctx.font = FONTE_PERGUNTA;
  linhasPergunta.forEach(function (linha) {
    ctx.fillText(linha, MARGEM, y);
    y += 42;
  });

  y += 40;
  ctx.fillStyle = "#ffffff";
  ctx.font = FONTE_TEXTO;
  linhasResposta.forEach(function (linha) {
    ctx.fillText(linha, MARGEM, y);
    y += ALTURA_LINHA;
  });

  // Rodapé.
  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
  ctx.font = FONTE_RODAPE;
  ctx.fillText("Dados e fatos sobre as Copas do Mundo", MARGEM, altura - 110);

  return canvas;
}

// Compartilha pela folha nativa quando o navegador oferece; senão, baixa o PNG.
async function compartilharImagem(pergunta, resposta) {
  const canvas = gerarImagem(pergunta, resposta);
  const blob = await new Promise(function (resolver) {
    canvas.toBlob(resolver, "image/png");
  });
  if (!blob) throw new Error("Não foi possível gerar a imagem.");

  const arquivo = new File([blob], "mister-copa.png", { type: "image/png" });
  if (navigator.canShare && navigator.canShare({ files: [arquivo] })) {
    try {
      await navigator.share({ files: [arquivo], title: "Mister Copa" });
      return "compartilhado";
    } catch (erro) {
      if (erro.name === "AbortError") return "cancelado";
      // Cai para o download abaixo.
    }
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "mister-copa.png";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  return "baixado";
}
