'use client';

import Link, { useLinkStatus } from 'next/link';
import type { ComponentProps } from 'react';

function NavigationProgress() {
  const { pending } = useLinkStatus();
  return pending ? <span className="navigation-progress" role="status"><span className="sr-only">Loading…</span></span> : null;
}

export default function PendingLink({ children, ...props }: ComponentProps<typeof Link>) {
  return <Link {...props}>{children}<NavigationProgress/></Link>;
}
