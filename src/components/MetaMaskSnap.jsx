import { encrypt } from "@metamask/eth-sig-util";
import { base16, base64 } from "@scure/base";
import { EncryptionScheme, atou, utoa } from "./EncryptionScheme.jsx";

async function generateKey(wallet) {
  await wallet.provider.request({
    method: "wallet_requestSnaps",
    params: {
      "npm:@metamask/message-signing-snap": {},
    },
  });
  const key = await wallet.provider.request({
    method: "wallet_snap",
    params: {
      snapId: "npm:@metamask/message-signing-snap",
      request: {
        method: "getEncryptionPublicKey",
        params: {},
      },
    },
  });
  const encoded = base64.encode(
    base16.decode(key.replace(/^0x/, "").toUpperCase()),
  );
  return encoded;
}

function doEncrypt(publicKey, data) {
  const encrypted = encrypt({
    publicKey,
    data,
    version: "x25519-xsalsa20-poly1305",
  });
  const encoded = base64.encode(atou(JSON.stringify(encrypted)));
  // The API expects a promise, even if we don't need `encrypt` to be async.
  return Promise.resolve(encoded);
}

async function decrypt(wallet, data) {
  const decoded = utoa(base64.decode(data.trim()));
  const encrypted = JSON.parse(decoded);
  const decrypted = await wallet.provider.request({
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
  return decrypted;
}

export function MetaMaskSnap(props) {
  return (
    <EncryptionScheme
      generateKey={generateKey}
      encrypt={doEncrypt}
      decrypt={decrypt}
      {...props}
    />
  );
}
