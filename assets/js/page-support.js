(function () {
  var C = window.GRIDPE_CONFIG;
  function upi(amt) {
    if (!C.upiVpa) return null;
    var u =
      "upi://pay?pa=" +
      encodeURIComponent(C.upiVpa) +
      "&pn=" +
      encodeURIComponent(C.upiName) +
      "&cu=INR&tn=" +
      encodeURIComponent("Support GridPe");
    if (amt) u += "&am=" + amt;
    return u;
  }
  var live = !!(
    C.upiVpa ||
    C.razorpayPage ||
    C.bmcSlug ||
    C.kofiSlug ||
    C.paypalMe
  );
  document.getElementById("rails-pending").classList.toggle("hide", live);
  document.querySelectorAll("[data-amt]").forEach(function (b) {
    var a = b.getAttribute("data-amt");
    var link = C.razorpayPage ? C.razorpayPage + "?amount=" + a : upi(a);
    if (link) {
      b.setAttribute("href", link);
    } else {
      b.addEventListener("click", function (e) {
        e.preventDefault();
        window.gp.toast(
          "Payment rails go live shortly — thank you for the intent!",
        );
      });
    }
  });
  ["bmc", "kofi", "paypal", "rzp"].forEach(function (k) {
    var el = document.getElementById("rail-" + k);
    if (!el) return;
    var url =
      k === "bmc"
        ? C.bmcSlug && "https://www.buymeacoffee.com/" + C.bmcSlug
        : k === "kofi"
          ? C.kofiSlug && "https://ko-fi.com/" + C.kofiSlug
          : k === "paypal"
            ? C.paypalMe && "https://paypal.me/" + C.paypalMe
            : C.razorpayPage;
    if (url) el.setAttribute("href", url);
    else el.classList.add("hide");
  });
  var q = document.getElementById("upi-link");
  if (q && upi()) q.setAttribute("href", upi());
})();
