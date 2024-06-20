import { useContext } from "react";
import {
  ConnectionContext,
  ConnectionContextType,
} from "../contexts/ConnectionContext";

const useConnection = (): ConnectionContextType =>
  useContext(ConnectionContext);

export default useConnection;
