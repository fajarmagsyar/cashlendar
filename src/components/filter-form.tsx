'use client';

import { useTransition, type FormEvent, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';

export function FilterForm({ action, children, clear }: { action:string; children:ReactNode; clear?:ReactNode }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const params = new URLSearchParams();
    new FormData(event.currentTarget).forEach((value, key) => params.append(key, String(value)));
    startTransition(() => router.push(`${action}?${params}`, { scroll:false }));
  }

  return <form action={action} onSubmit={submit} className="filter-form" aria-busy={pending}>
    {children}
    <button className="button small" disabled={pending}>{pending ? 'Applying…' : 'Apply'}</button>
    {clear}
  </form>;
}
