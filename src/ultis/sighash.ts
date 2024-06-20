import { snakeCase } from "snake-case";
import { sha256 } from "js-sha256";

export function sighash(nameSpace: string, ixName: string): Buffer {
  let name = snakeCase(ixName);
  let preimage = `${nameSpace}:${name}`;
  return Buffer.from(sha256.digest(preimage)).slice(0, 8);
}
