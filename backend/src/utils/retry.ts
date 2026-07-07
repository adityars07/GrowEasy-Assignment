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
        const delay = baseDelay * Math.pow(2, attempt);
        console.warn(
          `[Retry] Attempt ${attempt + 1}/${maxRetries + 1} failed: ${lastError.message}. ` +
            `Retrying in ${delay}ms...`
        );
        await sleep(delay);
      }
    }
  }

  throw lastError;
}

/** Simple sleep utility */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
