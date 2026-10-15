/* IDIOMA
   O HTML está escrito em português. Cada elemento traduzível traz a
   versão inglesa ao lado:
     data-en="…"            conteúdo (pode ter <em>, <strong>…)
     data-en-<atributo>="…" um atributo (aria-label, href, content…)
     data-so-idioma="pt|en" blocos inteiros que só existem num idioma
   Na primeira troca guarda-se o português original, para se poder
   voltar a ele. Sem dicionários à parte: a tradução vive ao lado do
   texto que traduz. */

(function(){
  var raiz = document.documentElement;
  var alvos = null;

  function recolher(){
    alvos = [];
    var todos = document.querySelectorAll("*");
    for (var i = 0; i < todos.length; i++){
      var el = todos[i], attrs = [];
      for (var j = 0; j < el.attributes.length; j++){
        var nome = el.attributes[j].name;
        if (nome.indexOf("data-en-") === 0) attrs.push(nome.slice(8));
      }
      var temConteudo = el.hasAttribute("data-en");
      if (!temConteudo && !attrs.length) continue;
      var original = { html: temConteudo ? el.innerHTML : null, attrs: {} };
      attrs.forEach(function(a){ original.attrs[a] = el.getAttribute(a); });
      alvos.push({ el: el, attrs: attrs, original: original });
    }
  }

  function aplicar(lingua){
    if (!alvos) recolher();
    var en = lingua === "en";
    alvos.forEach(function(a){
      if (a.original.html !== null){
        var novo = en ? a.el.getAttribute("data-en") : a.original.html;
        if (a.el.innerHTML !== novo) a.el.innerHTML = novo;
      }
      a.attrs.forEach(function(n){
        a.el.setAttribute(n, en ? a.el.getAttribute("data-en-" + n) : a.original.attrs[n]);
      });
    });
    document.querySelectorAll("[data-so-idioma]").forEach(function(el){
      el.hidden = el.getAttribute("data-so-idioma") !== lingua;
    });
    document.querySelectorAll("button[data-idioma]").forEach(function(b){
      b.setAttribute("aria-pressed", String(b.getAttribute("data-idioma") === lingua));
    });
    raiz.lang = en ? "en" : "pt-PT";
    raiz.setAttribute("data-idioma", lingua);
    raiz.classList.remove("idioma-a-carregar");
    document.dispatchEvent(new CustomEvent("idioma", { detail: lingua }));
  }

  window.idioma = {
    atual: function(){ return raiz.getAttribute("data-idioma") === "en" ? "en" : "pt"; },
    mudar: function(lingua, guardar){
      if (lingua !== "en") lingua = "pt";
      if (guardar){ try { localStorage.setItem("tf-idioma", lingua); } catch(e){} }
      aplicar(lingua);
    }
  };

  /* arranque: o <head> já decidiu o idioma (guardado ou o do browser) */
  var inicial = window.idioma.atual();
  if (inicial === "en") aplicar("en");
  else document.querySelectorAll("[data-so-idioma]").forEach(function(el){
    el.hidden = el.getAttribute("data-so-idioma") !== "pt";
  });
})();
