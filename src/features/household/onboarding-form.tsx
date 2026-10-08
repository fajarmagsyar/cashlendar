'use client';
import {useI18n} from '@/components/language-provider';

import { ActionForm, Field } from '@/components/action-form';
import { createHousehold, acceptInvitation } from './actions';
export function OnboardingForm({ token }: { token?:string }) {
  const {t}=useI18n();
  return token ? <ActionForm action={()=>acceptInvitation(token)} submit={t("Join household")}><p>{t("Accept this invitation using the Google account with the email your household owner invited.")}</p></ActionForm> : <ActionForm action={createHousehold} submit={t("Create household")}><Field label={t("Household name")}><input name="name" required maxLength={80} placeholder={t("e.g. The Pratama family")} autoComplete="organization"/></Field><p className="muted">{t("You’ll be the owner. Next, add your first account and invite your family.")}</p></ActionForm>;
}
