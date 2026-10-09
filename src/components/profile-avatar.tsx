'use client';
import Image from 'next/image';
import {useState} from 'react';

export function ProfileAvatar({name,photoUrl,className=''}:{name:string;photoUrl?:string;className?:string}) {
  const [failedUrl,setFailedUrl]=useState('');
  return <span className={`avatar ${className}`} aria-hidden="true">{name.slice(0,1).toUpperCase()}
    {photoUrl && photoUrl!==failedUrl && <Image src={photoUrl} alt="" width={40} height={40} unoptimized draggable={false} className="avatar-photo" onError={()=>setFailedUrl(photoUrl)}/>}
  </span>;
}
