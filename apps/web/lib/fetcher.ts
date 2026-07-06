type FetchError = Error & {
  info?: unknown;
  status?: number;
};

export const fetcher = async (url: string) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('jwt_token') : null;

  const res = await fetch(url, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    const error: FetchError = new Error('An error occurred while fetching the data.');
    error.info = await res.json();
    error.status = res.status;
    throw error;
  }

  return res.json();
};
