import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.118.0';

const config=window.ROAM_AUTH_CONFIG;
const gate=document.querySelector('#accountGate');
let language=localStorage.getItem('roam-language')||'en',mode='login',client,user,revision=0,loaded=false,queue=Promise.resolve(),failed=false,latestSnapshot;
const text=(en,he)=>language==='he'?he:en;
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function message(s){const n=gate.querySelector('[role=status]');if(n)n.textContent=s;}
function showGate(){
 document.body.classList.add('auth-locked');gate.hidden=false;
 document.documentElement.lang=language;document.documentElement.dir=language==='he'?'rtl':'ltr';
 const recovery=mode==='update',reset=mode==='reset',signup=mode==='signup';
 gate.innerHTML=`<div class="auth-top"><a class="brand" href="#">✳ roamtogether</a><button id="authLanguage">${text('עברית','English')}</button></div><div class="card auth-card"><span class="eyebrow">${text('YOUR PERSONAL TRAVEL SPACE','מרחב הטיולים האישי שלכם')}</span><h1>${recovery?text('Choose a new password','בחירת סיסמה חדשה'):reset?text('Reset your password','איפוס סיסמה'):signup?text('Create your account','יצירת חשבון'):text('Welcome back','ברוכים השבים')}</h1><p class="muted">${text('Your trips, saved to your account. Ready on every device.','הטיולים שלכם נשמרים בחשבון וזמינים מכל מכשיר.')}</p><form id="authForm">${recovery?'':`<label class="field">${text('Email','כתובת מייל')}<input name="email" type="email" autocomplete="email" required maxlength="254" dir="ltr"></label>`}${reset?'':`<label class="field">${text('Password','סיסמה')}<input name="password" type="password" autocomplete="${signup||recovery?'new-password':'current-password'}" minlength="${signup||recovery?'10':'1'}" maxlength="128" required dir="ltr"></label>`}${signup||recovery?`<small>${text('Use at least 10 characters.','בחרו סיסמה עם 10 תווים לפחות.')}</small>`:''}<button type="submit" class="primary">${recovery?text('Save password','שמירת סיסמה'):reset?text('Send reset link','שליחת קישור לאיפוס'):signup?text('Create account','יצירת חשבון'):text('Sign in','כניסה')}</button><p role="status" aria-live="polite"></p></form>${recovery?'':`<div class="auth-links"><button data-mode="${signup||reset?'login':'signup'}">${signup||reset?text('Back to sign in','חזרה לכניסה'):text('Create an account','יצירת חשבון')}</button>${reset?'':`<button data-mode="reset">${text('Forgot password?','שכחתם סיסמה?')}</button>`}</div>`}<small class="muted">${text('Flight reminder emails will be available after the email service is connected.','תזכורות טיסה במייל יהיו זמינות לאחר חיבור שירות הדיוור.')}</small></div>`;
 gate.querySelector('#authLanguage').onclick=()=>{language=language==='en'?'he':'en';localStorage.setItem('roam-language',language);showGate()};
 gate.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{mode=b.dataset.mode;showGate()});
 gate.querySelector('form').onsubmit=submit;
}
async function submit(e){
 e.preventDefault();if(!client){message(text('Account connection is not configured yet.','חיבור החשבונות עדיין אינו מוגדר.'));return}
 const form=e.target,b=form.querySelector('[type=submit]'),email=form.elements.email?.value.trim(),password=form.elements.password?.value;
 b.disabled=true;message(text('Please wait…','רגע אחד…'));
 try{
  let result;
  const redirect=location.origin+location.pathname;
  if(mode==='signup')result=await client.auth.signUp({email,password,options:{emailRedirectTo:redirect}});
  else if(mode==='reset')result=await client.auth.resetPasswordForEmail(email,{redirectTo:redirect});
  else if(mode==='update')result=await client.auth.updateUser({password});
  else result=await client.auth.signInWithPassword({email,password});
  if(result.error)throw result.error;
  form.reset();
  if(mode==='reset'||(mode==='signup'&&!result.data.session)){message(text('Check your email for a confirmation link. If it does not arrive, check spam or try again later.','בדקו במייל את קישור האישור. אם לא הגיע, בדקו בדואר זבל או נסו שוב מאוחר יותר.'));return}
  if(mode==='update'){mode='login';await openAccount((await client.auth.getSession()).data.session);return}
  await openAccount(result.data.session);
 }catch(error){message(error.status===429?text('Too many requests. Please wait and try again.','בוצעו יותר מדי בקשות. המתינו ונסו שוב.'):mode==='login'?text('Could not sign in. Check your email, password and email confirmation.','לא הצלחנו להתחבר. בדקו את המייל, הסיסמה ואישור כתובת המייל.'):text('The request could not be completed. Check the details or try again later.','לא ניתן להשלים את הבקשה. בדקו את הפרטים או נסו שוב מאוחר יותר.'))}
 finally{b.disabled=false}
}
async function openAccount(session){
 if(!session?.user)return; if(loaded)return;
 user=session.user;
 message(text('Loading your trips…','טוען את הטיולים שלכם…'));
 const {data,error}=await client.from('roam_workspaces').select('data,revision').eq('owner_id',user.id).maybeSingle();
 if(error){message(text('Could not load your trips. Please try signing in again.','לא ניתן לטעון את הטיולים. נסו להתחבר שוב.'));return}
 revision=data?.revision||0;
 window.ROAM_ACCOUNT={id:user.id,email:user.email,state:data?.data||{version:1,selected:null,trips:[]},commit};
 const script=document.createElement('script');script.src='app.js?v=20261023-accounts1';
 script.onload=()=>{if(!window.ROAM_APP_READY){message(text('Could not open your saved trips. Your account data has not changed.','לא ניתן לפתוח את הטיולים. הנתונים בחשבון לא שונו.'));return}loaded=true;gate.hidden=true;document.body.classList.remove('auth-locked');renderAccountBar()};
 script.onerror=()=>message(text('Could not load the app. Refresh to try again.','טעינת האתר נכשלה. רעננו כדי לנסות שוב.'));
 document.body.append(script);
}
function commit(state){
 const snapshot=JSON.parse(JSON.stringify(state));latestSnapshot=snapshot;
 queue=queue.then(async()=>{
  if(failed)throw Error('SYNC_BLOCKED');
  setStatus(text('Saving…','שומר בענן…'));
  const {data,error}=await client.rpc('roam_save_workspace',{payload:snapshot,expected_revision:revision});
  if(error){failed=true;setStatus(text('Not saved. Connection failed or another device changed your trips.','לא נשמר. החיבור נכשל או שהטיולים שונו במכשיר אחר.'));showSyncFailure(latestSnapshot);throw error}
  revision=data;window.ROAM_ACCOUNT.state=snapshot;setStatus(text('Saved to your account','נשמר בחשבון שלכם'));
 });
 // Keep the queue usable while propagating the error to the caller.
 const result=queue;queue=queue.catch(()=>{});return result;
}
function setStatus(s){const n=document.querySelector('#cloudStatus');if(n)n.textContent=s;}
function showSyncFailure(snapshot){
 gate.hidden=false;document.body.classList.add('auth-locked');
 gate.innerHTML=`<div class="card auth-card"><h1>${text('Your changes have not been saved','השינויים לא נשמרו')}</h1><p>${text('Download a copy of your changes before reloading. Reloading loads the latest account version.','הורידו עותק של השינויים לפני רענון. הרענון יטען את הגרסה האחרונה מהחשבון.')}</p><button id="downloadUnsaved">${text('Download my changes','הורדת השינויים שלי')}</button> <button id="reloadAccount" class="primary">${text('Reload account','טעינה מחדש של החשבון')}</button></div>`;
 gate.querySelector('#downloadUnsaved').onclick=()=>{const a=document.createElement('a'),url=URL.createObjectURL(new Blob([JSON.stringify(snapshot)],{type:'application/json'}));a.href=url;a.download='roam-unsaved-trips.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
 gate.querySelector('#reloadAccount').onclick=()=>location.reload();
}
function renderAccountBar(){
 const bar=document.querySelector('#accountBar');bar.hidden=false;
 bar.innerHTML=`<span dir="ltr">${safe(user.email)}</span><small id="cloudStatus">${text('Saved to your account','נשמר בחשבון שלכם')}</small><button id="localTripsImport" hidden>${text('Import trips from this device','העברת טיולים מהמכשיר לחשבון')}</button><button id="accountSignOut">${text('Sign out','יציאה מהחשבון')}</button>`;
 const legacy=localStorage.getItem('roam-data');
 if(legacy){const button=bar.querySelector('#localTripsImport');button.hidden=false;button.onclick=()=>window.dispatchEvent(new CustomEvent('roam-import-local'))}
 bar.querySelector('#accountSignOut').onclick=async()=>{await queue;if(failed)return;const {error}=await client.auth.signOut();if(!error)location.reload();else setStatus(text('Sign out failed. Please try again.','היציאה נכשלה. נסו שוב.'))};
}
showGate();
if(config?.url&&config?.key){
 client=createClient(config.url,config.key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
 client.auth.onAuthStateChange((event,session)=>{
  if(event==='PASSWORD_RECOVERY'){mode='update';showGate()}
  if(event==='SIGNED_OUT'&&loaded)location.reload();
  if(event==='SIGNED_IN'&&loaded&&session?.user.id!==user?.id)location.reload();
 });
 const {data,error}=await client.auth.getSession();
 if(!error&&data.session&&mode!=='update')await openAccount(data.session);
}
