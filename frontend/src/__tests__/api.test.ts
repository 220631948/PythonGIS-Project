/**
 * Unit tests for lib/api.ts – fetchData, APIClient, error classes
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchData, APIError, NetworkError, TimeoutError, apiClient } from '../lib/api';

// --- Mock global fetch ---

const mockFetch = vi.fn<(...args: Parameters<typeof fetch>) => Promise<Response>>();

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch);
});

afterEach(() => {
  vi.restoreAllMocks();
  mockFetch.mockReset();
});

// Helper to create a mock Response
function jsonResponse(data: unknown, status = 200, statusText = 'OK'): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText,
    headers: new Headers(),
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    clone: () => jsonResponse(data, status, statusText),
  } as unknown as Response;
}

// ── Error Classes ──

describe('Error Classes', () => {
  it('APIError carries status and detail', () => {
    const err = new APIError('bad', 404, 'not found', false);
    expect(err.message).toBe('bad');
    expect(err.status).toBe(404);
    expect(err.detail).toBe('not found');
    expect(err.retryable).toBe(false);
    expect(err.name).toBe('APIError');
  });

  it('NetworkError defaults to status 0 and retryable', () => {
    const err = new NetworkError('offline');
    expect(err.status).toBe(0);
    expect(err.retryable).toBe(true);
    expect(err.name).toBe('NetworkError');
  });

  it('TimeoutError defaults to 408', () => {
    const err = new TimeoutError();
    expect(err.status).toBe(408);
    expect(err.retryable).toBe(true);
    expect(err.name).toBe('TimeoutError');
  });
});

// ── fetchData ──

describe('fetchData', () => {
  it('returns JSON on success', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ ok: true }));
    const result = await fetchData('/api/test', { retries: 0 });
    expect(result).toEqual({ ok: true });
  });

  it('throws APIError on 4xx', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ detail: 'nope' }, 404, 'Not Found'));

    await expect(fetchData('/api/missing', { retries: 0 })).rejects.toThrow(APIError);
  });

  it('throws APIError with retryable=true on 503', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({}, 503, 'Unavailable'));

    try {
      await fetchData('/api/down', { retries: 0 });
      expect.fail('should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(APIError);
      expect((e as APIError).retryable).toBe(true);
    }
  });

  it('throws NetworkError when fetch itself rejects', async () => {
    mockFetch.mockRejectedValueOnce(new Error('network fail'));

    await expect(fetchData('/api/x', { retries: 0 })).rejects.toThrow(NetworkError);
  });
});

// ── APIClient convenience methods ──

describe('APIClient', () => {
  it('getServiceAccess calls correct endpoint', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ features: [] }));
    await apiClient.getServiceAccess();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const url = mockFetch.mock.calls[0]?.[0] as string;
    expect(url).toContain('/api/services/access');
  });

  it('searchPlaces URL-encodes the query', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse([{ name: 'test' }]));
    await apiClient.searchPlaces('sea point');

    const url = mockFetch.mock.calls[0]?.[0] as string;
    expect(url).toContain('q=sea%20point');
  });

  it('getSafetyPrecincts includes simplify param', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ features: [] }));
    await apiClient.getSafetyPrecincts(0.005);

    const url = mockFetch.mock.calls[0]?.[0] as string;
    expect(url).toContain('simplify=0.005');
  });
});
