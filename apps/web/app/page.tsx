const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function Page() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_50%,rgba(17,24,39,1)_0%,rgba(0,0,0,1)_100%)]"></div>
      <div className="absolute inset-0 -z-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>

      <header className="hero max-w-2xl">
        <div className="mb-10 inline-flex items-center justify-center rounded-3xl border border-white/5 bg-white/[0.03] p-6 backdrop-blur-sm">
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-emerald-500/80"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
            <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" />
          </svg>
        </div>

        <h1>SyncSphere</h1>
        <p>
          Wyrafinowany hub łączący Twoje spotkania. <br />
          Elegancja spotyka synchronizację w ułamku sekundy.
        </p>

        <div className="mt-4">
          <a href={`${API_URL}/auth/google`} className="btn-glass group">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="transition-transform group-hover:scale-110"
            >
              <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
            </svg>
            <span>Zacznij tutaj</span>
          </a>
        </div>
      </header>

      <footer className="absolute bottom-8 text-xs font-medium uppercase tracking-widest text-slate-500">
        Designed for Excellence
      </footer>
    </main>
  );
}
