import { requireHousehold } from '@/lib/supabase/server';
import { InviteButton,MemberButton } from '@/features/household/family-controls';
import { Icon } from '@/components/icon';
export default async function Family() {
  const { supabase,household,membership,user } = await requireHousehold();
  const [members,profiles,invitations] = await Promise.all([
    supabase.from('household_members').select('user_id,role,joined_at').eq('household_id',household.id).order('joined_at'),
    supabase.from('profiles').select('id,display_name'),
    membership.role==='owner' ? supabase.from('invitations').select('id,email,expires_at,accepted_at,revoked_at').eq('household_id',household.id).order('created_at',{ ascending:false }) : Promise.resolve({ data:[],error:null })
  ]);
  if (members.error || profiles.error || invitations.error) throw new Error('Could not load your family. Please try again.');
  const names = new Map(profiles.data.map(p=>[p.id,p.display_name]));
  return <><div className="page-heading"><div><span className="small-label">BETTER TOGETHER</span><h1>{household.name}</h1><p>Your family’s accounts, entries, and goals in one shared place.</p></div>{membership.role==='owner' && <InviteButton/>}</div><section className="panel"><div className="section-heading"><h2>Household members</h2><span className="muted">{members.data.length} members</span></div>{members.data.map(member=><div className="member-row" key={member.user_id}><span className="avatar">{(names.get(member.user_id)||'F').slice(0,1).toUpperCase()}</span><div className="member-info"><strong>{names.get(member.user_id) || 'Family member'}{member.user_id===user.id && ' (you)'}</strong><span>{member.role==='owner' ? 'Household owner' : 'Member'} · Joined {member.joined_at.slice(0,10)}</span></div>{membership.role==='owner' && member.role!=='owner' && <MemberButton id={member.user_id} operation="remove" name={names.get(member.user_id)||'this member'}/>}</div>)}<div className="family-note"><Icon name="family"/><p>Everyone can manage shared finances. The owner manages invitations and membership.</p></div></section>
    {membership.role==='owner' && <section className="panel"><div className="section-heading"><h2>Invitations</h2><span className="muted">Valid for seven days</span></div>{invitations.data.length ? invitations.data.map(inv=>{
      const status = inv.accepted_at ? 'Accepted' : inv.revoked_at ? 'Revoked' : new Date(inv.expires_at)<new Date() ? 'Expired' : 'Pending';
      return <div className="member-row" key={inv.id}><div className="member-info"><strong>{inv.email}</strong><span>{status} · Expires {new Date(inv.expires_at).toLocaleDateString('en',{ timeZone:'Asia/Jakarta',year:'numeric',month:'short',day:'numeric' })}</span></div>{status==='Pending' && <MemberButton id={inv.id} operation="revoke" name={inv.email}/>}</div>;
    }) : <div className="empty-state"><h3>No invitations yet.</h3><p>Invite a family member to manage your money together.</p></div>}</section>}</>;
}
