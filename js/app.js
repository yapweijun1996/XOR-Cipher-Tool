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
    zipOutput: document.getElementById("zipOutput"),
    showTable: document.getElementById("showTable"),
    tableSection: document.getElementById("tableSection"),
    xorTableBody: document.getElementById("xorTableBody"),
    statusMessage: document.getElementById("statusMessage"),
    installButton: document.getElementById("installButton"),
    updateBanner: document.getElementById("updateBanner"),
    reloadButton: document.getElementById("reloadButton"),
  };

  let lastContinuousCipher = "";
  let lastCipherIsZipped = false;
  let deferredInstallPrompt = null;
  let waitingWorker = null;

  function countCodePoints(value) {
    return Array.from(value).length;
  }

  function updateCounters() {
    const plain = els.plainText.value;
    const cipherValue = els.cipherText.value;
    const cleanCipher = cipher.cleanCiphertext(cipherValue);
    const groupCount = cleanCipher.length > 0 && cleanCipher.length % 3 === 0
      ? cleanCipher.length / 3
      : 0;

    els.plainCounter.textContent = `${countCodePoints(plain)} chars / ${encoder.encode(plain).length} bytes`;
    els.cipherCounter.textContent = `${cleanCipher.length} digits / ${groupCount} groups`;
  }

  function updateModeLabels() {
    if (els.zipOutput.checked) {
      els.encryptButton.textContent = "Encrypt to Zipped Numbers";
      els.decryptButton.textContent = "Decrypt from Zipped Numbers";
    } else {
      els.encryptButton.textContent = "Encrypt to Numbers";
      els.decryptButton.textContent = "Decrypt from Numbers";
    }
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
    els.cipherText.value = els.groupOutput.checked
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

      if (els.zipOutput.checked) {
        result = await cipher.encryptToShortestNumbers(message, key);
        lastCipherIsZipped = result.zipped;
        lastContinuousCipher = result.ciphertext;
      } else {
        lastCipherIsZipped = false;
        lastContinuousCipher = cipher.encrypt(message, key);
      }

      refreshCipherDisplay();
      renderTable(cipher.buildXorRows(message, key, MAX_TABLE_ROWS));
      updateCounters();
      if (result && result.zipped) {
        setStatus(`Encrypted and zipped. Saved ${result.savedDigits} digits.`, "success");
      } else if (result && !result.zipped) {
        setStatus(`Zip skipped: zipped output would be longer (${result.zippedLength} vs ${result.normalLength} digits).`, "success");
      } else {
        setStatus("Encrypted into 3-digit number groups.", "success");
      }
    } catch (error) {
      handleError(error);
    }
  }

  async function onDecrypt() {
    try {
      const key = els.keyInput.value;
      const decrypted = els.zipOutput.checked
        ? await cipher.decryptFromZippedNumbers(els.cipherText.value, key)
        : cipher.decrypt(els.cipherText.value, key);
      els.plainText.value = decrypted;
      lastContinuousCipher = cipher.validateNumberCiphertext(els.cipherText.value);
      lastCipherIsZipped = els.zipOutput.checked;
      refreshCipherDisplay();
      renderTable(cipher.buildXorRows(decrypted, key, MAX_TABLE_ROWS));
      updateCounters();
      setStatus(lastCipherIsZipped
        ? "Unzipped and decrypted successfully."
        : "Decrypted successfully.", "success");
    } catch (error) {
      handleError(error);
    }
  }

  function onClear() {
    els.keyInput.value = "";
    els.plainText.value = "";
    els.cipherText.value = "";
    lastContinuousCipher = "";
    lastCipherIsZipped = false;
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
    els.zipOutput.addEventListener("change", () => {
      updateModeLabels();
      setStatus(els.zipOutput.checked
        ? "Zip mode enabled. Ciphertext must be zipped numbers when decrypting."
        : "Zip mode disabled. Ciphertext must be normal numbers when decrypting.", "");
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
  updateCounters();
  setupInstallPrompt();
  setupServiceWorker();

  window.XORCipherTool = cipher;
}());
