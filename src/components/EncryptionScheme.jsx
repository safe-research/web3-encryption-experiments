import { useCallback, useState, useTransition } from "react";

export function EncryptionScheme({
  generateKey,
  encrypt,
  decrypt,
  wallet,
  plaintext,
  setPlaintext,
  ciphertext,
  setCiphertext,
}) {
  const [encryptionKey, setEncryptionKey] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isEncrypting, startEncryption] = useTransition();
  const [isDecrypting, startDecryption] = useTransition();

  const handleRequestEncryptionKey = useCallback(() => {
    startTransition(async () => {
      const key = await generateKey(wallet);
      setEncryptionKey(key);
    });
  }, [generateKey, wallet, setEncryptionKey, startTransition]);

  const handleEncrypt = useCallback(() => {
    startTransition(async () => {
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
          disabled={isPending}
          style={{
            cursor: "pointer",
            marginLeft: "8px",
          }}
        >
          {isPending ? "Requesting..." : "Request"}
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
          disabled={isDecrypting || !ciphertext}
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
