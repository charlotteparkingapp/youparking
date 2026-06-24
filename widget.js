// ============================================================
//  YOUPARKING — Widget JS v1.0
//  Il cliente incolla questo tag sul suo sito:
//
//  <script src="https://tuodominio.github.io/youparking/widget.js"
//          data-key="ypk_abc123xyz"></script>
//
//  Il widget:
//  1. Legge data-key dal tag script
//  2. Chiama il backend GAS per ottenere la lista garages
//  3. Inietta un form prenotazione nella pagina
//  4. Al submit invia la prenotazione al backend
// ============================================================

(function() {
  "use strict";

  // Trova il tag script corrente e legge il token
  var scripts = document.getElementsByTagName("script");
  var currentScript = scripts[scripts.length - 1];
  var TOKEN = currentScript.getAttribute("data-key");
  var LANG  = currentScript.getAttribute("data-lang") || "it";

  // URL del backend GAS — aggiorna dopo il deploy
  var GAS_URL = "https://script.google.com/macros/s/AKfycbyG9Awdp3OXOUWPvXtJrEd9ISfhYVe4yQEQxxaceTEi8ETrOs2PpKxgavBauqnRgDkzaQ/exec";

  if (!TOKEN) {
    console.error("[YouParking] data-key mancante sul tag script.");
    return;
  }

  var T = {
    it: {
      title:       "Prenota il tuo posto",
      garage:      "Garage",
      nome:        "Nome e Cognome",
      tel:         "Telefono",
      email:       "Email",
      veicolo:     "Tipo di veicolo",
      arrivo:      "Data di arrivo",
      orario_arr:  "Orario di arrivo",
      partenza:    "Data di partenza",
      orario_par:  "Orario di partenza",
      note:        "Note aggiuntive (opzionale)",
      submit:      "Invia prenotazione",
      sending:     "Invio in corso...",
      success:     "Prenotazione ricevuta! Ti contatteremo a breve.",
      error:       "Errore durante l'invio. Riprova o chiamaci direttamente.",
      required:    "Compila tutti i campi obbligatori.",
      veicoli:     ["Moto / Scooter", "Auto piccola", "Auto media", "Auto grande / SUV", "Furgone"],
      select_gar:  "— Seleziona garage —",
    },
    en: {
      title:       "Book your parking spot",
      garage:      "Garage",
      nome:        "Full name",
      tel:         "Phone",
      email:       "Email",
      veicolo:     "Vehicle type",
      arrivo:      "Arrival date",
      orario_arr:  "Arrival time",
      partenza:    "Departure date",
      orario_par:  "Departure time",
      note:        "Additional notes (optional)",
      submit:      "Send booking",
      sending:     "Sending...",
      success:     "Booking received! We will contact you shortly.",
      error:       "Error sending. Please retry or call us directly.",
      required:    "Please fill all required fields.",
      veicoli:     ["Motorbike / Scooter", "Small car", "Medium car", "Large car / SUV", "Van"],
      select_gar:  "— Select garage —",
    },
  };
  var L = T[LANG] || T["it"];

  // Stili inline — nessuna dipendenza esterna
  var CSS = [
    ".yp-widget{font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px;box-sizing:border-box}",
    ".yp-widget h2{font-size:18px;font-weight:600;margin:0 0 20px;color:#111}",
    ".yp-widget .yp-field{margin-bottom:14px}",
    ".yp-widget label{display:block;font-size:13px;font-weight:500;color:#444;margin-bottom:4px}",
    ".yp-widget input,.yp-widget select,.yp-widget textarea{width:100%;padding:9px 12px;border:1px solid #d0d0d0;border-radius:8px;font-size:14px;box-sizing:border-box;color:#111;background:#fff}",
    ".yp-widget input:focus,.yp-widget select:focus,.yp-widget textarea:focus{outline:none;border-color:#4f46e5;box-shadow:0 0 0 3px rgba(79,70,229,0.1)}",
    ".yp-widget .yp-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}",
    ".yp-widget textarea{resize:vertical;min-height:72px}",
    ".yp-widget button{width:100%;padding:11px;background:#4f46e5;color:#fff;border:none;border-radius:8px;font-size:15px;font-weight:600;cursor:pointer;margin-top:8px;transition:background .15s}",
    ".yp-widget button:hover{background:#4338ca}",
    ".yp-widget button:disabled{background:#a5a5a5;cursor:not-allowed}",
    ".yp-widget .yp-msg{padding:12px 16px;border-radius:8px;font-size:14px;margin-top:12px;display:none}",
    ".yp-widget .yp-ok{background:#ecfdf5;color:#065f46;border:1px solid #6ee7b7}",
    ".yp-widget .yp-err{background:#fef2f2;color:#991b1b;border:1px solid #fca5a5}",
    ".yp-powered{font-size:11px;text-align:center;color:#aaa;margin-top:12px}",
    ".yp-powered a{color:#aaa;text-decoration:none}",
    ".yp-powered a:hover{color:#666}",
  ].join("");

  function buildForm(garages) {
    var garageOptions = "<option value=''>" + L.select_gar + "</option>";
    garages.forEach(function(g) {
      garageOptions += "<option value='" + g.nome + "'>" + g.nome + "</option>";
    });

    var veicoloOptions = L.veicoli.map(function(v) {
      return "<option value='" + v + "'>" + v + "</option>";
    }).join("");

    return [
      "<style>" + CSS + "</style>",
      "<div class='yp-widget'>",
      "  <h2>" + L.title + "</h2>",
      "  <form id='yp-form' novalidate>",
      "    <div class='yp-field'>",
      "      <label>" + L.garage + " *</label>",
      "      <select name='garage' required>" + garageOptions + "</select>",
      "    </div>",
      "    <div class='yp-field'>",
      "      <label>" + L.nome + " *</label>",
      "      <input type='text' name='nome_cognome' required>",
      "    </div>",
      "    <div class='yp-row'>",
      "      <div class='yp-field'>",
      "        <label>" + L.tel + " *</label>",
      "        <input type='tel' name='telefono' required>",
      "      </div>",
      "      <div class='yp-field'>",
      "        <label>" + L.email + "</label>",
      "        <input type='email' name='email'>",
      "      </div>",
      "    </div>",
      "    <div class='yp-field'>",
      "      <label>" + L.veicolo + "</label>",
      "      <select name='tipo_veicolo'>" + veicoloOptions + "</select>",
      "    </div>",
      "    <div class='yp-row'>",
      "      <div class='yp-field'>",
      "        <label>" + L.arrivo + " *</label>",
      "        <input type='date' name='data_arrivo' required>",
      "      </div>",
      "      <div class='yp-field'>",
      "        <label>" + L.orario_arr + " *</label>",
      "        <input type='time' name='orario_arrivo' required>",
      "      </div>",
      "    </div>",
      "    <div class='yp-row'>",
      "      <div class='yp-field'>",
      "        <label>" + L.partenza + " *</label>",
      "        <input type='date' name='data_partenza' required>",
      "      </div>",
      "      <div class='yp-field'>",
      "        <label>" + L.orario_par + " *</label>",
      "        <input type='time' name='orario_partenza' required>",
      "      </div>",
      "    </div>",
      "    <div class='yp-field'>",
      "      <label>" + L.note + "</label>",
      "      <textarea name='note'></textarea>",
      "    </div>",
      "    <button type='submit' id='yp-btn'>" + L.submit + "</button>",
      "    <div id='yp-ok'  class='yp-msg yp-ok'></div>",
      "    <div id='yp-err' class='yp-msg yp-err'></div>",
      "  </form>",
      "  <p class='yp-powered'>Powered by <a href='https://youparking.it' target='_blank'>YouParking</a></p>",
      "</div>",
    ].join("\n");
  }

  function showMsg(type, text) {
    var ok  = document.getElementById("yp-ok");
    var err = document.getElementById("yp-err");
    if (type === "ok")  { ok.textContent  = text; ok.style.display  = "block"; err.style.display = "none"; }
    if (type === "err") { err.textContent = text; err.style.display = "block"; ok.style.display  = "none"; }
  }

  function mountForm(garages, container) {
    container.innerHTML = buildForm(garages);

    document.getElementById("yp-form").addEventListener("submit", function(e) {
      e.preventDefault();
      var form = e.target;
      var btn  = document.getElementById("yp-btn");

      // Validazione campi required
      var required = ["garage","nome_cognome","telefono","data_arrivo","orario_arrivo","data_partenza","orario_partenza"];
      var valid = required.every(function(name) {
        return form[name] && form[name].value.trim() !== "";
      });
      if (!valid) { showMsg("err", L.required); return; }

      btn.disabled    = true;
      btn.textContent = L.sending;

      var payload = {
        action:          "booking",
        token:           TOKEN,
        garage:          form["garage"].value,
        nome_cognome:    form["nome_cognome"].value.trim(),
        telefono:        form["telefono"].value.trim(),
        email:           form["email"] ? form["email"].value.trim() : "",
        tipo_veicolo:    form["tipo_veicolo"] ? form["tipo_veicolo"].value : "",
        data_arrivo:     form["data_arrivo"].value,
        orario_arrivo:   form["orario_arrivo"].value,
        data_partenza:   form["data_partenza"].value,
        orario_partenza: form["orario_partenza"].value,
        note:            form["note"] ? form["note"].value.trim() : "",
      };

      fetch(GAS_URL, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.ok) {
          form.reset();
          showMsg("ok", L.success);
        } else {
          showMsg("err", data.error || L.error);
        }
      })
      .catch(function() {
        showMsg("err", L.error);
      })
      .finally(function() {
        btn.disabled    = false;
        btn.textContent = L.submit;
      });
    });
  }

  // Init: crea container, carica config dal backend, monta form
  function init() {
    var container = document.createElement("div");
    container.id  = "yp-container";
    currentScript.parentNode.insertBefore(container, currentScript.nextSibling);

    fetch(GAS_URL + "?action=getConfig&token=" + TOKEN)
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.ok && data.garages && data.garages.length > 0) {
          mountForm(data.garages, container);
        } else {
          container.innerHTML = "<p style='color:red;font-size:13px'>[YouParking] Configurazione non trovata.</p>";
        }
      })
      .catch(function() {
        container.innerHTML = "<p style='color:red;font-size:13px'>[YouParking] Impossibile caricare il form.</p>";
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();
