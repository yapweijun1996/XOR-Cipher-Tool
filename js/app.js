(function () {
  "use strict";

  const MAX_TABLE_ROWS = 24;
  const cipher = window.XORNumberCipher;
  const encoder = new TextEncoder();

  const els = {
    keyInput: document.getElementById("keyInput"),
    plainText: document.getElementById("plainText"),
    cipherText: document.getElementById("cipherText"),
    plainCounter: document.getElementById("plainCounter"),
    cipherCounter: document.getElementById("cipherCounter"),
    encryptButton: document.getElementById("encryptButton"),
    decryptButton: document.getElementById("decryptButton"),
    copyCipherButton: document.getElementById("copyCipherButton"),
    copyPlainButton: document.getElementById("copyPlainButton"),
    clearButton: document.getElementById("clearButton"),
    groupOutput: document.getElementById("groupOutput"),
    outputMode: document.getElementById("outputMode"),
    numberMode: document.getElementById("numberMode"),
    numberModeField: document.getElementById("numberModeField"),
    compactMode: document.getElementById("compactMode"),
    compactModeField: document.getElementById("compactModeField"),
    compactEncoding: document.getElementById("compactEncoding"),
    compactEncodingField: document.getElementById("compactEncodingField"),
    showTable: document.getElementById("showTable"),
    tableSection: document.getElementById("tableSection"),
    xorTableBody: document.getElementById("xorTableBody"),
    statusMessage: document.getElementById("statusMessage"),
    installButton: document.getElementById("installButton"),
    updateBanner: document.getElementById("updateBanner"),
    reloadButton: document.getElementById("reloadButton"),
  };

  let lastContinuousCipher = "";
  let lastCipherFormat = "number";
  let deferredInstallPrompt = null;
  let waitingWorker = null;

  function countCodePoints(value) {
    return Array.from(value).length;
  }

  function isCompactOutputSelected() {
    return els.outputMode.value === "compact";
  }

  function updateCounters() {
    const plain = els.plainText.value;
    const cipherValue = els.cipherText.value;
    const cleanCipher = cipher.cleanCiphertext(cipherValue);
    const compactMode = isCompactOutputSelected() || cipher.isCompactCiphertext(cleanCipher);
    const groupCount = !compactMode && cleanCipher.length > 0 && cleanCipher.length % 3 === 0
      ? cleanCipher.length / 3
      : 0;

    els.plainCounter.textContent = `${countCodePoints(plain)} chars / ${encoder.encode(plain).length} bytes`;
    els.cipherCounter.textContent = compactMode
      ? `${cleanCipher.length} chars`
      : `${cleanCipher.length} digits / ${groupCount} groups`;
  }

  function updateModeLabels() {
    if (isCompactOutputSelected()) {
      els.encryptButton.textContent = "Encrypt Compact";
      els.decryptButton.textContent = "Decrypt Compact";
    } else {
      els.encryptButton.textContent = "Encrypt to Numbers";
      els.decryptButton.textContent = "Decrypt from Numbers";
    }
  }

  function updateAdvancedControls() {
    const compact = isCompactOutputSelected();
    els.numberModeField.hidden = compact;
    els.compactModeField.hidden = !compact;
    els.compactEncodingField.hidden = !compact;
    els.numberMode.disabled = compact;
    els.compactMode.disabled = !compact;
    els.compactEncoding.disabled = !compact;
  }

  function setStatus(message, type) {
    els.statusMessage.textContent = message;
    els.statusMessage.className = `status ${type || ""}`.trim();
  }

  function renderTable(rows) {
    if (!rows.length) {
      els.xorTableBody.innerHTML = '<tr><td colspan="5">Encrypt a message to see byte-level output.</td></tr>';
      return;
    }

    els.xorTableBody.replaceChildren(...rows.map((row) => {
      const tr = document.createElement("tr");
      [row.index, row.messageByte, row.keyByte, row.xor, row.group].forEach((value) => {
        const td = document.createElement("td");
        td.textContent = String(value);
        tr.appendChild(td);
      });
      return tr;
    }));
  }

  function refreshCipherDisplay() {
    if (!lastContinuousCipher) return;
    els.cipherText.value = els.groupOutput.checked && cipher.isNumberCiphertext(lastContinuousCipher)
      ? cipher.formatNumberGroups(lastContinuousCipher)
      : lastContinuousCipher;
    updateCounters();
  }

  async function copyValue(value, label) {
    if (!value) {
      throw new Error(`${label} is required.`);
    }
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(value);
    } else {
      fallbackCopy(value);
    }
    setStatus(`${label} copied.`, "success");
  }

  function fallbackCopy(value) {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "-1000px";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }

  function handleError(error) {
    setStatus(error.message || "Something went wrong.", "error");
  }

  function showUpdateBanner(worker) {
    waitingWorker = worker;
    els.updateBanner.hidden = false;
  }

  async function onEncrypt() {
    try {
      const message = els.plainText.value;
      const key = els.keyInput.value;
      let result = null;

      if (isCompactOutputSelected()) {
        result = await cipher.encodeCompact(message, key, {
          mode: els.compactMode.value,
          encoding: els.compactEncoding.value,
        });
        lastCipherFormat = "compact";
        lastContinuousCipher = result.ciphertext;
      } else {
        result = await cipher.encodeNumber(message, key, {
          mode: els.numberMode.value,
        });
        lastCipherFormat = "number";
        lastContinuousCipher = result.ciphertext;
      }

      refreshCipherDisplay();
      renderTable(cipher.buildXorRows(message, key, MAX_TABLE_ROWS));
      updateCounters();
      if (result.format === "compact") {
        setStatus(`Compact mode ${result.mode} (${result.modeName}). Selected ${result.selectedLength} chars.`, "success");
      } else {
        setStatus(`Number mode ${result.mode} (${result.modeName}). Selected ${result.selectedLength} digits; saved ${result.savedDigits} digits.`, "success");
      }
    } catch (error) {
      handleError(error);
    }
  }

  async function onDecrypt() {
    try {
      const key = els.keyInput.value;
      const decrypted = await cipher.decode(els.cipherText.value, key);
      els.plainText.value = decrypted;
      lastContinuousCipher = cipher.cleanCiphertext(els.cipherText.value);
      lastCipherFormat = cipher.isCompactCiphertext(lastContinuousCipher) ? "compact" : "number";
      refreshCipherDisplay();
      renderTable(cipher.buildXorRows(decrypted, key, MAX_TABLE_ROWS));
      updateCounters();
      setStatus(lastCipherFormat === "compact"
        ? "Compact ciphertext decrypted successfully."
        : "Number ciphertext decrypted successfully.", "success");
    } catch (error) {
      handleError(error);
    }
  }

  function onClear() {
    els.keyInput.value = "";
    els.plainText.value = "";
    els.cipherText.value = "";
    lastContinuousCipher = "";
    lastCipherFormat = "number";
    renderTable([]);
    updateCounters();
    setStatus("Cleared.", "success");
  }

  function registerEvents() {
    els.encryptButton.addEventListener("click", () => {
      onEncrypt().catch(handleError);
    });
    els.decryptButton.addEventListener("click", () => {
      onDecrypt().catch(handleError);
    });
    els.copyCipherButton.addEventListener("click", () => {
      copyValue(els.cipherText.value, "Ciphertext").catch(handleError);
    });
    els.copyPlainButton.addEventListener("click", () => {
      copyValue(els.plainText.value, "Plain text").catch(handleError);
    });
    els.clearButton.addEventListener("click", onClear);
    els.plainText.addEventListener("input", updateCounters);
    els.cipherText.addEventListener("input", () => {
      lastContinuousCipher = "";
      updateCounters();
    });
    els.groupOutput.addEventListener("change", refreshCipherDisplay);
    els.outputMode.addEventListener("change", () => {
      updateModeLabels();
      updateAdvancedControls();
      updateCounters();
      setStatus(isCompactOutputSelected()
        ? "Compact text output enabled. Choose compression and encoding manually."
        : "Number-only output enabled. Choose numeric compression manually.", "");
    });
    [els.numberMode, els.compactMode, els.compactEncoding].forEach((select) => {
      select.addEventListener("change", updateCounters);
    });
    els.showTable.addEventListener("change", () => {
      els.tableSection.hidden = !els.showTable.checked;
    });
    els.reloadButton.addEventListener("click", () => {
      if (waitingWorker) {
        waitingWorker.postMessage({ type: "SKIP_WAITING" });
      }
    });
  }

  function setupInstallPrompt() {
    window.addEventListener("beforeinstallprompt", (event) => {
      event.preventDefault();
      deferredInstallPrompt = event;
      els.installButton.hidden = false;
    });

    els.installButton.addEventListener("click", async () => {
      if (!deferredInstallPrompt) return;
      deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;
      els.installButton.hidden = true;
    });
  }

  function setupServiceWorker() {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("./sw.js", { updateViaCache: "none" }).then((registration) => {
      if (registration.waiting) {
        showUpdateBanner(registration.waiting);
      }

      registration.addEventListener("updatefound", () => {
        const worker = registration.installing;
        if (!worker) return;

        worker.addEventListener("statechange", () => {
          if (worker.state === "installed" && navigator.serviceWorker.controller) {
            showUpdateBanner(worker);
          }
        });
      });

      registration.update();
      setInterval(() => registration.update(), 60 * 60 * 1000);
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
          registration.update();
        }
      });
    }).catch(() => {});

    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  }

  registerEvents();
  updateModeLabels();
  updateAdvancedControls();
  updateCounters();
  setupInstallPrompt();
  setupServiceWorker();

  window.XORCipherTool = cipher;
}());
