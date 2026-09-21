(function () {
  var B = window.gp.base;
  window.gp
    .getJSON(B + "data/tariffs.json")
    .then(function (T) {
      document.getElementById("asof").textContent = T.asOf;
      var host = document.getElementById("tlist");
      function draw(q) {
        q = (q || "").toLowerCase();
        var html = "";
        var n = 0;
        T.states.forEach(function (s) {
          var ds = s.discoms.filter(function (d) {
            return (
              !q ||
              s.state.toLowerCase().indexOf(q) > -1 ||
              d.name.toLowerCase().indexOf(q) > -1 ||
              d.code.toLowerCase().indexOf(q) > -1
            );
          });
          if (!ds.length) return;
          n += ds.length;
          html += '<h3 style="margin-top:2rem">' + s.state + "</h3>";
          ds.forEach(function (d) {
            var rows = d.slabs
              .map(function (sl, i) {
                var prev = i ? d.slabs[i - 1].upto + 1 : 1;
                return (
                  "<tr><td>" +
                  prev +
                  "&ndash;" +
                  (sl.upto === null ? "above" : sl.upto) +
                  '</td><td class="num">&#8377;' +
                  sl.rate.toFixed(2) +
                  "</td></tr>"
                );
              })
              .join("");
            html +=
              '<div class="card" style="margin-bottom:16px"><div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:center"><h4 style="margin:0">' +
              d.name +
              '</h4><span class="badge plain">' +
              (d.mode === "flat" ? "Flat rate" : "Telescopic") +
              '</span></div><div class="grid g2" style="margin-top:14px;gap:16px"><div class="table-wrap"><table style="min-width:0"><thead><tr><th>Units</th><th class="num">Rate/unit</th></tr></thead><tbody>' +
              rows +
              '</tbody></table></div><div><div class="kv"><span class="k">Fixed charge</span><span class="v">' +
              (d.fixedPerKw
                ? "&#8377;" + d.fixedPerKw + "/kW"
                : "&#8377;" + d.fixedMin + "/mo") +
              '</span></div><div class="kv"><span class="k">Fuel surcharge</span><span class="v">' +
              (d.fppcaPct ? d.fppcaPct + "%" : "&mdash;") +
              '</span></div><div class="kv"><span class="k">Electricity duty</span><span class="v">' +
              (d.dutyPct ? d.dutyPct + "%" : "&mdash;") +
              '</span></div><div class="kv"><span class="k">Meter rent</span><span class="v">' +
              (d.meterRent ? "&#8377;" + d.meterRent : "&mdash;") +
              "</span></div>" +
              (d.note
                ? '<p class="dim" style="font-size:.82rem;margin-top:10px">' +
                  d.note +
                  "</p>"
                : "") +
              '<a class="btn btn-ghost btn-sm" style="margin-top:10px" href="' +
              B +
              "bill-calculator.html?state=" +
              encodeURIComponent(s.state) +
              '">Calculate this bill &rarr;</a></div></div></div>';
          });
        });
        host.innerHTML =
          html || '<div class="empty">No DISCOM matches that search.</div>';
        document.getElementById("count").textContent = n;
      }
      draw("");
      var f = document.getElementById("q");
      f.addEventListener("input", function () {
        draw(f.value);
      });
    })
    .catch(function () {
      document.getElementById("tlist").innerHTML =
        '<div class="empty">Tariff data could not be loaded.</div>';
    });
})();
