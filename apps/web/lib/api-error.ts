type ApiErrorBody = {
  message?: string | string[];
};

export async function getApiErrorMessage(
  res: Response,
  fallback: string,
): Promise<string> {
  const data = (await res.json().catch(() => null)) as ApiErrorBody | null;
  if (!data?.message) return fallback;

  return Array.isArray(data.message) ? data.message.join(', ') : data.message;
}
