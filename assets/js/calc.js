/* ==========================================================================
   GridPe.com — calculation engine
   Pure functions + page controllers. No dependencies.
   Every formula used on the site lives here so it can be audited in one place.
   ========================================================================== */
(function () {
  'use strict';

  var $ = window.gp.$, $$ = window.gp.$$, inr = window.gp.inr, num = window.gp.num;
  var B = window.gp.base;

  var M = window.GPMath = {};

  /* ============================== ELECTRICITY ============================== */

  /** Energy charge for a given consumption under a DISCOM's slab structure. */
  M.energyCharge = function (d, units) {
    var slabs = d.slabs || [];
    if (!slabs.length) return 0;
    if (d.mode === 'flat') {
      for (var i = 0; i < slabs.length; i++) {
        if (slabs[i].upto === null || units <= slabs[i].upto) return units * slabs[i].rate;
      }
      return units * slabs[slabs.length - 1].rate;
    }
    // telescopic
    var rem = units, prev = 0, total = 0;
    for (var j = 0; j < slabs.length; j++) {
      var cap = slabs[j].upto === null ? Infinity : slabs[j].upto;
      var width = cap - prev;
      var take = Math.min(rem, width);
      if (take <= 0) break;
      total += take * slabs[j].rate;
      rem -= take; prev = cap;
      if (rem <= 0) break;
    }
    return total;
  };

  /** Full bill breakdown. */
  M.bill = function (d, units, loadKw) {
    loadKw = loadKw || 2;
    var energy = M.energyCharge(d, units);
    var fixed = Math.max(d.fixedMin || 0, (d.fixedPerKw || 0) * loadKw);
    var fppca = energy * ((d.fppcaPct || 0) / 100);
    var duty = (energy + fixed + fppca) * ((d.dutyPct || 0) / 100);
    var meter = d.meterRent || 0;
    var total = energy + fixed + fppca + duty + meter;
    return {
      units: units, energy: energy, fixed: fixed, fppca: fppca, duty: duty, meter: meter,
      total: total, effective: units > 0 ? total / units : 0
    };
  };

  /** Invert the bill: what consumption produces this rupee amount? */
  M.unitsFromBill = function (d, amount, loadKw) {
    var lo = 0, hi = 8000;
    for (var i = 0; i < 60; i++) {
      var mid = (lo + hi) / 2;
      if (M.bill(d, mid, loadKw).total < amount) lo = mid; else hi = mid;
    }
    return Math.round((lo + hi) / 2);
  };

  /* ================================= SOLAR ================================= */

  M.solarSubsidy = function (kw, stateTopUp) {
    var central = Math.min(30000 * Math.min(kw, 2) + 18000 * Math.max(0, Math.min(kw, 3) - 2), 78000);
    var state = 0;
    if (stateTopUp && stateTopUp.perKw) state = Math.min(stateTopUp.perKw * kw, stateTopUp.cap || Infinity);
    return { central: Math.round(central), state: Math.round(state), total: Math.round(central + state) };
  };

  M.costBand = function (kw, bands) {
    for (var i = 0; i < bands.length; i++) {
      if (bands[i].maxKw === null || kw <= bands[i].maxKw) return bands[i];
    }
    return bands[bands.length - 1];
  };

  /** Round a raw kW requirement to a buildable system size. */
  M.roundKw = function (kw) {
    if (kw <= 1) return 1;
    if (kw <= 10) return Math.round(kw * 2) / 2;
    return Math.round(kw);
  };

  /**
   * 25-year cash-flow model.
   * Self-consumed units offset the retail tariff; exported units are credited at
   * `exportFactor` of the retail tariff (net metering settles below retail in most states).
   */
  M.solarProjection = function (o) {
    var a = o.assumptions;
    var rows = [], cum = -o.netCost, payback = null;
    var annualConsumption = o.monthlyUnits * 12;
    for (var y = 1; y <= a.systemLifeYears; y++) {
      var deg = Math.pow(1 - a.degradationPctPerYear / 100, y - 1);
      var gen = o.kw * o.genPerKwDay * 365 * deg;
      var tariff = o.tariff * Math.pow(1 + a.tariffEscalationPctPerYear / 100, y - 1);
      var self = Math.min(gen, annualConsumption);
      var exp = Math.max(0, gen - annualConsumption);
      var save = self * tariff + exp * tariff * (o.exportFactor === undefined ? 0.75 : o.exportFactor);
      var cost = a.omPerKwPerYear * o.kw;
      if (y === a.inverterReplacementYear) cost += a.inverterCostPerKw * o.kw;
      var net = save - cost;
      var before = cum;
      cum += net;
      if (payback === null && cum >= 0) payback = y - 1 + (before < 0 ? (-before / net) : 0);
      rows.push({ year: y, gen: gen, tariff: tariff, save: save, cost: cost, net: net, cum: cum });
    }
    var npv = -o.netCost;
    rows.forEach(function (r) { npv += r.net / Math.pow(1 + a.discountRatePct / 100, r.year); });
    return {
      rows: rows,
      lifetimeSaving: cum,
      lifetimeGen: rows.reduce(function (s, r) { return s + r.gen; }, 0),
      year1Saving: rows[0].save,
      payback: payback,
      npv: npv,
      irr: M.irr([-o.netCost].concat(rows.map(function (r) { return r.net; })))
    };
  };

  M.irr = function (cf) {
    function npv(r) { return cf.reduce(function (s, c, i) { return s + c / Math.pow(1 + r, i); }, 0); }
    var lo = -0.9, hi = 3;
    if (npv(lo) * npv(hi) > 0) return null;
    for (var i = 0; i < 120; i++) {
      var mid = (lo + hi) / 2;
      if (npv(lo) * npv(mid) <= 0) hi = mid; else lo = mid;
    }
    return (lo + hi) / 2;
  };

  M.emi = function (p, annualRatePct, years) {
    var r = annualRatePct / 1200, n = years * 12;
    if (r === 0) return p / n;
    return p * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
  };

  /* ================================== EV =================================== */

  M.evPerKm = function (tariff, kmPerKwh, eff) {
    return tariff / (kmPerKwh * eff);
  };
  M.icePerKm = function (fuelPrice, kmpl) {
    return fuelPrice / kmpl;
  };
  M.chargeTime = function (usableKwh, fromSoc, toSoc, chargerKw, carMaxKw, isDC) {
    var kwh = usableKwh * (toSoc - fromSoc) / 100;
    var rate = Math.min(chargerKw, carMaxKw || chargerKw);
    if (!rate) return null;
    var factor = isDC ? 0.75 : 0.88;
    return kwh / (rate * factor);
  };
  M.chargeCost = function (usableKwh, fromSoc, toSoc, ratePerKwh, isDC) {
    var kwh = usableKwh * (toSoc - fromSoc) / 100;
    var eff = isDC ? 0.94 : 0.88;
    return kwh * ratePerKwh / eff;
  };

  /* ============================== APPLIANCES =============================== */

  M.applianceUnits = function (watts, hours, days, qty) {
    return watts * hours * (days || 30) * (qty || 1) / 1000;
  };

  /* ========================================================================= *
   *  PAGE CONTROLLERS
   * ========================================================================= */

  function fillSelect(sel, arr, valueKey, labelKey, placeholder) {
    if (!sel) return;
    sel.innerHTML = (placeholder ? '<option value="">' + placeholder + '</option>' : '') +
      arr.map(function (o, i) {
        var v = valueKey ? o[valueKey] : i;
        var l = labelKey ? o[labelKey] : o;
        return '<option value="' + v + '">' + l + '</option>';
      }).join('');
  }
  function val(id) { var e = document.getElementById(id); return e ? e.value : ''; }
  function numval(id, d) { var v = parseFloat(val(id)); return isFinite(v) ? v : (d || 0); }
  function setText(id, t) { var e = document.getElementById(id); if (e) e.textContent = t; }
  function show(id, on) { var e = document.getElementById(id); if (e) e.classList.toggle('hide', !on); }

  var CTRL = {};

  /* ------------------------------ BILL ------------------------------------ */
  CTRL.bill = function () {
    var T, sState = $('#f-state'), sDiscom = $('#f-discom');
    window.gp.getJSON(B + 'data/tariffs.json').then(function (data) {
      T = data;
      fillSelect(sState, T.states, 'state', 'state', 'Select your state');
      setText('data-asof', T.asOf);
      var pre = new URLSearchParams(location.search).get('state');
      if (pre) { sState.value = pre; onState(); }
    }).catch(function () { window.gp.toast('Could not load tariff data'); });

    function currentDiscom() {
      if (!T) return null;
      var st = T.states.filter(function (s) { return s.state === sState.value; })[0];
      if (!st) return null;
      return st.discoms.filter(function (d) { return d.code === sDiscom.value; })[0] || st.discoms[0];
    }
    function onState() {
      var st = T.states.filter(function (s) { return s.state === sState.value; })[0];
      if (!st) { sDiscom.innerHTML = '<option value="">Select a state first</option>'; return; }
      fillSelect(sDiscom, st.discoms, 'code', 'name');
      run();
    }
    sState && sState.addEventListener('change', onState);
    sDiscom && sDiscom.addEventListener('change', run);
    $$('#calc-bill input,#calc-bill select').forEach(function (i) { i.addEventListener('input', run); });

    $$('input[name=mode]').forEach(function (r) {
      r.addEventListener('change', function () {
        show('row-units', r.value === 'units');
        show('row-amount', r.value === 'amount');
        run();
      });
    });

    function run() {
      var d = currentDiscom();
      if (!d) return;
      var load = numval('f-load', 2);
      var mode = (document.querySelector('input[name=mode]:checked') || {}).value || 'units';
      var units = mode === 'units' ? numval('f-units', 0) : M.unitsFromBill(d, numval('f-amount', 0), load);
      var b = M.bill(d, units, load);

      window.gp.animateTo($('#r-total'), b.total, function (v) { return inr(v); });
      setText('r-units', num(units) + ' units');
      setText('r-energy', inr(b.energy));
      setText('r-fixed', inr(b.fixed));
      setText('r-fppca', inr(b.fppca));
      setText('r-duty', inr(b.duty));
      setText('r-meter', inr(b.meter));
      setText('r-eff', '₹' + b.effective.toFixed(2) + '/unit');
      setText('r-year', inr(b.total * 12));
      setText('r-daily', (units / 30).toFixed(1) + ' units/day');

      var note = $('#r-note');
      if (note) { note.textContent = d.note || ''; note.classList.toggle('hide', !d.note); }

      // slab breakdown table
      var tb = $('#r-slabs');
      if (tb) {
        var rem = units, prev = 0, rows = '';
        d.slabs.forEach(function (s) {
          var cap = s.upto === null ? Infinity : s.upto;
          var take = d.mode === 'flat' ? (units <= cap && units > prev ? units : 0) : Math.max(0, Math.min(rem, cap - prev));
          if (d.mode === 'flat' && units > cap) { prev = cap; return; }
          rows += '<tr><td>' + (prev + 1) + '–' + (cap === Infinity ? '∞' : cap) + '</td><td class="num">₹' + s.rate.toFixed(2) + '</td>' +
            '<td class="num">' + num(take) + '</td><td class="num">' + inr(take * s.rate) + '</td></tr>';
          rem -= take; prev = cap;
        });
        tb.innerHTML = rows;
      }

      // solar cross-sell
      var kw = M.roundKw((units / 30) / 4.1);
      setText('x-kw', kw + ' kW');
      setText('x-save', inr(b.total * 12 * 0.85));
      var lnk = $('#x-link');
      if (lnk) lnk.setAttribute('href', B + 'solar-calculator.html?bill=' + Math.round(b.total) + '&state=' + encodeURIComponent(sState.value));
    }
  };

  /* ------------------------------ SOLAR ----------------------------------- */
  CTRL.solar = function () {
    var S, T;
    Promise.all([window.gp.getJSON(B + 'data/solar.json'), window.gp.getJSON(B + 'data/tariffs.json')])
      .then(function (r) {
        S = r[0]; T = r[1];
        fillSelect($('#f-state'), S.states, 'state', 'state', '');
        var p = new URLSearchParams(location.search);
        $('#f-state').value = p.get('state') || 'Delhi';
        if (!$('#f-state').value) $('#f-state').value = 'Delhi';
        if (p.get('bill')) $('#f-bill').value = p.get('bill');
        run();
      }).catch(function () { window.gp.toast('Could not load solar data'); });

    $$('#calc-solar input,#calc-solar select').forEach(function (i) {
      i.addEventListener('input', function () {
        if (i.id === 'f-tenure') setText('f-tenure-v', i.value + ' years');
        run();
      });
    });

    function run() {
      if (!S) return;
      var stateName = val('f-state') || 'Delhi';
      var st = S.states.filter(function (s) { return s.state === stateName; })[0] || { kwhPerKwPerDay: S.assumptions.generationDefault };
      var gen = st.kwhPerKwPerDay;
      var bill = numval('f-bill', 3000);
      var tariff = numval('f-tariff', 8);
      var monthlyUnits = bill / tariff;
      var roofSqft = numval('f-roof', 0);

      var kwNeed = (monthlyUnits / 30) / gen;
      var kw = M.roundKw(kwNeed);
      var kwMaxByRoof = roofSqft > 0 ? Math.floor(roofSqft / S.assumptions.areaSqftPerKw * 2) / 2 : Infinity;
      var limited = false;
      if (kwMaxByRoof < kw && kwMaxByRoof >= 1) { kw = kwMaxByRoof; limited = true; }

      var band = M.costBand(kw, S.costPerKw);
      var costLow = band.low * kw, costHigh = band.high * kw;
      var cost = (costLow + costHigh) / 2;
      var topUp = S.stateTopUp.filter(function (x) { return x.state === stateName; })[0];
      var sub = M.solarSubsidy(kw, topUp);
      var net = Math.max(0, cost - sub.total);

      var proj = M.solarProjection({
        kw: kw, genPerKwDay: gen, tariff: tariff, monthlyUnits: monthlyUnits,
        netCost: net, assumptions: S.assumptions
      });

      window.gp.animateTo($('#r-lifetime'), proj.lifetimeSaving, function (v) { return window.gp.compactINR(v); });
      setText('r-kw', kw + ' kW');
      setText('r-gen-day', (kw * gen).toFixed(1) + ' units/day');
      setText('r-gen-year', num(kw * gen * 365) + ' units');
      setText('r-cost', inr(costLow) + ' – ' + inr(costHigh));
      setText('r-subsidy', inr(sub.total));
      setText('r-subsidy-split', sub.state > 0 ? '₹' + num(sub.central) + ' central + ₹' + num(sub.state) + ' ' + stateName : 'PM Surya Ghar central subsidy');
      setText('r-net', inr(net));
      setText('r-year1', inr(proj.year1Saving));
      setText('r-monthly', inr(proj.year1Saving / 12));
      setText('r-payback', proj.payback ? proj.payback.toFixed(1) + ' years' : '—');
      setText('r-irr', proj.irr ? (proj.irr * 100).toFixed(1) + '%' : '—');
      setText('r-npv', inr(proj.npv));
      setText('r-area', num(kw * S.assumptions.areaSqftPerKw) + ' sq ft');
      setText('r-panels', Math.ceil(kw * 1000 / 550) + ' panels (550 Wp)');
      setText('r-co2', num(kw * gen * 365 * S.assumptions.co2KgPerKwh / 1000, 1) + ' tonnes/yr');
      setText('r-trees', num(kw * gen * 365 * S.assumptions.co2KgPerKwh / 1000 * S.assumptions.treesPerTonneCo2) + ' trees');
      setText('r-state-gen', gen.toFixed(1) + ' kWh/kW/day');
      show('r-roof-warn', limited);

      // EMI
      var tenure = numval('f-tenure', 5), rate = numval('f-rate', 8.5);
      var emi = M.emi(net, rate, tenure);
      setText('r-emi', inr(emi));
      setText('r-emi-delta', inr(proj.year1Saving / 12 - emi));
      var d = $('#r-emi-delta');
      if (d) d.className = 'v ' + (proj.year1Saving / 12 - emi >= 0 ? 'pos' : 'neg');
      setText('r-emi-verdict', proj.year1Saving / 12 >= emi
        ? 'Your monthly saving covers the EMI from day one — the system is cash-flow positive on credit.'
        : 'The EMI runs ahead of the saving for now. Shorten the tenure or pay a larger portion upfront to flip it positive.');

      // cumulative chart
      var bars = $('#r-bars');
      if (bars) {
        var pick = proj.rows.filter(function (r) { return r.year % 2 === 1; });
        var max = Math.max.apply(null, pick.map(function (r) { return Math.abs(r.cum); }));
        bars.innerHTML = pick.map(function (r) {
          var h = Math.max(3, Math.abs(r.cum) / max * 100);
          return '<div class="bar' + (r.cum < 0 ? ' alt' : '') + '" style="height:' + h + '%" title="Year ' + r.year + ': ' + window.gp.compactINR(r.cum) + '"></div>';
        }).join('');
        var bl = $('#r-bar-labels');
        if (bl) bl.innerHTML = pick.map(function (r) { return '<span>' + (r.year % 4 === 1 ? 'Y' + r.year : '') + '</span>'; }).join('');
      }

      // carry into the lead form
      var c = $('#lead-carry');
      if (c) c.value = kw + ' kW · ' + stateName + ' · bill ' + inr(bill) + ' · est. net ' + inr(net);
    }
  };

  /* ----------------------------- SUBSIDY ---------------------------------- */
  CTRL.subsidy = function () {
    var S;
    window.gp.getJSON(B + 'data/solar.json').then(function (d) {
      S = d;
      fillSelect($('#f-state'), S.states, 'state', 'state', '');
      $('#f-state').value = 'Delhi';
      run();
    });
    $$('#calc-subsidy input,#calc-subsidy select').forEach(function (i) {
      i.addEventListener('input', function () {
        if (i.id === 'f-kw') setText('f-kw-v', i.value + ' kW');
        run();
      });
    });
    function run() {
      if (!S) return;
      var kw = numval('f-kw', 3);
      var stateName = val('f-state');
      var topUp = S.stateTopUp.filter(function (x) { return x.state === stateName; })[0];
      var sub = M.solarSubsidy(kw, topUp);
      var band = M.costBand(kw, S.costPerKw);
      var cost = (band.low + band.high) / 2 * kw;

      window.gp.animateTo($('#r-total'), sub.total, function (v) { return inr(v); });
      setText('r-central', inr(sub.central));
      setText('r-state', inr(sub.state));
      setText('r-cost', inr(cost));
      setText('r-net', inr(Math.max(0, cost - sub.total)));
      setText('r-pct', Math.round(sub.total / cost * 100) + '% of project cost');
      var m = $('#r-meter'); if (m) m.style.width = Math.min(100, sub.total / cost * 100) + '%';
      setText('r-topup-note', topUp ? topUp.note : 'No additional state top-up is published for ' + stateName + ' — the central subsidy applies.');

      var tb = $('#r-bands');
      if (tb) {
        tb.innerHTML =
          '<tr><td>First 2 kW</td><td class="num">₹30,000/kW</td><td class="num">' + inr(30000 * Math.min(kw, 2)) + '</td></tr>' +
          '<tr><td>3rd kW</td><td class="num">₹18,000/kW</td><td class="num">' + inr(18000 * Math.max(0, Math.min(kw, 3) - 2)) + '</td></tr>' +
          '<tr><td>Above 3 kW</td><td class="num">₹0</td><td class="num">₹0</td></tr>' +
          '<tr><td><b>Central subsidy (capped at ₹78,000)</b></td><td class="num">—</td><td class="num"><b>' + inr(sub.central) + '</b></td></tr>';
      }
      var eligible = $('#r-eligible');
      if (eligible) {
        var type = (document.querySelector('input[name=ptype]:checked') || {}).value || 'own';
        var ok = type === 'own';
        eligible.className = 'callout ' + (ok ? 'tip' : 'warn');
        eligible.innerHTML = ok
          ? '<b>You look eligible.</b><p class="mb0">Residential consumer with the connection in your own name — that is the core PM Surya Ghar requirement. Apply on the national portal, pick an empanelled vendor, and the subsidy is credited to your bank account after inspection and net-meter commissioning.</p>'
          : '<b>Check before you apply.</b><p class="mb0">The subsidy is released to the person whose name is on the electricity connection. For a rented property you need the owner on the application; for a housing society, common-area load is funded at ₹18,000/kW up to 500 kW instead.</p>';
      }
    }
  };

  /* -------------------------------- EV ------------------------------------ */
  CTRL.ev = function () {
    var E;
    window.gp.getJSON(B + 'data/ev-models.json').then(function (d) {
      E = d;
      var models = d.models.slice().sort(function (a, b) { return (a.brand + a.model).localeCompare(b.brand + b.model); });
      fillSelect($('#f-model'), models.map(function (m, i) { return { i: i, l: m.brand + ' ' + m.model }; }), 'i', 'l');
      window._models = models;
      fillSelect($('#f-city'), d.fuelPrices, 'city', 'city');
      $('#f-city').value = 'Delhi';
      var nx = models.map(function (m, i) { return { i: i, m: m }; }).filter(function (x) { return /Nexon EV 45/.test(x.m.model); })[0];
      if (nx) $('#f-model').value = nx.i;
      setText('f-mix-v', val('f-mix') + '% at home');
      run();
    });
    $$('#calc-ev input,#calc-ev select').forEach(function (i) {
      i.addEventListener('input', function () {
        if (i.id === 'f-km') setText('f-km-v', num(i.value) + ' km/year');
        if (i.id === 'f-mix') setText('f-mix-v', i.value + '% at home');
        run();
      });
    });
    function run() {
      if (!E) return;
      var m = window._models[numval('f-model', 0)];
      if (!m) return;
      var city = E.fuelPrices.filter(function (c) { return c.city === val('f-city'); })[0] || E.fuelPrices[0];
      var kmYear = numval('f-km', 15000);
      var kmpl = numval('f-kmpl', 15);
      var homeRate = numval('f-home', 8);
      var pubRate = numval('f-public', 21);
      var mix = numval('f-mix', 80) / 100;

      var ice = M.icePerKm(city.petrol, kmpl);
      var evH = M.evPerKm(homeRate, m.realKmPerKwh, E.chargingTariffs.acEfficiency);
      var evP = M.evPerKm(pubRate, m.realKmPerKwh, E.chargingTariffs.dcEfficiency);
      var evBlend = evH * mix + evP * (1 - mix);
      var saveYear = (ice - evBlend) * kmYear;

      window.gp.animateTo($('#r-save'), saveYear, function (v) { return inr(v); });
      setText('r-ice-km', '₹' + ice.toFixed(2) + '/km');
      setText('r-ev-home-km', '₹' + evH.toFixed(2) + '/km');
      setText('r-ev-pub-km', '₹' + evP.toFixed(2) + '/km');
      setText('r-ev-blend', '₹' + evBlend.toFixed(2) + '/km');
      setText('r-ice-year', inr(ice * kmYear));
      setText('r-ev-year', inr(evBlend * kmYear));
      setText('r-5yr', inr(saveYear * 5));
      setText('r-10yr', inr(saveYear * 10));
      setText('r-cut', Math.round((1 - evBlend / ice) * 100) + '% cheaper per km');
      setText('r-eff', m.realKmPerKwh.toFixed(2) + ' km/kWh');
      setText('r-batt', m.batteryKwh + ' kWh (' + m.usableKwh + ' usable)');
      setText('r-range', num(m.claimedRangeKm) + ' km claimed · ~' + num(m.usableKwh * m.realKmPerKwh) + ' km real');
      setText('r-full', inr(m.usableKwh * homeRate / E.chargingTariffs.acEfficiency) + ' for a full home charge');
      setText('r-petrol-city', '₹' + city.petrol.toFixed(2) + '/L in ' + city.city);

      // payback vs an equivalent petrol car
      var delta = numval('f-delta', 300000);
      setText('r-payback', saveYear > 0 ? (delta / saveYear).toFixed(1) + ' years' : '—');
      var meter = $('#r-meter');
      if (meter) meter.style.width = Math.min(100, (1 - evBlend / ice) * 100) + '%';

      var bars = $('#r-bars');
      if (bars) {
        var vals = [ice * kmYear, evP * kmYear, evBlend * kmYear, evH * kmYear];
        var mx = Math.max.apply(null, vals);
        bars.innerHTML = vals.map(function (v, i) {
          return '<div class="bar' + (i === 0 ? ' alt' : '') + '" style="height:' + (v / mx * 100) + '%" title="' + inr(v) + '/yr"></div>';
        }).join('');
      }
    }
  };

  /* --------------------------- CHARGING COST ------------------------------ */
  CTRL.charging = function () {
    var E;
    window.gp.getJSON(B + 'data/ev-models.json').then(function (d) {
      E = d;
      var models = d.models.slice();
      window._models = models;
      fillSelect($('#f-model'), models.map(function (m, i) { return { i: i, l: m.brand + ' ' + m.model }; }), 'i', 'l');
      fillSelect($('#f-charger'), d.chargers, 'id', 'name');
      $('#f-charger').value = '7.2';
      run();
    });
    $$('#calc-charging input,#calc-charging select').forEach(function (i) {
      i.addEventListener('input', function () {
        if (i.id === 'f-from') setText('f-from-v', i.value + '%');
        if (i.id === 'f-to') setText('f-to-v', i.value + '%');
        run();
      });
    });
    function run() {
      if (!E) return;
      var m = window._models[numval('f-model', 0)];
      var ch = E.chargers.filter(function (c) { return c.id === val('f-charger'); })[0] || E.chargers[1];
      var from = numval('f-from', 20), to = numval('f-to', 80);
      if (to <= from) to = from + 1;
      var isDC = ch.type === 'DC';
      var rate = numval('f-rate', isDC ? 21 : 8);
      var carMax = isDC ? m.maxDcKw : m.maxAcKw;

      if (isDC && !m.maxDcKw) {
        setText('r-time', 'Not supported');
        setText('r-cost', '—');
        show('r-dc-warn', true);
        return;
      }
      show('r-dc-warn', false);

      var hrs = M.chargeTime(m.usableKwh, from, to, ch.kw, carMax, isDC);
      var cost = M.chargeCost(m.usableKwh, from, to, rate, isDC);
      var kwh = m.usableKwh * (to - from) / 100;
      var kmAdded = kwh * m.realKmPerKwh;

      setText('r-time', hrs >= 1 ? Math.floor(hrs) + ' h ' + Math.round((hrs % 1) * 60) + ' m' : Math.round(hrs * 60) + ' min');
      window.gp.animateTo($('#r-cost'), cost, function (v) { return inr(v, 0); });
      setText('r-kwh', kwh.toFixed(1) + ' kWh drawn from the battery');
      setText('r-km', num(kmAdded) + ' km added');
      setText('r-perkm', '₹' + (cost / kmAdded).toFixed(2) + '/km');
      setText('r-rate-cap', 'Limited to ' + Math.min(ch.kw, carMax) + ' kW (' + (ch.kw > carMax ? 'car' : 'charger') + ' is the bottleneck)');
      setText('r-install', ch.installCost ? inr(ch.installCost) + ' one-time installation' : 'No installation cost');
      setText('r-note', ch.note || '');

      var tb = $('#r-compare');
      if (tb) {
        tb.innerHTML = E.chargers.map(function (c) {
          var cm = c.type === 'DC' ? m.maxDcKw : m.maxAcKw;
          if (c.type === 'DC' && !m.maxDcKw) return '';
          var h = M.chargeTime(m.usableKwh, from, to, c.kw, cm, c.type === 'DC');
          var r = c.type === 'DC' ? 21 : 8;
          return '<tr><td>' + c.name + '</td><td class="num">' + Math.min(c.kw, cm) + ' kW</td>' +
            '<td class="num">' + (h >= 1 ? h.toFixed(1) + ' h' : Math.round(h * 60) + ' min') + '</td>' +
            '<td class="num">' + inr(M.chargeCost(m.usableKwh, from, to, r, c.type === 'DC')) + '</td></tr>';
        }).join('');
      }
    }
  };

  /* --------------------------- APPLIANCE LOAD ----------------------------- */
  CTRL.appliance = function () {
    var A, rows = [];
    window.gp.getJSON(B + 'data/appliances.json').then(function (d) {
      A = d;
      fillSelect($('#f-add'), d.items.map(function (x, i) { return { i: i, l: x.name + ' — ' + x.watts + ' W' }; }), 'i', 'l', 'Add an appliance…');
      ['Ceiling fan (conventional)', 'LED bulb 9 W', 'Refrigerator 250 L (5★)', 'Television LED 43"', 'Air conditioner 1.5 ton (3★, inverter)'].forEach(function (n) {
        var i = d.items.map(function (x) { return x.name; }).indexOf(n);
        if (i >= 0) add(i, n === 'LED bulb 9 W' ? 6 : (n === 'Ceiling fan (conventional)' ? 4 : 1));
      });
      render();
    });

    function add(idx, qty) {
      var it = A.items[idx];
      rows.push({ name: it.name, watts: it.watts, hours: it.hours, qty: qty || 1 });
    }
    var sel = $('#f-add');
    sel && sel.addEventListener('change', function () {
      if (sel.value === '') return;
      add(parseInt(sel.value, 10), 1); sel.value = ''; render();
    });
    $$('#calc-appliance input').forEach(function (i) { i.addEventListener('input', render); });

    function render() {
      var tariff = numval('f-tariff', 8);
      var tb = $('#r-rows');
      if (!tb) return;
      if (!rows.length) { tb.innerHTML = '<tr><td colspan="6" class="empty">Add appliances to build your home load profile.</td></tr>'; }
      else {
        tb.innerHTML = rows.map(function (r, i) {
          var u = M.applianceUnits(r.watts, r.hours, 30, r.qty);
          return '<tr>' +
            '<td>' + r.name + '</td>' +
            '<td class="num"><input class="input" style="width:64px;padding:6px" type="number" min="1" value="' + r.qty + '" data-i="' + i + '" data-k="qty"></td>' +
            '<td class="num">' + r.watts + ' W</td>' +
            '<td class="num"><input class="input" style="width:70px;padding:6px" type="number" min="0" step="0.5" value="' + r.hours + '" data-i="' + i + '" data-k="hours"></td>' +
            '<td class="num">' + u.toFixed(1) + '</td>' +
            '<td class="num">' + inr(u * tariff) + ' <button class="chip" style="padding:2px 8px;margin-left:6px" data-del="' + i + '">×</button></td>' +
            '</tr>';
        }).join('');
      }
      var totalUnits = rows.reduce(function (s, r) { return s + M.applianceUnits(r.watts, r.hours, 30, r.qty); }, 0);
      var totalW = rows.reduce(function (s, r) { return s + r.watts * r.qty; }, 0);
      window.gp.animateTo($('#r-bill'), totalUnits * tariff, function (v) { return inr(v); });
      setText('r-units', num(totalUnits, 0) + ' units/month');
      setText('r-load', (totalW / 1000).toFixed(2) + ' kW connected load');
      setText('r-sanction', Math.max(1, Math.ceil(totalW / 1000 * 0.6)) + ' kW');
      setText('r-year', inr(totalUnits * tariff * 12));
      setText('r-solar', M.roundKw((totalUnits / 30) / 4.1) + ' kW');

      // biggest consumers
      var sorted = rows.slice().sort(function (a, b) {
        return M.applianceUnits(b.watts, b.hours, 30, b.qty) - M.applianceUnits(a.watts, a.hours, 30, a.qty);
      }).slice(0, 5);
      var top = $('#r-top');
      if (top) {
        top.innerHTML = sorted.map(function (r) {
          var u = M.applianceUnits(r.watts, r.hours, 30, r.qty);
          return '<div class="kv"><span class="k">' + r.name + '</span><span class="v">' + u.toFixed(0) + ' units · ' + Math.round(u / totalUnits * 100) + '%</span></div>';
        }).join('');
      }
    }
    document.addEventListener('click', function (e) {
      var d = e.target.closest('[data-del]');
      if (d) { rows.splice(parseInt(d.getAttribute('data-del'), 10), 1); render(); }
    });
    document.addEventListener('input', function (e) {
      var t = e.target;
      if (t.dataset && t.dataset.i !== undefined && t.dataset.k) {
        rows[parseInt(t.dataset.i, 10)][t.dataset.k] = parseFloat(t.value) || 0;
        var tariff = numval('f-tariff', 8);
        var totalUnits = rows.reduce(function (s, r) { return s + M.applianceUnits(r.watts, r.hours, 30, r.qty); }, 0);
        setText('r-units', num(totalUnits, 0) + ' units/month');
        window.gp.animateTo($('#r-bill'), totalUnits * tariff, function (v) { return inr(v); });
      }
    });
  };

  /* ------------------------------- EMI ------------------------------------ */
  CTRL.emi = function () {
    $$('#calc-emi input,#calc-emi select').forEach(function (i) {
      i.addEventListener('input', function () {
        if (i.id === 'f-years') setText('f-years-v', i.value + ' years');
        if (i.id === 'f-rate') setText('f-rate-v', i.value + '%');
        run();
      });
    });
    function run() {
      var p = numval('f-amount', 200000), r = numval('f-rate', 8.5), y = numval('f-years', 5);
      var down = numval('f-down', 0);
      var principal = Math.max(0, p - down);
      var e = M.emi(principal, r, y);
      var total = e * y * 12;
      window.gp.animateTo($('#r-emi'), e, function (v) { return inr(v); });
      setText('r-principal', inr(principal));
      setText('r-interest', inr(total - principal));
      setText('r-total', inr(total + down));
      setText('r-ratio', Math.round((total - principal) / principal * 100) + '% of principal paid as interest');
      var m = $('#r-meter'); if (m) m.style.width = Math.min(100, principal / total * 100) + '%';

      var save = numval('f-save', 3000);
      setText('r-net', inr(save - e));
      var n = $('#r-net'); if (n) n.className = 'v ' + (save - e >= 0 ? 'pos' : 'neg');
      setText('r-verdict', save >= e
        ? 'Cash-flow positive: the monthly saving is larger than the EMI, so the system pays for itself while you repay it.'
        : 'Cash-flow negative by ' + inr(e - save) + '/month at this tenure. Stretch the tenure or raise the down payment to close the gap.');

      var tb = $('#r-schedule');
      if (tb) {
        var bal = principal, mr = r / 1200, out = '';
        for (var yr = 1; yr <= y; yr++) {
          var ip = 0, pp = 0;
          for (var mth = 0; mth < 12; mth++) {
            var i2 = bal * mr; var p2 = e - i2;
            ip += i2; pp += p2; bal -= p2;
          }
          out += '<tr><td>Year ' + yr + '</td><td class="num">' + inr(pp) + '</td><td class="num">' + inr(ip) + '</td><td class="num">' + inr(Math.max(0, bal)) + '</td></tr>';
        }
        tb.innerHTML = out;
      }
    }
    run();
  };

  /* ----------------------------- ROOF AREA -------------------------------- */
  CTRL.roof = function () {
    $$('#calc-roof input,#calc-roof select').forEach(function (i) { i.addEventListener('input', run); });
    function run() {
      var L = numval('f-len', 30), W = numval('f-wid', 30);
      var usablePct = numval('f-usable', 70) / 100;
      var shade = numval('f-shade', 0) / 100;
      var area = L * W;
      var usable = area * usablePct * (1 - shade);
      var kw = Math.floor(usable / 90 * 2) / 2;
      var panels = Math.floor(usable / 27);
      window.gp.animateTo($('#r-kw'), kw, function (v) { return v.toFixed(1) + ' kW'; });
      setText('r-area', num(area) + ' sq ft total');
      setText('r-usable', num(usable) + ' sq ft usable');
      setText('r-panels', panels + ' panels (550 Wp)');
      setText('r-gen', num(kw * 4.1 * 30) + ' units/month');
      setText('r-value', inr(kw * 4.1 * 365 * 8) + '/year at ₹8/unit');
      setText('r-sub', inr(M.solarSubsidy(kw).total));
      var m = $('#r-meter'); if (m) m.style.width = (usablePct * (1 - shade) * 100) + '%';
    }
    run();
  };

  /* ------------------------------- BOOT ----------------------------------- */
  function boot() {
    var k = document.body.getAttribute('data-calc');
    if (k && CTRL[k]) {
      try { CTRL[k](); } catch (e) { if (window.console) console.error('[GridPe calc]', e); }
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
