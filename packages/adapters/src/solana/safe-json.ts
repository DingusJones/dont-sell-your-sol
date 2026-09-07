/** Validate JSON grammar, then preserve every numeric lexeme as a string.
 * The first parse is discarded: rounded JS numbers never enter the domain.
 * Quoted metadata is copied verbatim, including escaped quotation marks.
 */
export function parseExactJson(text:string):unknown {
 JSON.parse(text);
 let out='',i=0;
 while(i<text.length){
  const c=text[i]!;
  if(c==='"'){const start=i++;while(i<text.length){if(text[i]==='\\'){i+=2;continue;}if(text[i++]==='"')break;}out+=text.slice(start,i);}
  else if(c==='-'||(c>='0'&&c<='9')){const match=/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/.exec(text.slice(i))!;out+=JSON.stringify(match[0]);i+=match[0].length;}
  else{out+=c;i++;}
 }
 return JSON.parse(out);
}
