import { MYSHIP_CONFIG } from './myship-config.mjs';

const REQUEST_TIMEOUT_MS = 45_000;
const MAX_ATTEMPTS = 3;
const RETRY_DELAYS_MS = [1_000, 3_000];
const RETRYABLE_HTTP_STATUSES = new Set([408, 500, 502, 503, 504]);
const USER_AGENT = 'ChestnutMoraMyShipSync/1.0 (+https://chestnut-mora.github.io/)';

export async function fetchMyShipSourceHtml() {
  let lastError;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(new Error(`source request timed out after ${REQUEST_TIMEOUT_MS} ms`)),
      REQUEST_TIMEOUT_MS,
    );
    let shouldRetry = false;

    try {
      const response = await fetch(MYSHIP_CONFIG.sourceUrl, {
        headers: { accept: 'text/html,application/xhtml+xml', 'user-agent': USER_AGENT },
        signal: controller.signal,
      });

      if (!response.ok) {
        lastError = new Error(`source returned HTTP ${response.status}`);
        if (!RETRYABLE_HTTP_STATUSES.has(response.status)) throw lastError;
        shouldRetry = true;
      } else {
        return await response.text();
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      shouldRetry = controller.signal.aborted || error instanceof TypeError;
      if (!shouldRetry) throw lastError;
    } finally {
      clearTimeout(timeout);
    }

    if (!shouldRetry) break;
    if (attempt < MAX_ATTEMPTS - 1) {
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt]));
    }
  }

  throw new Error(`MyShip source request failed after ${MAX_ATTEMPTS} attempts: ${lastError?.message || 'unknown error'}`, {
    cause: lastError,
  });
}
