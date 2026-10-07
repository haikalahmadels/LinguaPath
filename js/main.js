(function () {
  "use strict";

  var root = document.documentElement;
  var reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  var canHover = window.matchMedia(
    "(hover: hover) and (pointer: fine)",
  ).matches;
  var RING_LEN = 326.73;
  var LANG_KEY = "landing-lang";
  var THEME_KEY = "landing-theme";
  var M = window.Mascot;

  var $ = function (s, el) {
    return (el || document).querySelector(s);
  };
  var $$ = function (s, el) {
    return Array.prototype.slice.call((el || document).querySelectorAll(s));
  };

  var lang = "id";
  try {
    var saved = localStorage.getItem(LANG_KEY);
    if (saved === "en" || saved === "id") lang = saved;
  } catch (e) {}

  function t(key, vars) {
    var dict = window.I18N[lang] || {};
    var s =
      dict[key] != null
        ? dict[key]
        : window.I18N.id[key] != null
          ? window.I18N.id[key]
          : key;
    if (vars && typeof s === "string")
      Object.keys(vars).forEach(function (k) {
        s = s.split("{" + k + "}").join(vars[k]);
      });
    return s;
  }

  function line(key) {
    var v = t(key);
    return Array.isArray(v) ? v[Math.floor(Math.random() * v.length)] : v;
  }

  function applyI18n() {
    root.lang = lang;
    document.title = t("meta.title", { brand: window.BRAND });
    var desc = $('meta[name="description"]');
    if (desc) desc.setAttribute("content", t("meta.desc"));

    $$("[data-i18n]").forEach(function (el) {
      el.textContent = t(el.getAttribute("data-i18n"));
    });
    $$("[data-i18n-attr]").forEach(function (el) {
      el.getAttribute("data-i18n-attr")
        .split(";")
        .forEach(function (pair) {
          var p = pair.split(":");
          if (p.length === 2) el.setAttribute(p[0].trim(), t(p[1].trim()));
        });
    });
    $$("[data-brand]").forEach(function (el) {
      el.textContent = window.BRAND;
    });
    $$("[data-brand-label]").forEach(function (el) {
      el.setAttribute("aria-label", window.BRAND);
    });

    var sw = $(".lang-switch");
    sw.setAttribute("data-active", lang);
    $$("button", sw).forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.lang === lang));
    });

    syncMenuLabel();
    syncThemeLabel();
    renderQuiz();
    renderPlan(false);
    renderBuildMsg();
    renderSuccess();
    syncClipLabel();
    if (M) M.hush();
  }

  function setLang(next) {
    if (next === lang) return;
    try {
      localStorage.setItem(LANG_KEY, next);
    } catch (e) {}
    if (reduceMotion) {
      lang = next;
      applyI18n();
      return;
    }
    document.body.classList.add("lang-swap");
    setTimeout(function () {
      lang = next;
      applyI18n();
      requestAnimationFrame(function () {
        document.body.classList.remove("lang-swap");
      });
    }, 150);
  }

  $$(".lang-switch button").forEach(function (b) {
    b.addEventListener("click", function () {
      setLang(b.dataset.lang);
    });
  });

  var themeBtn = $("#theme-btn");
  function theme() {
    return root.getAttribute("data-theme") === "dark" ? "dark" : "light";
  }
  function syncThemeLabel() {
    themeBtn.setAttribute(
      "aria-label",
      t(theme() === "dark" ? "a11y.themeLight" : "a11y.themeDark"),
    );
  }
  function setTheme(next) {
    root.setAttribute("data-theme", next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch (e) {}
    syncThemeLabel();
  }
  themeBtn.addEventListener("click", function () {
    var next = theme() === "dark" ? "light" : "dark";
    if (reduceMotion || !document.startViewTransition) {
      setTheme(next);
      return;
    }

    var r = themeBtn.getBoundingClientRect();
    var x = r.left + r.width / 2,
      y = r.top + r.height / 2;
    var end = Math.hypot(
      Math.max(x, innerWidth - x),
      Math.max(y, innerHeight - y),
    );
    var vt = document.startViewTransition(function () {
      setTheme(next);
    });
    vt.ready
      .then(function () {
        root.animate(
          {
            clipPath: [
              "circle(0px at " + x + "px " + y + "px)",
              "circle(" + end + "px at " + x + "px " + y + "px)",
            ],
          },
          {
            duration: 650,
            easing: "cubic-bezier(.16,1,.3,1)",
            pseudoElement: "::view-transition-new(root)",
          },
        );
      })
      .catch(function () {});
  });

  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", function (e) {
      var stored = null;
      try {
        stored = localStorage.getItem(THEME_KEY);
      } catch (err) {}
      if (!stored) {
        root.setAttribute("data-theme", e.matches ? "dark" : "light");
        syncThemeLabel();
      }
    });

  var nav = $("#nav");
  new IntersectionObserver(function (entries) {
    nav.classList.toggle("scrolled", !entries[0].isIntersecting);
  }).observe($(".top-sentinel"));

  var menuBtn = $(".menu-btn");
  var menu = $("#mobile-menu");
  function syncMenuLabel() {
    var open = menuBtn.getAttribute("aria-expanded") === "true";
    menuBtn.setAttribute(
      "aria-label",
      t(open ? "a11y.menuClose" : "a11y.menu"),
    );
    $("use", menuBtn).setAttribute("href", open ? "#i-x" : "#i-list");
  }
  function setMenu(open) {
    menuBtn.setAttribute("aria-expanded", String(open));
    menu.hidden = !open;
    syncMenuLabel();
  }
  menuBtn.addEventListener("click", function () {
    setMenu(menuBtn.getAttribute("aria-expanded") !== "true");
  });
  $$("a", menu).forEach(function (a) {
    a.addEventListener("click", function () {
      setMenu(false);
    });
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !menu.hidden) {
      setMenu(false);
      menuBtn.focus();
    }
  });

  var navLinks = $$(".nav-links a");
  var sectionIO = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        navLinks.forEach(function (a) {
          a.classList.toggle(
            "active",
            a.getAttribute("href") === "#" + en.target.id,
          );
        });
      });
    },
    { rootMargin: "-45% 0px -50% 0px" },
  );
  [
    "top",
    "masalah",
    "tes",
    "cara-kerja",
    "target",
    "fitur",
    "bahasa",
    "faq",
  ].forEach(function (id) {
    var s = document.getElementById(id);
    if (s) sectionIO.observe(s);
  });

  function setRing(el, frac) {
    el.style.strokeDashoffset = String(
      RING_LEN * (1 - Math.max(0, Math.min(1, frac))),
    );
  }

  function countTo(el, to, dur) {
    if (reduceMotion || !window.gsap) {
      el.textContent = to;
      return;
    }
    var o = { v: Number(el.textContent) || 0 };
    window.gsap.to(o, {
      v: to,
      duration: dur || 1,
      ease: "power2.out",
      onUpdate: function () {
        el.textContent = Math.round(o.v);
      },
    });
  }

  function arrowKeys(group, selector) {
    group.addEventListener("keydown", function (e) {
      if (["ArrowLeft", "ArrowRight"].indexOf(e.key) < 0) return;
      var items = $$(selector, group);
      var i = items.indexOf(document.activeElement);
      if (i < 0) return;
      e.preventDefault();
      var n =
        items[
          (i + (e.key === "ArrowRight" ? 1 : -1) + items.length) % items.length
        ];
      n.focus();
      n.click();
    });
  }

  function svgIcon(id, cls) {
    return (
      '<svg class="ic' +
      (cls ? " " + cls : "") +
      '" aria-hidden="true"><use href="#' +
      id +
      '"/></svg>'
    );
  }
  function esc(s) {
    var d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }
  function center(el) {
    var r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 3 };
  }

  function mBody(wrap) {
    return wrap ? $(".mascot", wrap) || wrap : null;
  }
  function react(wrap, mood, text, opts) {
    if (!M || !wrap) return;
    opts = opts || {};
    var body = mBody(wrap);
    M.mood(body, mood, opts.ms || 1800);
    if (opts.jump) M.jump(body);
    if (opts.wave) M.wave(body);
    if (text) M.say(wrap, text, opts.sayMs);
  }

  var confettiCanvas = $("#confetti");
  var ctx = confettiCanvas.getContext("2d");
  var pieces = [];
  var running = false;
  function confetti(x, y, n) {
    if (reduceMotion) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (confettiCanvas.width !== innerWidth * dpr) {
      confettiCanvas.width = innerWidth * dpr;
      confettiCanvas.height = innerHeight * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var accent =
      getComputedStyle(root).getPropertyValue("--accent").trim() || "#2347D9";
    var colors = [accent, "#FFC93C", "#FF8A7A", "#4CCB8F"];
    for (var i = 0; i < (n || 60); i++) {
      var a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2;
      var v = 6 + Math.random() * 8;
      pieces.push({
        x: x,
        y: y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        w: 6 + Math.random() * 6,
        h: 4 + Math.random() * 4,
        r: Math.random() * 6,
        vr: (Math.random() - 0.5) * 0.4,
        c: colors[i % colors.length],
        life: 0,
      });
    }
    if (!running) {
      running = true;
      requestAnimationFrame(tick);
    }
  }
  function tick() {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    pieces = pieces.filter(function (p) {
      return p.life < 140 && p.y < innerHeight + 40;
    });
    pieces.forEach(function (p) {
      p.life++;
      p.vy += 0.32;
      p.vx *= 0.985;
      p.x += p.vx;
      p.y += p.vy;
      p.r += p.vr;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.r);
      ctx.globalAlpha = Math.max(0, 1 - p.life / 140);
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });
    if (pieces.length) requestAnimationFrame(tick);
    else {
      running = false;
      ctx.clearRect(0, 0, innerWidth, innerHeight);
    }
  }

  var synth = window.speechSynthesis;
  function speak(text, bcp, onEnd) {
    if (!synth || typeof SpeechSynthesisUtterance === "undefined") {
      setTimeout(onEnd || function () {}, 2400);
      return;
    }
    synth.cancel();
    var u = new SpeechSynthesisUtterance(text);
    u.lang = bcp;
    u.rate = 0.9;
    var v = synth.getVoices().filter(function (x) {
      return x.lang && x.lang.toLowerCase().indexOf(bcp.slice(0, 2)) === 0;
    })[0];
    if (v) u.voice = v;
    var done = false;
    var finish = function () {
      if (!done) {
        done = true;
        if (onEnd) onEnd();
      }
    };
    u.onend = finish;
    u.onerror = finish;
    synth.speak(u);
    setTimeout(finish, 6000);
  }

  document.addEventListener("click", function (e) {
    var m = e.target.closest("[data-tap]");
    if (!m) return;
    var wrap = m.closest(".mascot-wrap");
    react(wrap, "happy", line("mascot.tap"), { ms: 1200, jump: true });
  });

  $$(".sticker").forEach(function (s) {
    s.addEventListener("click", function () {
      speak(s.dataset.speak, s.dataset.speakLang);
      s.classList.remove("pop");
      void s.offsetWidth;
      s.classList.add("pop");
      var c = center(s);
      confetti(c.x, c.y, 18);
    });
  });
  if (canHover && !reduceMotion) {
    var hero = $(".hero");
    var stickers = $$(".sticker");
    var sq = false,
      sx = 0,
      sy = 0;
    hero.addEventListener("pointermove", function (e) {
      sx = e.clientX / innerWidth - 0.5;
      sy = e.clientY / innerHeight - 0.5;
      if (sq) return;
      sq = true;
      requestAnimationFrame(function () {
        sq = false;
        stickers.forEach(function (s) {
          var d = Number(s.dataset.depth) || 1;
          s.style.setProperty("--tx", (-sx * 28 * d).toFixed(1) + "px");
          s.style.setProperty("--ty", (-sy * 20 * d).toFixed(1) + "px");
        });
      });
    });
  }

  var quiz = {
    lang: "ja",
    i: 0,
    picked: null,
    checked: false,
    score: 0,
    marks: [],
    done: false,
  };
  var stage = $("#quiz-stage");
  var stepDots = $$(".quiz-steps i");
  var quizMascot = $("#quiz-mascot");
  var UNIT_BY_SCORE = [1, 2, 4, 6];

  function optList(q) {
    return Array.isArray(q.opts) ? q.opts : q.opts[lang];
  }
  function optIsTarget(q) {
    return Array.isArray(q.opts);
  }

  function renderDots() {
    stepDots.forEach(function (d, i) {
      d.classList.toggle("done", quiz.marks[i] != null);
      d.classList.toggle("bad", quiz.marks[i] === false);
    });
  }

  function renderQuiz(focusSel) {
    renderDots();
    if (quiz.done) return renderResult(focusSel);
    var q = window.QUIZ[quiz.lang][quiz.i];
    var opts = optList(q);
    var langAttr = optIsTarget(q) ? ' lang="' + quiz.lang + '"' : "";
    var html =
      '<p class="q-count">' +
      esc(t("test.counter", { n: quiz.i + 1 })) +
      "</p>" +
      '<h3 class="q-text" tabindex="-1">' +
      esc(q.q[lang]) +
      "</h3>" +
      '<div class="q-opts">';
    opts.forEach(function (o, idx) {
      var cls = "q-opt";
      var icon = "";
      if (quiz.checked) {
        if (idx === q.a) {
          cls += " is-right";
          icon = svgIcon("i-check-circle");
        } else if (idx === quiz.picked) {
          cls += " is-wrong";
          icon = svgIcon("i-x-circle");
        }
      }
      html +=
        '<button type="button" class="' +
        cls +
        '" data-opt="' +
        idx +
        '" aria-pressed="' +
        (quiz.picked === idx) +
        '"' +
        (quiz.checked ? " disabled" : "") +
        "><span" +
        langAttr +
        ">" +
        esc(o) +
        "</span>" +
        (icon || svgIcon("i-check")) +
        "</button>";
    });
    html += '</div><div class="q-foot">';
    if (quiz.checked) {
      var right = quiz.picked === q.a;
      html +=
        '<p class="q-fb ' +
        (right ? "ok" : "bad") +
        '">' +
        svgIcon(right ? "i-check-circle" : "i-x-circle") +
        "<span><strong>" +
        esc(t(right ? "test.correct" : "test.wrong")) +
        "</strong> " +
        esc(q.ex[lang]) +
        "</span></p>";
      var last = quiz.i === 2;
      html +=
        '<button type="button" class="btn btn-primary" data-act="next"><span>' +
        esc(t(last ? "test.finish" : "test.next")) +
        "</span>" +
        svgIcon("i-arrow-right") +
        "</button>";
    } else {
      html +=
        '<p class="q-fb" hidden></p><button type="button" class="btn btn-primary" data-act="check"' +
        (quiz.picked == null ? " disabled" : "") +
        "><span>" +
        esc(t("test.check")) +
        "</span>" +
        svgIcon("i-arrow-right") +
        "</button>";
    }
    html += "</div>";
    stage.innerHTML = html;
    if (focusSel) {
      var f = $(focusSel, stage);
      if (f) f.focus();
    }
  }

  function renderResult(focusSel) {
    var unit = UNIT_BY_SCORE[quiz.score];
    stage.innerHTML =
      '<div class="q-result">' +
      '<div class="ring" aria-hidden="true"><svg viewBox="0 0 120 120"><circle class="ring-bg" cx="60" cy="60" r="52"/><circle class="ring-fg" id="result-ring" cx="60" cy="60" r="52"/></svg>' +
      '<div class="ring-label"><strong><span id="result-n">0</span>/3</strong></div></div>' +
      "<div>" +
      '<p class="r-k">' +
      esc(t("test.resultK")) +
      ", " +
      esc(t("test.score", { n: quiz.score })) +
      "</p>" +
      '<h3 class="r-level" tabindex="-1">' +
      esc(t("test.lvl" + quiz.score)) +
      "</h3>" +
      '<p class="r-start">' +
      esc(t("test.startAt")) +
      " <strong>" +
      esc(t("test.unit", { n: unit })) +
      "</strong>, " +
      esc(t("test.notLesson1")) +
      "</p>" +
      '<p class="r-body">' +
      esc(t("test.resultB")) +
      "</p>" +
      '<div class="r-actions">' +
      '<a class="btn btn-primary" href="#daftar" data-act="join"><span>' +
      esc(t("test.join")) +
      "</span>" +
      svgIcon("i-arrow-right") +
      "</a>" +
      '<button type="button" class="btn btn-ghost" data-act="retry">' +
      svgIcon("i-arrow-counter-clockwise") +
      "<span>" +
      esc(t("test.retry")) +
      "</span></button>" +
      "</div>" +
      "</div>" +
      "</div>";
    var ring = $("#result-ring");
    var n = $("#result-n");
    if (focusSel) {
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          setRing(ring, quiz.score / 3);
        });
      });
      countTo(n, quiz.score, 0.9);
      var f = $(focusSel, stage);
      if (f) f.focus();
    } else {
      ring.style.transition = "none";
      setRing(ring, quiz.score / 3);
      n.textContent = quiz.score;
    }
  }

  stage.addEventListener("click", function (e) {
    var opt = e.target.closest("[data-opt]");
    if (opt && !quiz.checked) {
      quiz.picked = Number(opt.dataset.opt);
      $$(".q-opt", stage).forEach(function (b) {
        b.setAttribute("aria-pressed", String(b === opt));
      });
      var chk = $('[data-act="check"]', stage);
      if (chk) chk.disabled = false;
      react(quizMascot, "wow", line("mascot.pick"), { ms: 1400 });
      return;
    }
    var act = e.target.closest("[data-act]");
    if (!act) return;
    var a = act.dataset.act;
    if (a === "check") {
      var q = window.QUIZ[quiz.lang][quiz.i];
      quiz.checked = true;
      var right = quiz.picked === q.a;
      quiz.marks[quiz.i] = right;
      if (right) quiz.score++;
      renderQuiz('[data-act="next"]');
      if (right) {
        react(quizMascot, "happy", line("mascot.right"), { jump: true });
        var ok = $(".is-right", stage);
        if (ok) {
          var c = center(ok);
          confetti(c.x, c.y, 36);
        }
      } else {
        react(quizMascot, "sad", line("mascot.wrong"), {
          ms: 2200,
          sayMs: 3200,
        });
        var w = $(".is-wrong", stage);
        if (w) w.classList.add("shake");
      }
    } else if (a === "next") {
      if (quiz.i === 2) {
        quiz.done = true;
        renderQuiz(".r-level");
        react(quizMascot, "happy", t("mascot.done"), {
          ms: 2600,
          jump: true,
          wave: true,
          sayMs: 3200,
        });
        var rr = $(".q-result .ring", stage);
        if (rr && quiz.score >= 2) {
          var p = center(rr);
          confetti(p.x, p.y, 90);
        }
      } else {
        quiz.i++;
        quiz.picked = null;
        quiz.checked = false;
        renderQuiz(".q-text");
      }
    } else if (a === "retry") {
      resetQuiz();
      renderQuiz(".q-text");
    } else if (a === "join") {
      var sel = $("#f-lang");
      if (sel) sel.value = quiz.lang;
    }
  });

  function resetQuiz() {
    quiz.i = 0;
    quiz.picked = null;
    quiz.checked = false;
    quiz.score = 0;
    quiz.marks = [];
    quiz.done = false;
  }

  var qTabs = $(".quiz .seg");
  $$("button", qTabs).forEach(function (b) {
    b.addEventListener("click", function () {
      if (b.dataset.qlang === quiz.lang) return;
      $$("button", qTabs).forEach(function (x) {
        x.setAttribute("aria-selected", String(x === b));
        x.tabIndex = x === b ? 0 : -1;
      });
      quiz.lang = b.dataset.qlang;
      resetQuiz();
      stage.style.opacity = "0";
      setTimeout(
        function () {
          renderQuiz();
          stage.style.opacity = "";
        },
        reduceMotion ? 0 : 150,
      );
      if (M) M.jump(mBody(quizMascot));
    });
    b.tabIndex = b.getAttribute("aria-selected") === "true" ? 0 : -1;
  });
  arrowKeys(qTabs, "button");

  var planMin = 10;
  var planList = $("#plan-list");
  var planRing = $("#plan-ring");
  var targetMascot = $("#target-mascot");

  function renderPlan(animate) {
    var items = window.PLANS[planMin];
    planList.innerHTML = items
      .map(function (it, i) {
        return (
          '<li class="' +
          (animate ? "enter" : "") +
          '" style="--i:' +
          i +
          '">' +
          '<span class="plan-ic">' +
          svgIcon(it[2]) +
          "</span>" +
          "<p>" +
          esc(t(it[0])) +
          "</p>" +
          '<span class="m">' +
          it[1] +
          " " +
          esc(t("target.min")) +
          "</span></li>"
        );
      })
      .join("");
    $("#plan-count").textContent = t("target.count", { n: items.length });
    setRing(planRing, planMin / 15);
  }

  var durGroup = $(".target .seg");
  $$("button", durGroup).forEach(function (b) {
    b.addEventListener("click", function () {
      var m = Number(b.dataset.min);
      $$("button", durGroup).forEach(function (x) {
        x.setAttribute("aria-checked", String(x === b));
        x.tabIndex = x === b ? 0 : -1;
      });
      if (m === planMin) return;
      planMin = m;
      countTo($("#plan-min"), m, 0.6);
      renderPlan(!reduceMotion);
      react(
        targetMascot,
        m === 15 ? "happy" : m === 5 ? "wow" : null,
        t("mascot.m" + m),
        { jump: true, ms: 1600 },
      );
    });
    b.tabIndex = b.getAttribute("aria-checked") === "true" ? 0 : -1;
  });
  arrowKeys(durGroup, "button");

  var lineEl = $("#build-line");
  var bank = $("#build-bank");
  var buildMsg = $("#build-msg");
  var buildState = "hint";

  function makeWord(text, idx) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "word";
    b.lang = "en";
    b.textContent = text;
    b.dataset.idx = idx;
    return b;
  }
  function buildReset() {
    lineEl.innerHTML = "";
    bank.innerHTML = "";
    lineEl.classList.remove("ok", "no");
    window.BUILD.bank.forEach(function (w, i) {
      bank.appendChild(makeWord(w, i));
    });
    buildState = "hint";
    renderBuildMsg();
  }
  function renderBuildMsg() {
    buildMsg.className =
      "build-msg" +
      (buildState === "ok" ? " ok" : buildState === "no" ? " no" : "");
    buildMsg.textContent = t(
      buildState === "ok"
        ? "feat.buildOk"
        : buildState === "no"
          ? "feat.buildNo"
          : "feat.buildHint",
    );
  }
  function flyFrom(el, fromRect) {
    if (reduceMotion || !window.gsap || !fromRect) return;
    var to = el.getBoundingClientRect();
    window.gsap.fromTo(
      el,
      { x: fromRect.left - to.left, y: fromRect.top - to.top },
      { x: 0, y: 0, duration: 0.45, ease: "expo.out" },
    );
  }
  bank.addEventListener("click", function (e) {
    var w = e.target.closest(".word");
    if (!w || w.classList.contains("used") || buildState === "ok") return;
    var rect = w.getBoundingClientRect();
    w.classList.add("used");
    var placed = makeWord(w.textContent, w.dataset.idx);
    lineEl.appendChild(placed);
    flyFrom(placed, rect);
    lineEl.classList.remove("no");
    var words = $$(".word", lineEl).map(function (x) {
      return x.textContent;
    });
    if (words.length === window.BUILD.answer.length) {
      var ok = words.join(" ") === window.BUILD.answer.join(" ");
      buildState = ok ? "ok" : "no";
      lineEl.classList.add(ok ? "ok" : "no");
      if (ok) {
        var c = center(lineEl);
        confetti(c.x, c.y, 50);
      }
    } else {
      buildState = "hint";
    }
    renderBuildMsg();
  });
  lineEl.addEventListener("click", function (e) {
    var w = e.target.closest(".word");
    if (!w || buildState === "ok") return;
    var src = $('.word[data-idx="' + w.dataset.idx + '"]', bank);
    var rect = w.getBoundingClientRect();
    w.remove();
    if (src) {
      src.classList.remove("used");
      flyFrom(src, rect);
      src.focus();
    }
    lineEl.classList.remove("no");
    buildState = "hint";
    renderBuildMsg();
  });
  $("#build-reset").addEventListener("click", buildReset);

  var wave = $("#wave");
  var clipBtn = $("#clip-play");
  var heights = [
    0.35, 0.6, 0.9, 0.5, 0.75, 1, 0.55, 0.8, 0.4, 0.65, 0.95, 0.7, 0.45, 0.85,
    0.6, 0.3, 0.7, 0.9, 0.5, 0.75, 0.4, 0.65, 0.85, 0.55, 0.35, 0.6, 0.8, 0.45,
  ];
  wave.innerHTML = heights
    .map(function (h, i) {
      return '<i style="--h:' + h + ";--i:" + i + '"></i>';
    })
    .join("");
  var clipPlaying = false;
  function syncClipLabel() {
    clipBtn.setAttribute(
      "aria-label",
      t(clipPlaying ? "feat.pause" : "feat.play"),
    );
    clipBtn.setAttribute("aria-pressed", String(clipPlaying));
  }
  function setClip(on) {
    clipPlaying = on;
    clipBtn.classList.toggle("playing", on);
    wave.classList.toggle("playing", on);
    syncClipLabel();
  }
  clipBtn.addEventListener("click", function () {
    if (clipPlaying) {
      if (synth) synth.cancel();
      setClip(false);
      return;
    }
    setClip(true);
    speak("안녕하세요. 만나서 반가워요.", "ko-KR", function () {
      setClip(false);
    });
  });

  $("#pron-play").addEventListener("click", function () {
    speak("ありがとう", "ja-JP");
  });

  var saveBtn = $("#save-btn");
  var saveN = $("#save-n");
  saveBtn.addEventListener("click", function () {
    var on = saveBtn.getAttribute("aria-pressed") !== "true";
    saveBtn.setAttribute("aria-pressed", String(on));
    saveN.textContent = on ? 13 : 12;
    if (!reduceMotion) {
      saveBtn.classList.remove("pop");
      void saveBtn.offsetWidth;
      saveBtn.classList.add("pop");
      if (on) {
        var c = center(saveBtn);
        confetti(c.x, c.y, 16);
      }
      if (window.gsap)
        window.gsap.fromTo(
          saveN,
          { y: on ? 8 : -8, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.35, ease: "expo.out" },
        );
    }
  });

  if (canHover) {
    $$(".cell").forEach(function (cell) {
      cell.addEventListener("pointermove", function (e) {
        var r = cell.getBoundingClientRect();
        cell.style.setProperty("--mx", e.clientX - r.left + "px");
        cell.style.setProperty("--my", e.clientY - r.top + "px");
      });
    });
  }

  if (!reduceMotion) {
    $$("[data-greet]").forEach(function (el, n) {
      var words = el.dataset.greet.split("|");
      var i = 0;
      setTimeout(function () {
        setInterval(function () {
          if (document.hidden) return;
          el.classList.add("out");
          setTimeout(function () {
            i = (i + 1) % words.length;
            el.textContent = words[i];
            el.classList.remove("out");
          }, 300);
        }, 3200);
      }, n * 900);
    });
  }
  $$(".lcard").forEach(function (card) {
    var mascot = $(".lcard-mascot", card);
    var hop = function () {
      if (M) {
        M.jump(mascot);
        M.mood(mascot, "happy", 900);
      }
    };
    card.addEventListener("pointerenter", hop);
    card.addEventListener("click", hop);
  });

  if (canHover && !reduceMotion) {
    $$("[data-tilt]").forEach(function (card) {
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform =
          "perspective(900px) rotateX(" +
          -y * 6 +
          "deg) rotateY(" +
          x * 6 +
          "deg) translateY(-4px)";
      });
      card.addEventListener("pointerleave", function () {
        card.style.transform = "";
      });
    });
  }

  $$(".acc-item").forEach(function (item, i) {
    var btn = $(".acc-btn", item);
    var panel = $(".acc-panel", item);
    panel.id = "faq-panel-" + i;
    btn.id = "faq-btn-" + i;
    btn.setAttribute("aria-controls", panel.id);
    panel.setAttribute("role", "region");
    panel.setAttribute("aria-labelledby", btn.id);
    btn.addEventListener("click", function () {
      var open = !item.classList.contains("open");
      item.classList.toggle("open", open);
      btn.setAttribute("aria-expanded", String(open));
    });
  });

  var form = $("#signup-form");
  var success = $("#signup-success");
  var submitted = null;
  var tried = false;
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function validate() {
    var name = $("#f-name"),
      email = $("#f-email");
    var errs = {};
    if (!name.value.trim()) errs.name = "signup.errName";
    if (!email.value.trim()) errs.email = "signup.errEmail";
    else if (!EMAIL_RE.test(email.value.trim()))
      errs.email = "signup.errEmailFmt";
    [
      ["name", name],
      ["email", email],
    ].forEach(function (p) {
      var field = p[1].closest(".field");
      var err = $("#e-" + p[0]);
      field.classList.toggle("invalid", !!errs[p[0]]);
      p[1].setAttribute("aria-invalid", String(!!errs[p[0]]));
      err.textContent = errs[p[0]] ? t(errs[p[0]]) : "";
    });
    return errs;
  }
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    tried = true;
    var errs = validate();
    if (errs.name) {
      $("#f-name").focus();
      return;
    }
    if (errs.email) {
      $("#f-email").focus();
      return;
    }
    submitted = {
      name: $("#f-name").value.trim(),
      email: $("#f-email").value.trim(),
    };
    form.hidden = true;
    success.hidden = false;
    renderSuccess();
    success.focus();
    var sm = $(".success-mascot");
    if (M) {
      M.mood(sm, "happy");
      M.jump(sm);
      M.wave(sm);
    }
    var c = center(sm);
    confetti(c.x, c.y, 120);
  });
  ["#f-name", "#f-email"].forEach(function (s) {
    $(s).addEventListener("input", function () {
      if (tried) validate();
    });
  });
  function renderSuccess() {
    if (tried && !submitted) validate();
    if (!submitted) return;
    $("#success-t").textContent = t("signup.okT", { name: submitted.name });
    $("#success-b").textContent = t("signup.okB", { email: submitted.email });
  }

  function onceVisible(el, fn, margin) {
    if (!el) return;
    var io = new IntersectionObserver(
      function (entries) {
        if (entries[0].isIntersecting) {
          io.disconnect();
          fn();
        }
      },
      { rootMargin: margin || "0px 0px -25% 0px" },
    );
    io.observe(el);
  }
  onceVisible(quizMascot, function () {
    setTimeout(function () {
      react(quizMascot, null, t("mascot.quizHi"), { wave: true, sayMs: 3200 });
    }, 500);
  });
  onceVisible(targetMascot, function () {
    setTimeout(function () {
      react(targetMascot, null, t("mascot.m10"), { wave: true });
    }, 400);
  });
  var peek = $(".peek");
  onceVisible(
    peek,
    function () {
      peek.classList.add("up");
      setTimeout(function () {
        react($("#peek-mascot"), "happy", t("mascot.bye"), {
          wave: true,
          ms: 2400,
          sayMs: 3400,
        });
      }, 500);
    },
    "0px",
  );

  buildReset();
  applyI18n();

  var heroRing = $("#hero-ring");
  var heroMin = $("#hero-min");
  var heroMascot = $("#hero-mascot");
  var toast = $("#hero-toast");
  var runner = $("#runner");
  var fwd = $("#forward-path");

  function heroGreeting() {
    toast.classList.add("show");
    setTimeout(function () {
      react(heroMascot, "happy", t("mascot.hello"), {
        wave: true,
        ms: 1600,
        sayMs: 3400,
      });
    }, 300);
  }

  function placeRunnerAtEnd() {
    var p = fwd.getPointAtLength(fwd.getTotalLength());
    runner.setAttribute("transform", "translate(" + p.x + " " + p.y + ")");
    if (M) M.mood(runner, "happy");
  }

  function staticState() {
    root.classList.remove("motion");
    setRing(heroRing, 0.7);
    heroMin.textContent = "7";
    placeRunnerAtEnd();
    toast.classList.add("show");
  }

  initMotion();
  function initMotion() {
    var gsap = window.gsap,
      ST = window.ScrollTrigger,
      MP = window.MotionPathPlugin;
    if (reduceMotion || !gsap || !ST || !root.classList.contains("motion")) {
      staticState();
      return;
    }
    window.__motionReady = true;
    gsap.registerPlugin(ST);
    if (MP) gsap.registerPlugin(MP);

    gsap.to(".scroll-progress span", {
      scaleX: 1,
      ease: "none",
      scrollTrigger: { start: 0, end: "max", scrub: 0.3 },
    });

    var scribble = $("#scribble");
    var sLen = scribble.getTotalLength();
    gsap.set(scribble, { strokeDasharray: sLen, strokeDashoffset: sLen });
    gsap.set("#hero-mascot", { y: 60 });
    gsap.set(".sticker", { opacity: 0 });

    var tl = gsap.timeline({ defaults: { ease: "expo.out" } });
    tl.to(".h-in", { y: 0, duration: 1.1, stagger: 0.12 })
      .to(
        scribble,
        { strokeDashoffset: 0, duration: 0.8, ease: "power2.inOut" },
        "-=0.5",
      )
      .fromTo(
        '[data-reveal="hero"]',
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 0.9, stagger: 0.1 },
        "-=0.8",
      )
      .fromTo(
        '[data-reveal="hero-card"]',
        { opacity: 0, y: 40, rotate: 2 },
        { opacity: 1, y: 0, rotate: 0, duration: 1.2 },
        "-=0.9",
      )
      .to(
        "#hero-mascot",
        { y: 0, duration: 0.9, ease: "back.out(2.2)" },
        "-=0.6",
      )
      .to(
        ".sticker",
        {
          opacity: 1,
          duration: 0.3,
          stagger: 0.08,
          onStart: function () {
            $$(".sticker").forEach(function (s, i) {
              setTimeout(function () {
                s.classList.add("pop");
              }, i * 80);
            });
          },
        },
        "-=0.7",
      )
      .add(function () {
        setRing(heroRing, 0.7);
        countTo(heroMin, 7, 1.1);
      }, "-=0.6")
      .fromTo(
        ".pcard .spark polyline",
        { strokeDashoffset: 200 },
        {
          strokeDashoffset: 0,
          duration: 1.2,
          stagger: 0.12,
          ease: "power2.out",
        },
        "<",
      )
      .add(heroGreeting, "+=0.6");

    var revealEls = $$("[data-reveal]").filter(function (el) {
      var v = el.getAttribute("data-reveal");
      return v !== "hero" && v !== "hero-card";
    });
    gsap.set(revealEls, { y: 28 });
    ST.batch(revealEls, {
      start: "top 88%",
      once: true,
      onEnter: function (batch) {
        gsap.to(batch, {
          opacity: 1,
          y: 0,
          duration: 0.9,
          stagger: 0.08,
          ease: "expo.out",
          overwrite: true,
        });
      },
    });

    var mq = gsap.to("#marquee-track", {
      xPercent: -50,
      ease: "none",
      duration: 34,
      repeat: -1,
    });
    var dir = 1;
    ST.create({
      trigger: ".marquee",
      start: "top bottom",
      end: "bottom top",
      onUpdate: function (self) {
        var v = self.getVelocity();
        if (Math.abs(v) > 20) dir = v > 0 ? 1 : -1;
        var boost = Math.min(Math.abs(v) / 300, 5);
        gsap.to(mq, {
          timeScale: dir * (1 + boost),
          duration: 0.3,
          overwrite: true,
        });
        gsap.to(mq, { timeScale: dir, duration: 1.2, delay: 0.3 });
      },
    });

    gsap.fromTo(
      ".skill-rows polyline",
      { strokeDashoffset: 200 },
      {
        strokeDashoffset: 0,
        duration: 1.4,
        stagger: 0.12,
        ease: "power2.out",
        scrollTrigger: { trigger: ".skill-rows", start: "top 85%", once: true },
      },
    );

    var fwdLen = fwd.getTotalLength();
    gsap.set(fwd, { strokeDasharray: fwdLen, strokeDashoffset: fwdLen });
    gsap.set(["#forward-head", "#forward-label"], { opacity: 0 });
    var start = fwd.getPointAtLength(0);
    gsap.set(runner, { x: start.x, y: start.y });
    if (M) M.mood(runner, "sad");
    var ptl = gsap
      .timeline({
        scrollTrigger: {
          trigger: ".problem",
          start: "top 65%",
          end: "bottom 75%",
          scrub: 0.8,
          onUpdate: function (self) {
            if (!M) return;
            var p = self.progress;
            var want = p > 0.85 ? "happy" : p > 0.45 ? null : "sad";
            if (runner._mood !== want) {
              runner._mood = want;
              M.mood(runner, want);
              if (want === "happy") M.jump(runner);
            }
          },
        },
      })
      .to("#loop-path", {
        rotation: 300,
        svgOrigin: "200 190",
        ease: "none",
        duration: 1,
      })
      .to(["#loop-path", "#loop-label"], { opacity: 0.12, duration: 0.5 }, 0.7)
      .to(fwd, { strokeDashoffset: 0, ease: "none", duration: 1 }, 0.6)
      .to(
        ["#forward-head", "#forward-label"],
        { opacity: 1, duration: 0.25 },
        1.45,
      );
    if (MP)
      ptl.to(
        runner,
        { motionPath: { path: fwd }, ease: "none", duration: 1 },
        0.6,
      );
    else placeRunnerAtEnd();

    $(".how").classList.add("anim");
    gsap.to("#how-fill", {
      scaleY: 1,
      ease: "none",
      scrollTrigger: {
        trigger: "#how-list",
        start: "top 65%",
        end: "bottom 65%",
        scrub: 0.6,
      },
    });
    $$(".how-step").forEach(function (step) {
      ST.create({
        trigger: step,
        start: "top 65%",
        toggleClass: { targets: step, className: "on" },
      });
    });

    if (canHover) {
      $$(".magnetic").forEach(function (btn) {
        var xTo = gsap.quickTo(btn, "x", { duration: 0.5, ease: "power3.out" });
        var yTo = gsap.quickTo(btn, "y", { duration: 0.5, ease: "power3.out" });
        btn.addEventListener("pointermove", function (e) {
          var r = btn.getBoundingClientRect();
          xTo((e.clientX - r.left - r.width / 2) * 0.25);
          yTo((e.clientY - r.top - r.height / 2) * 0.35);
        });
        btn.addEventListener("pointerleave", function () {
          xTo(0);
          yTo(0);
        });
      });
    }

    if (document.fonts && document.fonts.ready)
      document.fonts.ready.then(function () {
        ST.refresh();
      });
  }
})();
