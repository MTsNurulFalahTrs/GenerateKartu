'use client';

export default function RouteError({ reset }: { reset: () => void }) {
  return <main className="content"><h1>Editor gagal dimuat</h1><button className="action" onClick={reset}>Coba lagi</button></main>;
}
