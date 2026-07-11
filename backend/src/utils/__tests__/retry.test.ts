import { retryWithBackoff } from '../retry';

describe('retryWithBackoff', () => {
  it('should return result if function succeeds on first try', async () => {
    const fn = jest.fn().mockResolvedValue('success');
    const result = await retryWithBackoff(fn, 2, 5);

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry and succeed if subsequent attempt succeeds', async () => {
    const fn = jest.fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockResolvedValueOnce('success');

    const result = await retryWithBackoff(fn, 2, 5);

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should throw error if all attempts fail', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('always fail'));

    await expect(retryWithBackoff(fn, 2, 5)).rejects.toThrow('always fail');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should handle 429 rate limit retryDelay parsing from error message', async () => {
    // Mock the sleep module or function if possible, or just test with a short mock delay.
    // To prevent the test from actually waiting 18 seconds, let's mock the sleep utility or global.setTimeout.
    const spy = jest.spyOn(global, 'setTimeout').mockImplementation((cb: any) => {
      cb();
      return {} as any;
    });

    const error = new Error('Too Many Requests. Please retry in 17.5s. retryDelay: 17.5s');
    const fn = jest.fn()
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce('success');

    const result = await retryWithBackoff(fn, 2, 5);

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenCalled();

    spy.mockRestore();
  });
});
