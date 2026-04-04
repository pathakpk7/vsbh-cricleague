// Basic test for frontend setup
import '@testing-library/jest-dom';

test('frontend test setup works', () => {
  // Simple test to verify Jest is working
  expect(true).toBe(true);
  expect(document.createElement('div')).toBeInstanceOf(HTMLDivElement);
});

test('localStorage mock is available', () => {
  expect(localStorage).toBeDefined();
  expect(typeof localStorage.getItem).toBe('function');
  expect(typeof localStorage.setItem).toBe('function');
});

test('sessionStorage mock is available', () => {
  expect(sessionStorage).toBeDefined();
  expect(typeof sessionStorage.getItem).toBe('function');
  expect(typeof sessionStorage.setItem).toBe('function');
});

test('TextEncoder is available', () => {
  expect(typeof TextEncoder).toBe('function');
  expect(typeof TextDecoder).toBe('function');
});
