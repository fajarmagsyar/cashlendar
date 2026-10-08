import {test} from 'node:test';
import assert from 'node:assert/strict';
import {deliverReminders,type Delivery} from '../../src/features/board/deliver-reminders.ts';

test('push delivery limits concurrency, localizes private payloads, and distinguishes expired devices from retryable failures',async()=>{
  const deliveries:Delivery[]=Array.from({length:13},(_,index)=>({id:String(index),lease_id:'lease',board_id:`board-${index}`,subscription_id:`device-${index}`,endpoint:'https://fcm.googleapis.com/send/test',auth:'secret',p256dh:'key',locale:index%2 ? 'en' : 'id'}));
  let active=0,maximum=0;
  const results:{id:string;sent:boolean;expired:boolean}[]=[];
  const output=await deliverReminders(deliveries,async(delivery,payload)=>{
    active++;maximum=Math.max(active,maximum);
    await new Promise(resolve=>setImmediate(resolve));active--;
    const message=JSON.parse(payload);
    assert.equal(message.title,'Cashlendar');assert.equal(message.url,'/board');
    assert(message.body.includes(delivery.locale==='id' ? 'pengingat keluarga' : 'family reminder'));
    assert(!payload.includes('secret'));assert(!payload.includes('device-'));
    if(delivery.id==='0') throw {statusCode:410};
    if(delivery.id==='1') throw {statusCode:503};
    if(delivery.id==='2') throw new Error('timeout');
  },async(delivery,sent,expired)=>{
    results.push({id:delivery.id,sent,expired});
    if(delivery.id==='3') throw new Error('database unavailable');
  });
  assert.equal(maximum,5);assert.equal(results.length,13);
  assert.deepEqual(results.find(result=>result.id==='0'),{id:'0',sent:false,expired:true});
  assert.deepEqual(results.find(result=>result.id==='1'),{id:'1',sent:false,expired:false});
  assert.deepEqual(output,{sent:10,failed:4});
});
