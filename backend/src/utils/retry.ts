/**
 * Retry a function with exponential backoff.
 *
 * @param fn - The async function to retry
 * @param maxRetries - Maximum number of retries (default: 5)
 * @param baseDelay - Base delay in ms before first retry (default: 2000)
 * @returns The result of the function
 * @throws The last error if all retries are exhausted
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 5,
  baseDelay: number = 2000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // If daily quota is fully exhausted (limit: 0), abort immediately — retrying won't help
      if (isDailyQuotaExhausted(lastError)) {
        console.error(
          `[Retry] Daily quota exhausted (limit: 0). Aborting — retries won't help. ` +
            `Wait for quota reset or upgrade to a paid API key.`
        );
        throw lastError;
      }

      if (attempt < maxRetries) {
        // Check if it's a rate limit error (429) and extract server-suggested delay
        const serverDelay = extractRateLimitDelay(lastError);
        const exponentialDelay = baseDelay * Math.pow(2, attempt);
        // Use server-suggested delay if available, otherwise exponential backoff
        // Add jitter (±20%) to avoid thundering herd
        const delay = serverDelay || exponentialDelay;
        const jitter = delay * (0.8 + Math.random() * 0.4);
        const finalDelay = Math.min(Math.ceil(jitter), 120_000); // Cap at 120s

        console.warn(
          `[Retry] Attempt ${attempt + 1}/${maxRetries} failed: ${lastError.message.substring(0, 120)}... ` +
            `Retrying in ${Math.round(finalDelay / 1000)}s...`
        );
        await sleep(finalDelay);
      }
    }
  }

  throw lastError;
}

/**
 * Detect if the error indicates the daily quota is fully exhausted (limit: 0).
 * In this case, retrying is pointless — the quota won't reset for hours.
 */
function isDailyQuotaExhausted(error: Error): boolean {
  const msg = error.message || '';
  // Check for "limit: 0" combined with "PerDay" quota ID — means daily quota is at zero
  return (
    msg.includes('429') &&
    msg.includes('limit: 0') &&
    msg.includes('PerDay')
  );
}

/**
 * Extract a retry delay from a 429 rate-limit error message.
 * Looks for patterns like "retry in 17s" or "retryDelay":"17s"
 * Returns delay in ms, or null if not a rate-limit error.
 */
function extractRateLimitDelay(error: Error): number | null {
  const msg = error.message || '';
  if (!msg.includes('429') && !msg.includes('Too Many Requests') && !msg.includes('quota')) {
    return null;
  }

  // Try to find "retryDelay":"Xs" in the error message
  const retryDelayMatch = msg.match(/retryDelay["\s:]+(\d+(?:\.\d+)?)\s*s/i);
  if (retryDelayMatch) {
    const seconds = Math.ceil(parseFloat(retryDelayMatch[1]));
    // Add a 5s buffer on top of server-suggested delay, clamp between 10s and 120s
    return Math.min(Math.max(seconds + 5, 10), 120) * 1000;
  }

  // Try "retry in Xs" pattern
  const retryInMatch = msg.match(/retry\s+in\s+(\d+(?:\.\d+)?)\s*s/i);
  if (retryInMatch) {
    const seconds = Math.ceil(parseFloat(retryInMatch[1]));
    return Math.min(Math.max(seconds + 5, 10), 120) * 1000;
  }

  // Default rate-limit delay: 30 seconds (conservative for free tier)
  return 30_000;
}

/** Simple sleep utility */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
