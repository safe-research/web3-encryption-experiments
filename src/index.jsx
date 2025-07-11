import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";

import {
  WalletConnection,
  WalletContext,
} from "./components/WalletConnection.jsx";
import { EncryptedMessage } from "./components/EncryptedMessage.jsx";

function App() {
  const [wallet, setWallet] = useState(null);

  return (
    <WalletContext value={wallet}>
      <h1>Encrypt and Decrypt With Your Wallet</h1>
      <WalletConnection setWallet={setWallet} />
      <EncryptedMessage />
    </WalletContext>
  );
}

createRoot(document.getElementById("app")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
