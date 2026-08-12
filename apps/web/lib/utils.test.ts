import { describe, expect, it } from 'vitest';

import { cn } from './utils';

describe('cn', () => {
  it('łączy klasy w jeden string', () => {
    expect(cn('flex', 'items-center')).toBe('flex items-center');
  });

  it('pomija wartości falsy', () => {
    expect(cn('flex', false, undefined, null, 'gap-2')).toBe('flex gap-2');
  });

  it('rozstrzyga konflikt klas Tailwind na rzecz ostatniej', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });
});
