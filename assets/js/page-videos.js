(function () {
  var V = [
    {
      id: "",
      t: "How to apply for the PM Surya Ghar subsidy, step by step",
      d: "The full portal flow, the three documents that hold applications up, and what happens after you submit.",
      tag: "Subsidy",
    },
    {
      id: "",
      t: "Reading an Indian electricity bill line by line",
      d: "Energy charge, fixed charge, fuel surcharge, duty — what each one is and which you can actually change.",
      tag: "Bills",
    },
    {
      id: "",
      t: "Comparing two solar quotes without getting fooled",
      d: "The nine line items to compare. Two quotes ₹40,000 apart usually differ on three of them.",
      tag: "Solar",
    },
    {
      id: "",
      t: "EV vs petrol: the maths on a whiteboard",
      d: "Charging losses, real efficiency and why the ₹1/km claim only holds in specific conditions.",
      tag: "EV",
    },
    {
      id: "",
      t: "Is a 7.2 kW home charger worth ₹28,000?",
      d: "When the bundled 3.3 kW cable is genuinely enough, and the three cases where it is not.",
      tag: "EV",
    },
    {
      id: "",
      t: "Cutting a summer bill by 30% without buying anything",
      d: "Thermostat, geyser timing and the standby load nobody looks at.",
      tag: "Bills",
    },
  ];
  var host = document.getElementById("vids");
  host.innerHTML = V.map(function (v) {
    var media = v.id
      ? '<div class="video-embed"><div class="video-facade" data-yt="' +
        v.id +
        '" data-title="' +
        v.t +
        '" style="background-image:url(https://i.ytimg.com/vi/' +
        v.id +
        '/hqdefault.jpg)"></div></div>'
      : '<div class="video-embed"><div class="video-facade" style="background:linear-gradient(140deg,#0B2A3D,#04302A)"></div></div>';
    return (
      '<div class="card reveal">' +
      media +
      '<span class="badge plain" style="margin-top:14px">' +
      v.tag +
      '</span><h3 style="margin:10px 0 6px;font-size:1.1rem">' +
      v.t +
      '</h3><p class="muted" style="font-size:.9rem;margin:0">' +
      v.d +
      "</p></div>"
    );
  }).join("");
})();
