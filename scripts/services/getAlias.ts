import { types as T } from "../deps.ts";
import { SetConfig } from "./getConfig.ts";

export type Alias = string & { _type: "alias" };
export async function getAlias(
  effects: T.Effects,
  config: SetConfig,
): Promise<Alias> {
  if (config.alias) {
    return config.alias as Alias;
  }
  try {
    return (await effects.readFile({
      volumeId: "main",
      path: "default_alias.txt",
    })) as Alias;
  } catch (_e) {
    const alias = `start9-${
      (Math.random().toString(36) + "00000000000000011").slice(2, 9 + 2)
    }`;
    await effects.writeFile({
      volumeId: "main",
      path: "default_alias.txt",
      toWrite: alias,
    });
    return alias as Alias;
  }
}
