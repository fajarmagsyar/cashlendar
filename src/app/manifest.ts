import type { MetadataRoute } from 'next';
export default function manifest(): MetadataRoute.Manifest {
  return { name:'Cashlendar',short_name:'Cashlendar',description:'Your household money, one day at a time.',start_url:'/',scope:'/',display:'standalone',background_color:'#f7f8f5',theme_color:'#174f3e',lang:'en',icons:[
    { src:'/icons/icon-192.png',sizes:'192x192',type:'image/png',purpose:'any' },
    { src:'/icons/icon-512.png',sizes:'512x512',type:'image/png',purpose:'any' },
    { src:'/icons/maskable-512.png',sizes:'512x512',type:'image/png',purpose:'maskable' }
  ] };
}
