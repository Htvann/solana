import WalletAdapter from "./walletAdapter";
import getPhantomAdapter from "./adaptor/phantom";

declare global {
  interface Window {
    solana: MathOrPhantomAdapter;
  }
}

type GetAdapterFunction = () => WalletAdapter | undefined;

export interface Wallet {
  name: string;
  icon: string;
  getAdapter: GetAdapterFunction;
}

const wallets: Wallet[] = [
  {
    name: "Phantom",
    icon: "https://www.phantom.app/img/logo.png",
    getAdapter: getPhantomAdapter,
  },
];

export default wallets;

export interface MathOrPhantomAdapter extends WalletAdapter {
  isMathWallet: boolean;
  isPhantom: boolean;
  getAccount: () => Promise<string>;
  connect: (arg: { onlyIfTrusted: boolean }) => void;
}
