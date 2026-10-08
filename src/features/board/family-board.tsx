'use client';
import {useEffect,useOptimistic,useState,useTransition} from 'react';
import {useRouter} from 'next/navigation';
import Link from '@/components/pending-link';
import {Icon} from '@/components/icon';
import {Dialog} from '@/components/dialog';
import {ActionForm,Field} from '@/components/action-form';
import {DatePicker} from '@/components/date-picker';
import {useI18n} from '@/components/language-provider';
import {useSaveFeedback} from '@/components/save-feedback';
import {todayJakarta} from '@/lib/finance/dates';
import {saveBoardItem,deleteBoardItem,setBoardState} from './actions';
import {PhoneNotifications} from './phone-notifications';
import type {BoardItem,BoardKind,BoardTask} from './types';

const kinds:{kind:BoardKind;label:string;plural:string;icon:'board'|'list'|'bell'}[]=[
  {kind:'note',label:'Note',plural:'Notes',icon:'board'},
  {kind:'todo',label:'To-do list',plural:'To-do lists',icon:'list'},
  {kind:'reminder',label:'Reminder',plural:'Reminders',icon:'bell'},
];
export function FamilyBoard({items,authors,pushReady}:{items:BoardItem[];authors:Record<string,string>;pushReady:boolean}) {
  const {t}=useI18n(),router=useRouter();
  const [filter,setFilter]=useState<BoardKind|'all'>('all');
  const [editor,setEditor]=useState<{item?:BoardItem}|null>(null);
  const [refreshing,startRefresh]=useTransition();
  useEffect(()=>{
    if(editor) return;
    const refresh=()=>{if(document.visibilityState==='visible' && navigator.onLine) startRefresh(()=>router.refresh());};
    const timer=setInterval(refresh,30000);
    return ()=>clearInterval(timer);
  },[editor,router]);
  const visible=items.filter(item=>filter==='all' || item.kind===filter);
  return <>
    <Link href="/more" className="board-back"><Icon name="left"/>{t('More')}</Link>
    <div className="page-heading"><h1>{t('Family board')}</h1><button className="button primary" onClick={()=>setEditor({})}><Icon name="plus"/>{t('Add to board')}</button></div>
    <p className="muted">{t('One place for the things your family needs to remember.')}</p>
    <PhoneNotifications configured={pushReady}/>
    <div className="board-toolbar"><div className="board-filters" role="group" aria-label={t('Show board items')}>
      {[{kind:'all',plural:'All'},...kinds].map(option=><button key={option.kind} aria-pressed={filter===option.kind} onClick={()=>setFilter(option.kind as BoardKind|'all')}>{t(option.plural)}</button>)}
    </div><button className="button secondary" disabled={refreshing} onClick={()=>startRefresh(()=>router.refresh())}>{t(refreshing ? 'Loading…' : 'Refresh board')}</button></div>
    {visible.length ? <section className="board-grid" aria-label={t('Shared board items')}>{visible.map(item=><BoardCard key={item.id} item={item} author={authors[item.updated_by] || t('Former member')} onEdit={()=>setEditor({item})}/>)}</section>
      : <section className="panel empty-state"><Icon name="board" size={32}/><h2>{t(items.length ? 'Nothing here yet' : 'Start with something to share')}</h2><p>{t('A shopping list, a school note, or a reminder for everyone.')}</p><button className="button primary" onClick={()=>setEditor({})}>{t('Add to board')}</button></section>}
    {editor && <BoardEditor item={editor.item} onClose={()=>setEditor(null)}/>}
  </>;
}

