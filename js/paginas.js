// Funções compartilhadas pelas páginas de edições e seleções.
// Todo texto vindo da API é inserido com textContent, nunca com innerHTML.

function criarElemento(tag, classe, texto) {
  const el = document.createElement(tag);
  if (classe) el.className = classe;
  if (texto !== undefined && texto !== null) el.textContent = texto;
  return el;
}

function parametro(nome) {
  return new URLSearchParams(window.location.search).get(nome);
}

async function buscarJSON(caminho) {
  const resp = await fetch(API_URL + caminho);
  let dados = {};
  try {
    dados = await resp.json();
  } catch (_) {
    // resposta sem JSON
  }
  if (!resp.ok) {
    throw new Error(dados.erro || "Erro ao carregar os dados (" + resp.status + ").");
  }
  return dados;
}

function mostrarErro(conteudo, mensagem) {
  conteudo.replaceChildren(criarElemento("div", "balao erro", mensagem));
}

function mostrarCarregando(conteudo) {
  conteudo.replaceChildren(criarElemento("p", "carregando", "Carregando..."));
}

// Linha de rótulo e valor, usada nas fichas de edição e de seleção.
function linhaFicha(rotulo, valor) {
  const linha = criarElemento("div", "linha-ficha");
  linha.appendChild(criarElemento("dt", null, rotulo));
  linha.appendChild(criarElemento("dd", null, valor === null || valor === undefined || valor === "" ? "Não confirmado" : valor));
  return linha;
}

function listaOuTraco(itens) {
  if (!itens || itens.length === 0) return "Nenhum";
  return itens.join(", ");
}
