// Simple Jest test to verify testing setup is working
describe('Jest Setup Test', () => {
  test('should pass basic test', () => {
    expect(2 + 2).toBe(4);
  });

  test('should handle async operations', async () => {
    const result = await Promise.resolve('hello');
    expect(result).toBe('hello');
  });

  test('should have TextEncoder available', () => {
    expect(typeof TextEncoder).toBe('function');
    expect(typeof TextDecoder).toBe('function');
  });

  test('should have localStorage mock', () => {
    expect(localStorage).toBeDefined();
    expect(sessionStorage).toBeDefined();
  });
});