function BoardCard({item,author,onEdit}:{item:BoardItem;author:string;onEdit:()=>void}) {
  const {t,locale}=useI18n();
  const [optimistic,updateOptimistic]=useOptimistic(item,(current,change:{done:boolean;taskId?:string})=>change.taskId
    ? {...current,checklist:current.checklist.map(task=>task.id===change.taskId ? {...task,done:change.done} : task)}
    : {...current,completed_at:change.done ? new Date().toISOString() : null});
  const [pending,startTransition]=useTransition(),[error,setError]=useState('');
  const [now,setNow]=useState(()=>Date.now());
  const [deleting,setDeleting]=useState(false),[deletePending,setDeletePending]=useState(false);
  const saved=useSaveFeedback();
  useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),60000);return ()=>clearInterval(timer);},[]);
  function toggle(done:boolean,taskId?:string) {
    setError('');
    startTransition(async()=>{
      updateOptimistic({done,taskId});
      try {const result=await setBoardState(item.id,done,taskId);if(!result.ok) setError(result.error);}
      catch{setError('Could not save. Please try again.');}
    });
  }
  const overdue=optimistic.due_at && !optimistic.completed_at && new Date(optimistic.due_at).getTime()<now;
  const type=kinds.find(k=>k.kind===item.kind)!;
  return <article className={`board-card board-${item.kind}`} aria-label={item.title} aria-busy={pending}>
    <div className="board-card-top"><span><Icon name={type.icon}/>{t(type.label)}</span>{overdue && <strong className="board-overdue">{t('Overdue')}</strong>}{optimistic.completed_at && <span className="status-label">{t('Completed')}</span>}</div>
    <h2>{item.title}</h2>{item.body && <p className="board-body">{item.body}</p>}
    {item.kind==='todo' && <><ul className="board-tasks">{optimistic.checklist.map(task=><li key={task.id}><label><input type="checkbox" checked={task.done} disabled={pending} onChange={e=>toggle(e.target.checked,task.id)}/><span className={task.done ? 'task-done' : ''}>{task.text}</span></label></li>)}</ul><small className="muted">{t('{done} of {total} done',{done:optimistic.checklist.filter(task=>task.done).length,total:optimistic.checklist.length})}</small></>}
    {item.due_at && <div className="board-reminder"><time dateTime={item.due_at}>{new Intl.DateTimeFormat(locale==='id' ? 'id-ID' : 'en-GB',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Jakarta'}).format(new Date(item.due_at))} WIB</time><button className="button secondary" disabled={pending} onClick={()=>toggle(!optimistic.completed_at)}>{t(optimistic.completed_at ? 'Reopen reminder' : 'Mark complete')}</button></div>}
    {error && <p role="alert" className="error-text">{t(error)}</p>}
    <div className="board-card-footer"><small>{t('Updated by {name}',{name:author})}</small><div><button className="text-button" disabled={pending} onClick={onEdit}>{t('Edit')}</button><button className="text-button danger" disabled={pending} onClick={()=>setDeleting(true)}>{t('Delete')}</button></div></div>
    {deleting && <Dialog title="Delete board item?" dismissible={!deletePending} onClose={()=>setDeleting(false)}><p>{t('This removes it for everyone in your family.')}</p><p><strong>{item.title}</strong></p><ActionForm action={()=>deleteBoardItem(item.id,item.version)} submit="Delete" onPendingChange={setDeletePending} onSuccess={()=>{saved('Board item deleted.');setDeleting(false);}}/></Dialog>}
  </article>;
}

function BoardEditor({item,onClose}:{item?:BoardItem;onClose:()=>void}) {
  const {t}=useI18n(),saved=useSaveFeedback();
  const [kind,setKind]=useState<BoardKind>(item?.kind || 'note');
  const [tasks,setTasks]=useState<BoardTask[]>(item?.checklist || []);
  const [pending,setPending]=useState(false);
  const due=item?.due_at ? new Date(new Date(item.due_at).getTime()+7*3600000).toISOString() : '';
  return <Dialog title={item ? 'Edit board item' : 'Add to board'} dismissible={!pending} onClose={onClose}>
    <ActionForm action={saveBoardItem} onPendingChange={setPending} onSuccess={()=>{saved(item ? 'Board item updated.' : 'Board item saved.');onClose();}}>
      {item && <><input type="hidden" name="id" value={item.id}/><input type="hidden" name="version" value={item.version}/></>}
      <input type="hidden" name="kind" value={kind}/><input type="hidden" name="checklist" value={JSON.stringify(kind==='todo' ? tasks : [])}/>
      {!item && <div className="entry-type-switch" role="group" aria-label={t('Item type')}>{kinds.map(type=><button type="button" key={type.kind} aria-pressed={kind===type.kind} onClick={()=>setKind(type.kind)}><Icon name={type.icon}/>{t(type.label)}</button>)}</div>}
      <Field label="Title"><input name="title" required maxLength={120} defaultValue={item?.title} data-autofocus/></Field>
      <Field label="Details (optional)"><textarea name="body" maxLength={4000} rows={4} defaultValue={item?.body}/></Field>
      {kind==='todo' && <div className="field"><label>{t('Tasks')}</label><div className="board-task-editor">{tasks.map((task,index)=><div key={task.id}><input aria-label={t('Task {number}',{number:index+1})} required maxLength={160} value={task.text} onChange={e=>setTasks(tasks.map(current=>current.id===task.id ? {...current,text:e.target.value} : current))}/><button type="button" className="icon-button" aria-label={t('Remove task {number}',{number:index+1})} onClick={()=>setTasks(tasks.filter(current=>current.id!==task.id))}><Icon name="close"/></button></div>)}</div><button className="button secondary" type="button" disabled={tasks.length>=50} onClick={()=>setTasks([...tasks,{id:crypto.randomUUID(),text:'',done:false}])}><Icon name="plus"/>{t('Add task')}</button>{!tasks.length && <small>{t('Add at least one task.')}</small>}</div>}
      {kind==='reminder' && <><div className="form-row"><Field label="Date"><DatePicker name="date" defaultValue={due.slice(0,10) || todayJakarta()} required/></Field><Field label="Time" hint="Western Indonesia Time (WIB)"><input name="time" type="time" required defaultValue={due.slice(11,16) || '09:00'}/></Field></div><p className="muted">{t('Family members who enable phone notifications will receive this reminder.')}</p></>}
    </ActionForm>
  </Dialog>;
}
