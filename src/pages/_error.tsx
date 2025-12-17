import { NextPageContext } from 'next';
import { useEffect } from 'react';
import { useRouter } from 'next/router';

interface ErrorProps {
  statusCode?: number;
  hasGetInitialPropsRun?: boolean;
  err?: Error;
}

function Error({ statusCode, hasGetInitialPropsRun, err }: ErrorProps) {
  const router = useRouter();

  useEffect(() => {
    // Log error for debugging
    if (err) {
      console.error('Error page error:', err);
    }
  }, [err]);

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>
        {statusCode
          ? `An error ${statusCode} occurred on server`
          : 'An error occurred on client'}
      </h1>
      <p>
        {err?.message || 'Something went wrong. Please try refreshing the page.'}
      </p>
      <button onClick={() => router.push('/dashboard')} style={{ marginTop: '20px', padding: '10px 20px' }}>
        Go to Dashboard
      </button>
    </div>
  );
}

Error.getInitialProps = ({ res, err, asPath }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  
  return {
    statusCode,
    hasGetInitialPropsRun: true,
    err: err ? err : undefined,
  };
};

export default Error;




