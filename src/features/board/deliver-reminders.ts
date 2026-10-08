export type Delivery={id:string;lease_id:string;board_id:string;subscription_id:string;endpoint:string;p256dh:string;auth:string;locale:'id'|'en'};

export async function deliverReminders(deliveries:Delivery[],send:(delivery:Delivery,payload:string)=>Promise<unknown>,finish:(delivery:Delivery,sent:boolean,expired:boolean)=>Promise<void>) {
  let sent=0,failed=0;
  for(let start=0;start<deliveries.length;start+=5) {
    await Promise.all(deliveries.slice(start,start+5).map(async delivery=>{
      let delivered=false,expired=false;
      try {
        // Keep private notes off lock screens; open the authenticated board for details.
        await send(delivery,JSON.stringify({title:'Cashlendar',body:delivery.locale==='id' ? 'Ada pengingat keluarga yang sudah waktunya. Buka papan keluarga.' : 'A family reminder is due. Open your family board.',tag:`board-${delivery.board_id}`,url:'/board'}));
        delivered=true;sent++;
      }catch(error){expired=typeof error==='object' && error!==null && 'statusCode' in error && [404,410].includes(Number(error.statusCode));failed++;}
      try{await finish(delivery,delivered,expired);}catch{failed++;}
    }));
  }
  return {sent,failed};
}
