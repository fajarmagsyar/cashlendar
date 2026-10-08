'use client';
import {useI18n} from '@/components/language-provider';

import {useState} from 'react';
import {Dialog} from '@/components/dialog';
import {ActionForm,Field} from '@/components/action-form';
import {saveProfile} from './actions';
export function EditProfileButton({name}:{name:string}) {
  const {t}=useI18n();
  const [open,setOpen]=useState(false);
  return <><button type="button" className="button" onClick={()=>setOpen(true)}>{t("Edit profile")}</button>{open && <Dialog title={t("Edit profile")} onClose={()=>setOpen(false)}><ActionForm action={saveProfile} submit={t("Save profile")} onSuccess={()=>setOpen(false)}><Field label={t("Display name")}><input name="display_name" defaultValue={name} autoComplete="name" required maxLength={100} data-autofocus/></Field></ActionForm></Dialog>}</>;
}
