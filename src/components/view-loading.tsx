import { LoadingAnimation } from './loading-animation';

export function ViewLoading() {
  return <section className="view-loading" role="status" aria-live="polite" aria-busy="true">
    <LoadingAnimation/>
    <span className="sr-only">Loading</span>
  </section>;
}
