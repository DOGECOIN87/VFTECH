// Real SQLite queries; only the two external providers are mocked. No emails leave tests.
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import worker from '../backend/worker.js';
export function fixture(){
  const sqlite=new DatabaseSync(':memory:');sqlite.exec(readFileSync('backend/migrations/0001_client_services.sql','utf8'));
  function statement(sql,args=[]){return {bind(...values){return statement(sql,values);},async first(){return sqlite.prepare(sql).get(...args)||null;},async all(){return {results:sqlite.prepare(sql).all(...args)};},async run(){const result=sqlite.prepare(sql).run(...args);return {success:true,meta:{changes:Number(result.changes)}};},sql,args};}
  const DB={prepare:statement,async batch(items){sqlite.exec('BEGIN');try{const results=items.map(item=>{const result=sqlite.prepare(item.sql).run(...item.args);return {success:true,meta:{changes:Number(result.changes)}};});sqlite.exec('COMMIT');return results;}catch(error){sqlite.exec('ROLLBACK');throw error;}}};
  const env={DB,SITE_URL:'https://vftech.test',TURNSTILE_SITE_KEY:'test-site-key',TURNSTILE_SECRET_KEY:'test-secret',TURNSTILE_HOSTNAME:'vftech.test',RESEND_API_KEY:'test-mail-key',EMAIL_FROM:'VFTech <test@vftech.test>',CONTACT_TO:'inbox@vftech.test',SESSION_SECRET:'test-only-session-secret-at-least-thirty-two-characters'};
  const state={emails:[],outbound:[],failMail:false,failCaptcha:false,hostname:null,action:null};
  const used=new Set(),original=globalThis.fetch;
  globalThis.fetch=async(url,options)=>{
    state.outbound.push(String(url));
    if(String(url)==='https://challenges.cloudflare.com/turnstile/v0/siteverify'){const token=options.body.get('response'),action=token?.startsWith('contact-')?'contact':'account',valid=/^(contact|account)-/.test(token||'')&&!used.has(token)&&!state.failCaptcha;used.add(token);return Response.json({success:valid,hostname:state.hostname||env.TURNSTILE_HOSTNAME,action:state.action||action});}
    if(String(url)==='https://api.resend.com/emails'){if(state.failMail)return Response.json({error:'provider unavailable'},{status:500});state.emails.push({payload:JSON.parse(options.body),key:options.headers['Idempotency-Key']});return Response.json({id:crypto.randomUUID()});}
    throw Error('Unexpected outbound request: '+url);
  };
  async function request(path,data,extra={}){const headers={...(data===undefined?{}:{'Content-Type':'application/json','Origin':new URL(env.SITE_URL).origin}),'CF-Connecting-IP':'192.0.2.10',...extra.headers};const response=await worker.fetch(new Request(new URL('/api/'+path,env.SITE_URL),{method:extra.method||(data===undefined?'GET':'POST'),headers,body:data===undefined?undefined:JSON.stringify(data)}),env);return {response,status:response.status,body:await response.json()};}
  function token(action){return `${action}-${crypto.randomUUID()}`;}
  function contact(overrides={}){return {name:'Test Customer',email:'one@example.test',business:'A business',phone:'',topics:['Website rebuild'],times:'Tomorrow afternoon',message:'Please build a dashboard.',planId:'business',website:'',idempotencyKey:crypto.randomUUID(),turnstileToken:token('contact'),...overrides};}
  async function challenge(address='one@example.test'){const result=await request('auth/request-code',{email:address,name:'Test Customer',turnstileToken:token('account')});if(result.status!==201)throw Error(JSON.stringify(result));const value=state.emails.at(-1).payload.text.match(/code is (\d{6})/)[1];return {email:address,challengeId:result.body.challengeId,code:value};}
  async function login(address='one@example.test'){const data=await challenge(address),result=await request('auth/verify-code',data);if(result.status!==200)throw Error(JSON.stringify(result));return {...result,cookie:result.response.headers.get('Set-Cookie').split(';')[0]};}
  return {worker,sqlite,env,state,request,token,contact,challenge,login,close(){globalThis.fetch=original;sqlite.close();}};
}
