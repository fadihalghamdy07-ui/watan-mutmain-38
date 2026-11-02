/* وطن مطمئن 38 — الحفظ المرحلي: قياس قبلي ثم مشاركة ثم قياس بعدي.
   تحفظ الأسماء والإجابات الخاصة في جداول لا تتيح القراءة العامة.
   يتطلب الملف تحميله بعد script المنصة الأصلي، بدلا من w38-persistence.js.
*/
(function () {
  'use strict';
  const API = 'https://ddlkaqpbogrolwuvntbb.supabase.co/rest/v1/';
  const PUBLIC_KEY = 'sb_publishable_FVo2S3pdcg8gZRnY1WJkJg_LSi3G0mD';
  const HEADERS = { apikey: PUBLIC_KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' };
  const IDKEY = 'w38_v3_active_participant';
  function newId() {
    if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
    const data = new Uint8Array(16);crypto.getRandomValues(data);
    data[6]=(data[6]&15)|64;data[8]=(data[8]&63)|128;
    const h=Array.from(data,v=>v.toString(16).padStart(2,'0')).join('');
    return [h.slice(0,8),h.slice(8,12),h.slice(12,16),h.slice(16,20),h.slice(20)].join('-');
  }
  const ROLES = ['طالبة', 'معلمة', 'ولي أمر', 'إدارية'];
  const QUESTIONS = [
    'أتحقق من صحة الأخبار والمعلومات قبل مشاركتها.',
    'أعرف كيف أتعامل مع الرسائل والروابط الإلكترونية المشبوهة.',
    'أحترم الآخرين وأساهم في الحوار الإيجابي داخل المدرسة والمجتمع.',
    'أحرص على المشاركة في الأعمال والمبادرات التي تخدم المجتمع.',
    'أتصرف بمسؤولية للمحافظة على أمن الوطن ومكتسباته.'
  ];
  const ANSWERS = [
    'لا أوافق إطلاقًا', 'لا أوافق', 'محايدة', 'أوافق', 'أوافق بشدة'
  ];
  const sending = new Set();
  const $ = (selector) => document.querySelector(selector);
  const safe = (value) => String(value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
  function localSet(key, value) { try {localStorage.setItem(key,JSON.stringify(value));return true;} catch(e) {return false;} }
  function localGet(key, fallback=null) { try {return JSON.parse(localStorage.getItem(key)) ?? fallback;} catch(e) {return fallback;} }
  function person() {
    const p=localGet(IDKEY);
    return p && /^[\da-f-]{36}$/i.test(p.id || '') && ROLES.includes(p.role) && typeof p.name==='string' && p.preDone ? p : null;
  }
  function wasActive() { const p=person();return p && localGet('w38_v3_activity_' + p.id, false)===true; }
  function saveActivity() { const p=person(); if (!p)return;localSet('w38_v3_activity_' + p.id,true);updateControls(); }
  async function post(table, payload) {
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),18000);
    try {
      const response=await fetch(API+table,{method:'POST',headers:HEADERS,body:JSON.stringify(payload),signal:controller.signal});
      if (!response.ok) {
        let details='';try{const body=await response.json(); details=body.code || body.message || '';}catch(e){}
        throw new Error('HTTP ' + response.status + ' ' + details);
      }
    } finally {clearTimeout(timer);}
  }
  function feedback(text) {
    if (typeof window.notice === 'function') {window.notice(text);return;}
    const result=document.createElement('p');result.className='result';result.setAttribute('role','status');result.textContent=text;
    $('#modalBody')?.append(result);
  }
  function saveIndividual(entry) {
    const p=person();
    if (!p)throw new Error('لا يوجد قياس قبلي مسجل على هذا الجهاز');
    return post('w38_named_entries',{pre_id:p.id,...entry});
  }
  async function publishAnonymously(activity,category,message) {
    const p=person();if(!p)return false;
    // إذا ذُكر اسم المشاركة في النص فلن ننشره للجميع، لكن يظل محفوظًا في السجل الخاص.
    if (message.includes(p.name) || /(?:\d|[٠-٩]){5,}/.test(message))return false;
    await post('watan_responses',{role:p.role,activity,category,message,approved:false});
    $('#refreshPublic')?.click();
    return true;
  }
  function progressMessage(message) {
    const label=$('#w38ParticipationStatus');if(label)label.textContent=message;
  }
  function updateControls() {
    const p=person();const pre=$('#w38PreSurveyButton'),after=$('#w38PostSurveyButton'),status=$('#w38ParticipationStatus');
    if (!pre || !after || !status)return;
    pre.textContent=p?'✅ القياس القبلي محفوظ':'📝 ابدئي بالقياس القبلي';
    pre.disabled=!!p;
    after.disabled=!p || !wasActive() || !!p.postDone;
    after.textContent=p?.postDone?'✅ القياس البعدي محفوظ':'📊 القياس البعدي بعد المشاركة';
    if (!p)status.textContent='الخطوة الأولى إلزامية: اكتبي الاسم والصفة وأجيبي عن أسئلة القياس القبلي الخمسة قبل المشاركة.';
    else if (p.postDone)status.textContent='✅ اكتمل القياس القبلي والبعدي لهذا المشارك، وحُفظت الإجابات في سجلات المدرسة.';
    else if (wasActive())status.textContent='اكتملت مشاركة واحدة على الأقل. الآن يمكنك تعبئة القياس البعدي وإرساله.';
    else status.textContent='✅ حُفظ القياس القبلي. شاركي في إحدى الفعاليات، ثم أكملي القياس البعدي.';
    const nameInput=$('#studentName');
    if(nameInput){nameInput.value=p?.name || '';nameInput.readOnly=!!p;nameInput.placeholder='اكتبي اسمك أولًا في القياس القبلي';}
    document.querySelectorAll('#communityForm .role-option').forEach(b=>{
      if(p){b.disabled=(b.dataset.role!==p.role);b.classList.toggle('active',b.dataset.role===p.role);b.setAttribute('aria-pressed',String(b.dataset.role===p.role));}
      else b.disabled=false;
    });
  }
  function addGuidance() {
    const head=$('#impact .section-head');
    if(head && !$('#w38SurveyControls')){
      const controls=document.createElement('div');controls.id='w38SurveyControls';
      controls.style.cssText='margin:18px auto;max-width:580px;background:#fff9e8;color:#153b33;border:1px solid #d0b87a;border-radius:16px;padding:16px;text-align:center';
      const title=document.createElement('strong');title.textContent='🇸🇦 رحلتكِ: قبلي ← مشاركة ← بعدي';controls.append(title);
      const status=document.createElement('p');status.id='w38ParticipationStatus';status.setAttribute('role','status');status.style.margin='12px 0';controls.append(status);
      const buttons=document.createElement('div');buttons.style.cssText='display:flex;flex-wrap:wrap;gap:10px;justify-content:center';
      const pre=document.createElement('button');pre.id='w38PreSurveyButton';pre.className='btn primary';pre.type='button';pre.onclick=()=>openSurvey('before');buttons.append(pre);
      const after=document.createElement('button');after.id='w38PostSurveyButton';after.className='btn primary';after.type='button';after.onclick=()=>openSurvey('after');buttons.append(after);
      controls.append(buttons);
      const restart=document.createElement('button');restart.type='button';restart.className='btn';restart.textContent='بدء مشاركة جديدة على هذا الجهاز';restart.style.cssText='display:block;margin:12px auto 0';
      restart.addEventListener('click',()=>{
        if(!confirm('هل تريدين بدء مشاركة لشخص آخر؟ سيتم فصل هذا الجهاز عن سجل المشارك الحالي، وتبقى استجاباته السابقة محفوظة في المدرسة.'))return;
        const old=person();
        try {localStorage.removeItem(IDKEY);localStorage.removeItem('w38_pledge');localStorage.removeItem('w38_survey');localStorage.removeItem('w38_complete');if(old)localStorage.removeItem('w38_v3_activity_'+old.id);}catch(e){}
        try{window.refresh?.();}catch(e){} updateControls();openSurvey('before');
      });controls.append(restart);
      head.insertAdjacentElement('afterend',controls);
    }
    const note=Array.from(document.querySelectorAll('#fingerprint p')).find(el=>el.textContent.includes('المشاركات لا تُرفع إلى خادم'));
    if(note)note.textContent='🔒 يُربط نص بصمتك باسمك وصفَتك من القياس القبلي في سجل خاص. لا يظهر الاسم في الجدار العام.';
    const label=$('label[for="studentName"]');if(label)label.textContent='اسم المشاركة (يُملأ من القياس القبلي)';
    const pledgeButton=$('#fingerprint button[onclick="savePledge()"]');
    if(pledgeButton&&!$('#w38PledgeStatus')){const p=document.createElement('p');p.id='w38PledgeStatus';p.className='participation-success';p.setAttribute('role','status');pledgeButton.after(p);}
    for (const id of ['wallActivity','communityActivity']) {
      const sel=document.getElementById(id);if(sel&&!Array.from(sel.options).some(x=>x.value==='بصمة وطن'))sel.add(new Option('بصمة وطن','بصمة وطن'));
    }
    updateControls();
  }
  function surveyForm(phase) {
    const isPre=phase==='before';const p=person();
    const title=isPre?'القياس القبلي — قبل المشاركة':'القياس البعدي — بعد المشاركة';
    let html='<h2 id="modalTitle">📊 '+title+'</h2><p>جميع الأسئلة الخمسة إلزامية. اختاري إجابة واحدة لكل سؤال.</p>';
    html+='<form id="w38SurveyForm" style="text-align:right">';
    if(isPre){
      html+='<label for="w38PersonName"><strong>اسم المشاركة أو المشارك (إلزامي)</strong></label>';
      html+='<input id="w38PersonName" class="field" name="participant_name" required minlength="2" maxlength="80" autocomplete="name" placeholder="اكتبي الاسم" />';
      html+='<label for="w38PersonRole"><strong>الصفة (إلزامية)</strong></label>';
      html+='<select id="w38PersonRole" class="field" required><option value="">اختاري الصفة</option>';
      ROLES.forEach(r=>{html+='<option value="'+safe(r)+'">'+safe(r)+'</option>'});html+='</select>';
    }else html+='<p style="background:#eff4ec;padding:10px;border-radius:10px">👤 الاسم: <strong>'+safe(p?.name||'')+'</strong> | الصفة: <strong>'+safe(p?.role||'')+'</strong></p>';
    QUESTIONS.forEach((q,i)=>{
      const n=i+1;html+='<fieldset style="border:1px solid #d2c292;border-radius:12px;margin:16px 0;padding:12px" data-q="'+n+'"><legend style="font-weight:700;white-space:normal">'+n+'. '+safe(q)+' <span style="color:#a73b2a">*</span></legend>';
      ANSWERS.forEach((a,j)=>{const value=j+1;html+='<label style="display:block;margin:8px 0;cursor:pointer"><input type="radio" name="w38q'+n+'" value="'+value+'" '+(j===0?'required ':'')+'style="margin-left:7px">'+safe(a)+'</label>'});
      html+='</fieldset>';
    });
    html+='<p id="w38FormStatus" role="status" style="font-weight:700;white-space:pre-wrap"></p>';
    html+='<button id="w38SubmitSurvey" class="btn primary" type="submit">'+(isPre?'✅ حفظ القياس القبلي والبدء بالمشاركة':'✅ حفظ القياس البعدي وإكمال المشاركة')+'</button>';
    html+='</form>';
    return html;
  }
  function openSurvey(phase) {
    const p=person();
    if(phase==='before' && p){progressMessage('تم حفظ القياس القبلي بالفعل. ابدئي مشاركة جديدة إذا كان الجهاز لمشارك آخر.');return;}
    if(phase==='after' && !p){return openSurvey('before');}
    if(phase==='after' && !wasActive()){progressMessage('أكملي إحدى مشاركات المبادرة أولًا؛ القياس البعدي يأتي بعد المشاركة.');return;}
    if(phase==='after' && p.postDone){progressMessage('تم حفظ القياس البعدي لهذا المشارك بالفعل.');return;}
    const body=$('#modalBody'),modal=$('#modal');if(!body||!modal)return;
    body.innerHTML=surveyForm(phase);
    modal.classList.add('open');modal.querySelector('.modal-inner')?.scrollTo(0,0);
    const form=$('#w38SurveyForm');form.addEventListener('submit',event=>submitSurveyForm(event,phase));
  }
  async function submitSurveyForm(event,phase) {
    event.preventDefault();
    if(sending.has('survey'))return;
    const form=event.currentTarget;
    if(!form.reportValidity())return;
    const status=$('#w38FormStatus');
    const answers={};let sum=0;
    for(let n=1;n<=5;n++){
      const selected=form.querySelector('input[name="w38q'+n+'"]:checked');
      if(!selected){status.textContent='⚠️ يجب الإجابة عن الأسئلة الخمسة كاملة.';return;}
      const score=Number(selected.value);if(!Number.isInteger(score)||score<1||score>5)return;
      answers[(phase==='before'?'before_q':'after_q')+n]=score;sum+=score;
    }
    const isPre=phase==='before';let candidate;
    if(isPre){
      const name=$('#w38PersonName')?.value.trim().replace(/\s+/g,' ');
      const role=$('#w38PersonRole')?.value;
      if(!name||name.length<2||name.length>80||!ROLES.includes(role)){status.textContent='⚠️ الاسم والصفة إلزاميان.';return;}
      const uid=newId();candidate={id:uid,name,role,preDone:true,postDone:false,beforeTotal:sum};
    }else{
      candidate=person();if(!candidate||!wasActive())return;
    }
    sending.add('survey');const btn=$('#w38SubmitSurvey');if(btn)btn.disabled=true;
    status.textContent='جارٍ حفظ إجاباتك في قاعدة بيانات المدرسة…';
    try {
      if(isPre){
        await post('w38_pre_surveys',{id:candidate.id,participant_name:candidate.name,role:candidate.role,...answers});
        try {['w38_pledge','w38_survey','w38_complete'].forEach(k=>localStorage.removeItem(k));} catch(e) {}
        localSet(IDKEY,candidate);
        try {window.refresh?.();} catch(e) {}
      }
      else {await post('w38_post_surveys',{pre_id:candidate.id,...answers});candidate.postDone=true;candidate.afterTotal=sum;localSet(IDKEY,candidate);}
      status.textContent=isPre?'✅ تم حفظ القياس القبلي باسمك وصفتك. الآن ابدئي المشاركة في إحدى فعاليات المبادرة.':'✅ تم حفظ القياس البعدي باسمك وصفتك. مجموعك القبلي '+(candidate.beforeTotal??'—')+' من ٢٥، والبعدي '+sum+' من ٢٥.';
      updateControls();
      const next=document.createElement('button');next.type='button';next.className='btn primary';next.style.marginTop='12px';next.textContent=isPre?'✨ الانتقال إلى الفعاليات':'🇸🇦 إنهاء القياس';
      next.onclick=()=>{$('#modal')?.classList.remove('open');$('#stations')?.scrollIntoView({behavior:'smooth'});};
      form.append(next);
      if(btn)btn.remove();
    }catch(e){console.error('W38 survey save failed:',e);status.textContent='⚠️ لم تُحفظ الإجابات في قاعدة البيانات. افحصي الاتصال ثم اضغطي حفظ مرة أخرى. لا تغلقي هذه النافذة.';}
    finally{sending.delete('survey');if(btn)btn.disabled=false;}
  }
  // اطلبي القياس القبلي أولًا قبل فتح أي محطة.
  const originalOpen=window.openStation;
  window.openStation=function(n){
    if(n===6)return openSurvey(person()?'after':'before');
    if(!person())return openSurvey('before');
    return originalOpen(n);
  };
  window.submitSurvey=function(){return openSurvey(person()?'after':'before');};
  // سجل بصمة وطن الخاص + نسخة عامة بدون اسم عندما يجيزها فحص المحتوى.
  window.savePledge=async function(){
    if(!person())return openSurvey('before');
    if(sending.has('pledge'))return;
    const message=$('#pledge')?.value.trim()||'';
    const status=$('#w38PledgeStatus');
    if(message.length<8||message.length>240){if(status)status.textContent='اكتبي بصمة من ٨ إلى ٢٤٠ حرفًا.';return;}
    sending.add('pledge');const btn=$('#fingerprint button[onclick="savePledge()"]');if(btn)btn.disabled=true;
    if(status)status.textContent='جارٍ حفظ بصمتك باسمك في سجل المدرسة…';
    try {
      await saveIndividual({kind:'fingerprint',activity:'بصمة وطن',message});
      localSet('w38_pledge',{name:person().name,text:message});window.refresh?.();
      saveActivity();if(status)status.textContent='✅ حُفظت بصمتك باسمك وصفتك في السجل الخاص.';
      try{const isPublic=await publishAnonymously('بصمة وطن','بصمة وطنية',message);if(status)status.textContent+=isPublic?' وقد تظهر للجميع دون اسم بعد الفحص الأولي.':' النص محفوظ خاصةً ولم يُنشر على الجدار العام.';}catch(err){console.warn('Public wall skipped:',err);}
    }catch(e){console.error(e);if(status)status.textContent='⚠️ تعذّر حفظ البصمة في قاعدة البيانات. تحققي من الاتصال وأعيدي الضغط على الزر.';}
    finally{sending.delete('pledge');if(btn)btn.disabled=false;}
  };
  function markStation(n,text){
    try {localSet('w38_station'+n,text);window.mark?.(n);}catch(e){}
    saveActivity();
  }
  async function submitNamed(kind,n,activity,category,message,allowPublic=true){
    if(!person())return openSurvey('before');
    const key='task'+n;if(sending.has(key))return;
    if(message.length<3||message.length>500){feedback('اكتبي مشاركة مناسبة ثم حاولي مجددًا.');return;}
    sending.add(key);feedback('جارٍ حفظ مشاركتك باسمك وصفتك في سجل المدرسة…');
    try{
      await saveIndividual({kind,activity,message});markStation(n,message);
      feedback('✅ تم حفظ مشاركتك باسمك وصفتك في سجل المدرسة.');
      if(allowPublic){try{const ok=await publishAnonymously(activity,category,message);if(ok)feedback('🌟 يمكن أن تظهر المشاركة في الجدار العام دون اسم بعد الفحص الأولي.');}catch(e){console.warn('Public wall skipped:',e);}}
    }catch(e){console.error(e);feedback('⚠️ لم تصل المشاركة إلى قاعدة البيانات، تحققي من الاتصال وأعيدي المحاولة.');}
    finally{sending.delete(key);}
  }
  window.submitText=function(n){
    if(!person())return openSurvey('before');
    const msg=$('#stationText')?.value.trim()||'';if(msg.length<8)return feedback('اكتبي ثمانية أحرف على الأقل.');
    if(n===2)return submitNamed('message',2,'رسالة اطمئنان','رسالة وطنية',msg);
    if(n===4)return submitNamed('idea',4,'مجلس وطن مطمئن','فكرة أو مقترح',msg);
    return feedback('اختاري فعالية مناسبة.');
  };
  window.submitSimple=function(n){
    if(!person())return openSurvey('before');
    const choice=$('#modalBody .choice.selected');if(!choice)return feedback('اختاري إجابة أولًا.');
    const msg=choice.textContent.trim();
    if(n===1)return submitNamed('mission',1,'سفيرات الطمأنينة','فكرة أو مقترح',msg,false);
    if(n===5)return submitNamed('action',5,'الطمأنينة فعل','مبادرة تطوعية',msg);
  };
  window.submitQuiz=function(){
    if(!person())return openSurvey('before');
    const choice=$('#modalBody .choice.selected');if(!choice)return feedback('اختاري إجابة أولًا.');
    if(choice.dataset.good!=='true')return feedback('حاولي مجددًا، وتحققي من المصدر الرسمي قبل النشر.');
    return submitNamed('quiz',3,'مختبر الوعي الرقمي','تجربة أو إنجاز',choice.textContent.trim(),false);
  };
  // إرسال جدار المشاركات الأصلي يبقى كما هو، لكنه يتطلب قياسًا قبليًا؛ وتُحفظ نسخة داخلية مرتبطة بالاسم.
  const communityForm=$('#communityForm');
  let communitySnapshot=null;
  communityForm?.addEventListener('submit',event=>{
    const p=person();
    if(!p){event.preventDefault();event.stopImmediatePropagation();openSurvey('before');return;}
    const message=$('#communityMessage')?.value.trim()||'';
    const activity=$('#communityActivity')?.value||'';
    if(message.includes(p.name)){
      event.preventDefault();event.stopImmediatePropagation();
      $('#communityStatus').textContent='🔒 لا تكتبي اسمك داخل نص المشاركة العامة. الاسم محفوظ بالفعل في سجل المدرسة الخاص.';
      return;
    }
    const button=Array.from(document.querySelectorAll('#communityForm .role-option')).find(x=>x.dataset.role===p.role);
    if(button){button.disabled=false;button.click();}
    communitySnapshot=(message.length>=8&&activity)?{message,activity}:null;
  },true);
  const communityStatus=$('#communityStatus');
  if(communityStatus){
    const observer=new MutationObserver(()=>{
      if(!communityStatus.textContent.startsWith('✅')||!communitySnapshot)return;
      const data=communitySnapshot;communitySnapshot=null;
      saveActivity();
      saveIndividual({kind:'general',activity:data.activity,message:data.message})
        .catch(error=>{console.warn('Named copy of public participation not saved:',error);communityStatus.textContent+=' ⚠️ لم تُحفظ النسخة المرتبطة بالاسم؛ أعيدي المحاولة عند الحاجة.';});
    });observer.observe(communityStatus,{childList:true,characterData:true,subtree:true});
  }
  addGuidance();
})();
