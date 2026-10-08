import { createServer } from 'node:http';
import { createHmac,timingSafeEqual,generateKeyPairSync,sign,verify } from 'node:crypto';
import { readFile,readdir } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

// Test-only PostgREST transport; financial queries still execute the app's SQL and RLS.
const db = new PGlite();
let lastLogoutScope:string|null=null;
let requestCounts:Record<string,number>={};
let requestDelay=0;
const owner = '10000000-0000-4000-8000-000000000001';
const member = '10000000-0000-4000-8000-000000000002';
const secret = 'cashlendar-local-browser-test-secret';
const signingKeys=generateKeyPairSync('ec',{namedCurve:'prime256v1'});
const publicJwk={...signingKeys.publicKey.export({format:'jwk'}),kid:'fixture-ec',alg:'ES256',use:'sig'};
const users: Record<string,{id:string;email:string;user_metadata:{full_name:string};aud:string;created_at:string}> = {
  [owner]:{id:owner,email:'owner@example.com',user_metadata:{full_name:'Test Owner'},aud:'authenticated',created_at:'2026-01-01T00:00:00Z'},
  [member]:{id:member,email:'member@example.com',user_metadata:{full_name:'Test Member'},aud:'authenticated',created_at:'2026-01-01T00:00:00Z'}
};
await db.exec(`create role authenticated;create role anon;create schema auth;
create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb default '{}');
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
grant usage on schema auth,public to authenticated;grant execute on function auth.uid() to authenticated;`);
for(const file of (await readdir('supabase/migrations')).filter(f=>f.endsWith('.sql')).sort()) await db.exec(await readFile(`supabase/migrations/${file}`,'utf8'));
for(const user of Object.values(users)) await db.query(`insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values($1,$2,now(),$3)`,[user.id,user.email,JSON.stringify(user.user_metadata)]);
await db.exec(`set request.jwt.claim.sub='${owner}';`);
const household = (await db.query<{id:string}>(`select create_household('Browser Test Family') as id`)).rows[0].id;
await db.query(`insert into household_members(household_id,user_id,role) values($1,$2,'member')`,[household,member]);
const cash = (await db.query<{id:string}>(`insert into accounts(household_id,name,type,opening_balance) values($1,'Daily cash','cash',5000000) returning id`,[household])).rows[0].id;
const savings = (await db.query<{id:string}>(`insert into accounts(household_id,name,type,opening_balance) values($1,'Emergency savings','savings',1000000) returning id`,[household])).rows[0].id;
const category = (await db.query<{id:string}>(`select id from categories where kind='expense' order by name limit 1`)).rows[0].id;
await db.query(`insert into transactions(household_id,account_id,category_id,kind,amount,date,note)
select $1,$2,$3,'expense',1000,'2026-01-05','Fixture expense '||g from generate_series(1,55) g`,[household,cash,category]);
await db.query(`insert into savings_goals(household_id,account_id,name,target_amount) values($1,$2,'Emergency fund',2000000)`,[household,savings]);

