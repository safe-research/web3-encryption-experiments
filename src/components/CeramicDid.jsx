import { sha256 } from "@noble/hashes/sha2.js";
import { base16, base64 } from "@scure/base";
import { DID } from "dids";
import { Ed25519Provider } from "key-did-provider-ed25519";
import KeyResolver from "key-did-resolver";
import { EncryptionScheme, atou, utoa } from "./EncryptionScheme.jsx";

async function createDid(wallet) {
  const entropy = await wallet.provider.request({
    method: "personal_sign",
    params: [
      `authorize access to your encrypted data on ${window.location.href}`,
      wallet.address,
    ],
  });
  const seed = sha256(base16.decode(entropy.replace(/^0x/, "").toUpperCase()));
  const did = new DID({
    resolver: KeyResolver.getResolver(),
    provider: new Ed25519Provider(seed),
  });
  await did.authenticate();
  return did;
}

async function generateKey(wallet) {
  const did = await createDid(wallet);
  return did.id;
}

async function encrypt(publicKey, data) {
  const did = new DID({
    resolver: KeyResolver.getResolver(),
  });
  const bytes = atou(data);
  const jwe = await did.createJWE(bytes, [publicKey]);
  const encoded = base64.encode(atou(JSON.stringify(jwe)));
  return encoded;
}

async function decrypt(wallet, data) {
  const decoded = utoa(base64.decode(data.trim()));
  const jwe = JSON.parse(decoded);
  const did = await createDid(wallet);
  const bytes = await did.decryptJWE(jwe);
  const message = utoa(bytes);
  return message;
}

export function CeramicDid(props) {
  return (
    <EncryptionScheme
      generateKey={generateKey}
      encrypt={encrypt}
      decrypt={decrypt}
      {...props}
    />
  );
}
