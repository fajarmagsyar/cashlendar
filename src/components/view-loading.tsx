import { Icon } from './icon';

export function ViewLoading({ initial = false }: { initial?:boolean }) {
  return <section className="view-loading" role="status" aria-live="polite" aria-busy="true">
    <div className="view-loading-heading">
      <span className="view-loading-icon" aria-hidden="true"><Icon name="calendar" size={24}/></span>
      <div><h2>{initial ? 'Opening your household' : 'Loading your view'}</h2><p>Your latest balances and activity are on their way.</p></div>
    </div>
    <div className="loading-skeleton" aria-hidden="true">
      <div className="loading-skeleton-top"><span/><span/></div>
      {[0,1,2].map(row=><div className="loading-skeleton-row" key={row}>
        <span className="loading-skeleton-symbol"/>
        <div className="loading-skeleton-copy"><span/><span/></div>
        <span className="loading-skeleton-amount"/>
      </div>)}
    </div>
  </section>;
}
