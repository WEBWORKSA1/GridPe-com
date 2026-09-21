(function () {
  var B = window.gp.base,
    inr = window.gp.inr,
    num = window.gp.num;
  var E,
    sortKey = "brand",
    asc = true;
  window.gp.getJSON(B + "data/ev-models.json").then(function (d) {
    E = d;
    document.getElementById("asof").textContent = d.asOf;
    draw();
  });
  function rate() {
    return parseFloat(document.getElementById("r").value) || 8;
  }
  function draw() {
    if (!E) return;
    var q = (document.getElementById("q").value || "").toLowerCase();
    var seg = document.getElementById("seg").value;
    var t = rate();
    var list = E.models.filter(function (m) {
      if (seg && m.segment !== seg) return false;
      return !q || (m.brand + " " + m.model).toLowerCase().indexOf(q) > -1;
    });
    list.sort(function (a, b) {
      var x = sortKey === "brand" ? a.brand + a.model : a[sortKey],
        y = sortKey === "brand" ? b.brand + b.model : b[sortKey];
      if (typeof x === "string")
        return asc ? x.localeCompare(y) : y.localeCompare(x);
      return asc ? x - y : y - x;
    });
    document.getElementById("count").textContent = list.length;
    document.getElementById("rows").innerHTML =
      list
        .map(function (m) {
          var home = t / (m.realKmPerKwh * 0.88);
          var pub = 21 / (m.realKmPerKwh * 0.94);
          var real = m.usableKwh * m.realKmPerKwh;
          return (
            "<tr><td><strong>" +
            m.brand +
            "</strong> " +
            m.model +
            '<br><span class="dim" style="font-size:.78rem">' +
            m.segment +
            " &middot; from &#8377;" +
            m.priceLakh +
            ' L</span></td><td class="num">' +
            m.batteryKwh +
            '</td><td class="num">' +
            num(m.claimedRangeKm) +
            '</td><td class="num">' +
            num(real) +
            '</td><td class="num">' +
            m.realKmPerKwh.toFixed(2) +
            '</td><td class="num">' +
            m.maxAcKw +
            " / " +
            (m.maxDcKw || "&mdash;") +
            '</td><td class="num" style="color:var(--brand-700)"><strong>&#8377;' +
            home.toFixed(2) +
            '</strong></td><td class="num">&#8377;' +
            pub.toFixed(2) +
            "</td></tr>"
          );
        })
        .join("") ||
      '<tr><td colspan="8" class="empty">No model matches.</td></tr>';
  }
  ["q", "seg", "r"].forEach(function (id) {
    document.getElementById(id).addEventListener("input", draw);
    document.getElementById(id).addEventListener("change", draw);
  });
  document.addEventListener("click", function (e) {
    var th = e.target.closest("[data-sort]");
    if (!th) return;
    var k = th.getAttribute("data-sort");
    asc = k === sortKey ? !asc : true;
    sortKey = k;
    draw();
  });
})();
