export type BoardKind='note'|'todo'|'reminder';
export type BoardTask={id:string;text:string;done:boolean};
export type BoardItem={id:string;kind:BoardKind;title:string;body:string;checklist:BoardTask[];due_at:string|null;completed_at:string|null;created_by:string;updated_by:string;updated_at:string;version:number};
