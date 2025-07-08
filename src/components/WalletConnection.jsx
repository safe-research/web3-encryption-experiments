import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react";

export const WalletContext = createContext(null);

export function useWallet() {
  return useContext(WalletContext);
}

let providersStore = null;
function useProvidersStore() {
  if (!providersStore) {
    providersStore = {
      value: [],
      subscribe: (listener) => {
        window.addEventListener("eip6963:announceProvider", listener);
        return () =>
          window.removeEventListener("eip6963:announceProvider", listener);
      },
      getSnapshot: () => providersStore.value,
    };

    window.addEventListener("eip6963:announceProvider", (e) => {
      const { info, provider } = e.detail;
      providersStore.value = [...providersStore.value, {
        id: info.uuid,
        name: info.name,
        provider,
      }];
    });
    window.dispatchEvent(new Event("eip6963:requestProvider"));

    // TEST +begin
    setTimeout(
      () =>
        window.dispatchEvent(
          new CustomEvent("eip6963:announceProvider", {
            detail: {
              info: { uuid: "default", name: "Default Provider" },
              provider: {
                request: async ({ method }) => {
                  if (method === "eth_requestAccounts") {
                    await new Promise((resolve) => setTimeout(resolve, 500));
                    return ["0x1234567890abcdef1234567890abcdef12345678"];
                  }
                  throw new Error("Method not supported");
                },
              },
            },
          }),
        ),
      1000,
    );
    setTimeout(
      () =>
        window.dispatchEvent(
          new CustomEvent("eip6963:announceProvider", {
            detail: {
              info: { uuid: "test", name: "Test Provider" },
              provider: {
                request: async ({ method }) => {
                  if (method === "eth_requestAccounts") {
                    await new Promise((resolve) => setTimeout(resolve, 500));
                    return ["0xabcdef1234567890abcdef1234567890abcdef12"];
                  }
                  throw new Error("Method not supported");
                },
              },
            },
          }),
        ),
      1200,
    );
    // TEST +end
  }

  return useSyncExternalStore(
    providersStore.subscribe,
    providersStore.getSnapshot,
  );
}

export function WalletConnection({ setWallet }) {
  const wallet = useWallet();
  const providers = useProvidersStore();
  const [selectedProvider, setSelectedProvider] = useState();
  const [isPending, startTransition] = useTransition();

  const selection = useMemo(() => {
    return providers.find((p) =>
      selectedProvider === undefined || p.id === selectedProvider
    );
  }, [providers, selectedProvider]);

  const handleClick = useCallback((e) => {
    if (selection) {
      startTransition(async () => {
        const accounts = await selection.provider.request({
          method: "eth_requestAccounts",
        });
        setWallet({ ...selection, accounts });
      });
    }
  }, [selection, startTransition]);

  return (
    <>
      <h3>Connect your wallet...</h3>
      <select
        value={selectedProvider}
        onChange={(e) => setSelectedProvider(e.target.value)}
        disabled={wallet !== null}
      >
        {providers.map((provider) => (
          <option key={provider.id} value={provider.id}>
            {provider.name}
          </option>
        ))}
      </select>
      {wallet === null
        ? (
          <button
            onClick={handleClick}
            disabled={!selection || isPending}
          >
            {isPending ? "Connecting..." : "Connect"}
          </button>
        )
        : (
          <button
            onClick={() => setWallet(null)}
          >
            Disconnect
          </button>
        )}
    </>
  );
}
