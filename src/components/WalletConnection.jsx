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
      providersStore.value = [
        ...providersStore.value,
        {
          id: info.uuid,
          name: info.name,
          provider,
        },
      ];
    });
    window.dispatchEvent(new Event("eip6963:requestProvider"));
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
    return providers.find(
      (p) => selectedProvider === undefined || p.id === selectedProvider,
    );
  }, [providers, selectedProvider]);

  const handleClick = useCallback(() => {
    if (selection) {
      startTransition(async () => {
        const [address] = await selection.provider.request({
          method: "eth_requestAccounts",
        });
        if (address) {
          setWallet({ ...selection, address });
        }
      });
    }
  }, [selection, startTransition, setWallet]);

  return (
    <div>
      {wallet === null ? (
        <h3>Connect your wallet...</h3>
      ) : (
        <h3>
          Connected with <code>{wallet.address}</code>.
        </h3>
      )}
      <select
        value={selectedProvider}
        onChange={(e) => setSelectedProvider(e.target.value)}
        disabled={wallet !== null}
        style={{
          cursor: "pointer",
          marginRight: "8px",
        }}
      >
        {providers.map((provider) => (
          <option key={provider.id} value={provider.id}>
            {provider.name}
          </option>
        ))}
      </select>
      {wallet === null ? (
        <button
          onClick={handleClick}
          disabled={!selection || isPending}
          style={{
            cursor: "pointer",
          }}
        >
          {isPending ? "Connecting..." : "Connect"}
        </button>
      ) : (
        <button
          onClick={() => setWallet(null)}
          style={{
            cursor: "pointer",
          }}
        >
          Disconnect
        </button>
      )}
    </div>
  );
}
