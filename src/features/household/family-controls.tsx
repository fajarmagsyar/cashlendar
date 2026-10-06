'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog } from '@/components/dialog';
import { ActionForm,Field } from '@/components/action-form';
import { inviteMember,manageMember } from './actions';
import { Icon } from '@/components/icon';
export function InviteButton() {
  const [open,setOpen] = useState(false),[link,setLink] = useState(''),[message,setMessage] = useState('');
  return <><button className="button primary" onClick={()=>{setLink('');setMessage('');setOpen(true);}}><Icon name="plus" size={18}/>Invite family</button>{open && <Dialog title="A shared place for your family" onClose={()=>setOpen(false)}>{link ? <div className="form"><p>Share this link with the invited person. They must sign in using the email you entered. The link expires in seven days.</p><Field label="Invitation link"><input readOnly value={link} onFocus={e=>e.target.select()}/></Field><button className="button primary" onClick={async()=>{try { await navigator.clipboard.writeText(link);setMessage('Link copied.'); } catch { setMessage('Select the link above and copy it.'); }}}>Copy invitation link</button><p role="status">{message}</p></div> : <ActionForm action={async(input)=>{const result=await inviteMember(input);if(result.ok && result.data) setLink(new URL(result.data.path,window.location.origin).toString());return result;}} submit="Create invitation"><Field label="Family member’s Google email"><input name="email" type="email" required maxLength={254} autoComplete="email" placeholder="name@gmail.com"/></Field><p className="muted">Invitations are shared by link. Cashlendar does not send emails.</p></ActionForm>}</Dialog>}</>;
}
export function MemberButton({ id,operation,name }: { id:string; operation:'remove'|'revoke'; name:string }) {
  const [open,setOpen] = useState(false);
  const router = useRouter();
  return <><button className="text-button danger" onClick={()=>setOpen(true)}>{operation==='remove' ? 'Remove' : 'Revoke'}</button>{open && <Dialog title={operation==='remove' ? `Remove ${name}?` : 'Revoke this invitation?'} onClose={()=>setOpen(false)}><ActionForm action={()=>manageMember({id,operation})} submit={operation==='remove' ? 'Remove member' : 'Revoke invitation'} onSuccess={()=>{setOpen(false);router.refresh();}}><p>{operation==='remove' ? 'They will lose access to this household. Their historical entries will remain.' : 'This invitation link will stop working.'}</p></ActionForm></Dialog>}</>;
}
