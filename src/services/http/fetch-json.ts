import "server-only";

export class ExternalRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExternalRequestError";
  }
}

export async function fetchJson(url: URL, label: string, signal?: AbortSignal): Promise<unknown> {
  const timeout = AbortSignal.timeout(10000);
  try {
    const response = await fetch(url, {
      cache: "no-store",
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    });
    if (!response.ok) {
      throw new ExternalRequestError(`${label} is temporarily unavailable (HTTP ${response.status}). Please try again.`);
    }
    try {
      const data: unknown = await response.json();
      return data;
    } catch {
      throw new ExternalRequestError(`${label} returned invalid JSON. Please try again.`);
    }
  } catch (error) {
    if (signal?.aborted) throw error;
    if (timeout.aborted || (error instanceof Error && error.name === "TimeoutError")) {
      throw new ExternalRequestError(`${label} request timed out. Please try again.`);
    }
    if (error instanceof ExternalRequestError) throw error;
    throw new ExternalRequestError(`Could not connect to ${label}. Please try again.`);
  }
}