const encode = (value:unknown)=>Buffer.from(JSON.stringify(value)).toString('base64url');
function token(id:string,asymmetric=false){
  const unsigned=`${encode(asymmetric ? {alg:'ES256',typ:'JWT',kid:'fixture-ec'} : {alg:'HS256',typ:'JWT'})}.${encode({sub:id,email:users[id].email,role:'authenticated',aud:'authenticated',exp:Math.floor(Date.now()/1000)+86400,iat:Math.floor(Date.now()/1000),iss:'http://127.0.0.1:54329/auth/v1'})}`;
  const signature=asymmetric ? sign('sha256',Buffer.from(unsigned),{key:signingKeys.privateKey,dsaEncoding:'ieee-p1363'}) : createHmac('sha256',secret).update(unsigned).digest();
  return `${unsigned}.${signature.toString('base64url')}`;
}
function identity(value:string|undefined){
  try {
    const [h,p,s]=(value?.replace(/^Bearer /,'') || '').split('.');
    const header=JSON.parse(Buffer.from(h,'base64url').toString());
    const actual=Buffer.from(s,'base64url');
    if(header.alg==='ES256') {
      if(!verify('sha256',Buffer.from(`${h}.${p}`),{key:signingKeys.publicKey,dsaEncoding:'ieee-p1363'},actual)) return null;
    } else {
      if(header.alg!=='HS256') return null;
      const signature=createHmac('sha256',secret).update(`${h}.${p}`).digest();
      if(actual.length!==signature.length || !timingSafeEqual(actual,signature)) return null;
    }
    const payload=JSON.parse(Buffer.from(p,'base64url').toString());
    return payload.exp>Math.floor(Date.now()/1000) ? users[payload.sub] || null : null;
  } catch {return null;}
}
const tables=new Set(['profiles','households','household_members','invitations','accounts','categories','transactions','transfers','savings_goals','planned_expenses','board_items','push_subscriptions']);
const rpcs=new Set(['create_household','create_invitation','accept_invitation','remove_member','revoke_invitation','account_balances','list_entries','finance_summary','list_planned_expenses','pay_planned_expense','export_finances','set_board_task','set_board_reminder','subscribe_board_push']);
const identifier=(value:string)=>{if(!/^[a-z_][a-z0-9_]*$/.test(value)) throw new Error('Invalid fixture identifier');return `"${value}"`;};
createServer(async(req,res)=>{
  const url=new URL(req.url || '/','http://127.0.0.1:54329');
  const send=(status:number,value:unknown)=>{res.writeHead(status,{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'});res.end(JSON.stringify(value,(key,v)=>['date','target_date'].includes(key) && typeof v==='string' ? v.slice(0,10) : typeof v==='bigint' ? String(v) : v));};
  if(url.pathname==='/health'){send(200,{ready:true});return;}
  if(url.pathname==='/auth/v1/.well-known/jwks.json'){send(200,{keys:[publicJwk]});return;}
  if(url.pathname==='/test/request-counts'){send(200,requestCounts);return;}
  if(url.pathname==='/test/delay' && req.method==='POST'){
    requestDelay=Math.min(1500,Math.max(0,Number(url.searchParams.get('ms')) || 0));
    send(200,{delay:requestDelay});return;
  }
  if(url.pathname==='/test/last-logout'){send(200,{scope:lastLogoutScope});return;}
  if(url.pathname==='/test/reset' && req.method==='POST'){
    lastLogoutScope=null;
    requestCounts={};
    requestDelay=0;
    await db.exec(`update profiles set display_name='Test Owner' where id='${owner}';update profiles set display_name='Test Member' where id='${member}';delete from board_items;delete from push_subscriptions;delete from planned_expenses;delete from transfers;delete from transactions where note not like 'Fixture expense %';delete from savings_goals where name<>'Emergency fund';delete from accounts where id not in ('${cash}','${savings}');delete from categories where name like 'Browser category%';`);
    send(200,{reset:true});return;
  }
  if(url.pathname==='/test/session'){
    const id=url.searchParams.get('member')==='1' ? member : owner;
    const session={access_token:token(id,url.searchParams.get('asymmetric')==='1'),refresh_token:'test-refresh',expires_at:Math.floor(Date.now()/1000)+86400,expires_in:86400,token_type:'bearer',user:users[id]};
    send(200,{cookieName:'sb-127-auth-token',cookieValue:`base64-${encode(session)}`});return;
  }
  const user=identity(req.headers.authorization);
  if(!user){send(401,{message:'Not authenticated',code:'401'});return;}
  if(requestDelay) await new Promise(resolve=>setTimeout(resolve,requestDelay));
  requestCounts[url.pathname]=(requestCounts[url.pathname] || 0)+1;
  if(url.pathname==='/auth/v1/user'){send(200,user);return;}
  if(url.pathname==='/auth/v1/logout'){lastLogoutScope=url.searchParams.get('scope') || 'global';send(200,{});return;}
  try {
    let body='';for await(const chunk of req) body+=chunk;
    const input=body ? JSON.parse(body) : {};
    const output=await db.transaction(async tx=>{
      await tx.query(`select set_config('request.jwt.claim.sub',$1,true)`,[user.id]);await tx.exec('set local role authenticated');
      if(url.pathname.startsWith('/rest/v1/rpc/')){
        const fn=url.pathname.split('/').at(-1)!;if(!rpcs.has(fn)) throw new Error('Unknown fixture RPC');
        const entries=Object.entries(input);
        const args=entries.map(([key],i)=>`${identifier(key)} => $${i+1}`).join(',');
        const rows=(await tx.query<Record<string,unknown>>(`select * from public.${identifier(fn)}(${args})`,entries.map(([,v])=>typeof v==='object' && v!==null ? JSON.stringify(v) : v))).rows;
        return ['list_entries','account_balances'].includes(fn) ? rows : rows[0]?.[fn] ?? null;
      }
      const table=url.pathname.split('/').at(-1)!;if(!tables.has(table)) throw new Error('Unknown fixture table');
      const values:unknown[]=[];const conditions:string[]=[];
      for(const [key,value] of url.searchParams){if(['select','order','limit','offset'].includes(key)) continue;const match=value.match(/^eq\.(.*)$/);if(match){values.push(match[1]);conditions.push(`${identifier(key)}=$${values.length}`);} }
      const where=conditions.length ? ` where ${conditions.join(' and ')}` : '';
      const cols=url.searchParams.get('select') || '*';
      const select=table==='household_members' && cols==='*,household:households(id,name,owner_id)'
        ? 'household_members.*, (select row_to_json(h) from (select id,name,owner_id from public.households where id=household_members.household_id) h) as household'
        : cols==='*' ? '*' : cols.split(',').map(identifier).join(',');
      if(req.method==='GET'){
        const orders=(url.searchParams.get('order') || '').split(',').filter(Boolean).map(part=>{const [col,direction]=part.split('.');return `${identifier(col)} ${direction==='desc' ? 'desc' : 'asc'}`;});
        return (await tx.query(`select ${select} from public.${identifier(table)}${where}${orders.length ? ` order by ${orders.join(',')}` : ''}`,values)).rows;
      }
      if(req.method==='POST'){
        const entries=Object.entries(Array.isArray(input) ? input[0] : input);
        return (await tx.query(`insert into public.${identifier(table)}(${entries.map(([k])=>identifier(k)).join(',')}) values(${entries.map((_,i)=>`$${i+1}`).join(',')}) returning ${select}`,entries.map(([,v])=>typeof v==='object' && v!==null ? JSON.stringify(v) : v))).rows;
      }
      if(req.method==='PATCH'){
        const entries=Object.entries(input);const offset=values.length;
        return (await tx.query(`update public.${identifier(table)} set ${entries.map(([k],i)=>`${identifier(k)}=$${offset+i+1}`).join(',')}${where} returning ${select}`,[...values,...entries.map(([,v])=>typeof v==='object' && v!==null ? JSON.stringify(v) : v)])).rows;
      }
      if(req.method==='DELETE') return (await tx.query(`delete from public.${identifier(table)}${where} returning ${select}`,values)).rows;
      throw new Error('Unsupported fixture request');
    });
    if(req.headers.accept?.includes('application/vnd.pgrst.object+json')){
      if(!Array.isArray(output) || output.length!==1){send(406,{code:'PGRST116',message:'Expected one record',details:'0 rows'});return;}
      send(200,output[0]);
    }else send(200,output);
  }catch(error){send(400,{message:error instanceof Error ? error.message : String(error),code:'TEST_DATABASE_ERROR'});}
}).listen(54329,'127.0.0.1',()=>console.log('Local test database transport ready at 127.0.0.1:54329'));
