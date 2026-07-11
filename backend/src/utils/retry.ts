/**
 * Retry a function with exponential backoff.
 *
 * @param fn - The async function to retry
 * @param maxRetries - Maximum number of retries (default: 2)
 * @param baseDelay - Base delay in ms before first retry (default: 1000)
 * @returns The result of the function
 * @throws The last error if all retries are exhausted
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 2,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries) {
        // Check if it's a rate limit error (429) and extract server-suggested delay
        const delay = extractRateLimitDelay(lastError) || baseDelay * Math.pow(2, attempt);
        console.warn(
          `[Retry] Attempt ${attempt + 1}/${maxRetries + 1} failed: ${lastError.message.substring(0, 120)}... ` +
            `Retrying in ${delay}ms...`
        );
        await sleep(delay);
      }
    }
  }

  throw lastError;
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
    // Clamp between 5s and 120s
    return Math.min(Math.max(seconds, 5), 120) * 1000;
  }

  // Try "retry in Xs" pattern
  const retryInMatch = msg.match(/retry\s+in\s+(\d+(?:\.\d+)?)\s*s/i);
  if (retryInMatch) {
    const seconds = Math.ceil(parseFloat(retryInMatch[1]));
    return Math.min(Math.max(seconds, 5), 120) * 1000;
  }

  // Default rate-limit delay: 15 seconds
  return 15000;
}

/** Simple sleep utility */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

