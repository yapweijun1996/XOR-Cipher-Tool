(function () {
  "use strict";

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const MAX_TABLE_ROWS = 24;

  const els = {
    keyInput: document.getElementById("keyInput"),
    plainText: document.getElementById("plainText"),
    cipherText: document.getElementById("cipherText"),
    encryptButton: document.getElementById("encryptButton"),
    decryptButton: document.getElementById("decryptButton"),
    copyCipherButton: document.getElementById("copyCipherButton"),
    copyPlainButton: document.getElementById("copyPlainButton"),
    clearButton: document.getElementById("clearButton"),
    groupOutput: document.getElementById("groupOutput"),
    showTable: document.getElementById("showTable"),
    tableSection: document.getElementById("tableSection"),
    xorTableBody: document.getElementById("xorTableBody"),
    statusMessage: document.getElementById("statusMessage"),
    installButton: document.getElementById("installButton"),
    updateBanner: document.getElementById("updateBanner"),
    reloadButton: document.getElementById("reloadButton"),
  };

  let lastContinuousCipher = "";
  let deferredInstallPrompt = null;
  let waitingWorker = null;

  function requireValue(value, label) {
    if (!value) {
      throw new Error(`${label} is required.`);
    }
  }

  function cleanCiphertext(ciphertext) {
    return ciphertext.replace(/\s+/g, "");
  }

  function validateNumberCiphertext(ciphertext) {
    const clean = cleanCiphertext(ciphertext);
    requireValue(clean, "Ciphertext");

    if (!/^\d+$/.test(clean)) {
      throw new Error("Ciphertext must contain numbers only.");
    }

    if (clean.length % 3 !== 0) {
      throw new Error("Ciphertext length must be divisible by 3.");
    }

    for (let i = 0; i < clean.length; i += 3) {
      const value = Number(clean.slice(i, i + 3));
      if (value < 0 || value > 255) {
        throw new Error("Each encrypted number must be between 000 and 255.");
      }
    }

    return clean;
  }

  function formatNumberGroups(ciphertext) {
    return cleanCiphertext(ciphertext).replace(/(\d{3})(?=\d)/g, "$1 ");
  }

  function buildXorRows(message, key) {
    const messageBytes = encoder.encode(message);
    const keyBytes = encoder.encode(key);
    const rows = [];

    for (let i = 0; i < Math.min(messageBytes.length, MAX_TABLE_ROWS); i += 1) {
      const messageByte = messageBytes[i];
      const keyByte = keyBytes[i % keyBytes.length];
      const xor = messageByte ^ keyByte;
      rows.push({
        index: i + 1,
        messageByte,
        keyByte,
        xor,
        group: String(xor).padStart(3, "0"),
      });
    }

    return rows;
  }

  function encryptToNumbers(message, key) {
    requireValue(message, "Message");
    requireValue(key, "Key");

    const messageBytes = encoder.encode(message);
    const keyBytes = encoder.encode(key);
    let output = "";

    for (let i = 0; i < messageBytes.length; i += 1) {
      const encryptedByte = messageBytes[i] ^ keyBytes[i % keyBytes.length];
      output += String(encryptedByte).padStart(3, "0");
    }

    return output;
  }

  function decryptFromNumbers(ciphertext, key) {
    requireValue(key, "Key");

    const clean = validateNumberCiphertext(ciphertext);
    const keyBytes = encoder.encode(key);
    const outputBytes = [];

    for (let i = 0; i < clean.length; i += 3) {
      const encryptedByte = Number(clean.slice(i, i + 3));
      const keyByte = keyBytes[(i / 3) % keyBytes.length];
      outputBytes.push(encryptedByte ^ keyByte);
    }

    return decoder.decode(new Uint8Array(outputBytes));
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
      ? formatNumberGroups(lastContinuousCipher)
      : lastContinuousCipher;
  }

  async function copyValue(value, label) {
    requireValue(value, label);
    await navigator.clipboard.writeText(value);
    setStatus(`${label} copied.`, "success");
  }

  function handleError(error) {
    setStatus(error.message || "Something went wrong.", "error");
  }

  function onEncrypt() {
    try {
      const message = els.plainText.value;
      const key = els.keyInput.value;
      lastContinuousCipher = encryptToNumbers(message, key);
      refreshCipherDisplay();
      renderTable(buildXorRows(message, key));
      setStatus("Encrypted into 3-digit number groups.", "success");
    } catch (error) {
      handleError(error);
    }
  }

  function onDecrypt() {
    try {
      const key = els.keyInput.value;
      const decrypted = decryptFromNumbers(els.cipherText.value, key);
      els.plainText.value = decrypted;
      lastContinuousCipher = validateNumberCiphertext(els.cipherText.value);
      refreshCipherDisplay();
      renderTable(buildXorRows(decrypted, key));
      setStatus("Decrypted successfully.", "success");
    } catch (error) {
      handleError(error);
    }
  }

  function onClear() {
    els.keyInput.value = "";
    els.plainText.value = "";
    els.cipherText.value = "";
    lastContinuousCipher = "";
    renderTable([]);
    setStatus("Cleared.", "success");
  }

  function registerEvents() {
    els.encryptButton.addEventListener("click", onEncrypt);
    els.decryptButton.addEventListener("click", onDecrypt);
    els.copyCipherButton.addEventListener("click", () => {
      copyValue(els.cipherText.value, "Ciphertext").catch(handleError);
    });
    els.copyPlainButton.addEventListener("click", () => {
      copyValue(els.plainText.value, "Plain text").catch(handleError);
    });
    els.clearButton.addEventListener("click", onClear);
    els.groupOutput.addEventListener("change", refreshCipherDisplay);
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

    navigator.serviceWorker.register("./sw.js").then((registration) => {
      registration.addEventListener("updatefound", () => {
        const worker = registration.installing;
        if (!worker) return;

        worker.addEventListener("statechange", () => {
          if (worker.state === "installed" && navigator.serviceWorker.controller) {
            waitingWorker = worker;
            els.updateBanner.hidden = false;
          }
        });
      });

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
  setupInstallPrompt();
  setupServiceWorker();

  window.XORCipherTool = {
    encryptToNumbers,
    decryptFromNumbers,
    validateNumberCiphertext,
    formatNumberGroups,
  };
}());
