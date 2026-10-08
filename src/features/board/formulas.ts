export type CellResult={value:string|number;error?:string};
type Value=string|number;
class FormulaError extends Error {}
const fail=(message:string):never=>{throw new FormulaError(message);};
const numeric=(value:Value):number=>value==='' ? 0 : typeof value==='number' ? value : fail('#VALUE!');

/** Evaluates only the small spreadsheet grammar; cell content never becomes executable code. */
export function evaluateSheet(cells:string[][]):CellResult[][] {
  const cache=new Map<string,CellResult>(),visiting=new Set<string>();
  function cell(row:number,col:number):CellResult {
    if(row<0 || col<0 || row>=cells.length || col>=cells[row].length) return {value:'',error:'#REF!'};
    const key=`${row}:${col}`;
    if(visiting.has(key)) return {value:'',error:'#CYCLE!'};
    if(cache.has(key)) return cache.get(key)!;
    if(visiting.size>=64) return {value:'',error:'#ERROR!'};
    visiting.add(key);
    const source=cells[row][col];let result:CellResult;
    try {
      if(!source.startsWith('=')) result={value:source.trim()!=='' && Number.isFinite(Number(source)) ? Number(source) : source};
      else result={value:parse(source.slice(1))};
    }catch(error){result={value:'',error:error instanceof FormulaError ? error.message : '#ERROR!'};}
    visiting.delete(key);cache.set(key,result);return result;
  }
  function address(ref:string):[number,number] {
    const match=/^([A-Z]+)([1-9]\d*)$/.exec(ref) || fail('#ERROR!');
    let col=0;for(const char of match[1]) col=col*26+char.charCodeAt(0)-64;
    return [Number(match[2])-1,col-1];
  }
  function read(ref:string):Value {const [r,c]=address(ref),result=cell(r,c);if(result.error) fail(result.error);return result.value;}
  function parse(source:string):number {
    const tokens:string[]=[];let offset=0;
    while(offset<source.length) {
      const match=/^\s*(\d+(?:\.\d*)?|\.\d+|[A-Za-z]+[0-9]*|[+\-*/(),:])/.exec(source.slice(offset));
      if(!match){if(source.slice(offset).trim()==='') break;throw new FormulaError('#ERROR!');}
      tokens.push(match[1].toUpperCase());offset+=match[0].length;
    }
    let index=0;
    const peek=()=>tokens[index];
    const take=(token:string)=>{if(peek()!==token) fail('#ERROR!');index++;};
    function expression():Value {
      let value=product();
      while(peek()==='+' || peek()==='-') {const op=tokens[index++],right=numeric(product());value=op==='+' ? numeric(value)+right : numeric(value)-right;}
      return value;
    }
    function product():Value {
      let value=atom();
      while(peek()==='*' || peek()==='/') {const op=tokens[index++],right=numeric(atom());if(op==='/' && right===0) fail('#DIV/0!');value=op==='*' ? numeric(value)*right : numeric(value)/right;}
      return value;
    }
    function atom():Value {
      const token=tokens[index++];
      if(token==='+' || token==='-') return numeric(atom())*(token==='-' ? -1 : 1);
      if(token==='('){const value=expression();take(')');return value;}
      if(/^\d|^\.\d/.test(token || '')) return Number(token);
      if(/^[A-Z]+[1-9]\d*$/.test(token || '')) return read(token);
      if(!['SUM','AVERAGE','MIN','MAX','COUNT'].includes(token)) return fail('#ERROR!');
      take('(');const values:Value[]=[];
      if(peek()!==')') do {
        if(/^[A-Z]+[1-9]\d*$/.test(peek() || '') && tokens[index+1]===':') {
          const [r1,c1]=address(tokens[index++]);take(':');const [r2,c2]=address(tokens[index++] || '');
          if(Math.max(r1,r2)>=cells.length || Math.max(c1,c2)>=cells[0].length) fail('#REF!');
          for(let r=Math.min(r1,r2);r<=Math.max(r1,r2);r++) for(let c=Math.min(c1,c2);c<=Math.max(c1,c2);c++){const result=cell(r,c);if(result.error) fail(result.error);values.push(result.value);}
        }else values.push(expression());
        if(peek()!==',') break;index++;
      }while(true);
      take(')');const numbers=values.filter((value):value is number=>typeof value==='number');
      const sum=numbers.reduce((a,b)=>a+b,0);
      switch(token) {
        case 'SUM':return sum;case 'COUNT':return numbers.length;
        case 'AVERAGE':return numbers.length ? sum/numbers.length : fail('#DIV/0!');
        case 'MIN':return numbers.length ? Math.min(...numbers) : 0;
        default:return numbers.length ? Math.max(...numbers) : 0;
      }
    }
    const value=numeric(expression());if(index!==tokens.length) fail('#ERROR!');
    if(!Number.isFinite(value)) fail('#VALUE!');return value;
  }
  return cells.map((row,r)=>row.map((_,c)=>cell(r,c)));
}
