/* lab-widgets.js —— 课程里的「动手实验」组件（站内原生实现，无依赖）
 *
 * 由 scripts/enhance-content.cjs 在构建后拷到 public/static/js/ 并注入 <head>。
 * 笔记里只写占位：<div class="lab" data-lab="animal-map"></div>
 * 支持：animal-map（01 什么是向量）、secant（05 什么是梯度）、attention（19 注意力机制）
 */
(function () {
  "use strict";

  var NS = "http://www.w3.org/2000/svg";

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function svg(tag, attrs) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  }

  function shell(root, title, hint) {
    root.classList.add("lab");
    root.textContent = "";
    var head = el("div", "lab-head");
    head.appendChild(el("span", "lab-tag", "动手实验"));
    head.appendChild(el("span", "lab-title", title));
    root.appendChild(head);
    var body = el("div", "lab-body");
    root.appendChild(body);
    if (hint) root.appendChild(el("p", "lab-hint", hint));
    return body;
  }

  /* ------------------------------------------------------------------ *
   * 1) 动物地图：拖动「？」，看谁离它最近（01 什么是向量）
   * ------------------------------------------------------------------ */
  function mountAnimalMap(root) {
    var animals = [
      { name: "金鱼", x: 0.02, y: 0.02 },
      { name: "猫", x: 0.25, y: 0.3 },
      { name: "狗", x: 0.45, y: 0.2 },
      { name: "狼", x: 0.55, y: 0.75 },
      { name: "鳄鱼", x: 0.5, y: 0.9 },
      { name: "老虎", x: 0.9, y: 0.85 },
    ];
    var body = shell(
      root,
      "动物地图 —— 拖动「？」，看谁离它最近",
      "「？」是一只神秘动物。你把它放在哪里，就等于宣布了它的两个数字——而相似度，只是两点之间的距离。"
    );

    var px = function (v) { return 70 + 540 * v; };
    var py = function (v) { return 370 - 340 * v; };

    var s = svg("svg", { viewBox: "0 0 640 420", "aria-label": "动物地图：拖动问号，看它离哪种动物最近" });
    s.setAttribute("class", "lab-svg");

    s.appendChild(svg("line", { x1: 70, y1: 370, x2: 618, y2: 370, class: "lab-axis" }));
    s.appendChild(svg("line", { x1: 70, y1: 370, x2: 70, y2: 22, class: "lab-axis" }));
    var tx = svg("text", { x: 600, y: 392, "text-anchor": "end", class: "lab-note" });
    tx.textContent = "体型 →";
    s.appendChild(tx);
    var ty = svg("text", { x: 86, y: 34, class: "lab-note" });
    ty.textContent = "凶猛 ↑";
    s.appendChild(ty);

    var dots = [];
    animals.forEach(function (a) {
      var c = svg("circle", { cx: px(a.x), cy: py(a.y), r: 7, class: "lab-dot" });
      s.appendChild(c);
      dots.push(c);
      var t = svg("text", { x: px(a.x), y: py(a.y) - 14, "text-anchor": "middle", class: "lab-label" });
      t.textContent = a.name;
      s.appendChild(t);
    });

    var link = svg("line", { x1: 0, y1: 0, x2: 0, y2: 0, class: "lab-link" });
    s.appendChild(link);

    var g = svg("g", { class: "lab-handle" });
    g.appendChild(svg("circle", { cx: 0, cy: 0, r: 13, class: "lab-handle-dot" }));
    var qm = svg("text", { x: 0, y: 5, "text-anchor": "middle", class: "lab-handle-q" });
    qm.textContent = "?";
    g.appendChild(qm);
    s.appendChild(g);

    var readout = el("p", "readout");
    body.appendChild(s);
    body.appendChild(readout);

    var pos = { x: 0.7, y: 0.35 };
    var dragging = false;

    function paint() {
      g.setAttribute("transform", "translate(" + px(pos.x) + "," + py(pos.y) + ")");
      var best = 0, bestD = Infinity;
      animals.forEach(function (a, i) {
        var d = Math.hypot(a.x - pos.x, a.y - pos.y);
        dots[i].setAttribute("r", "7");
        dots[i].classList.remove("is-nearest");
        if (d < bestD) { bestD = d; best = i; }
      });
      dots[best].setAttribute("r", "9");
      dots[best].classList.add("is-nearest");
      link.setAttribute("x1", px(pos.x));
      link.setAttribute("y1", py(pos.y));
      link.setAttribute("x2", px(animals[best].x));
      link.setAttribute("y2", py(animals[best].y));
      readout.innerHTML =
        "神秘动物 = [ " + pos.x.toFixed(2) + " , " + pos.y.toFixed(2) +
        " ] —— 离它最近的是 <strong>" + animals[best].name + "</strong>（距离 " + bestD.toFixed(2) + "）";
    }

    function toData(ev) {
      var pt = s.createSVGPoint();
      pt.x = ev.clientX;
      pt.y = ev.clientY;
      var p = pt.matrixTransform(s.getScreenCTM().inverse());
      return {
        x: Math.min(1, Math.max(0, (p.x - 70) / 540)),
        y: Math.min(1, Math.max(0, (370 - p.y) / 340)),
      };
    }

    s.addEventListener("pointerdown", function (ev) {
      dragging = true;
      try { s.setPointerCapture(ev.pointerId); } catch (e) {}
      pos = toData(ev);
      paint();
    });
    s.addEventListener("pointermove", function (ev) {
      if (!dragging) return;
      pos = toData(ev);
      paint();
    });
    s.addEventListener("pointerup", function () { dragging = false; });
    s.addEventListener("pointercancel", function () { dragging = false; });

    paint();
  }

  /* ------------------------------------------------------------------ *
   * 2) 割线逼近切线：拖动滑块缩小 Δx（05 什么是梯度）
   * ------------------------------------------------------------------ */
  function mountSecant(root) {
    var body = shell(
      root,
      "割线逼近切线 —— 拖动滑块缩小 Δx",
      "第二点 Q 沿曲线滑向 P，橙色割线越转越贴近黑色切线，割线斜率 Δh/Δx 也随之逼近切线斜率 −6。这就是「取极限」的全过程。"
    );

    var X = function (x) { return 60 + ((x - 0.4) / 5) * 464; };
    var Y = function (y) { return 26 + ((13 - y) / 14) * 262; };

    var s = svg("svg", { viewBox: "0 0 560 320", "aria-label": "拖动滑块缩小 Δx，割线逐渐贴近切线" });
    s.setAttribute("class", "lab-svg");
    body.appendChild(s);

    s.appendChild(svg("line", { x1: 60, y1: 288, x2: 524, y2: 288, class: "lab-axis" }));
    var ax = svg("text", { x: 524, y: 306, "text-anchor": "end", class: "lab-note" });
    ax.textContent = "位置 x →";
    s.appendChild(ax);

    var curve = svg("path", { class: "lab-curve" });
    s.appendChild(curve);
    var curveLabel = svg("text", { x: X(0.5), y: Y(12.25) - 8, class: "lab-label lab-blue" });
    curveLabel.textContent = "h(x)=(x−4)²";
    s.appendChild(curveLabel);

    var dxLine = svg("line", { class: "lab-guide" });
    var dhLine = svg("line", { class: "lab-guide" });
    s.appendChild(dxLine);
    s.appendChild(dhLine);
    var dxText = svg("text", { "text-anchor": "middle", class: "lab-note" });
    dxText.textContent = "Δx";
    s.appendChild(dxText);
    var dhText = svg("text", { class: "lab-note" });
    dhText.textContent = "Δh";
    s.appendChild(dhText);

    var tangent = svg("line", { class: "lab-tangent" });
    s.appendChild(tangent);
    var tangentLabel = svg("text", { class: "lab-label" });
    tangentLabel.textContent = "切线";
    s.appendChild(tangentLabel);

    var secant = svg("line", { class: "lab-secant" });
    s.appendChild(secant);
    var secantLabel = svg("text", { "text-anchor": "end", class: "lab-label lab-accent" });
    secantLabel.textContent = "割线";
    s.appendChild(secantLabel);

    var pDot = svg("circle", { class: "lab-dot is-nearest" });
    var qDot = svg("circle", { class: "lab-dot" });
    s.appendChild(pDot);
    s.appendChild(qDot);
    var pText = svg("text", { "text-anchor": "end", class: "lab-label lab-accent" });
    pText.textContent = "P (x₀)";
    s.appendChild(pText);
    var qText = svg("text", { class: "lab-label" });
    qText.textContent = "Q (x₀+Δx)";
    s.appendChild(qText);

    var readout = el("div", "secant-readout");
    body.appendChild(readout);

    var slide = el("label", "secant-slider");
    slide.appendChild(el("span", null, "← 拖动缩小 Δx"));
    var input = document.createElement("input");
    input.type = "range";
    input.min = "0.05";
    input.max = "3";
    input.step = "0.05";
    input.value = "2.4";
    slide.appendChild(input);
    body.appendChild(slide);

    function paint(dx) {
      var l = 1 + dx;
      var r = (l - 4) * (l - 4);
      var slope = (r - 9) / dx;
      var f = Math.min(5.35, l + 0.7);
      var secY = function (x) { return 9 + slope * (x - 1); };
      var tanY = function (x) { return 9 - 6 * (x - 1); };

      var d = "";
      for (var i = 0; i < 121; i++) {
        var x = 0.4 + (5 * i) / 120;
        d += (i === 0 ? "M " : "L ") + X(x).toFixed(1) + " " + Y((x - 4) * (x - 4)).toFixed(1);
      }
      curve.setAttribute("d", d);

      var px0 = X(1), py0 = Y(9), qx = X(l), qy = Y(r);
      dxLine.setAttribute("x1", px0); dxLine.setAttribute("y1", py0);
      dxLine.setAttribute("x2", qx); dxLine.setAttribute("y2", py0);
      dhLine.setAttribute("x1", qx); dhLine.setAttribute("y1", py0);
      dhLine.setAttribute("x2", qx); dhLine.setAttribute("y2", qy);
      dxText.setAttribute("x", (px0 + qx) / 2); dxText.setAttribute("y", py0 - 7);
      dhText.setAttribute("x", qx + 8); dhText.setAttribute("y", (py0 + qy) / 2 + 4);

      tangent.setAttribute("x1", X(0.4)); tangent.setAttribute("y1", Y(tanY(0.4)));
      tangent.setAttribute("x2", X(2.4)); tangent.setAttribute("y2", Y(tanY(2.4)));
      tangentLabel.setAttribute("x", X(2.4) + 4); tangentLabel.setAttribute("y", Y(tanY(2.4)) + 4);

      secant.setAttribute("x1", X(0.4)); secant.setAttribute("y1", Y(secY(0.4)));
      secant.setAttribute("x2", X(f)); secant.setAttribute("y2", Y(secY(f)));
      secantLabel.setAttribute("x", X(f) - 2); secantLabel.setAttribute("y", Y(secY(f)) - 8);

      pDot.setAttribute("cx", px0); pDot.setAttribute("cy", py0); pDot.setAttribute("r", "5.5");
      qDot.setAttribute("cx", qx); qDot.setAttribute("cy", qy); qDot.setAttribute("r", "5.5");
      pText.setAttribute("x", px0 - 8); pText.setAttribute("y", py0 - 9);
      qText.setAttribute("x", qx + 9); qText.setAttribute("y", qy + 14);

      readout.innerHTML =
        "<span>Δx = <b>" + dx.toFixed(2) + "</b></span>" +
        "<span class=\"is-accent\">割线斜率 Δh/Δx = <b>" + slope.toFixed(2) + "</b></span>" +
        "<span>切线斜率 = <b>−6.00</b></span>";
    }

    input.addEventListener("input", function () { paint(parseFloat(input.value)); });
    paint(parseFloat(input.value));
  }

  /* ------------------------------------------------------------------ *
   * 3) 「它」的目光：点词看注意力分布（19 注意力机制）
   * ------------------------------------------------------------------ */
  function mountAttention(root) {
    var DATA = {
      A: {
        label: "句子 A ·「它太累了」",
        tokens: ["小猫", "没有", "过", "马路", "，", "因为", "它", "太", "累", "了"],
        salient: { 0: { 8: 0.3, 1: 0.14 }, 3: { 2: 0.25, 0: 0.18 }, 6: { 0: 0.62, 8: 0.13, 3: 0.06 }, 8: { 6: 0.4, 0: 0.22, 7: 0.12 } },
      },
      B: {
        label: "句子 B ·「它太堵了」",
        tokens: ["小猫", "没有", "过", "马路", "，", "因为", "它", "太", "堵", "了"],
        salient: { 0: { 1: 0.2, 2: 0.14 }, 3: { 2: 0.25, 8: 0.18 }, 6: { 3: 0.58, 8: 0.16, 0: 0.07 }, 8: { 6: 0.38, 3: 0.26, 7: 0.1 } },
      },
    };

    var body = shell(
      root,
      "「它」的目光 —— 点击词语，查看注意力分布",
      "百分比 = softmax 后的注意力权重（演示用的手工数据）。注意切换句子时，「它」的最大权重从「小猫」跳到「马路」——决定目光去向的，是「累 / 堵」这一个字的差别。"
    );

    var state = { sentence: "A", query: 6 };

    var buttons = el("div", "lab-switch");
    var btnA = el("button", "think-btn", DATA.A.label);
    var btnB = el("button", "think-btn", DATA.B.label);
    btnA.type = "button";
    btnB.type = "button";
    buttons.appendChild(btnA);
    buttons.appendChild(btnB);
    body.appendChild(buttons);

    var row = el("div", "token-row");
    body.appendChild(row);
    var readout = el("p", "readout");
    body.appendChild(readout);

    function weights(d, q) {
      var w = d.tokens.map(function () { return 0.02; });
      w[q] += 0.06;
      var extra = d.salient[q] || {};
      for (var k in extra) w[+k] += extra[k];
      var sum = w.reduce(function (a, b) { return a + b; }, 0);
      return w.map(function (v) { return v / sum; });
    }

    function paint() {
      var d = DATA[state.sentence];
      var w = weights(d, state.query);
      var best = -1, bestW = -1;
      w.forEach(function (v, i) { if (i !== state.query && v > bestW) { bestW = v; best = i; } });

      btnA.style.opacity = state.sentence === "A" ? "1" : "0.55";
      btnB.style.opacity = state.sentence === "B" ? "1" : "0.55";

      row.textContent = "";
      d.tokens.forEach(function (tok, i) {
        var selected = i === state.query;
        var b = el("button", "token" + (selected ? " selected" : ""));
        b.type = "button";
        if (!selected) {
          b.style.background = "rgba(194,65,12," + Math.min(0.55, 1.6 * w[i]).toFixed(3) + ")";
          if (w[i] > 0.18) b.style.borderColor = "var(--accent)";
        }
        b.appendChild(document.createTextNode(tok));
        b.appendChild(el("span", "token-w", selected ? "Q" : Math.round(100 * w[i]) + "%"));
        b.addEventListener("click", function () {
          state.query = i;
          paint();
        });
        row.appendChild(b);
      });

      readout.innerHTML =
        "「<strong>" + d.tokens[state.query] + "</strong>」的目光主要落在「<strong>" +
        (best >= 0 ? d.tokens[best] : "") + "</strong>」上（" + Math.round(100 * bestW) + "%）";
    }

    btnA.addEventListener("click", function () { state.sentence = "A"; paint(); });
    btnB.addEventListener("click", function () { state.sentence = "B"; paint(); });
    paint();
  }

  /* ------------------------------------------------------------------ */
  function init() {
    var nodes = document.querySelectorAll("[data-lab]");
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      if (n.getAttribute("data-lab-ready")) continue;
      n.setAttribute("data-lab-ready", "1");
      var t = n.getAttribute("data-lab");
      try {
        if (t === "animal-map") mountAnimalMap(n);
        else if (t === "secant") mountSecant(n);
        else if (t === "attention") mountAttention(n);
      } catch (e) {
        if (window.console) console.error("[lab]", t, e);
      }
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
  document.addEventListener("nav", init);
})();
