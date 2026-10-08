import {timingSafeEqual} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
import webpush from 'web-push';
import {deliverReminders,type Delivery} from '@/features/board/deliver-reminders';
export const runtime='nodejs';
export const maxDuration=60;

export async function GET(request:Request) {
  const secret=process.env.CRON_SECRET;
  const authorization=request.headers.get('authorization') || '';
  const expected=`Bearer ${secret}`;
  if(!secret || Buffer.byteLength(authorization)!==Buffer.byteLength(expected) || !timingSafeEqual(Buffer.from(authorization),Buffer.from(expected))) return Response.json({error:'Unauthorized'},{status:401});
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  const publicKey=process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,privateKey=process.env.VAPID_PRIVATE_KEY,subject=process.env.VAPID_SUBJECT;
  if(!url || !key || !publicKey || !privateKey || !subject) return Response.json({error:'Notifications are not configured'},{status:503});
  const supabase=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data,error}=await supabase.rpc('claim_board_notifications');
  if(error) return Response.json({error:'Could not claim reminders'},{status:503});
  const deliveries=(data || []) as Delivery[];
  const {sent,failed}=await deliverReminders(deliveries,(delivery,payload)=>webpush.sendNotification({endpoint:delivery.endpoint,keys:{p256dh:delivery.p256dh,auth:delivery.auth}},payload,{TTL:3600,timeout:8000,vapidDetails:{subject,publicKey,privateKey}}),async(delivery,delivered,expired)=>{
    const result=await supabase.rpc('finish_board_notification',{p_id:delivery.id,p_lease_id:delivery.lease_id,p_sent:delivered,p_expired:expired});
    if(result.error) throw new Error('Could not record delivery');
  });
  return Response.json({sent,failed},{status:failed ? 503 : 200,headers:{'Cache-Control':'no-store'}});
}
