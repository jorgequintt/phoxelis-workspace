import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getLastDocument,
  isSessionActive,
  markSessionActive,
  setLastDocument,
} from '../../utils/session';

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('last document storage', () => {
  it('returns null when no last document has been saved', () => {
    expect(getLastDocument()).toBeNull();
  });

  it('returns the name after setLastDocument', () => {
    setLastDocument('my-art');
    expect(getLastDocument()).toBe('my-art');
  });

  it('overwrites the previous last document', () => {
    setLastDocument('first');
    setLastDocument('second');
    expect(getLastDocument()).toBe('second');
  });
});

describe('session tracking', () => {
  it('is inactive by default', () => {
    expect(isSessionActive()).toBe(false);
  });

  it('becomes active after markSessionActive', () => {
    markSessionActive();
    expect(isSessionActive()).toBe(true);
  });
});