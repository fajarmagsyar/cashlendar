'use client';
export default function ErrorPage({ reset }: { reset:()=>void }) {
  return <main id="main" className="loading-page"><h1>We couldn’t load this page.</h1><p>Please check your connection and try again. If this persists, check your Supabase setup.</p><button className="button primary" onClick={reset}>Try again</button></main>;
}
