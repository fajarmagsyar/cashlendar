'use client';

import Link, { useLinkStatus } from 'next/link';
import type { ComponentProps } from 'react';

export function NavigationProgress({pending}:{pending:boolean}) {
  return pending ? <span className="navigation-progress" role="status">
    <span className="navigation-progress-rail" aria-hidden="true"><span className="navigation-progress-bar"/></span>
    <span className="navigation-progress-label"><span className="loading-spinner" aria-hidden="true"/>Loading your view…</span>
  </span> : null;
}

function LinkProgress() {
  const { pending } = useLinkStatus();
  return <NavigationProgress pending={pending}/>;
}

export default function PendingLink({ children, ...props }: ComponentProps<typeof Link>) {
  return <Link {...props}>{children}<LinkProgress/></Link>;
}
