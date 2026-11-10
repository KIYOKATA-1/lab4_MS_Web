import "server-only";

import type { SourceResult } from "./environment.types";

export async function sourceResult<T>(label: string, load: () => Promise<T>, usable: (data: T) => boolean): Promise<SourceResult<T>> {
  try {
    const data = await load();
    if (!usable(data)) return { status: "empty", data: null, fetchedAt: null, error: `No usable ${label.toLowerCase()} data is available for this city.` };
    return { status: "success", data, fetchedAt: Math.floor(Date.now() / 1000), error: null };
  } catch (error) {
    return { status: "error", data: null, fetchedAt: null, error: error instanceof Error ? error.message : `${label} could not be loaded. Please try again.` };
  }
}
