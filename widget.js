(function() {
  "use strict";
  var scripts = document.getElementsByTagName("script");
  var currentScript = scripts[scripts.length - 1];
  var TOKEN = currentScript.getAttribute("data-key");
  var LANG  = currentScript.getAttribute("data-lang") || "it";
  var GAS_URL = "https://script.google.com/macros/s/AKfycbyo4h8vqqBaQMv4_iSGPZ6zkl31G7zaRwKDoPioPeMXSm9L5B4yCOMbIHg2o5O8c_9QvA/exec";

  if (!TOKEN) { console.error("[YouParking] data-key mancante."); return; }

  var T = {
    it: {
      tab_new:"Nuova prenotazione", tab_cancel:"Cancella prenotazione",
      garage:"Garage", nome:"Nome e Cognome", tel:"Telefono", email:"Email",
      veicolo:"Tipo di veicolo", arrivo:"Data di arrivo", orario_arr:"Orario di arrivo",
      partenza:"Data di partenza", orario_par:"Orario di partenza",
      note:"Note aggiuntive (opzionale)", submit:"Invia prenotazione",
      sending:"Invio in corso...", required:"Compila tutti i campi obbligatori.",
      select_gar:"— Seleziona garage —",
      preventivo:"Preventivo stimato",
      preventivo_note:"IVA inclusa · Si paga in garage",
      no_tariffa:"Tariffa non disponibile per questo garage",
      codice_label:"Codice prenotazione", codice_ph:"Es. YP-AB3X7K",
      cancel_btn:"Cancella prenotazione", cancel_sending:"Cancellazione in corso...",
      cancel_required:"Inserisci il codice prenotazione.",
      veicoli:[
        {key:"moto",    label:"Moto / Scooter"},
        {key:"piccola", label:"Auto piccola"},
        {key:"media",   label:"Auto media"},
        {key:"grande",  label:"Auto grande / SUV"},
        {key:"luxury",  label:"Auto luxury"},
        {key:"van",     label:"Van / Furgone"},
      ],
    },
  };
  T["en"] = T["it"];
  var L = T[LANG] || T["it"];

  var CSS = [
    ".yp-widget{font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px;box-sizing:border-box}",
    ".yp-tabs{display:flex;border-bottom:2px solid #e5e5e5;margin-bottom:24px}",
    ".yp-tab{flex:1;padding:10px;text-align:center;font-size:14px;font-weight:600;color:#888;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-2px;transition:all .15s}",
    ".yp-tab.active{color:#4f46e5;border-bottom-color:#4f46e5}",
    ".yp-panel{display:none}.yp-panel.active{display:block}",
    ".yp-field{margin-bottom:14px}",
    ".yp-widget label{display:block;font-size:13px;font-weight:500;color:#444;margin-bottom:5px}",
    ".yp-widget input,.yp-widget select,.yp-widget textarea{width:100%;padding:9px 12px;border:1px solid #d0d0d0;border-radius:8px;font-size:14px;box-sizing:border-box;color:#111;background:#fff}",
    ".yp-widget input:focus,.yp-widget select:focus,.yp-widget textarea:focus{outline:none;border-color:#4f46e5;box-shadow:0 0 0 3px rgba(79,70,229,.1)}",
    ".yp-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}",
    ".yp-widget textarea{resize:vertical;min-height:72px}",
    ".yp-widget button{width:100%;padding:11px;border:none;border-radius:8px;font-size:15px;font-weight:600;cursor:pointer;margin-top:8px;transition:background .15s}",
    ".btn-book{background:#4f46e5;color:#fff}.btn-book:hover{background:#4338ca}",
    ".btn-cancel{background:#dc2626;color:#fff}.btn-cancel:hover{background:#b91c1c}",
    ".yp-widget button:disabled{background:#a5a5a5;cursor:not-allowed}",
    ".yp-msg{padding:12px 16px;border-radius:8px;font-size:14px;margin-top:12px;display:none}",
    ".yp-ok{background:#ecfdf5;color:#065f46;border:1px solid #6ee7b7}",
    ".yp-err{background:#fef2f2;color:#991b1b;border:1px solid #fca5a5}",
    ".yp-code-box{background:#f0f4ff;border:1px solid #c7d2fe;border-radius:8px;padding:14px 16px;margin-top:14px;font-size:14px;color:#3730a3;text-align:center;display:none}",
    ".yp-code-box strong{display:block;font-size:22px;letter-spacing:3px;margin:6px 0}",
    /* preventivo */
    ".yp-preventivo{background:#f0fdf4;border:1px solid #86efac;border-radius:10px;padding:14px 16px;margin-top:14px;display:none}",
    ".yp-preventivo-title{font-size:12px;font-weight:700;color:#15803d;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px}",
    ".yp-preventivo-importo{font-size:28px;font-weight:700;color:#15803d;margin-bottom:2px}",
    ".yp-preventivo-dettaglio{font-size:12px;color:#166534;margin-bottom:4px}",
    ".yp-preventivo-note{font-size:11px;color:#4ade80}",
    ".yp-powered{font-size:11px;text-align:center;color:#aaa;margin-top:16px}",
    ".yp-powered a{color:#aaa;text-decoration:none}.yp-powered a:hover{color:#666}",
  ].join("");

  var garagesConfig = {};

  function buildWidget(garages) {
    var garageOptions = "<option value=''>" + L.select_gar + "</option>";
    garages.forEach(function(g) {
      garagesConfig[g.nome] = g;
      garageOptions += "<option value='" + g.nome + "'>" + g.nome + "</option>";
    });
    var veicoloOptions = L.veicoli.map(function(v) {
      return "<option value='" + v.key + "'>" + v.label + "</option>";
    }).join("");

    return [
      "<style>" + CSS + "</style>",
      "<div class='yp-widget'>",
      "  <div class='yp-tabs'>",
      "    <div class='yp-tab active' onclick='ypTab(this,\"yp-new\")'>📋 " + L.tab_new + "</div>",
      "    <div class='yp-tab' onclick='ypTab(this,\"yp-cancel\")'>❌ " + L.tab_cancel + "</div>",
      "  </div>",
      "  <div id='yp-new' class='yp-panel active'>",
      "    <form id='yp-form' novalidate>",
      "      <div class='yp-field'><label>" + L.garage + " *</label><select name='garage' id='yp-garage-sel' required>" + garageOptions + "</select></div>",
      "      <div class='yp-field'><label>" + L.nome + " *</label><input type='text' name='nome_cognome' required></div>",
      "      <div class='yp-row'>",
      "        <div class='yp-field'><label>" + L.tel + " *</label><input type='tel' name='telefono' required></div>",
      "        <div class='yp-field'><label>" + L.email + "</label><input type='email' name='email'></div>",
      "      </div>",
      "      <div class='yp-field'><label>" + L.veicolo + "</label><select name='tipo_veicolo' id='yp-veicolo-sel'>" + veicoloOptions + "</select></div>",
      "      <div class='yp-row'>",
      "        <div class='yp-field'><label>" + L.arrivo + " *</label><input type='date' name='data_arrivo' id='yp-arr-data' required></div>",
      "        <div class='yp-field'><label>" + L.orario_arr + " *</label><input type='time' name='orario_arrivo' id='yp-arr-ora' required></div>",
      "      </div>",
      "      <div class='yp-row'>",
      "        <div class='yp-field'><label>" + L.partenza + " *</label><input type='date' name='data_partenza' id='yp-par-data' required></div>",
      "        <div class='yp-field'><label>" + L.orario_par + " *</label><input type='time' name='orario_partenza' id='yp-par-ora' required></div>",
      "      </div>",
      "      <div id='yp-preventivo' class='yp-preventivo'>",
      "        <div class='yp-preventivo-title'>" + L.preventivo + "</div>",
      "        <div id='yp-prev-importo' class='yp-preventivo-importo'></div>",
      "        <div id='yp-prev-dettaglio' class='yp-preventivo-dettaglio'></div>",
      "        <div class='yp-preventivo-note'>" + L.preventivo_note + "</div>",
      "      </div>",
      "      <div class='yp-field'><label>" + L.note + "</label><textarea name='note'></textarea></div>",
      "      <button type='submit' id='yp-btn' class='btn-book'>" + L.submit + "</button>",
      "      <div id='yp-ok'  class='yp-msg yp-ok'></div>",
      "      <div id='yp-err' class='yp-msg yp-err'></div>",
      "      <div id='yp-codebox' class='yp-code-box'>Il tuo codice prenotazione:<strong id='yp-codice'></strong>Conservalo per eventuali cancellazioni.</div>",
      "    </form>",
      "  </div>",
      "  <div id='yp-cancel' class='yp-panel'>",
      "    <form id='yp-cform' novalidate>",
      "      <div class='yp-field'><label>" + L.codice_label + " *</label><input type='text' id='yp-cancel-code' placeholder='" + L.codice_ph + "' style='text-transform:uppercase;letter-spacing:2px;font-size:16px;text-align:center'></div>",
      "      <button type='submit' id='yp-cbtn' class='btn-cancel'>" + L.cancel_btn + "</button>",
      "      <div id='yp-cok'  class='yp-msg yp-ok'></div>",
      "      <div id='yp-cerr' class='yp-msg yp-err'></div>",
      "    </form>",
      "  </div>",
      "  <p class='yp-powered'>Powered by <a href='https://charlotteparkingapp.github.io/youparking' target='_blank'>YouParking</a> · <a href='https://charlottesystems.github.io/charlotte-commercial' target='_blank'>Charlotte</a></p>",
      "</div>",
    ].join("\n");
  }

  // ── CALCOLO TARIFFA ──────────────────────────────────────────
  function calcolaPreventivo(garage, veicolo, arrivo, partenza) {
    if (!garage || !veicolo || !arrivo || !partenza) return null;
    var g = garagesConfig[garage];
    if (!g || !g.tariffe) return null;
    var t = g.tariffe[veicolo];
    if (!t || (!t.ora && !t.gg)) return null;

    var diffMs  = partenza - arrivo;
    if (diffMs <= 0) return null;
    var diffMin = diffMs / 60000;

    var oreGiornaliero = g.ore_giornaliero || 4;
    var tolOra = g.tol_ora !== undefined ? g.tol_ora : 15;
    var tolGg  = g.tol_gg  !== undefined ? g.tol_gg  : 20;

    // Calcola giorni interi (con tolleranza giornaliera)
    var giorni = 0;
    var minutiRimanenti = diffMin;
    while (minutiRimanenti > (oreGiornaliero * 60 + tolGg)) {
      giorni++;
      minutiRimanenti -= oreGiornaliero * 60;
    }
    // Se i minuti rimanenti superano la soglia giornaliera (con tol), ancora un giorno
    if (minutiRimanenti > oreGiornaliero * 60) {
      giorni++;
      minutiRimanenti = 0;
    }

    // Calcola ore rimanenti (con tolleranza oraria)
    // Prima ora: sempre piena (nessuna tolleranza)
    var ore = 0;
    if (minutiRimanenti > 0) {
      ore = 1;
      minutiRimanenti -= 60;
    }
    while (minutiRimanenti > tolOra) {
      ore++;
      minutiRimanenti -= 60;
    }

    var totale = (giorni * t.gg) + (ore * t.ora);

    // Costruisci descrizione
    var parti = [];
    if (giorni > 0) parti.push(giorni + (giorni === 1 ? " giornata" : " giornate") + " × " + t.gg.toFixed(2) + "€");
    if (ore > 0)    parti.push(ore + (ore === 1 ? " ora" : " ore") + " × " + t.ora.toFixed(2) + "€");

    return {
      totale:     totale,
      dettaglio:  parti.join(" + "),
      giorni:     giorni,
      ore:        ore,
    };
  }

  function aggiornaPreventivo() {
    var garage  = document.getElementById("yp-garage-sel")  ? document.getElementById("yp-garage-sel").value  : "";
    var veicolo = document.getElementById("yp-veicolo-sel") ? document.getElementById("yp-veicolo-sel").value : "";
    var arrD    = document.getElementById("yp-arr-data")    ? document.getElementById("yp-arr-data").value    : "";
    var arrO    = document.getElementById("yp-arr-ora")     ? document.getElementById("yp-arr-ora").value     : "";
    var parD    = document.getElementById("yp-par-data")    ? document.getElementById("yp-par-data").value    : "";
    var parO    = document.getElementById("yp-par-ora")     ? document.getElementById("yp-par-ora").value     : "";

    var box = document.getElementById("yp-preventivo");
    if (!box) return;

    if (!garage || !arrD || !arrO || !parD || !parO) { box.style.display = "none"; return; }

    var arrivo   = new Date(arrD + "T" + arrO);
    var partenza = new Date(parD + "T" + parO);
    if (isNaN(arrivo) || isNaN(partenza) || partenza <= arrivo) { box.style.display = "none"; return; }

    var g = garagesConfig[garage];
    if (g && !g.tariffe) {
      document.getElementById("yp-prev-importo").textContent = "—";
      document.getElementById("yp-prev-dettaglio").textContent = L.no_tariffa;
      box.style.display = "block"; return;
    }

    var result = calcolaPreventivo(garage, veicolo, arrivo, partenza);
    if (!result) { box.style.display = "none"; return; }

    document.getElementById("yp-prev-importo").textContent = result.totale.toFixed(2) + " €";
    document.getElementById("yp-prev-dettaglio").textContent = result.dettaglio;
    box.style.display = "block";
  }

  function mount(garages, container) {
    container.innerHTML = buildWidget(garages);

    window.ypTab = function(el, panelId) {
      container.querySelectorAll(".yp-tab").forEach(function(t) { t.classList.remove("active"); });
      container.querySelectorAll(".yp-panel").forEach(function(p) { p.classList.remove("active"); });
      el.classList.add("active");
      document.getElementById(panelId).classList.add("active");
    };

    // Listeners per calcolo live
    ["yp-garage-sel","yp-veicolo-sel","yp-arr-data","yp-arr-ora","yp-par-data","yp-par-ora"].forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener("change", aggiornaPreventivo);
    });

    // Submit prenotazione
    document.getElementById("yp-form").addEventListener("submit", function(e) {
      e.preventDefault();
      var form = e.target;
      var btn  = document.getElementById("yp-btn");
      var required = ["garage","nome_cognome","telefono","data_arrivo","orario_arrivo","data_partenza","orario_partenza"];
      if (!required.every(function(n) { return form[n] && form[n].value.trim(); })) {
        showMsg("yp-err", L.required); return;
      }
      btn.disabled = true; btn.textContent = L.sending;
      fetch(GAS_URL, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          action:"booking", token:TOKEN,
          garage:          form["garage"].value,
          nome_cognome:    form["nome_cognome"].value.trim(),
          telefono:        form["telefono"].value.trim(),
          email:           form["email"] ? form["email"].value.trim() : "",
          tipo_veicolo:    L.veicoli.find(function(v){return v.key===form["tipo_veicolo"].value;})
                           ? L.veicoli.find(function(v){return v.key===form["tipo_veicolo"].value;}).label
                           : form["tipo_veicolo"].value,
          data_arrivo:     form["data_arrivo"].value,
          orario_arrivo:   form["orario_arrivo"].value,
          data_partenza:   form["data_partenza"].value,
          orario_partenza: form["orario_partenza"].value,
          note:            form["note"] ? form["note"].value.trim() : "",
          preventivo:      document.getElementById("yp-prev-importo").textContent || "",
        }),
      })
      .then(function(r){return r.json();})
      .then(function(data) {
        if (data.ok) {
          form.reset();
          document.getElementById("yp-preventivo").style.display = "none";
          document.getElementById("yp-codice").textContent = data.codice;
          document.getElementById("yp-codebox").style.display = "block";
          document.getElementById("yp-ok").style.display = "none";
          document.getElementById("yp-err").style.display = "none";
        } else { showMsg("yp-err", data.error || "Errore. Riprova."); }
      })
      .catch(function(){showMsg("yp-err","Errore di rete. Riprova.");})
      .finally(function(){btn.disabled=false;btn.textContent=L.submit;});
    });

    // Submit cancellazione
    document.getElementById("yp-cform").addEventListener("submit", function(e) {
      e.preventDefault();
      var codice = document.getElementById("yp-cancel-code").value.trim().toUpperCase();
      var btn = document.getElementById("yp-cbtn");
      if (!codice) { showCMsg("yp-cerr", L.cancel_required); return; }
      btn.disabled = true; btn.textContent = L.cancel_sending;
      fetch(GAS_URL, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({action:"cancel", token:TOKEN, codice:codice}),
      })
      .then(function(r){return r.json();})
      .then(function(data){
        if (data.ok){showCMsg("yp-cok",data.message);document.getElementById("yp-cancel-code").value="";}
        else{showCMsg("yp-cerr",data.error||"Prenotazione non trovata.");}
      })
      .catch(function(){showCMsg("yp-cerr","Errore di rete. Riprova.");})
      .finally(function(){btn.disabled=false;btn.textContent=L.cancel_btn;});
    });
  }

  function showMsg(id,text){var el=document.getElementById(id);if(el){el.textContent=text;el.style.display="block";}}
  function showCMsg(id,text){["yp-cok","yp-cerr"].forEach(function(i){var el=document.getElementById(i);if(el)el.style.display="none";});showMsg(id,text);}

  function init() {
    var container = document.createElement("div");
    container.id = "yp-container";
    currentScript.parentNode.insertBefore(container, currentScript.nextSibling);
    fetch(GAS_URL + "?action=getConfig&token=" + TOKEN)
      .then(function(r){return r.json();})
      .then(function(data){
        if (data.ok && data.garages && data.garages.length > 0) mount(data.garages, container);
        else container.innerHTML = "<p style='color:red;font-size:13px'>[YouParking] Configurazione non trovata.</p>";
      })
      .catch(function(){container.innerHTML="<p style='color:red;font-size:13px'>[YouParking] Impossibile caricare il form.</p>";});
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
