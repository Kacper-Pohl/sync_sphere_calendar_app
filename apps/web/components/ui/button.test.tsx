import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Button } from './button';

describe('Button', () => {
  it('renderuje element button z podanym tekstem', () => {
    render(<Button>Zapisz</Button>);

    expect(screen.getByRole('button', { name: 'Zapisz' })).toBeInTheDocument();
  });

  it('wywołuje onClick po kliknięciu', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Zapisz</Button>);

    await userEvent.click(screen.getByRole('button', { name: 'Zapisz' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('nie wywołuje onClick gdy jest disabled', async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Zapisz
      </Button>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Zapisz' }));

    expect(onClick).not.toHaveBeenCalled();
  });
});
