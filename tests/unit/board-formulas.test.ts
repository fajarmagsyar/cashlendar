import {test} from 'node:test';
import assert from 'node:assert/strict';
import {evaluateSheet} from '../../src/features/board/formulas.ts';

test('tables calculate arithmetic, references, ranges and common aggregate functions',()=>{
  const result=evaluateSheet([['10','20','=A1+B1*2','=SUM(A1:B1)'],['5','Text','=AVERAGE(A1:B2)','=COUNT(A1:B2)'],['','','=MIN(A1:A2)','=MAX(A1:B2)']]);
  assert.equal(result[0][2].value,50);assert.equal(result[0][3].value,30);
  assert.equal(result[1][2].value,35/3);assert.equal(result[1][3].value,3);
  assert.equal(result[2][2].value,5);assert.equal(result[2][3].value,20);
  assert.equal(evaluateSheet([['=-(2+3)/2']])[0][0].value,-2.5);
});
test('formulas reject cycles, bad references, division by zero and executable input',()=>{
  const cells=evaluateSheet([['=B1','=A1','=1/0','=Z99','=alert(1)','=SUM(A1:Z99)']])[0];
  assert.equal(cells[0].error,'#CYCLE!');assert.equal(cells[2].error,'#DIV/0!');
  assert.equal(cells[3].error,'#REF!');assert.equal(cells[4].error,'#ERROR!');assert.equal(cells[5].error,'#REF!');
  assert.equal(evaluateSheet([['word','=A1+1']])[0][1].error,'#VALUE!');
});
