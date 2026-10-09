'use client';
import {useEffect,useState,useSyncExternalStore} from 'react';
import {useRouter} from 'next/navigation';
import {Icon,type IconName} from '@/components/icon';
import {EditorAction} from './editor-action';
import {ActionForm,Field} from '@/components/action-form';
import {DatePicker} from '@/components/date-picker';
import {useI18n} from '@/components/language-provider';
import {useSaveFeedback} from '@/components/save-feedback';
import {todayJakarta} from '@/lib/finance/dates';
import {saveBoardDocument} from './actions';
import {itemDocument,textBlock,type BoardBlock,type BoardDocument} from './document';
import {Drawing,Sheet} from './page-blocks';
import type {BoardItem} from './types';

const subscribeHydration=()=>()=>{};
const clientReady=()=>true;
const serverReady=()=>false;

export function BoardPageEditor({item:incomingItem,initialDocument}:{item?:BoardItem;initialDocument?:BoardDocument}) {
  const {t}=useI18n(),router=useRouter(),saved=useSaveFeedback();
  const [item]=useState(incomingItem);
  const ready=useSyncExternalStore(subscribeHydration,clientReady,serverReady);
  const [doc,setDoc]=useState<BoardDocument>(()=>item ? itemDocument(item) : initialDocument || {version:1,blocks:[]});
  const [reminder,setReminder]=useState(Boolean(item?.due_at)),[dirty,setDirty]=useState(false),[pending,setPending]=useState(false);
  const due=item?.due_at ? new Date(new Date(item.due_at).getTime()+7*3600000).toISOString() : '';
  useEffect(()=>{
    const guard=(event:BeforeUnloadEvent)=>{if(dirty || pending){event.preventDefault();event.returnValue='';}};
    window.addEventListener('beforeunload',guard);return ()=>window.removeEventListener('beforeunload',guard);
  },[dirty,pending]);
  function update(block:BoardBlock){setDirty(true);setDoc(current=>({...current,blocks:current.blocks.map(b=>b.id===block.id ? block : b)}));}
  function add(type:BoardBlock['type']) {
    const id=crypto.randomUUID();let block:BoardBlock;
    if(type==='text') block=textBlock();
    else if(type==='checklist') block={id,type,tasks:[{id:crypto.randomUUID(),text:'',done:false}]};
    else if(type==='table') block={id,type,cells:Array.from({length:4},()=>['','',''])};
    else block={id,type,strokes:[]};
    setDoc(current=>({...current,blocks:[...current.blocks,block]}));setDirty(true);
    requestAnimationFrame(()=>document.getElementById(`block-${block.id}`)?.scrollIntoView({block:'center'}));
  }
  function remove(block:BoardBlock) {
    const content=block.type==='text' ? block.text : block.type==='checklist' ? block.tasks.some(task=>task.text) : block.type==='table' ? block.cells.some(row=>row.some(Boolean)) : block.strokes.length;
    if(content && !window.confirm(t('Remove this block and its contents?'))) return;
    setDoc(current=>({...current,blocks:current.blocks.filter(b=>b.id!==block.id)}));setDirty(true);
  }
  function move(index:number,direction:number) {
    setDoc(current=>{const blocks=[...current.blocks];[blocks[index],blocks[index+direction]]=[blocks[index+direction],blocks[index]];return {...current,blocks};});setDirty(true);
  }
  function back(){if(!dirty || window.confirm(t('Leave without saving your changes?'))){router.push('/board');router.refresh();}}
  return <section className="board-editor" aria-label={t(item ? 'Edit page' : 'New page')}>
    <div className="page-editor-heading"><EditorAction label="Family board" icon="left" onClick={back} disabled={pending || !ready}/><h1>{t(item ? 'Edit page' : 'New page')}</h1><span className="sr-only" role="status">{t(dirty ? 'Unsaved changes' : 'Shared with your family')}</span></div>
    <ActionForm showSubmit={false} disabled={!ready} id="board-page-form" className="page-editor-form" action={saveBoardDocument} onPendingChange={setPending} onSuccess={()=>{setDirty(false);saved('Board item saved.');router.push('/board');}}>
      {item && <><input type="hidden" name="id" value={item.id}/><input type="hidden" name="version" value={item.version}/></>}
      <input type="hidden" name="document" value={JSON.stringify(doc)}/>
      <Field label="Title"><input className="page-title-input" name="title" required maxLength={120} defaultValue={item?.title} placeholder={t('Title')} onChange={()=>setDirty(true)}/></Field>
      <div className="page-blocks">{doc.blocks.map((block,index)=><section className={`page-block block-${block.type}`} id={`block-${block.id}`} key={block.id} aria-label={t('Block {number}',{number:index+1})}>
        <div className="block-controls"><Icon name={block.type==='drawing' ? 'pen' : block.type}/><div>
          <EditorAction label={t('Move block {number} up',{number:index+1})} icon="up" disabled={index===0} onClick={()=>move(index,-1)}/><EditorAction label={t('Move block {number} down',{number:index+1})} icon="down" disabled={index===doc.blocks.length-1} onClick={()=>move(index,1)}/><EditorAction label={t('Remove block {number}',{number:index+1})} icon="trash" onClick={()=>remove(block)}/>
        </div></div>
        {block.type==='text' && <><div className="text-format-tools" role="group" aria-label={t('Text formatting')}><EditorAction label="Heading" icon="heading" aria-pressed={block.style==='heading'} onClick={()=>update({...block,style:block.style==='heading' ? 'paragraph' : 'heading'})}/><EditorAction label="Bold" icon="bold" aria-pressed={block.bold} onClick={()=>update({...block,bold:!block.bold})}/><EditorAction label="Italic" icon="italic" aria-pressed={block.italic} onClick={()=>update({...block,italic:!block.italic})}/></div><textarea className={`page-text ${block.style==='heading' ? 'page-text-heading' : ''}`} aria-label={t('Text block {number}',{number:index+1})} placeholder={t('Write something for your family…')} value={block.text} maxLength={8000} rows={block.style==='heading' ? 2 : 4} style={{fontWeight:block.bold || block.style==='heading' ? 700 : 400,fontStyle:block.italic ? 'italic' : 'normal'}} onChange={event=>update({...block,text:event.target.value})}/></>}
        {block.type==='checklist' && <div className="page-checklist">{block.tasks.map((task,taskIndex)=><div className="page-task" key={task.id}><input type="checkbox" aria-label={t('Complete task {number}',{number:taskIndex+1})} checked={task.done} onChange={event=>update({...block,tasks:block.tasks.map(current=>current.id===task.id ? {...current,done:event.target.checked} : current)})}/><input aria-label={t('Task {number}',{number:taskIndex+1})} required maxLength={160} placeholder={t('What needs doing?')} value={task.text} onChange={event=>update({...block,tasks:block.tasks.map(current=>current.id===task.id ? {...current,text:event.target.value} : current)})}/><EditorAction label={t('Remove task {number}',{number:taskIndex+1})} icon="close" onClick={()=>block.tasks.length===1 ? remove(block) : update({...block,tasks:block.tasks.filter(current=>current.id!==task.id)})}/></div>)}<EditorAction label="Add task" icon="plus" disabled={block.tasks.length>=50} onClick={()=>update({...block,tasks:[...block.tasks,{id:crypto.randomUUID(),text:'',done:false}]})}/></div>}
        {block.type==='table' && <Sheet block={block} onChange={update}/>}
        {block.type==='drawing' && <Drawing block={block} onChange={update} disabled={pending}/>}
      </section>)}</div>
      <div className="add-block-tools" role="group" aria-label={t('Add content')}>{(['text','checklist','table','drawing'] as const).map(type=><EditorAction key={type} label={{text:'Text',checklist:'Checklist',table:'Table',drawing:'Drawing'}[type]} icon={type==='drawing' ? 'pen' : type as IconName} disabled={doc.blocks.length>=50} onClick={()=>add(type)}/>)}<EditorAction label="Add a reminder" icon="bell" aria-pressed={reminder} onClick={()=>{setReminder(!reminder);setDirty(true);}}/></div>
      {reminder && <div className="page-reminder-settings"><div className="form-row" onChange={()=>setDirty(true)}><Field label="Date"><DatePicker name="date" onChange={()=>setDirty(true)} defaultValue={due.slice(0,10) || todayJakarta()} required/></Field><Field label="Time"><input name="time" type="time" required defaultValue={due.slice(11,16) || '09:00'}/></Field></div></div>}
    </ActionForm>
    <EditorAction label={pending ? 'Saving…' : 'Save page'} icon="save" type="submit" form="board-page-form" className="editor-save" disabled={pending || !ready}/>
  </section>;
}
