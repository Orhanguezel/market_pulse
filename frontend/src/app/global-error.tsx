'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="de">
      <body>
        <main
          style={{
            minHeight: '100vh',
            display: 'grid',
            placeItems: 'center',
            padding: '2rem',
            fontFamily: 'system-ui, sans-serif',
            background: '#faf7f2',
            color: '#1f1a17',
          }}
        >
          <div style={{ maxWidth: 640, textAlign: 'center' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>
              Es ist ein unerwarteter Fehler aufgetreten.
            </h1>
            <p style={{ marginBottom: '1.5rem', lineHeight: 1.6 }}>
              Bitte laden Sie die Seite erneut. Wenn das Problem bestehen bleibt,
              versuchen Sie es spaeter noch einmal.
            </p>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                padding: '0.875rem 1.25rem',
                borderRadius: 9999,
                border: 'none',
                background: '#6b4a3f',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              Seite neu laden
            </button>
            {process.env.NODE_ENV === 'development' ? (
              <pre
                style={{
                  marginTop: '1.5rem',
                  padding: '1rem',
                  overflowX: 'auto',
                  textAlign: 'left',
                  background: '#1f1a17',
                  color: '#fff',
                  borderRadius: 12,
                }}
              >
                {error.message}
                {error.digest ? `\nDigest: ${error.digest}` : ''}
              </pre>
            ) : null}
          </div>
        </main>
      </body>
    </html>
  );
}
