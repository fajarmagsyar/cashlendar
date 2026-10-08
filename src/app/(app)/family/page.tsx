import {getTranslations} from '@/lib/i18n/server';
import Link from '@/components/pending-link';
import {Icon} from '@/components/icon';
import { requireHousehold } from '@/lib/supabase/server';
import { InviteButton,MemberButton } from '@/features/household/family-controls';
export default async function Family() {
  const {t,locale}=await getTranslations();
  const {supabase,household,membership,user}=await requireHousehold();
  const [members,profiles,invitations]=await Promise.all([
    supabase.from('household_members').select('user_id,role,joined_at').eq('household_id',household.id).order('joined_at'),
    supabase.from('profiles').select('id,display_name'),
    membership.role==='owner' ? supabase.from('invitations').select('id,email,expires_at,accepted_at,revoked_at').eq('household_id',household.id).order('created_at',{ascending:false}) : Promise.resolve({data:[],error:null})
  ]);
  if(members.error || profiles.error || invitations.error) throw new Error('Could not load your family. Please try again.');
  const names=new Map(profiles.data.map(p=>[p.id,p.display_name]));
  return <><Link className="text-button profile-back" href="/profile" aria-label={t("Back to profile")}><Icon name="left" size={18}/>{t("Profile")}</Link><div className="page-heading"><h1>{t("Family")}</h1>{membership.role==='owner' && <InviteButton/>}</div>
    <section className="panel"><div className="section-heading"><h2>{household.name}</h2><span className="muted">{members.data.length}{' '}{t("members")}</span></div>
      {members.data.map(member=><div className="member-row" key={member.user_id}><span className="avatar">{(names.get(member.user_id)||'F').slice(0,1).toUpperCase()}</span><div className="member-info"><strong>{names.get(member.user_id) || t("Family member")}{member.user_id===user.id && t(" (you)")}</strong><span>{member.role==='owner' ? t("Owner") : t("Member")}</span></div>{membership.role==='owner' && member.role!=='owner' && <MemberButton id={member.user_id} operation="remove" name={names.get(member.user_id)||'this member'}/>}</div>)}
    </section>
    {membership.role==='owner' && <section className="panel"><div className="section-heading"><h2>{t("Invitations")}</h2></div>{invitations.data.length ? invitations.data.map(inv=>{
      const status=inv.accepted_at ? 'Accepted' : inv.revoked_at ? 'Revoked' : new Date(inv.expires_at)<new Date() ? 'Expired' : 'Pending';
      return <div className="member-row" key={inv.id}><div className="member-info"><strong>{inv.email}</strong><span>{t(status)}{' '}{t("· Expires")}{' '}{new Date(inv.expires_at).toLocaleDateString(locale,{timeZone:'Asia/Jakarta',year:'numeric',month:'short',day:'numeric'})}</span></div>{status==='Pending' && <MemberButton id={inv.id} operation="revoke" name={inv.email}/>}</div>;
    }) : <div className="empty-state"><h3>{t("No invitations yet")}</h3></div>}</section>}
  </>;
}
