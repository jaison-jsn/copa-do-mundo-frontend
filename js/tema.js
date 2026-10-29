// Controla o tema do site: escuro (padrão), claro e alto contraste.
// Carregado no <head> para aplicar o tema antes da primeira pintura da tela.
// A escolha é guardada no localStorage. Se o navegador bloquear o armazenamento,
// o site continua funcionando com o tema escuro.

(function () {
  const CHAVE = "mister-copa-tema";
  const TEMAS = ["escuro", "claro", "contraste"];
  const ROTULOS = {
    escuro: "Tema: escuro",
    claro: "Tema: claro",
    contraste: "Tema: alto contraste",
  };

  // Sem escolha salva, segue o sistema: modo claro do sistema vira o tema claro.
  function temaPadrao() {
    try {
      return window.matchMedia("(prefers-color-scheme: light)").matches ? "claro" : "escuro";
    } catch (_) {
      return "escuro";
    }
  }

  function lerTema() {
    try {
      const salvo = localStorage.getItem(CHAVE);
      return TEMAS.indexOf(salvo) !== -1 ? salvo : temaPadrao();
    } catch (_) {
      return temaPadrao();
    }
  }

  function salvarTema(tema) {
    try {
      localStorage.setItem(CHAVE, tema);
    } catch (_) {
      // armazenamento indisponível: a escolha vale só para esta página
    }
  }

  function aplicarTema(tema) {
    document.documentElement.setAttribute("data-tema", tema);
  }

  let atual = lerTema();
  aplicarTema(atual);

  document.addEventListener("DOMContentLoaded", function () {
    const menu = document.querySelector(".menu");
    if (!menu) return;

    const botao = document.createElement("button");
    botao.type = "button";
    botao.className = "botao-tema";

    function atualizarRotulo() {
      botao.textContent = ROTULOS[atual];
      botao.setAttribute("aria-label", "Mudar o tema. Atual: " + ROTULOS[atual]);
    }

    botao.addEventListener("click", function () {
      atual = TEMAS[(TEMAS.indexOf(atual) + 1) % TEMAS.length];
      aplicarTema(atual);
      salvarTema(atual);
      atualizarRotulo();
    });

    atualizarRotulo();
    menu.appendChild(botao);
  });
})();
