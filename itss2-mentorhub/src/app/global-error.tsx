'use client';

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <html>
      <body>
        <div style={{ padding: 24, fontFamily: 'system-ui' }}>
          <h2>Lỗi hệ thống</h2>
          <p>{error.message}</p>
          <button onClick={reset} style={{ marginTop: 12 }}>
            Tải lại
          </button>
        </div>
      </body>
    </html>
  );
}
