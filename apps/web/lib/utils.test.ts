import { describe, expect, it } from 'vitest';

import { cn } from './utils';

describe('cn', () => {
  it('joins class names into a single string', () => {
    expect(cn('flex', 'items-center')).toBe('flex items-center');
  });

  it('skips falsy values', () => {
    expect(cn('flex', false, undefined, null, 'gap-2')).toBe('flex gap-2');
  });

  it('resolves conflicting Tailwind classes in favour of the last one', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });
});
