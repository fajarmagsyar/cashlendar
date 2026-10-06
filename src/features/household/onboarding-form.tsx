'use client';
import { ActionForm, Field } from '@/components/action-form';
import { createHousehold, acceptInvitation } from './actions';
export function OnboardingForm({ token }: { token?:string }) {
  return token ? <ActionForm action={()=>acceptInvitation(token)} submit="Join household"><p>Accept this invitation using the Google account with the email your household owner invited.</p></ActionForm> : <ActionForm action={createHousehold} submit="Create household"><Field label="Household name"><input name="name" required maxLength={80} placeholder="e.g. The Pratama family" autoComplete="organization"/></Field><p className="muted">You’ll be the owner. Next, add your first account and invite your family.</p></ActionForm>;
}
