import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fetcher } from './fetcher';

const URL = 'http://api.test/calendar/events';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function headersOfLastCall(mock: ReturnType<typeof vi.fn>): Record<string, string> {
  return mock.mock.calls[0][1].headers as Record<string, string>;
}

describe('fetcher', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns the parsed body on a successful response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ events: [] })));

    await expect(fetcher(URL)).resolves.toEqual({ events: [] });
  });

  it('attaches the bearer token stored in localStorage', async () => {
    localStorage.setItem('jwt_token', 'token-123');
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}));
    vi.stubGlobal('fetch', fetchMock);

    await fetcher(URL);

    expect(headersOfLastCall(fetchMock).Authorization).toBe('Bearer token-123');
  });

  it('sends no Authorization header when no token is stored', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}));
    vi.stubGlobal('fetch', fetchMock);

    await fetcher(URL);

    expect(headersOfLastCall(fetchMock)).not.toHaveProperty('Authorization');
  });

  it('throws an error carrying the status and the parsed body', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse({ message: 'Brak dostępu' }, 403)),
    );

    await expect(fetcher(URL)).rejects.toMatchObject({
      status: 403,
      info: { message: 'Brak dostępu' },
    });
  });
});
