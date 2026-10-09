import {test} from 'node:test';
import assert from 'node:assert/strict';
import {navigationMotion,isNestedRoute} from '../../src/lib/navigation-motion.ts';

test('tabs slide in spatial order and nested routes zoom both ways',()=>{
  assert.equal(navigationMotion('/','/accounts'),'slide-left');
  assert.equal(navigationMotion('/profile','/more'),'slide-right');
  assert.equal(navigationMotion('/profile','/settings'),'zoom-in');
  assert.equal(navigationMotion('/settings','/profile'),'zoom-out');
  assert.equal(navigationMotion('/board','/board/new'),'zoom-in');
  assert.equal(navigationMotion('/board/new','/board'),'zoom-out');
  assert.equal(navigationMotion('/','/'),'none');
  assert.equal(isNestedRoute('/settings'),true);
  assert.equal(isNestedRoute('/board'),true);
  assert.equal(isNestedRoute('/accounts'),false);
});
