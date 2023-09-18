declare interface Window {
  ethereum?: {
    isMetaMask?: boolean;
    request?: (request: unknown) => unknown;
  };
}
