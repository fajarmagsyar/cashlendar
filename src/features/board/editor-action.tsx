'use client';
import type {ButtonHTMLAttributes} from 'react';
import {Icon,type IconName} from '@/components/icon';
import {useI18n} from '@/components/language-provider';

export function EditorAction({label,icon,className='',children,...props}:ButtonHTMLAttributes<HTMLButtonElement> & {label:string;icon:IconName}) {
  const {t}=useI18n();
  return <button type="button" {...props} className={`editor-action ${className}`} aria-label={t(label)} title={t(label)}>{children || <Icon name={icon}/>}</button>;
}
