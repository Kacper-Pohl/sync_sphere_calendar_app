import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function NotFound() {
  return (
    <div className="flex h-screen flex-col items-center justify-center text-white">
      <h2>Nie znaleziono strony</h2>
      <Link href="/" className="mt-4 text-blue-500 hover:underline">
        Wróć do strony głównej
      </Link>
    </div>
  );
}
