import Link from '@/components/pending-link';
import {Icon} from '@/components/icon';
import {requireHousehold} from '@/lib/supabase/server';
import {getProfile} from '@/features/profile/queries';
import {EditProfileButton} from '@/features/profile/profile-controls';
import {switchGoogleAccount} from '@/features/profile/actions';
import {signOut} from '@/features/household/actions';
export default async function Profile() {
  const [profile,{household,membership}]=await Promise.all([getProfile(),requireHousehold()]);
  return <><div className="page-heading"><h1>Profile</h1></div>
    <div className="profile-layout">
      <section className="panel profile-identity"><span className="avatar profile-avatar" aria-hidden="true">{profile.display_name.slice(0,1).toUpperCase()}</span><div className="profile-details"><h2>{profile.display_name}</h2><p>{profile.email}</p></div><EditProfileButton name={profile.display_name}/></section>
      <section className="panel profile-menu" aria-label="Profile shortcuts">
        <Link href="/family" className="profile-menu-row"><Icon name="family"/><span><strong>Family</strong><small>{household.name} · {membership.role==='owner' ? 'Owner' : 'Member'}</small></span><Icon name="right" size={18}/></Link>
        <Link href="/settings" className="profile-menu-row"><Icon name="settings"/><span><strong>Settings</strong></span><Icon name="right" size={18}/></Link>
      </section>
      <section className="panel profile-account"><h2>Google account</h2><p className="profile-credential-note">Manage your password and sign-in details with Google.</p>
        <a className="profile-menu-row" href="https://myaccount.google.com/" target="_blank" rel="noopener noreferrer"><Icon name="profile"/><span><strong>Manage Google account</strong></span><Icon name="arrow" size={18}/></a>
        <form action={switchGoogleAccount}><button className="profile-menu-row" type="submit"><Icon name="arrow"/><span><strong>Switch Google account</strong></span><Icon name="right" size={18}/></button></form>
        <form action={signOut}><button className="profile-menu-row danger" type="submit"><Icon name="logout"/><span><strong>Sign out</strong></span></button></form>
      </section>
    </div>
  </>;
}
