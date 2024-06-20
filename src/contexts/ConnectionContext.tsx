import React, { ReactNode, createContext, useState } from "react";
import { Connection, PublicKey } from "@solana/web3.js";

type Network = {
  name: "locahost";
  url: string;
  programId?: string;
};

const networks: Network[] = [
  {
    name: "locahost",
    url: "http://127.0.0.1:8899",
    programId: "1",
  },
];

// Default to first network that has a defined program id
const [DEFAULT_NETWORK] = networks;

export type ConnectionContextType = {
  networks: Network[];
  connection?: Connection;
  setConnection?: React.Dispatch<React.SetStateAction<Connection>>;
  endpoint?: Network;
  setEndpoint?: (network: Network) => void;
  dexProgramId?: PublicKey;
  graphQLUrl?: string;
};
const ConnectionContext = createContext<ConnectionContextType>({
  networks,
});

const ConnectionProvider = ({ children }: { children: ReactNode }) => {
  const [endpoint, setEndpoint] = useState(DEFAULT_NETWORK);

  const [connection, setConnection] = useState(
    new Connection(endpoint.url, {
      commitment: "confirmed",
    }),
  );

  const handleSetEndpoint = (newEndpoint: Network) => {
    // Update both endpoint and connection state valuse in the same function
    // Will prevent extra rerenders of components that depend on both endpoint and connection
    setEndpoint(newEndpoint);
    setConnection(new Connection(newEndpoint.url, "confirmed"));
  };

  const state: ConnectionContextType = {
    networks,
    connection,
    setConnection,
    endpoint,
    setEndpoint: handleSetEndpoint,
  };

  return (
    <ConnectionContext.Provider value={state}>
      {children}
    </ConnectionContext.Provider>
  );
};

export { ConnectionContext, ConnectionProvider, networks };
