import { describe, expect, it } from 'vitest';

import { getApiErrorMessage } from './api-error';

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('getApiErrorMessage', () => {
  it('returns the message when it is a string', async () => {
    const res = jsonResponse({ message: 'Brak dostępu' });

    await expect(getApiErrorMessage(res, 'fallback')).resolves.toBe('Brak dostępu');
  });

  it('joins an array of messages with commas', async () => {
    const res = jsonResponse({ message: ['title jest wymagany', 'startAt jest wymagany'] });

    await expect(getApiErrorMessage(res, 'fallback')).resolves.toBe(
      'title jest wymagany, startAt jest wymagany',
    );
  });

  it('falls back when the body is not valid JSON', async () => {
    const res = new Response('<html>502 Bad Gateway</html>');

    await expect(getApiErrorMessage(res, 'Coś poszło nie tak')).resolves.toBe('Coś poszło nie tak');
  });

  it('falls back when the JSON carries no message', async () => {
    const res = jsonResponse({ statusCode: 500 });

    await expect(getApiErrorMessage(res, 'Coś poszło nie tak')).resolves.toBe('Coś poszło nie tak');
  });
});
