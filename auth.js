import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.118.0';

const config=window.ROAM_AUTH_CONFIG;
const gate=document.querySelector('#accountGate');
// Capture recovery intent before Supabase consumes the callback fragment.
const recoveryRequested=new URLSearchParams(location.search).get('reset')==='1'||new URLSearchParams(location.hash.slice(1)).get('type')==='recovery'||sessionStorage.getItem('roam-password-recovery')==='1';
if(recoveryRequested)sessionStorage.setItem('roam-password-recovery','1');
let language=localStorage.getItem('roam-language')||'en',mode=recoveryRequested?'update':'login',client,user,revision=0,loaded=false,queue=Promise.resolve(),failed=false,latestSnapshot;
const text=(en,he)=>language==='he'?he:en;
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function message(s){const n=gate.querySelector('[role=status]');if(n)n.textContent=s;}
// Destinations rotated on the sign-in boarding pass.
const destinations=[['JFK','New York','ניו יורק'],['LHR','London','לונדון'],['CDG','Paris','פריז'],['FCO','Rome','רומא'],['BKK','Bangkok','בנגקוק'],['ATH','Athens','אתונה']];
const icons={
 plane:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z"/></svg>',
 mail:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zm0 2v.4l8 5 8-5V7zm16 2.8-8 5-8-5V17h16z"/></svg>',
 lock:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a5 5 0 0 1 5 5v3h1a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h1V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v3h6V7a3 3 0 0 0-3-3zm0 9a2 2 0 0 0-1 3.7V18h2v-1.3A2 2 0 0 0 12 13z"/></svg>'
};
let destinationTimer;
function showGate(){
 document.body.classList.add('auth-locked');gate.hidden=false;
 document.documentElement.lang=language;document.documentElement.dir=language==='he'?'rtl':'ltr';
 const recovery=mode==='update',reset=mode==='reset',signup=mode==='signup';
 const [code,cityEn,cityHe]=destinations[0];
 gate.innerHTML=`<div class="auth-top"><a class="brand" href="#">✳ <span>roam<span class="light">together</span></span></a><button id="authLanguage">${text('עברית','English')}</button></div><div class="auth-shell"><div class="auth-visual" aria-hidden="true"><span class="eyebrow">${text('BOARDING PASS','כרטיס עלייה למטוס')}</span><h2>${text('Every journey starts with a check‑in.','כל מסע מתחיל בצ׳ק‑אין.')}</h2><div class="auth-route"><div class="auth-airport"><b>TLV</b><small>${text('Tel Aviv','תל אביב')}</small></div><div class="auth-path"><svg viewBox="0 0 200 60" preserveAspectRatio="none"><path d="M4 54 Q100 -14 196 54"/></svg><span class="auth-plane">${icons.plane}</span></div><div class="auth-airport"><b class="auth-dest">${code}</b><small class="auth-dest-city">${text(cityEn,cityHe)}</small></div></div><div class="auth-pass-meta"><div><small>${text('FLIGHT','טיסה')}</small><b dir="ltr">RT 2026</b></div><div><small>${text('GATE','שער')}</small><b>A1</b></div><div><small>${text('SEAT','מושב')}</small><b>${text('Family','משפחה')} ♡</b></div></div></div><div class="card auth-card"><span class="eyebrow">${text('YOUR PERSONAL TRAVEL SPACE','מרחב הטיולים האישי שלכם')}</span><h1>${recovery?text('Choose a new password','בחירת סיסמה חדשה'):reset?text('Reset your password','איפוס סיסמה'):signup?text('Create your account','יצירת חשבון'):text('Welcome back','ברוכים השבים')}</h1><p class="muted">${text('Your trips, saved to your account. Ready on every device.','הטיולים שלכם נשמרים בחשבון וזמינים מכל מכשיר.')}</p><form id="authForm">${recovery?'':`<label class="field">${text('Email','כתובת מייל')}<span class="auth-input">${icons.mail}<input name="email" type="email" autocomplete="email" required maxlength="254" dir="ltr" placeholder="you@example.com"></span></label>`}${reset?'':`<label class="field">${text('Password','סיסמה')}<span class="auth-input">${icons.lock}<input name="password" type="password" autocomplete="${signup||recovery?'new-password':'current-password'}" minlength="${signup||recovery?'10':'1'}" maxlength="128" required dir="ltr"></span></label>`}${signup||recovery?`<small>${text('Use at least 10 characters.','בחרו סיסמה עם 10 תווים לפחות.')}</small>`:''}<button type="submit" class="primary auth-submit">${recovery?text('Save password','שמירת סיסמה'):reset?text('Send reset link','שליחת קישור לאיפוס'):signup?text('Create account','יצירת חשבון'):text('Sign in','כניסה')}${icons.plane}</button><p role="status" aria-live="polite"></p></form>${recovery?'':`<div class="auth-links"><button data-mode="${signup||reset?'login':'signup'}">${signup||reset?text('Back to sign in','חזרה לכניסה'):text('Create an account','יצירת חשבון')}</button>${reset?'':`<button data-mode="reset">${text('Forgot password?','שכחתם סיסמה?')}</button>`}</div>`}<small class="muted auth-note">${text('Flight reminder emails will be available after the email service is connected.','תזכורות טיסה במייל יהיו זמינות לאחר חיבור שירות הדיוור.')}</small></div></div>`;
 gate.querySelector('#authLanguage').onclick=()=>{language=language==='en'?'he':'en';localStorage.setItem('roam-language',language);showGate()};
 gate.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{mode=b.dataset.mode;showGate()});
 gate.querySelector('form').onsubmit=submit;
 clearInterval(destinationTimer);
 if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 let index=0;
 destinationTimer=setInterval(()=>{
  const dest=gate.querySelector('.auth-dest'),city=gate.querySelector('.auth-dest-city');
  if(!dest||gate.hidden){clearInterval(destinationTimer);return}
  index=(index+1)%destinations.length;const [c,en,he]=destinations[index];
  dest.textContent=c;city.textContent=text(en,he);
  dest.parentElement.classList.remove('flip');void dest.offsetWidth;dest.parentElement.classList.add('flip');
 },2800);
}
async function submit(e){
 e.preventDefault();if(!client){message(text('Account connection is not configured yet.','חיבור החשבונות עדיין אינו מוגדר.'));return}
 const form=e.target,b=form.querySelector('[type=submit]'),email=form.elements.email?.value.trim(),password=form.elements.password?.value;
 b.disabled=true;message(text('Please wait…','רגע אחד…'));
 try{
  let result;
  const redirect=location.origin+location.pathname;
  if(mode==='signup')result=await client.auth.signUp({email,password,options:{emailRedirectTo:redirect}});
  else if(mode==='reset')result=await client.auth.resetPasswordForEmail(email,{redirectTo:redirect+'?reset=1'});
  else if(mode==='update')result=await client.auth.updateUser({password});
  else result=await client.auth.signInWithPassword({email,password});
  if(result.error)throw result.error;
  form.reset();
  if(mode==='reset'||(mode==='signup'&&!result.data.session)){message(text('Check your email for a confirmation link. If it does not arrive, check spam or try again later.','בדקו במייל את קישור האישור. אם לא הגיע, בדקו בדואר זבל או נסו שוב מאוחר יותר.'));return}
  if(mode==='update'){sessionStorage.removeItem('roam-password-recovery');history.replaceState(null,'',location.pathname);mode='login';message(text('Password saved. Opening your trips…','הסיסמה נשמרה. פותח את הטיולים…'));if(loaded){gate.hidden=true;document.body.classList.remove('auth-locked')}else await openAccount((await client.auth.getSession()).data.session);return}
  await openAccount(result.data.session);
 }catch(error){message(error.status===429?text('Too many requests. Please wait and try again.','בוצעו יותר מדי בקשות. המתינו ונסו שוב.'):mode==='login'?text('Could not sign in. Check your email, password and email confirmation.','לא הצלחנו להתחבר. בדקו את המייל, הסיסמה ואישור כתובת המייל.'):text('The request could not be completed. Check the details or try again later.','לא ניתן להשלים את הבקשה. בדקו את הפרטים או נסו שוב מאוחר יותר.'))}
 finally{b.disabled=false}
}
async function openAccount(session){
 if(!session?.user||mode==='update')return; if(loaded)return;
 user=session.user;
 message(text('Loading your trips…','טוען את הטיולים שלכם…'));
 const {data,error}=await client.from('roam_workspaces').select('data,revision').eq('owner_id',user.id).maybeSingle();
 if(error){message(text('Could not load your trips. Please try signing in again.','לא ניתן לטעון את הטיולים. נסו להתחבר שוב.'));return}
 revision=data?.revision||0;
 window.ROAM_ACCOUNT={id:user.id,email:user.email,state:data?.data||{version:1,selected:null,trips:[]},commit};
 const script=document.createElement('script');script.src='app.js?v=20261028-stays1';
 script.onload=()=>{if(!window.ROAM_APP_READY){message(text('Could not open your saved trips. Your account data has not changed.','לא ניתן לפתוח את הטיולים. הנתונים בחשבון לא שונו.'));return}loaded=true;if(mode==='update'){showGate();return}gate.hidden=true;document.body.classList.remove('auth-locked');renderAccountBar()};
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
 bar.innerHTML=`<span class="account-avatar" aria-hidden="true">${safe((user.email||'?')[0].toUpperCase())}</span><span class="account-email" dir="ltr">${safe(user.email)}</span><small id="cloudStatus">${text('Saved to your account','נשמר בחשבון שלכם')}</small><button id="localTripsImport" hidden>${text('Import trips from this device','העברת טיולים מהמכשיר לחשבון')}</button><button id="accountSignOut">${text('Sign out','יציאה מהחשבון')}</button>`;
 const legacy=localStorage.getItem('roam-data');
 if(legacy){const button=bar.querySelector('#localTripsImport');button.hidden=false;button.onclick=()=>window.dispatchEvent(new CustomEvent('roam-import-local'))}
 bar.querySelector('#accountSignOut').onclick=async()=>{await queue;if(failed)return;const {error}=await client.auth.signOut();if(!error)location.reload();else setStatus(text('Sign out failed. Please try again.','היציאה נכשלה. נסו שוב.'))};
}
showGate();
if(config?.url&&config?.key){
 client=createClient(config.url,config.key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
 client.auth.onAuthStateChange((event,session)=>{
  if(event==='PASSWORD_RECOVERY'){sessionStorage.setItem('roam-password-recovery','1');mode='update';showGate()}
  if(event==='SIGNED_OUT'&&loaded)location.reload();
  if(event==='SIGNED_IN'&&loaded&&session?.user.id!==user?.id)location.reload();
 });
 const {data,error}=await client.auth.getSession();
 if(mode==='update'){
  if(error||!data.session){mode='reset';sessionStorage.removeItem('roam-password-recovery');showGate();message(text('Request a new reset email, then open the newest link.','בקשו מייל איפוס חדש ופתחו את הקישור האחרון שקיבלתם.'))}
 }else if(!error&&data.session)await openAccount(data.session);
}

