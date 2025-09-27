export { TokenEngine } from "./TokenEngine";

// Export additional types and utilities as needed
export type TokenSource = {
  type: string;
  path?: string;
  content?: unknown;
};

export type TokenFormat =
  | "css"
  | "js"
  | "json"
  | "tailwind"
  | "mui"
  | "chakra"
  | string;

export type TokenExportOptions = {
  format: TokenFormat;
  destination: string;
  prefix?: string;
};
