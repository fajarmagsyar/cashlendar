import {BoardPageEditor} from '@/features/board/page-editor';
import {textBlock} from '@/features/board/document';
export default function NewBoardPage(){return <BoardPageEditor initialDocument={{version:1,blocks:[textBlock()]}}/>;}
