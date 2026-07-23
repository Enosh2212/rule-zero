const REQUEST_TIMEOUT_MS = 10_000;

export async function requestJson<T>(
  url: string,
  init: RequestInit | undefined,
  errorPrefix: string,
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    if (!response.ok) throw new Error(`${errorPrefix} (${response.status})`);
    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(`${errorPrefix} (request timed out)`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
