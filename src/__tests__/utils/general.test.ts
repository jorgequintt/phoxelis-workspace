import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  downloadArrayBuffer,
  downloadBlob,
  fileToBase64,
  promptForFile,
} from '../../utils/general';

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

const mockCreateObjectURL = () => {
  let capturedBlob: Blob | null = null;
  Object.defineProperty(window.URL, 'createObjectURL', {
    configurable: true,
    value: vi.fn((blob: Blob) => {
      capturedBlob = blob;
      return 'blob:mock';
    }),
  });
  Object.defineProperty(window.URL, 'revokeObjectURL', {
    configurable: true,
    value: vi.fn(),
  });
  return { capturedBlob: () => capturedBlob };
};

describe('downloadArrayBuffer', () => {
  it('creates a blob URL, clicks a hidden anchor and revokes the URL', () => {
    const { capturedBlob } = mockCreateObjectURL();
    let anchor: HTMLAnchorElement | null = null;
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(function (this: HTMLAnchorElement) {
        anchor = this;
      });

    downloadArrayBuffer('hello', 'file.txt');

    expect(capturedBlob()).toBeInstanceOf(Blob);
    expect(capturedBlob()!.type).toBe('text/plain;charset=utf-8');
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(anchor).not.toBeNull();
    expect(anchor!.download).toBe('file.txt');
    expect(anchor!.href).toBe('blob:mock');
    expect(anchor!.style.display).toBe('none');
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock');
    expect(document.body.contains(anchor!)).toBe(false);
  });

  it('honours a custom mime type', () => {
    const { capturedBlob } = mockCreateObjectURL();
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    downloadArrayBuffer('{}', 'data.json', 'application/json');
    expect(capturedBlob()!.type).toBe('application/json');
  });
});

describe('downloadBlob', () => {
  it('downloads an existing blob and revokes the URL', () => {
    const { capturedBlob } = mockCreateObjectURL();
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    const blob = new Blob(['data'], { type: 'text/csv' });
    downloadBlob(blob, 'out.csv');

    expect(capturedBlob()).toBe(blob);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock');
  });
});

describe('fileToBase64', () => {
  class FakeFileReader {
    onload: ((e: unknown) => void) | null = null;
    onerror: ((e: unknown) => void) | null = null;
    result = '';
    readAsDataURL(_file: File) {
      this.result = 'data:text/plain;base64,AA==';
      this.onload?.({ target: this });
    }
  }

  beforeEach(() => {
    vi.stubGlobal('FileReader', FakeFileReader);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('resolves with the data URL on load', async () => {
    const file = new File(['a'], 'a.txt', { type: 'text/plain' });
    await expect(fileToBase64(file)).resolves.toBe('data:text/plain;base64,AA==');
  });

  it('rejects when the reader errors', async () => {
    const error = new Error('boom');
    class ErroringReader {
      onerror: ((e: unknown) => void) | null = null;
      readAsDataURL() {
        this.onerror?.(error);
      }
    }
    vi.stubGlobal('FileReader', ErroringReader);
    const file = new File(['a'], 'a.txt', { type: 'text/plain' });
    await expect(fileToBase64(file)).rejects.toBe(error);
  });
});

describe('promptForFile', () => {
  it('resolves with the chosen file and applies the default accept filter', async () => {
    let capturedInput: HTMLInputElement | null = null;
    vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(function (
      this: HTMLInputElement,
    ) {
      capturedInput = this;
    });

    const promise = promptForFile();
    expect(capturedInput).not.toBeNull();
    expect(capturedInput!.type).toBe('file');
    expect(capturedInput!.accept).toBe('image/*');

    const file = new File(['x'], 'x.png', { type: 'image/png' });
    Object.defineProperty(capturedInput!, 'files', { configurable: true, value: [file] });
    capturedInput!.dispatchEvent(new Event('change'));

    await expect(promise).resolves.toBe(file);
  });

  it('uses a custom accept filter', async () => {
    let capturedInput: HTMLInputElement | null = null;
    vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(function (
      this: HTMLInputElement,
    ) {
      capturedInput = this;
    });

    promptForFile('.phx,application/json');
    expect(capturedInput!.accept).toBe('.phx,application/json');
  });

  it('rejects when no file is selected', async () => {
    let capturedInput: HTMLInputElement | null = null;
    vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(function (
      this: HTMLInputElement,
    ) {
      capturedInput = this;
    });

    const promise = promptForFile();
    Object.defineProperty(capturedInput!, 'files', { configurable: true, value: [] });
    capturedInput!.dispatchEvent(new Event('change'));

    await expect(promise).rejects.toBeNull();
  });
});