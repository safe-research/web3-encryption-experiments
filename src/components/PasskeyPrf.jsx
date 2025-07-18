import { base64 } from "@scure/base";
import { DID } from "dids";
import { Ed25519Provider } from "key-did-provider-ed25519";
import KeyResolver from "key-did-resolver";
import { EncryptionScheme, atou, utoa } from "./EncryptionScheme.jsx";

async function createCredential() {
  const credential = await navigator.credentials.create({
    publicKey: {
      challenge: Uint8Array.from([0x5a, 0xfe]),
      rp: {
        name: "Web3 Encryption Experiments",
        id: window.location.hostname,
      },
      user: {
        id: Uint8Array.from([0x5a, 0xfe]),
        name: "research@safe.dev",
        displayName: "Researcher",
      },
      pubKeyCredParams: [
        { alg: -7, type: "public-key" }, // ES256
      ],
      timeout: 60000,
      attestation: "none",
      extensions: {
        prf: {},
      },
    },
  });
  if (!credential?.prf?.enabled) {
    // On macOS Safari, the extension is not reported as enabled, even if it
    // does reply with PRF entropy when attesting.
    console.warn("PRF extension may not supported by the authenticator");
  }
}

async function getCredential() {
  const credential = await navigator.credentials.get({
    publicKey: {
      challenge: Uint8Array.from([0x5a, 0xfe]),
      userVerification: "discouraged",
      timeout: 60000,
      extensions: {
        prf: {
          eval: {
            first: Uint8Array.from([0x5a, 0xfe]),
          },
        },
      },
    },
  });
  return credential;
}

async function getPrf() {
  let credential;
  try {
    credential = await getCredential();
  } catch (err) {
    console.warn(err);
    await createCredential();
    credential = await getCredential();
  }

  const extensions = credential.getClientExtensionResults();
  const prf = extensions?.prf?.results?.first;
  if (!prf) {
    throw new Error("PRF extension not supported by the authenticator");
  }

  return new Uint8Array(prf);
}

async function createDid(_wallet) {
  const seed = await getPrf();
  const did = new DID({
    resolver: KeyResolver.getResolver(),
    provider: new Ed25519Provider(seed),
  });
  await did.authenticate();
  return did;
}

async function generateKey() {
  const did = await createDid();
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

async function decrypt(_wallet, data) {
  const decoded = utoa(base64.decode(data.trim()));
  const jwe = JSON.parse(decoded);
  const did = await createDid();
  const bytes = await did.decryptJWE(jwe);
  const message = utoa(bytes);
  return message;
}

export function PasskeyPrf(props) {
  return (
    <EncryptionScheme
      generateKey={generateKey}
      encrypt={encrypt}
      decrypt={decrypt}
      walletRequired={false}
      {...props}
    />
  );
}
