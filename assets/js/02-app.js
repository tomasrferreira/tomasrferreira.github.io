/* APP
   Tema, menu, ficha da abertura, vídeos ao passar o cursor,
   casos de estudo, lista dos outros projetos, competências,
   copiar o email e o relógio de Vila do Conde. */

(function(){
  "use strict";

  var raiz = document.documentElement;
  var semMovimento = matchMedia("(prefers-reduced-motion: reduce)");
  var comRato = matchMedia("(hover: hover) and (pointer: fine)");
  var ligacao = navigator.connection || {};
  var poupar = !!ligacao.saveData || /2g/.test(ligacao.effectiveType || "");

  var TEXTOS = {
    pt: {
      temaEscuro: "Mudar para o tema escuro", temaClaro: "Mudar para o tema claro",
      menuAbrir: "Abrir o menu", menuFechar: "Fechar o menu",
      copiado: "Email copiado", copiarFalhou: "Não foi possível copiar. O email é tomas.r.ferreira@hotmail.com"
    },
    en: {
      temaEscuro: "Switch to dark theme", temaClaro: "Switch to light theme",
      menuAbrir: "Open menu", menuFechar: "Close menu",
      copiado: "Email copied", copiarFalhou: "Couldn't copy the address. The email is tomas.r.ferreira@hotmail.com"
    }
  };
  function lingua(){ return window.idioma ? window.idioma.atual() : "pt"; }
  function t(chave){ return TEXTOS[lingua()][chave]; }
  function tocarSemErro(v){ var p = v.play(); if (p && p.catch) p.catch(function(){}); }


  /* ---------- TEMA ----------
     Troca com um círculo que nasce do botão (View Transitions),
     onde o browser o permitir. */
  var botaoTema = document.querySelector("[data-mudar-tema]");
  var metasCor = document.querySelectorAll('meta[name="theme-color"]');

  function rotularTema(){
    var escuro = raiz.getAttribute("data-tema") === "escuro";
    botaoTema.setAttribute("aria-label", t(escuro ? "temaClaro" : "temaEscuro"));
  }
  function aplicarTema(tema, guardar){
    raiz.setAttribute("data-tema", tema);
    if (guardar){ try { localStorage.setItem("tf-tema", tema); } catch(e){} }
    var fundo = getComputedStyle(raiz).getPropertyValue("--fundo").trim();
    metasCor.forEach(function(m){ m.setAttribute("content", fundo); });
    rotularTema();
  }
  botaoTema.addEventListener("click", function(){
    var novo = raiz.getAttribute("data-tema") === "escuro" ? "claro" : "escuro";
    if (!document.startViewTransition || semMovimento.matches){ aplicarTema(novo, true); return; }
    var r = botaoTema.getBoundingClientRect();
    var x = r.left + r.width / 2, y = r.top + r.height / 2;
    var raio = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    var transicao = document.startViewTransition(function(){ aplicarTema(novo, true); });
    transicao.ready.then(function(){
      raiz.animate(
        { clipPath: ["circle(0px at " + x + "px " + y + "px)", "circle(" + raio + "px at " + x + "px " + y + "px)"] },
        { duration: 700, easing: "cubic-bezier(.16,1,.3,1)", pseudoElement: "::view-transition-new(root)" }
      );
    }).catch(function(){});
  });
  /* sem escolha guardada, acompanha o sistema */
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function(e){
    var guardado = null;
    try { guardado = localStorage.getItem("tf-tema"); } catch(err){}
    if (!guardado) aplicarTema(e.matches ? "escuro" : "claro", false);
  });


  /* ---------- IDIOMA ---------- */
  document.querySelectorAll("button[data-idioma]").forEach(function(b){
    b.addEventListener("click", function(){
      if (window.idioma) window.idioma.mudar(b.getAttribute("data-idioma"), true);
    });
  });
  document.addEventListener("idioma", function(){ rotularTema(); rotularMenu(); relogio(); });


  /* ---------- BARRA DO TOPO E MENU ---------- */
  var topo = document.querySelector("[data-topo]");
  var botaoMenu = document.querySelector("[data-menu]");
  var nav = document.getElementById("nav");

  function aoScroll(){ topo.classList.toggle("topo--fundo", window.scrollY > 8); }
  addEventListener("scroll", aoScroll, { passive: true });
  aoScroll();

  function menuAberto(){ return topo.classList.contains("topo--menu"); }
  function rotularMenu(){ botaoMenu.setAttribute("aria-label", t(menuAberto() ? "menuFechar" : "menuAbrir")); }
  function menu(abrir){
    topo.classList.toggle("topo--menu", abrir);
    botaoMenu.setAttribute("aria-expanded", String(abrir));
    rotularMenu();
  }
  botaoMenu.addEventListener("click", function(){ menu(!menuAberto()); });
  nav.addEventListener("click", function(e){ if (e.target.closest("a")) menu(false); });
  document.addEventListener("click", function(e){ if (menuAberto() && !e.target.closest("[data-topo]")) menu(false); });
  document.addEventListener("keydown", function(e){
    if (e.key === "Escape" && menuAberto()){ menu(false); botaoMenu.focus(); }
  });

  /* secção atual realçada na navegação */
  var ligacoesNav = Array.prototype.slice.call(nav.querySelectorAll("a"));
  if ("IntersectionObserver" in window){
    var espiao = new IntersectionObserver(function(entradas){
      entradas.forEach(function(e){
        if (!e.isIntersecting) return;
        ligacoesNav.forEach(function(a){
          a.setAttribute("aria-current", String(a.getAttribute("href") === "#" + e.target.id));
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    ["inicio", "projetos", "sobre", "competencias", "contacto"].forEach(function(id){
      var s = document.getElementById(id);
      if (s) espiao.observe(s);
    });
  }


  /* ---------- REVELAR AO FAZER SCROLL ---------- */
  var revelaveis = document.querySelectorAll(".revela");
  if ("IntersectionObserver" in window && !semMovimento.matches){
    var revelar = new IntersectionObserver(function(entradas){
      entradas.forEach(function(e){
        if (e.isIntersecting){ e.target.classList.add("visto"); revelar.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: .06 });
    revelaveis.forEach(function(el){ revelar.observe(el); });
  } else {
    revelaveis.forEach(function(el){ el.classList.add("visto"); });
  }


  /* ---------- FICHA DA ABERTURA ---------- */
  /* a ficha em C inclina-se para o cursor */
  (function(){
    var ficha = document.querySelector(".ficha"), hero = document.querySelector(".hero");
    if (!ficha || !comRato.matches || semMovimento.matches) return;
    hero.addEventListener("pointermove", function(e){
      if (innerWidth <= 1080) return;
      var r = ficha.getBoundingClientRect();
      var px = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (innerWidth / 2)));
      var py = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (innerHeight / 2)));
      ficha.style.setProperty("--ry", (-9 + px * 7).toFixed(2) + "deg");
      ficha.style.setProperty("--rx", (4 - py * 5).toFixed(2) + "deg");
    });
    hero.addEventListener("pointerleave", function(){
      ficha.style.removeProperty("--ry"); ficha.style.removeProperty("--rx");
    });
  })();


  /* ---------- VÍDEOS DOS PROJETOS ----------
     Com rato: tocam ao passar o cursor (ou ao receber foco pelo
     teclado) e param ao sair. Em ecrãs táteis: tocam quando o
     projeto está à vista. Só se descarregam quando fazem falta. */
  function carregar(v){
    if (!v.getAttribute("src") && v.getAttribute("data-src")) v.src = v.getAttribute("data-src");
  }
  var grupos = Array.prototype.slice.call(document.querySelectorAll("[data-video-grupo]")).map(function(g){
    var videos = Array.prototype.slice.call(g.querySelectorAll("video[data-src]"));
    var principal = videos[0], barra = g.querySelector(".media__progresso");
    var aTocar = false, pedido = null;

    function progresso(){
      pedido = null;
      if (!aTocar) return;
      if (principal.duration) barra.style.setProperty("--p", (principal.currentTime / principal.duration).toFixed(4));
      pedido = requestAnimationFrame(progresso);
    }
    principal.addEventListener("playing", function(){ if (aTocar) g.classList.add("com-imagem"); });
    function tocar(){
      if (aTocar) return;
      aTocar = true;
      g.classList.add("a-tocar");
      videos.forEach(function(v){ v.preload = "auto"; carregar(v); tocarSemErro(v); });
      if (!principal.paused && principal.readyState > 2) g.classList.add("com-imagem");
      if (!pedido) pedido = requestAnimationFrame(progresso);
    }
    function parar(){
      if (!aTocar) return;
      aTocar = false;
      g.classList.remove("a-tocar", "com-imagem");
      videos.forEach(function(v){ v.pause(); });
    }

    if (comRato.matches){
      g.addEventListener("pointerenter", function(e){ if (e.pointerType === "mouse") tocar(); });
      g.addEventListener("pointerleave", parar);
      g.addEventListener("focus", tocar);
      g.addEventListener("blur", parar);
    } else if (!semMovimento.matches && !poupar && "IntersectionObserver" in window){
      new IntersectionObserver(function(e){
        if (e[0].isIntersecting) tocar(); else parar();
      }, { threshold: .6 }).observe(g);
    }
    return { el: g, videos: videos, parar: parar };
  });

  /* quando o projeto se aproxima, pede-se só o início dos vídeos,
     para o primeiro passar do cursor ser imediato */
  if (comRato.matches && !poupar && "IntersectionObserver" in window){
    var aquecer = new IntersectionObserver(function(entradas){
      entradas.forEach(function(e){
        if (!e.isIntersecting) return;
        grupos.forEach(function(gr){
          if (gr.el !== e.target) return;
          gr.videos.forEach(function(v){ if (v.preload === "none") v.preload = "metadata"; carregar(v); });
        });
        aquecer.unobserve(e.target);
      });
    }, { rootMargin: "300px 0px" });
    grupos.forEach(function(gr){ aquecer.observe(gr.el); });
  }
  document.addEventListener("visibilitychange", function(){
    if (document.hidden) grupos.forEach(function(gr){ gr.parar(); });
  });

  /* etiqueta que segue o cursor por cima dos vídeos */
  (function(){
    var etiqueta = document.querySelector(".cursor-etiqueta");
    if (!etiqueta || !comRato.matches) return;
    var texto = etiqueta.querySelector("span"), icone = etiqueta.querySelector("use");
    var pos = { x: 0, y: 0 }, alvo = { x: 0, y: 0 }, ativo = false, pedido = null;
    function quadro(){
      pedido = null;
      var k = semMovimento.matches ? 1 : .24;
      pos.x += (alvo.x - pos.x) * k; pos.y += (alvo.y - pos.y) * k;
      etiqueta.style.transform = "translate3d(" + (pos.x + 16).toFixed(1) + "px," + (pos.y + 18).toFixed(1) + "px,0)";
      if (ativo || Math.abs(alvo.x - pos.x) > .4 || Math.abs(alvo.y - pos.y) > .4) pedido = requestAnimationFrame(quadro);
    }
    document.querySelectorAll("[data-cursor]").forEach(function(el){
      el.addEventListener("pointerenter", function(e){
        if (e.pointerType !== "mouse") return;
        texto.textContent = el.getAttribute("data-cursor");
        icone.setAttribute("href", el.hasAttribute("data-abrir") ? "#i-play" : "#i-seta");
        pos.x = alvo.x = e.clientX; pos.y = alvo.y = e.clientY;
        ativo = true;
        etiqueta.classList.add("cursor-etiqueta--visivel");
        if (!pedido) pedido = requestAnimationFrame(quadro);
      });
      el.addEventListener("pointermove", function(e){
        alvo.x = e.clientX; alvo.y = e.clientY;
        if (!pedido) pedido = requestAnimationFrame(quadro);
      });
      el.addEventListener("pointerleave", function(){
        ativo = false;
        etiqueta.classList.remove("cursor-etiqueta--visivel");
      });
    });
  })();


  /* ---------- CASOS DE ESTUDO (<dialog>) ---------- */
  var IDS_CASOS = ["caso-plastic", "caso-pvz"];

  function abrirCaso(id, opcoes){
    var d = document.getElementById(id);
    opcoes = opcoes || {};
    if (!d || d.open) return;
    grupos.forEach(function(gr){ gr.parar(); });
    var videos = d.querySelectorAll("video[data-src]");
    videos.forEach(function(v){ if (v.preload === "none") v.preload = "metadata"; carregar(v); });
    if (typeof d.showModal === "function") d.showModal(); else d.setAttribute("open", "");
    d.querySelector(".caso__in").scrollTop = 0;
    try { history.replaceState(null, "", "#" + id); } catch(e){}

    if (opcoes.tocar && videos[0]) tocarSemErro(videos[0]);
    else if (id === "caso-plastic" && !semMovimento.matches && !poupar) videos.forEach(tocarSemErro);

    if (opcoes.foco){
      var alvo = document.getElementById(opcoes.foco);
      if (alvo) setTimeout(function(){
        alvo.scrollIntoView({ block: "start", behavior: semMovimento.matches ? "auto" : "smooth" });
        alvo.focus({ preventScroll: true });
      }, 60);
    }
  }

  document.querySelectorAll("[data-abrir]").forEach(function(b){
    b.addEventListener("click", function(){
      abrirCaso(b.getAttribute("data-abrir"), { tocar: b.hasAttribute("data-tocar"), foco: b.getAttribute("data-foco") });
    });
  });
  document.querySelectorAll("dialog.caso").forEach(function(d){
    d.addEventListener("click", function(e){ if (e.target === d) d.close(); });
    d.querySelectorAll("[data-fechar]").forEach(function(b){ b.addEventListener("click", function(){ d.close(); }); });
    d.addEventListener("close", function(){
      d.querySelectorAll("video").forEach(function(v){ v.pause(); });
      if (location.hash === "#" + d.id){
        try { history.replaceState(null, "", location.pathname + location.search); } catch(e){}
      }
    });
  });
  /* ligação direta: …/#caso-pvz abre o caso */
  function casoDoEndereco(){
    var id = location.hash.slice(1);
    if (IDS_CASOS.indexOf(id) !== -1) abrirCaso(id);
  }
  addEventListener("hashchange", casoDoEndereco);
  casoDoEndereco();

  /* capítulos da demo completa */
  document.querySelectorAll("video[data-capitulos]").forEach(function(v){
    var lista = document.getElementById(v.getAttribute("data-capitulos"));
    if (!lista) return;
    var botoes = Array.prototype.slice.call(lista.querySelectorAll("button[data-t]"));
    botoes.forEach(function(b){
      b.addEventListener("click", function(){
        var tempo = parseFloat(b.getAttribute("data-t"));
        carregar(v);
        function ir(){ v.currentTime = tempo; tocarSemErro(v); }
        if (v.readyState >= 1) ir();
        else { v.preload = "metadata"; v.addEventListener("loadedmetadata", ir, { once: true }); v.load(); }
      });
    });
    v.addEventListener("timeupdate", function(){
      var atual = null;
      botoes.forEach(function(b){ if (v.currentTime + .3 >= parseFloat(b.getAttribute("data-t"))) atual = b; });
      botoes.forEach(function(b){ b.setAttribute("aria-current", String(b === atual)); });
    });
  });


  /* ---------- OUTROS PROJETOS (acordeão) ---------- */
  document.querySelectorAll(".item__cabeca").forEach(function(b){
    b.addEventListener("click", function(){
      var abrir = b.getAttribute("aria-expanded") !== "true";
      var corpo = document.getElementById(b.getAttribute("aria-controls"));
      b.setAttribute("aria-expanded", String(abrir));
      b.closest(".item").classList.toggle("item--aberto", abrir);
      if (abrir) corpo.removeAttribute("inert"); else corpo.setAttribute("inert", "");
    });
  });


  /* ---------- COMPETÊNCIAS: onde foram usadas ---------- */
  var chips = document.querySelectorAll("button.chip");
  function encaixarDica(chip){
    var dica = chip.querySelector(".chip__dica");
    if (!dica) return;
    dica.style.setProperty("--dx", "0px");
    var r = dica.getBoundingClientRect(), margem = 12, dx = 0;
    if (r.left < margem) dx = margem - r.left;
    else if (r.right > innerWidth - margem) dx = innerWidth - margem - r.right;
    dica.style.setProperty("--dx", dx.toFixed(0) + "px");
  }
  function fecharChips(excecao){
    chips.forEach(function(c){ if (c !== excecao) c.classList.remove("chip--ativo"); });
  }
  chips.forEach(function(c){
    c.addEventListener("pointerenter", function(){ encaixarDica(c); });
    c.addEventListener("focus", function(){ encaixarDica(c); });
    c.addEventListener("click", function(){
      var ja = c.classList.contains("chip--ativo");
      fecharChips(c);
      if (!ja) encaixarDica(c);
      c.classList.toggle("chip--ativo", !ja);
    });
  });
  document.addEventListener("click", function(e){ if (!e.target.closest(".chip")) fecharChips(null); });


  /* ---------- COPIAR O EMAIL ---------- */
  var aviso = document.querySelector(".aviso"), esperaAviso;
  function avisar(msg){
    aviso.textContent = msg;
    aviso.classList.add("aviso--visivel");
    clearTimeout(esperaAviso);
    esperaAviso = setTimeout(function(){ aviso.classList.remove("aviso--visivel"); }, 2400);
  }
  function copiarAntigo(texto){
    var campo = document.createElement("textarea");
    campo.value = texto; campo.setAttribute("readonly", "");
    campo.style.position = "fixed"; campo.style.opacity = "0";
    document.body.appendChild(campo); campo.select();
    var ok = false;
    try { ok = document.execCommand("copy"); } catch(e){}
    campo.remove();
    return ok;
  }
  document.querySelectorAll("[data-copiar]").forEach(function(b){
    b.addEventListener("click", function(){
      var texto = b.getAttribute("data-copiar");
      function ok(){
        b.classList.add("email__copiar--feito");
        avisar(t("copiado"));
        setTimeout(function(){ b.classList.remove("email__copiar--feito"); }, 2000);
      }
      function falhou(){ if (copiarAntigo(texto)) ok(); else avisar(t("copiarFalhou")); }
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(texto).then(ok, falhou);
      else falhou();
    });
  });


  /* ---------- RELÓGIO DE VILA DO CONDE ---------- */
  var relogioEl = document.querySelector("[data-relogio]");
  function relogio(){
    if (!relogioEl) return;
    try {
      var agora = new Date();
      relogioEl.textContent = new Intl.DateTimeFormat(lingua() === "en" ? "en-GB" : "pt-PT",
        { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Lisbon" }).format(agora);
      relogioEl.setAttribute("datetime", agora.toISOString());
    } catch(e){}
  }
  relogio();
  setInterval(relogio, 20000);


  /* ---------- arranque ---------- */
  rotularTema();
  rotularMenu();

  /* para quem abre a consola */
  try {
    var en = lingua() === "en";
    console.log("%c" + (en ? "Hi there 👋" : "Olá 👋"), "font:600 22px system-ui;color:#0B7A72");
    console.log(en
      ? "If you're reading this, we'll probably get along. This site is built with HTML, CSS and JavaScript, with no frameworks and no build step.\n→ tomas.r.ferreira@hotmail.com"
      : "Se está a ler isto, é provável que nos entendamos. Este site é feito em HTML, CSS e JavaScript, sem frameworks nem compilação.\n→ tomas.r.ferreira@hotmail.com");
  } catch(e){}
})();
