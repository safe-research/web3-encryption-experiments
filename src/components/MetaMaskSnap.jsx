import { encrypt } from "@metamask/eth-sig-util";
import { base16, base64 } from "@scure/base";
import { useCallback, useState, useTransition } from "react";

function atou(s) {
  return new TextEncoder("utf-8").encode(s);
}

function utoa(u) {
  return new TextDecoder("utf-8").decode(u);
}

export function MetaMaskSnap({
  wallet,
  plaintext,
  setPlaintext,
  ciphertext,
  setCiphertext,
}) {
  const [encryptionKey, setEncryptionKey] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isDecrypting, startDecryption] = useTransition();

  const handleRequestEncryptionKey = useCallback(() => {
    startTransition(async () => {
      await wallet.provider.request({
        method: "wallet_requestSnaps",
        params: {
          "npm:@metamask/message-signing-snap": {},
        },
      });
      const hexKey = await wallet.provider.request({
        method: "wallet_snap",
        params: {
          snapId: "npm:@metamask/message-signing-snap",
          request: {
            method: "getEncryptionPublicKey",
            params: {},
          },
        },
      });
      const base64Key = base64.encode(
        base16.decode(hexKey.replace(/^0x/, "").toUpperCase()),
      );
      setEncryptionKey(base64Key);
    });
  }, [wallet, setEncryptionKey, startTransition]);

  const handleEncrypt = useCallback(() => {
    const encrypted = encrypt({
      publicKey: encryptionKey,
      data: plaintext,
      version: "x25519-xsalsa20-poly1305",
    });
    const encoded = base64.encode(atou(JSON.stringify(encrypted)));
    setCiphertext(encoded);
  }, [plaintext, encryptionKey, setCiphertext]);

  const handleDecrypt = useCallback(() => {
    startDecryption(async () => {
      const decoded = utoa(base64.decode(ciphertext.trim()));
      const encrypted = JSON.parse(decoded);
      const decryptedMessage = await wallet.provider.request({
        method: "wallet_snap",
        params: {
          snapId: "npm:@metamask/message-signing-snap",
          request: {
            method: "decryptMessage",
            params: {
              data: encrypted,
            },
          },
        },
      });
      setPlaintext(decryptedMessage);
    });
  }, [ciphertext, startDecryption, setPlaintext]);

  return (
    <>
      <p>
        Encyrption key:{" "}
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
          disabled={!encryptionKey}
          style={{
            cursor: "pointer",
          }}
        >
          Encrypt
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
