import { useState } from "react";

import { CeramicDid } from "./CeramicDid.jsx";
import { MetaMaskSnap } from "./MetaMaskSnap.jsx";
import { useWallet } from "./WalletConnection.jsx";

function Section({ title, children }) {
  return (
    <details>
      <summary>
        <h3 style={{ display: "inline-block", cursor: "pointer" }}>{title}</h3>
      </summary>
      {children}
    </details>
  );
}

export function EncryptedMessage() {
  const wallet = useWallet();
  const [plaintext, setPlaintext] = useState("");
  const [ciphertext, setCiphertext] = useState("");

  let props = { wallet, plaintext, setPlaintext, ciphertext, setCiphertext };
  return wallet ? (
    <div>
      <h3>Plaintext Message</h3>
      <textarea
        value={plaintext}
        onChange={(e) => setPlaintext(e.target.value)}
        rows={2}
        cols={72}
        style={{
          fontFamily: "monospace",
        }}
      />

      <h3>Encrypted Message</h3>
      <textarea
        value={ciphertext}
        onChange={(e) => setCiphertext(e.target.value)}
        rows={6}
        cols={72}
        style={{
          fontFamily: "monospace",
        }}
      />

      <Section title="MetaMask Encryption Snap">
        <MetaMaskSnap {...props} />
      </Section>

      <Section title="Ceramic DID Encryption">
        <CeramicDid {...props} />
      </Section>
    </div>
  ) : (
    <></>
  );
}
