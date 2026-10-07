(function () {
  "use strict";

  var COLORS = {
    blue: "var(--accent)",
    sun: "#FFC93C",
    coral: "#FF8A7A",
    mint: "#4CCB8F",
  };
  var reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  var INNER =
    '<ellipse class="m-shadow" cx="60" cy="125" rx="30" ry="4.5"/>' +
    '<g class="m-bod">' +
    '<g class="m-sprout">' +
    '<path class="m-stem" d="M60 24 C60 16 60 12 61 7"/>' +
    '<path class="m-leaf" d="M61 9 C66 1 76 1 79 5 C74 11 66 12 61 9 Z"/>' +
    '<path class="m-leaf" d="M60 11 C55 4 46 4 43 8 C48 13 55 14 60 11 Z"/>' +
    "</g>" +
    '<ellipse class="m-arm m-arm-l" cx="17" cy="76" rx="8" ry="11"/>' +
    '<ellipse class="m-arm m-arm-r" cx="103" cy="76" rx="8" ry="11"/>' +
    '<path class="m-body" d="M34 100 L25 120 L52 106 Z"/>' +
    '<rect class="m-body" x="15" y="22" width="90" height="86" rx="40"/>' +
    '<ellipse class="m-belly" cx="60" cy="88" rx="26" ry="14"/>' +
    '<g class="m-eyes">' +
    '<ellipse class="m-white" cx="44" cy="58" rx="10" ry="11"/>' +
    '<ellipse class="m-white" cx="76" cy="58" rx="10" ry="11"/>' +
    '<g class="m-pupils">' +
    '<circle class="m-ink" cx="44" cy="59" r="5"/><circle class="m-ink" cx="76" cy="59" r="5"/>' +
    '<circle class="m-glint" cx="46" cy="56.5" r="1.7"/><circle class="m-glint" cx="78" cy="56.5" r="1.7"/>' +
    "</g>" +
    "</g>" +
    '<g class="m-eyes-happy"><path d="M35 61 Q44 50 53 61"/><path d="M67 61 Q76 50 85 61"/></g>' +
    '<ellipse class="m-cheek" cx="31" cy="74" rx="7" ry="4.5"/><ellipse class="m-cheek" cx="89" cy="74" rx="7" ry="4.5"/>' +
    '<path class="m-mouth m-smile" d="M52 76 Q60 84 68 76"/>' +
    '<path class="m-mouth m-open" d="M50 74 Q60 92 70 74 Z"/>' +
    '<path class="m-mouth m-sad" d="M52 83 Q60 75 68 83"/>' +
    '<ellipse class="m-mouth m-wow" cx="60" cy="80" rx="5" ry="6"/>' +
    '<path class="m-drop" d="M95 38 C99 45 99 50 95 50 C91 50 91 45 95 38 Z"/>' +
    "</g>";

  var all = [];

  function setup(host, isGroup) {
    var color = COLORS[host.getAttribute("data-color")] || COLORS.blue;
    host.style.setProperty("--m-body", color);
    host.classList.add("m-host");
    if (isGroup) {
      host.innerHTML =
        '<g transform="translate(-33 -70) scale(.55)">' + INNER + "</g>";
    } else {
      host.innerHTML =
        '<svg viewBox="0 0 120 130" aria-hidden="true" focusable="false">' +
        INNER +
        "</svg>";
    }
    var m = {
      host: host,
      pupils: host.querySelector(".m-pupils"),
      eyes: host.querySelector(".m-eyes"),
      visible: false,
      timer: null,
    };
    all.push(m);
    return m;
  }

  document.querySelectorAll("[data-mascot]").forEach(function (el) {
    setup(el, false);
  });
  document.querySelectorAll("[data-mascot-g]").forEach(function (el) {
    setup(el, true);
  });

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      all.forEach(function (m) {
        if (m.host === en.target) m.visible = en.isIntersecting;
      });
    });
  });
  all.forEach(function (m) {
    io.observe(m.host);
  });

  var px = null,
    py = null,
    queued = false;
  function look() {
    queued = false;
    all.forEach(function (m) {
      if (!m.visible || !m.eyes) return;
      var r = m.eyes.getBoundingClientRect();
      if (!r.width) return;
      var dx = px - (r.left + r.width / 2);
      var dy = py - (r.top + r.height / 2);
      var d = Math.hypot(dx, dy) || 1;
      var k = Math.min(1, d / 220);
      m.pupils.style.transform =
        "translate(" +
        ((dx / d) * 3.6 * k).toFixed(2) +
        "px," +
        ((dy / d) * 3.2 * k).toFixed(2) +
        "px)";
    });
  }
  if (!reduceMotion) {
    window.addEventListener(
      "pointermove",
      function (e) {
        px = e.clientX;
        py = e.clientY;
        if (!queued) {
          queued = true;
          requestAnimationFrame(look);
        }
      },
      { passive: true },
    );
  }

  var MOODS = ["is-happy", "is-sad", "is-wow"];

  function find(el) {
    for (var i = 0; i < all.length; i++) if (all[i].host === el) return all[i];
    return null;
  }

  function mood(el, name, ms) {
    var m = find(el);
    if (!m) return;
    clearTimeout(m.timer);
    MOODS.forEach(function (c) {
      el.classList.remove(c);
    });
    if (name) el.classList.add("is-" + name);
    if (name && ms)
      m.timer = setTimeout(function () {
        el.classList.remove("is-" + name);
      }, ms);
  }

  function replay(el, cls, ms) {
    el.classList.remove(cls);
    void el.getBoundingClientRect();
    el.classList.add(cls);
    setTimeout(function () {
      el.classList.remove(cls);
    }, ms);
  }
  function jump(el) {
    if (!reduceMotion) replay(el, "is-jump", 700);
  }
  function wave(el) {
    if (!reduceMotion) replay(el, "is-wave", 1600);
  }

  function say(wrap, text, ms) {
    var b = wrap && wrap.querySelector(".bubble");
    if (!b) return;
    clearTimeout(b._t);
    b.textContent = text;
    b.classList.remove("show");
    void b.offsetWidth;
    b.classList.add("show");
    if (ms !== 0)
      b._t = setTimeout(function () {
        b.classList.remove("show");
      }, ms || 2600);
  }
  function hush() {
    document.querySelectorAll(".bubble.show").forEach(function (b) {
      b.classList.remove("show");
    });
  }

  window.Mascot = {
    mood: mood,
    jump: jump,
    wave: wave,
    say: say,
    hush: hush,
    all: all,
  };
})();
