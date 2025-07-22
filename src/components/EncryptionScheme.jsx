import { useCallback, useState, useTransition } from "react";
import { useWallet } from "./WalletConnection.jsx";

export function atou(s) {
  return new TextEncoder().encode(s);
}

export function utoa(u) {
  return new TextDecoder().decode(u);
}

export function EncryptionScheme({
  generateKey,
  encrypt,
  decrypt,
  plaintext,
  setPlaintext,
  ciphertext,
  setCiphertext,
  walletRequired = true,
}) {
  const wallet = useWallet();
  const [encryptionKey, setEncryptionKey] = useState("");
  const [isRequestingKey, startKeyRequest] = useTransition();
  const [isEncrypting, startEncryption] = useTransition();
  const [isDecrypting, startDecryption] = useTransition();

  const handleRequestEncryptionKey = useCallback(() => {
    startKeyRequest(async () => {
      const key = await generateKey(wallet);
      setEncryptionKey(key);
    });
  }, [generateKey, wallet, setEncryptionKey, startKeyRequest]);

  const handleEncrypt = useCallback(() => {
    startEncryption(async () => {
      const encrypted = await encrypt(encryptionKey, plaintext);
      setCiphertext(encrypted);
    });
  }, [encrypt, encryptionKey, plaintext, setCiphertext, startEncryption]);

  const handleDecrypt = useCallback(() => {
    startDecryption(async () => {
      const decrypted = await decrypt(wallet, ciphertext);
      setPlaintext(decrypted);
    });
  }, [decrypt, wallet, ciphertext, setPlaintext, startDecryption]);

  const missingWallet = !wallet && walletRequired;
  return (
    <>
      <p>
        Encryption key:{" "}
        <input
          value={encryptionKey}
          onChange={(e) => setEncryptionKey(e.target.value)}
          style={{
            fontFamily: "monospace",
            textOverflow: "ellipsis",
            width: "400px",
          }}
        />
        <button
          onClick={handleRequestEncryptionKey}
          disabled={missingWallet || isRequestingKey}
          style={{
            cursor: "pointer",
            marginLeft: "8px",
          }}
        >
          {isRequestingKey ? "Requesting..." : "Request"}
        </button>
      </p>
      <div>
        <button
          onClick={handleEncrypt}
          disabled={isEncrypting || !encryptionKey}
          style={{
            cursor: "pointer",
          }}
        >
          {isEncrypting ? "Encrypting..." : "Encrypt"}
        </button>
        <button
          onClick={handleDecrypt}
          disabled={missingWallet || isDecrypting || !ciphertext}
          style={{
            cursor: "pointer",
            marginLeft: "8px",
          }}
        >
          {isDecrypting ? "Decrypting..." : "Decrypt"}
        </button>
      </div>
    </>
  );
}
