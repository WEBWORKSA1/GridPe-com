(function () {
  var B = window.gp.base;
  window.gp
    .getJSON(B + "data/discoms.json")
    .then(function (D) {
      var host = document.getElementById("dlist");
      var states = [];
      D.discoms.forEach(function (d) {
        if (states.indexOf(d.state) < 0) states.push(d.state);
      });
      var sel = document.getElementById("st");
      sel.innerHTML =
        '<option value="">All states</option>' +
        states
          .sort()
          .map(function (s) {
            return "<option>" + s + "</option>";
          })
          .join("");
      function draw() {
        var q = (document.getElementById("q").value || "").toLowerCase();
        var st = sel.value;
        var list = D.discoms.filter(function (d) {
          if (st && d.state !== st) return false;
          if (!q) return true;
          return (
            (d.name + " " + d.short + " " + d.state).toLowerCase().indexOf(q) >
            -1
          );
        });
        document.getElementById("count").textContent = list.length;
        if (!list.length) {
          host.innerHTML =
            '<div class="empty">No distribution company matches that search.</div>';
          return;
        }
        host.innerHTML =
          '<div class="grid g-auto">' +
          list
            .map(function (d) {
              return (
                '<div class="card card-hover"><span class="badge plain">' +
                d.state +
                '</span><h4 style="margin:12px 0 4px">' +
                d.name +
                '</h4><p class="dim" style="font-size:.85rem;margin-bottom:12px">' +
                d.short +
                '</p><div class="kv"><span class="k">Complaints</span><span class="v">' +
                d.helpline +
                '</span></div><a class="btn btn-ghost btn-sm" style="margin-top:12px" href="' +
                d.site +
                '" target="_blank" rel="noopener nofollow">Official site &rarr;</a></div>'
              );
            })
            .join("") +
          "</div>";
      }
      draw();
      document.getElementById("q").addEventListener("input", draw);
      sel.addEventListener("change", draw);
    })
    .catch(function () {
      document.getElementById("dlist").innerHTML =
        '<div class="empty">Directory could not be loaded.</div>';
    });
})();
