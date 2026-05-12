(function (root, factory) {
  "use strict";

  const api = factory(root);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.XORNumberCipher = api;
  root.XORCipherTool = api;
}(typeof globalThis !== "undefined" ? globalThis : window, function (root) {
  "use strict";

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  function requireValue(value, label) {
    if (!value) {
      throw new Error(`${label} is required.`);
    }
  }

  function cleanCiphertext(ciphertext) {
    return String(ciphertext || "").replace(/\s+/g, "");
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

  function encryptToNumbers(message, key) {
    requireValue(message, "Message");
    requireValue(key, "Key");

    const messageBytes = encoder.encode(message);
    return encryptBytesToNumbers(messageBytes, key);
  }

  function encryptBytesToNumbers(bytes, key) {
    requireValue(key, "Key");

    const keyBytes = encoder.encode(key);
    let output = "";

    for (let i = 0; i < bytes.length; i += 1) {
      const encryptedByte = bytes[i] ^ keyBytes[i % keyBytes.length];
      output += String(encryptedByte).padStart(3, "0");
    }

    return output;
  }

  function decryptFromNumbers(ciphertext, key) {
    requireValue(key, "Key");

    const clean = validateNumberCiphertext(ciphertext);
    const keyBytes = encoder.encode(key);
    const outputBytes = decryptNumbersToBytes(ciphertext, key);

    return decoder.decode(outputBytes);
  }

  function decryptNumbersToBytes(ciphertext, key) {
    requireValue(key, "Key");

    const clean = validateNumberCiphertext(ciphertext);
    const keyBytes = encoder.encode(key);
    const outputBytes = [];

    for (let i = 0; i < clean.length; i += 3) {
      const encryptedByte = Number(clean.slice(i, i + 3));
      const keyByte = keyBytes[(i / 3) % keyBytes.length];
      outputBytes.push(encryptedByte ^ keyByte);
    }

    return new Uint8Array(outputBytes);
  }

  function bytesToNumberGroups(bytes) {
    return Array.from(bytes, (byte) => String(byte).padStart(3, "0")).join("");
  }

  function numberGroupsToBytes(numberGroups) {
    const clean = validateNumberCiphertext(numberGroups);
    const bytes = [];

    for (let i = 0; i < clean.length; i += 3) {
      bytes.push(Number(clean.slice(i, i + 3)));
    }

    return new Uint8Array(bytes);
  }

  function requireCompressionStream(type) {
    const ctor = root[type];
    if (typeof ctor !== "function") {
      throw new Error(`${type} is not available in this runtime.`);
    }
    return ctor;
  }

  async function compressBytes(bytes) {
    const Compression = requireCompressionStream("CompressionStream");
    const stream = new Blob([bytes]).stream().pipeThrough(new Compression("gzip"));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }

  async function decompressBytes(bytes) {
    const Decompression = requireCompressionStream("DecompressionStream");
    const stream = new Blob([bytes]).stream().pipeThrough(new Decompression("gzip"));
    return await new Response(stream).text();
  }

  async function decompressToBytes(bytes) {
    const Decompression = requireCompressionStream("DecompressionStream");
    const stream = new Blob([bytes]).stream().pipeThrough(new Decompression("gzip"));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }

  async function zipNumberCiphertext(ciphertext) {
    const clean = validateNumberCiphertext(ciphertext);
    const compressed = await compressBytes(encoder.encode(clean));
    return bytesToNumberGroups(compressed);
  }

  async function unzipNumberCiphertext(zippedCiphertext) {
    const compressedBytes = numberGroupsToBytes(zippedCiphertext);
    const restored = await decompressBytes(compressedBytes);
    return validateNumberCiphertext(restored);
  }

  async function encryptToZippedNumbers(message, key) {
    return await zipNumberCiphertext(encryptToNumbers(message, key));
  }

  async function decryptFromZippedNumbers(zippedCiphertext, key) {
    return decryptFromNumbers(await unzipNumberCiphertext(zippedCiphertext), key);
  }

  async function encryptCompressedToNumbers(message, key) {
    requireValue(message, "Message");
    requireValue(key, "Key");

    const compressed = await compressBytes(encoder.encode(message));
    return encryptBytesToNumbers(compressed, key);
  }

  async function decryptCompressedFromNumbers(ciphertext, key) {
    const compressed = decryptNumbersToBytes(ciphertext, key);
    const plainBytes = await decompressToBytes(compressed);
    return decoder.decode(plainBytes);
  }

  async function encryptToShortestNumbers(message, key) {
    const normal = encryptToNumbers(message, key);
    const compressed = await encryptCompressedToNumbers(message, key);

    if (compressed.length < normal.length) {
      return {
        ciphertext: compressed,
        compressed: true,
        zipped: true,
        normalLength: normal.length,
        compressedLength: compressed.length,
        zippedLength: compressed.length,
        savedDigits: normal.length - compressed.length,
      };
    }

    return {
      ciphertext: normal,
      compressed: false,
      zipped: false,
      normalLength: normal.length,
      compressedLength: compressed.length,
      zippedLength: compressed.length,
      savedDigits: 0,
    };
  }

  async function encryptBestNumbers(message, key) {
    requireValue(message, "Message");
    requireValue(key, "Key");

    const normal = encryptToNumbers(message, key);
    const compressed = await encryptCompressedToNumbers(message, key);
    const doubleCompressed = await zipNumberCiphertext(compressed);
    const candidates = [
      {
        mode: "000",
        modeName: "normal",
        payload: normal,
      },
      {
        mode: "001",
        modeName: "gzip-before-encrypt",
        payload: compressed,
      },
      {
        mode: "002",
        modeName: "gzip-before-encrypt-plus-gzip",
        payload: doubleCompressed,
      },
    ].map((candidate) => ({
      ...candidate,
      ciphertext: `${candidate.mode}${candidate.payload}`,
      length: candidate.payload.length + 3,
    }));
    const best = candidates.reduce((winner, candidate) => (
      candidate.length < winner.length ? candidate : winner
    ));

    return {
      ciphertext: best.ciphertext,
      mode: best.mode,
      modeName: best.modeName,
      normalLength: candidates[0].length,
      compressedLength: candidates[1].length,
      doubleCompressedLength: candidates[2].length,
      selectedLength: best.length,
      savedDigits: Math.max(0, candidates[0].length - best.length),
      candidates,
    };
  }

  async function decryptBestNumbers(ciphertext, key) {
    requireValue(key, "Key");

    const clean = validateNumberCiphertext(ciphertext);
    if (clean.length < 6) {
      throw new Error("Best ciphertext must include a 3-digit mode header and payload.");
    }

    const mode = clean.slice(0, 3);
    const payload = clean.slice(3);

    if (mode === "000") {
      return decryptFromNumbers(payload, key);
    }

    if (mode === "001") {
      return await decryptCompressedFromNumbers(payload, key);
    }

    if (mode === "002") {
      const compressedCiphertext = await unzipNumberCiphertext(payload);
      return await decryptCompressedFromNumbers(compressedCiphertext, key);
    }

    throw new Error(`Unsupported best ciphertext mode: ${mode}.`);
  }

  function buildXorRows(message, key, limit) {
    requireValue(key, "Key");

    const messageBytes = encoder.encode(message || "");
    const keyBytes = encoder.encode(key);
    const maxRows = Number.isFinite(limit) ? Math.max(0, limit) : messageBytes.length;
    const rows = [];

    for (let i = 0; i < Math.min(messageBytes.length, maxRows); i += 1) {
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

  return {
    encode: encryptBestNumbers,
    decode: decryptBestNumbers,
    encrypt: encryptToNumbers,
    decrypt: decryptFromNumbers,
    encryptToNumbers,
    decryptFromNumbers,
    encryptBytesToNumbers,
    decryptNumbersToBytes,
    validateNumberCiphertext,
    formatNumberGroups,
    cleanCiphertext,
    zipNumberCiphertext,
    unzipNumberCiphertext,
    encryptToZippedNumbers,
    decryptFromZippedNumbers,
    encryptCompressedToNumbers,
    decryptCompressedFromNumbers,
    encryptToShortestNumbers,
    encryptBestNumbers,
    decryptBestNumbers,
    buildXorRows,
  };
}));
