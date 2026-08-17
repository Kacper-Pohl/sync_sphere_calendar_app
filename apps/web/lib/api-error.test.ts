import { describe, expect, it } from 'vitest';

import { getApiErrorMessage } from './api-error';

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('getApiErrorMessage', () => {
  it('zwraca message gdy jest stringiem', async () => {
    const res = jsonResponse({ message: 'Brak dostępu' });

    await expect(getApiErrorMessage(res, 'fallback')).resolves.toBe('Brak dostępu');
  });

  it('skleja tablicę message przecinkiem', async () => {
    const res = jsonResponse({ message: ['title jest wymagany', 'startAt jest wymagany'] });

    await expect(getApiErrorMessage(res, 'fallback')).resolves.toBe(
      'title jest wymagany, startAt jest wymagany',
    );
  });

  it('zwraca fallback gdy body nie jest poprawnym JSON-em', async () => {
    const res = new Response('<html>502 Bad Gateway</html>');

    await expect(getApiErrorMessage(res, 'Coś poszło nie tak')).resolves.toBe('Coś poszło nie tak');
  });

  it('zwraca fallback gdy JSON nie zawiera message', async () => {
    const res = jsonResponse({ statusCode: 500 });

    await expect(getApiErrorMessage(res, 'Coś poszło nie tak')).resolves.toBe('Coś poszło nie tak');
  });
});
