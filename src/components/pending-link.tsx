'use client';
import {useI18n} from '@/components/language-provider';

import Link, { useLinkStatus } from 'next/link';
import type { ComponentProps } from 'react';
import { LoadingAnimation } from './loading-animation';

export function NavigationProgress({pending}:{pending:boolean}) {
  const {t}=useI18n();
  return pending ? <span className="navigation-progress" role="status">
    <LoadingAnimation/>
    <span className="sr-only">{t("Loading")}</span>
  </span> : null;
}

function LinkProgress() {
  const { pending } = useLinkStatus();
  return <NavigationProgress pending={pending}/>;
}

export default function PendingLink({ children, ...props }: ComponentProps<typeof Link>) {
  return <Link {...props}>{children}<LinkProgress/></Link>;
}
