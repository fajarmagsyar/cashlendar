'use client';
import {useEffect,useOptimistic,useState,useTransition} from 'react';
import {useRouter} from 'next/navigation';
import Link from '@/components/pending-link';
import {Icon} from '@/components/icon';
import {Dialog} from '@/components/dialog';
import {ActionForm} from '@/components/action-form';
import {useI18n} from '@/components/language-provider';
import {useSaveFeedback} from '@/components/save-feedback';
import {deleteBoardItem,setBoardState,setBoardDocumentTask} from './actions';
import {PhoneNotifications} from './phone-notifications';
import type {BoardItem} from './types';
import {itemDocument} from './document';
import {Sheet,Drawing} from './page-blocks';

export function FamilyBoard({items,authors,pushReady}:{items:BoardItem[];authors:Record<string,string>;pushReady:boolean}) {
  const {t}=useI18n(),router=useRouter();
  const [search,setSearch]=useState('');
  const [refreshing,startRefresh]=useTransition();
  useEffect(()=>{
    const refresh=()=>{if(document.visibilityState==='visible' && navigator.onLine) startRefresh(()=>router.refresh());};
    const timer=setInterval(refresh,30000);
    return ()=>clearInterval(timer);
  },[router]);
  const visible=items.filter(item=>!search || `${item.title} ${itemDocument(item).blocks.map(block=>block.type==='text' ? block.text : block.type==='checklist' ? block.tasks.map(task=>task.text).join(' ') : block.type==='table' ? block.cells.flat().join(' ') : '').join(' ')}`.toLocaleLowerCase().includes(search.toLocaleLowerCase()));
  return <>
    <Link href="/more" className="board-back"><Icon name="left"/>{t('More')}</Link>
    <div className="page-heading"><h1>{t('Fridge Notes')}</h1><div className="board-heading-actions"><button className="button secondary board-icon-action" title={t('Refresh board')} aria-label={t('Refresh board')} aria-busy={refreshing} disabled={refreshing} onClick={()=>startRefresh(()=>router.refresh())}><Icon name="reload"/></button><Link className="button primary board-icon-action" href="/board/new" title={t('New page')} aria-label={t('New page')}><Icon name="plus"/></Link></div></div>
    <PhoneNotifications configured={pushReady}/>
    {items.length>0 && <div className="board-toolbar"><label className="board-search"><span className="sr-only">{t('Search pages')}</span><input type="search" value={search} onChange={event=>setSearch(event.target.value)} placeholder={t('Search pages')}/></label></div>}
    {visible.length ? <section className="board-grid" aria-label={t('Shared board items')}>{visible.map(item=><BoardCard key={item.id} item={item} author={authors[item.updated_by] || t('Former member')}/>)}</section>
      : <section className="fridge-empty"><Icon name="board" size={28}/><p>{t(items.length ? 'No matching notes.' : 'No notes yet. Tap + to add one.')}</p></section>}
  </>;
}

function BoardCard({item,author}:{item:BoardItem;author:string}) {
  const {t,locale}=useI18n();
  const [optimistic,updateOptimistic]=useOptimistic(item,(current,change:{done:boolean;taskId?:string;blockId?:string})=>change.taskId
    ? {...current,document:{...itemDocument(current),blocks:itemDocument(current).blocks.map(block=>block.id===change.blockId && block.type==='checklist' ? {...block,tasks:block.tasks.map(task=>task.id===change.taskId ? {...task,done:change.done} : task)} : block)}}
    : {...current,completed_at:change.done ? new Date().toISOString() : null});
  const [pending,startTransition]=useTransition(),[error,setError]=useState('');
  const [now,setNow]=useState(()=>Date.now());
  const [deleting,setDeleting]=useState(false),[deletePending,setDeletePending]=useState(false);
  const saved=useSaveFeedback();
  useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),60000);return ()=>clearInterval(timer);},[]);
  function toggle(done:boolean,taskId?:string,blockId?:string) {
    setError('');
    startTransition(async()=>{
      updateOptimistic({done,taskId,blockId});
      try {const result=await (taskId && blockId ? setBoardDocumentTask(item.id,blockId,taskId,done) : setBoardState(item.id,done));if(!result.ok) setError(result.error);}
      catch{setError('Could not save. Please try again.');}
    });
  }
  const overdue=optimistic.due_at && !optimistic.completed_at && new Date(optimistic.due_at).getTime()<now;
  const doc=itemDocument(optimistic);
  const tasks=doc.blocks.flatMap(block=>block.type==='checklist' ? block.tasks : []);
  return <article className="board-card board-page" aria-label={item.title} aria-busy={pending}>
    <div className="board-card-top"><span><Icon name="board"/>{t('Shared page')}</span>{overdue && <strong className="board-overdue">{t('Overdue')}</strong>}{optimistic.completed_at && <span className="status-label">{t('Completed')}</span>}</div>
    <h2><Link href={`/board/${item.id}`}>{item.title}</Link></h2>
    <div className="board-page-preview">{doc.blocks.map(block=>block.type==='text' ? <p key={block.id} className={`board-body ${block.style==='heading' ? 'preview-heading' : ''}`} style={{fontWeight:block.bold || block.style==='heading' ? 700 : 400,fontStyle:block.italic ? 'italic' : 'normal'}}>{block.text}</p> : block.type==='checklist' ? <ul key={block.id} className="board-tasks">{block.tasks.map(task=><li key={task.id}><label><input type="checkbox" checked={task.done} disabled={pending} onChange={event=>toggle(event.target.checked,task.id,block.id)}/><span className={task.done ? 'task-done' : ''}>{task.text}</span></label></li>)}</ul> : block.type==='table' ? <Sheet key={block.id} block={block}/> : <Drawing key={block.id} block={block}/>)}</div>
    {tasks.length>0 && <small className="muted">{t('{done} of {total} done',{done:tasks.filter(task=>task.done).length,total:tasks.length})}</small>}
    {item.due_at && <div className="board-reminder"><time dateTime={item.due_at}>{new Intl.DateTimeFormat(locale==='id' ? 'id-ID' : 'en-GB',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Jakarta'}).format(new Date(item.due_at))} WIB</time><button className="button secondary" disabled={pending} onClick={()=>toggle(!optimistic.completed_at)}>{t(optimistic.completed_at ? 'Reopen reminder' : 'Mark complete')}</button></div>}
    {error && <p role="alert" className="error-text">{t(error)}</p>}
    <div className="board-card-footer"><small>{t('Updated by {name}',{name:author})}</small><div><Link className="text-button" href={`/board/${item.id}`}>{t('Edit')}</Link><button className="text-button danger" disabled={pending} onClick={()=>setDeleting(true)}>{t('Delete')}</button></div></div>
    {deleting && <Dialog title="Delete board item?" dismissible={!deletePending} onClose={()=>setDeleting(false)}><p>{t('This removes it for everyone in your family.')}</p><p><strong>{item.title}</strong></p><ActionForm action={()=>deleteBoardItem(item.id,item.version)} submit="Delete" onPendingChange={setDeletePending} onSuccess={()=>{saved('Board item deleted.');setDeleting(false);}}/></Dialog>}
  </article>;
}
