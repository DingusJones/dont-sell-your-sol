import {it,expect} from 'vitest';
import {safeUrl} from '../../packages/links/src/validate-url.ts';
import {enabledLink,resolve} from '../../packages/links/src/resolve.ts';
it('rejects hostile destinations and unverified provider URLs',()=>{for(const url of ['javascript:alert(1)','data:text/html,a','https://good.example.evil/a','https://user@good.example/a','http://good.example','https://good.example:444','https://good.example/\\evil','https://good.example/#bad'])expect(safeUrl(url,['good.example'])).toBe(false);expect(safeUrl('https://good.example/entity',['good.example'])).toBe(true);expect(resolve('made-up',['position']).url).toBe(null);expect(enabledLink({...resolve('made-up',['position']),url:'https://good.example/entity',target:'action'})).toBe(false);});
