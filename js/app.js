/* CoinWood — language switch, nav, tokenomics donut */
(function () {
  "use strict";

  /* ---------- i18n ---------- */
  var LS_KEY = "cw-lang";
  var lang = localStorage.getItem(LS_KEY)
    || ((navigator.language || "en").toLowerCase().indexOf("fr") === 0 ? "fr" : "en");

  function t(key) {
    return (window.I18N[lang] && window.I18N[lang][key]) || window.I18N.en[key] || key;
  }

  function applyLang() {
    document.documentElement.lang = lang;
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      var val = t(key);
      if (val.indexOf("&") !== -1) { el.innerHTML = val; } else { el.textContent = val; }
    });
    document.getElementById("langToggle").textContent = lang === "en" ? "FR" : "EN";
    var wp = document.getElementById("wpLink");
    if (wp) { wp.href = lang === "fr" ? "whitepaper-fr.pdf" : "whitepaper-en.pdf"; }
    renderLegendAndTable();
  }

  document.getElementById("langToggle").addEventListener("click", function () {
    lang = lang === "en" ? "fr" : "en";
    localStorage.setItem(LS_KEY, lang);
    applyLang();
  });

  /* ---------- mobile nav ---------- */
  var burger = document.getElementById("navBurger");
  var navLinks = document.getElementById("navLinks");
  burger.addEventListener("click", function () {
    var open = navLinks.classList.toggle("is-open");
    burger.setAttribute("aria-expanded", open ? "true" : "false");
  });
  navLinks.addEventListener("click", function (e) {
    if (e.target.tagName === "A") { navLinks.classList.remove("is-open"); }
  });

  /* ---------- tokenomics data (ring order = validated palette order) ---------- */
  var ALLOC = [
    { key: "presale", pct: 35, color: "var(--c-presale)", hex: "#008300" },
    { key: "liq",     pct: 20, color: "var(--c-liq)",     hex: "#3987e5" },
    { key: "team",    pct: 10, color: "var(--c-team)",    hex: "#c98500" },
    { key: "refo",    pct: 10, color: "var(--c-refo)",    hex: "#199e70" },
    { key: "stake",   pct: 10, color: "var(--c-stake)",   hex: "#d95926" },
    { key: "mkt",     pct: 10, color: "var(--c-mkt)",     hex: "#9085e9" },
    { key: "air",     pct: 5,  color: "var(--c-air)",     hex: "#d55181" }
  ];
  var SUPPLY = 10; // billions

  /* ---------- donut ---------- */
  var svg = document.getElementById("donut");
  var tip = document.getElementById("donutTip");
  var NS = "http://www.w3.org/2000/svg";
  var CX = 160, CY = 160, R = 118, STROKE = 46;
  var GAP = 0.024; // rad — ~2px visual gap between segments

  function polar(angle, radius) {
    return [CX + radius * Math.cos(angle), CY + radius * Math.sin(angle)];
  }

  function arcPath(a0, a1, radius) {
    var p0 = polar(a0, radius), p1 = polar(a1, radius);
    var large = (a1 - a0) > Math.PI ? 1 : 0;
    return "M " + p0[0] + " " + p0[1] +
      " A " + radius + " " + radius + " 0 " + large + " 1 " + p1[0] + " " + p1[1];
  }

  function buildDonut() {
    var start = -Math.PI / 2; // 12 o'clock
    ALLOC.forEach(function (d, i) {
      var sweep = (d.pct / 100) * Math.PI * 2;
      var a0 = start + GAP / 2, a1 = start + sweep - GAP / 2;
      var path = document.createElementNS(NS, "path");
      path.setAttribute("d", arcPath(a0, a1, R));
      path.setAttribute("stroke", d.hex);
      path.setAttribute("stroke-width", STROKE);
      path.setAttribute("fill", "none");
      path.setAttribute("data-idx", i);
      path.style.transition = "opacity 0.15s";
      svg.appendChild(path);

      // selective direct labels: only the two largest segments
      if (d.pct >= 20) {
        var mid = start + sweep / 2;
        var lp = polar(mid, R);
        var label = document.createElementNS(NS, "text");
        label.setAttribute("x", lp[0]);
        label.setAttribute("y", lp[1]);
        label.setAttribute("text-anchor", "middle");
        label.setAttribute("dominant-baseline", "central");
        label.setAttribute("fill", "#ffffff");
        label.setAttribute("font-size", "17");
        label.setAttribute("font-weight", "800");
        label.setAttribute("pointer-events", "none");
        label.textContent = d.pct + "%";
        svg.appendChild(label);
      }
      start += sweep;
    });

    svg.addEventListener("mousemove", onHover);
    svg.addEventListener("mouseleave", clearHover);
  }

  function onHover(e) {
    var target = e.target.closest ? e.target.closest("path[data-idx]") : null;
    if (!target) { clearHover(); return; }
    var i = +target.getAttribute("data-idx");
    var d = ALLOC[i];

    svg.querySelectorAll("path[data-idx]").forEach(function (p) {
      p.style.opacity = p === target ? "1" : "0.35";
    });
    document.querySelectorAll("#tokLegend li").forEach(function (li, j) {
      li.classList.toggle("is-hot", j === i);
    });

    var wrap = svg.parentElement.getBoundingClientRect();
    tip.hidden = false;
    tip.innerHTML = "<strong>" + t("tok." + d.key) + "</strong><span>" +
      d.pct + "% · " + (SUPPLY * d.pct / 100).toLocaleString(lang === "fr" ? "fr-FR" : "en-US") + "B $CWD</span>";
    var x = e.clientX - wrap.left + 14, y = e.clientY - wrap.top - 10;
    if (x + 170 > wrap.width) { x -= 190; }
    tip.style.left = x + "px";
    tip.style.top = y + "px";
  }

  function clearHover() {
    tip.hidden = true;
    svg.querySelectorAll("path[data-idx]").forEach(function (p) { p.style.opacity = "1"; });
    document.querySelectorAll("#tokLegend li").forEach(function (li) { li.classList.remove("is-hot"); });
  }

  /* ---------- legend + table (rebuilt on language change) ---------- */
  function renderLegendAndTable() {
    var legend = document.getElementById("tokLegend");
    var tbody = document.getElementById("tokTableBody");
    legend.innerHTML = "";
    tbody.innerHTML = "";
    ALLOC.forEach(function (d) {
      var li = document.createElement("li");
      li.innerHTML = '<i style="background:' + d.hex + '"></i>' +
        '<span class="lbl">' + t("tok." + d.key) + "</span>" +
        '<span class="pct">' + d.pct + "%</span>";
      legend.appendChild(li);

      var tr = document.createElement("tr");
      tr.innerHTML = "<td>" + t("tok." + d.key) + "</td><td>" + d.pct + "%</td><td>" +
        t("tok." + d.key + "Note") + "</td>";
      tbody.appendChild(tr);
    });
  }

  buildDonut();
  applyLang();
})();
