/* وطن مطمئن 38 — الإصدار السابع: رحلة إلزامية مترابطة مع توثيق كل مرحلة في Supabase.
   بصمة دخول ← نشيد ← قياس قبلي ← بصمة وطن ← 6 فعاليات ← قياس بعدي ← تسليم نهائي.
   تنويه: استكمال النموذج الرقمي ليس بديلاً عن تنفيذ فعاليات المبادرة الواقعية وتوثيقها.
*/
(function () {
  'use strict';
  const API='https://ddlkaqpbogrolwuvntbb.supabase.co/rest/v1/';
  const PUBLIC_KEY='sb_publishable_FVo2S3pdcg8gZRnY1WJkJg_LSi3G0mD';
  const HEADERS={apikey:PUBLIC_KEY,'Content-Type':'application/json',Prefer:'return=minimal'};
  const IDKEY='w38_v5_active_participant';
  const ROLES=['طالبة','معلمة','ولي أمر','إدارية'];
  const QUESTIONS=[
    'أتحقق من صحة الأخبار والمعلومات قبل مشاركتها.',
    'أعرف كيف أتعامل مع الرسائل والروابط الإلكترونية المشبوهة.',
    'أحترم الآخرين وأساهم في الحوار الإيجابي داخل المدرسة والمجتمع.',
    'أحرص على المشاركة في الأعمال والمبادرات التي تخدم المجتمع.',
    'أتصرف بمسؤولية للمحافظة على أمن الوطن ومكتسباته.'
  ];
  const ANSWERS=['لا أوافق إطلاقًا','لا أوافق','محايدة','أوافق','أوافق بشدة'];
  const ACTIVITIES=['سفير الطمأنينة','رسالة اطمئنان','مختبر الوعي الرقمي','مجلس وطن مطمئن','الطمأنينة فعل','نبض الطمأنينة المجتمعي'];
  const TOPICS=['التحقق من الأخبار ومصادرها','التعامل الآمن مع الروابط المجهولة','الحوار والطمأنينة النفسية','التطوع وخدمة المجتمع','معرفة الجهات والقنوات الرسمية'];
  const SOURCES=['القنوات والجهات الحكومية الرسمية','المدرسة والمعلمات','الأسرة','أحتاج إلى إرشاد لمعرفة المصادر الرسمية'];
  const $=s=>document.querySelector(s);
  const safe=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const memory=new Map(),sending=new Set();
  function store(k,v){memory.set(k,v);try{localStorage.setItem(k,JSON.stringify(v));return true;}catch(e){return false;}}
  function load(k,d=null){try{const value=localStorage.getItem(k);return value===null?(memory.get(k)??d):(JSON.parse(value)??memory.get(k)??d);}catch(e){return memory.get(k)??d;}}
  function remove(k){memory.delete(k);try{localStorage.removeItem(k);}catch(e){}}
  // الإصدار الخامس مستقل تماماً عن هوية المشارك السابقة (v3/v4): لا ننقل اسماً قديماً إلى زائر جديد.
  // نحذف بقايا العرض المحلي القديم فقط؛ السجلات المحفوظة في Supabase لا تُمس.
  if(!load(IDKEY)) {
    ['w38_pledge','w38_survey','w38_complete'].forEach(remove);
    for(let n=1;n<=6;n++)remove('w38_station'+n);
  }

  function uuid(){if(crypto.randomUUID)return crypto.randomUUID();const a=new Uint8Array(16);crypto.getRandomValues(a);a[6]=(a[6]&15)|64;a[8]=(a[8]&63)|128;const x=Array.from(a,v=>v.toString(16).padStart(2,'0')).join('');return [x.slice(0,8),x.slice(8,12),x.slice(12,16),x.slice(16,20),x.slice(20)].join('-');}
  function participant(){const p=load(IDKEY);return p&&/^[0-9a-f-]{36}$/i.test(p.id||'')&&p.preDone&&ROLES.includes(p.role)&&typeof p.name==='string'?p:null;}
  function doneKey(){return 'w38_v5_done_'+participant()?.id;}
  function stages(){return participant() ? load(doneKey(),[]).filter(n=>Number.isInteger(n)&&n>=1&&n<=6):[];}
  function completeAll(){return stages().length===6&&[1,2,3,4,5,6].every(n=>stages().includes(n));}
  function pledgeDone(){return !!participant()?.pledgeDone;}
  function markStage(n){const s=stages();if(!s.includes(n))s.push(n);store(doneKey(),s);updateUI();}
  function nextStage(){for(let n=1;n<=6;n++)if(!stages().includes(n))return n;return 0;}
  function scrollTo(id){$('#'+id)?.scrollIntoView({behavior:'smooth',block:'start'});}
  function notice(text){const p=document.createElement('p');p.className='result';p.setAttribute('role','status');p.textContent=text;$('#modalBody')?.append(p);}
  function modal(html){const el=$('#modal'),body=$('#modalBody');if(!el||!body)return;body.innerHTML=html;el.classList.add('open');el.querySelector('.modal-inner')?.scrollTo(0,0);}
  function errorText(e){return (e instanceof Error?e.message:String(e)).slice(0,140);}
  async function apiPost(table,payload){const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),18000);try{
    const response=await fetch(API+table,{method:'POST',headers:HEADERS,body:JSON.stringify(payload),signal:ctl.signal});
    if(!response.ok){let detail='';try{const j=await response.json();detail=j.code||j.message||'';}catch(e){}throw new Error('HTTP '+response.status+' '+detail);}
  }finally{clearTimeout(timer);}}
  function saveEntry(entry){const p=participant();if(!p)throw new Error('أكملي القياس القبلي أولًا');return apiPost('w38_named_entries',{pre_id:p.id,...entry});}
  async function publishPublic(activity,category,message){const p=participant();if(!p||message.includes(p.name)||/(?:\d|[٠-٩]){5,}/.test(message))return false;
    await apiPost('watan_responses',{role:p.role,activity,category,message,approved:false});$('#refreshPublic')?.click();return true;
  }
  function addGuidance(){
    const head=$('#impact .section-head');
    if(head&&!$('#w38Journey')){
      const c=document.createElement('div');c.id='w38Journey';c.style.cssText='margin:16px auto 24px;max-width:720px;background:#fff9e8;color:#17443b;border:2px solid #d3b57a;border-radius:18px;padding:18px;text-align:center;box-shadow:0 6px 24px #00000011';
      c.innerHTML='<strong style="font-size:19px">🇸🇦 رحلة وطن مطمئن 38</strong><p style="margin:10px 0;line-height:2">البصمة الافتتاحية ← النشيد الوطني ← القبلي ← بصمة وطن ← الفعاليات الست ← البعدي ← التسليم</p><p id="w38JourneyStatus" role="status" style="font-weight:700"></p><div id="w38JourneyButtons" style="display:flex;justify-content:center;gap:9px;flex-wrap:wrap"></div><p style="font-size:12px;color:#476259;margin-top:12px">لا يُعتمد التسليم النهائي إلا بعد وصول جميع المتطلبات إلى قاعدة البيانات. وتظل الأعمال المدرسية الفعلية مطلوبة وفق التعميم.</p>';
      head.insertAdjacentElement('afterend',c);
      const bar=$('#w38JourneyButtons');
      const b=document.createElement('button');b.id='w38PreButton';b.type='button';b.className='btn primary';b.onclick=()=>openSurvey('before');bar.append(b);
      const a=document.createElement('button');a.id='w38PostButton';a.type='button';a.className='btn primary';a.onclick=()=>openSurvey('after');bar.append(a);
      const f=document.createElement('button');f.id='w38FinishButton';f.type='button';f.className='btn primary';f.onclick=()=>finalSubmit();bar.append(f);
    }
    const guide=$('#stations .section-head p');if(guide)guide.textContent='ست فعاليات وفق تعميم تعليم تبوك، تُنجز بالترتيب ثم يظهر القياس البعدي تلقائيًا';
    const old=$('#stations .shell > p.muted');if(old)old.textContent='تُحفظ استجابات الفعاليات في السجل الخاص بالمبادرة باسم المشاركة وصفتها، دون نشرهما للعموم.';
    const label=$('label[for="studentName"]');if(label)label.textContent='اسم المشاركة المسجّل في الاستبانة القبلية (للعرض فقط)';
    const pledgeButton=$('#fingerprint button[onclick="savePledge()"]');if(pledgeButton&&!$('#w38PledgeStatus')){
      const status=document.createElement('p');status.id='w38PledgeStatus';status.style.cssText='font-weight:700;margin-top:12px';status.setAttribute('role','status');pledgeButton.after(status);
    }
    for(const name of ['wallActivity','communityActivity']){const sel=$('#'+name);if(sel&&!Array.from(sel.options).some(o=>o.value==='بصمة وطن'))sel.add(new Option('بصمة وطن','بصمة وطن'));}
    const sixth=Array.from(document.querySelectorAll('#stationGrid article')).find((_,i)=>i===5);
    if(sixth){const p=sixth.querySelector('p');if(p)p.textContent='استبانة الاحتياجات المعرفية والمصادر الرسمية، مستقلة عن القياس القبلي والبعدي.';}
    updateUI();
  }
  function updateUI(){
    const p=participant(),completed=stages(),count=completed.length;
    if($('#w38PreButton')){$('#w38PreButton').textContent=p?'✅ القبلي محفوظ':'📝 الاستبانة القبلية';$('#w38PreButton').disabled=!!p;}
    if($('#w38PostButton')){$('#w38PostButton').textContent=p?.postDone?'✅ البعدي محفوظ':'📊 الاستبانة البعدية';$('#w38PostButton').disabled=!p||!p.pledgeDone||!completeAll()||!!p.postDone;}
    if($('#w38FinishButton')){$('#w38FinishButton').textContent=p?.finalDone?'✅ تم التسليم':'🏅 التسليم النهائي';$('#w38FinishButton').disabled=!p||!p.postDone||!completeAll()||!!p.finalDone;}
    const stat=$('#w38JourneyStatus');
    if(stat){if(!p)stat.textContent='بعد البصمة والنشيد الوطني يظهر القياس القبلي الإلزامي، وتدخل كل مشاركة اسمها وصفَتها بنفسها.';
      else if(!p.pledgeDone)stat.textContent='✅ حُفظ القياس القبلي. الآن اكتبي بصمة وطن لتنتقلي إلى الفعاليات.';
      else if(!completeAll())stat.textContent='✅ حفظنا بصمة وطن. الفعاليات المكتملة: '+count+' من ٦. التالية: '+ACTIVITIES[nextStage()-1]+'.';
      else if(!p.postDone)stat.textContent='✅ اكتملت الفعاليات الست. الآن الاختبار البعدي إلزامي.';
      else if(!p.finalDone)stat.textContent='✅ حُفظ الاختبار البعدي. بقي التسليم النهائي.';
      else stat.textContent='✅ تم تسليم الرحلة كاملة وحفظها في قاعدة بيانات المدرسة.';
    }
    // لا تظهر خانة البصمة الوطنية أو الفعاليات قبل إكمال الخطوات السابقة.
    const fingerprintSection=$('#fingerprint');if(fingerprintSection)fingerprintSection.style.display=p?'':'none';
    const stationsSection=$('#stations');if(stationsSection)stationsSection.style.display=p?.pledgeDone?'':'none';
    const impactSection=$('#impact');if(impactSection)impactSection.style.display=p?.pledgeDone?'':'none';
    const name=$('#studentName');if(name){
      name.value=p?.name||'';
      name.readOnly=true;
      name.autocomplete='off';
      name.placeholder=p?'اسم المشاركة محفوظ من الاستبانة القبلية':'يُكتب الاسم أولاً في الاستبانة القبلية';
      name.setAttribute('aria-label','اسم المشاركة محفوظ من القياس القبلي');
    }

    const counter=$('#countBadge');if(counter)counter.textContent=count+' من ٦';
    const progress=$('#progressBar');if(progress)progress.style.width=Math.round(count/6*100)+'%';
    document.querySelectorAll('#stationGrid article').forEach((card,i)=>{
      const n=i+1,finished=completed.includes(n);
      card.style.outline=finished?'2px solid #c4a15b':'';
      const btn=card.querySelector('button');if(btn){btn.textContent=finished?'✅ مكتملة — عرض الفعالية':n===6?'إكمال نبض الطمأنينة ←':'شاركي في الفعالية ←';}
    });
    document.querySelectorAll('#communityForm .role-option').forEach(b=>{if(p){b.disabled=b.dataset.role!==p.role;b.classList.toggle('active',b.dataset.role===p.role);b.setAttribute('aria-pressed',String(b.dataset.role===p.role));}else b.disabled=false;});
    syncStrictJourney();
  }
  function surveyHtml(phase){const isPre=phase==='before',p=participant();let h='<h2 id="modalTitle">'+(isPre?'📝 القياس القبلي — قبل بصمة وطن والفعاليات':'📊 القياس البعدي — بعد الفعاليات الست')+'</h2><p>جميع الأسئلة الخمسة إلزامية ويجب حفظها في قاعدة البيانات قبل الانتقال.</p><form id="w38SurveyForm">';
    if(isPre){h+='<label for="w38Name"><strong>الاسم (إلزامي)</strong></label><input id="w38Name" class="field" required minlength="2" maxlength="80" autocomplete="off" placeholder="اكتبي الاسم لأول مرة هنا" />';
      h+='<label for="w38Role"><strong>الصفة (إلزامية)</strong></label><select id="w38Role" class="field" required><option value="">اختاري الصفة</option>'+ROLES.map(r=>'<option>'+safe(r)+'</option>').join('')+'</select>';
    }else{h+='<p style="background:#edf4ec;padding:12px;border-radius:11px">👤 '+safe(p?.name||'')+' — '+safe(p?.role||'')+'</p>';}
    QUESTIONS.forEach((q,i)=>{const n=i+1;h+='<fieldset style="border:1px solid #d6c69b;padding:12px;border-radius:12px;margin:14px 0"><legend style="font-weight:700;white-space:normal">'+n+'- '+safe(q)+' *</legend>';
      ANSWERS.forEach((a,j)=>{h+='<label style="display:block;padding:5px 0"><input type="radio" name="w38q'+n+'" value="'+(j+1)+'" '+(j===0?'required ':'')+'style="margin-left:8px">'+safe(a)+'</label>';});h+='</fieldset>';});
    h+='<p id="w38FormStatus" role="status" style="font-weight:700;white-space:pre-wrap"></p><button id="w38SaveSurvey" class="btn primary" type="submit">'+(isPre?'حفظ القبلي والانتقال لبصمة وطن':'حفظ البعدي والانتقال للتسليم')+'</button></form>';return h;
  }
  function openSurvey(phase){const p=participant();if(phase==='before'&&p){scrollTo(p.pledgeDone?'stations':'fingerprint');return;}
    if(phase==='after'&&!p){return openSurvey('before');}
    if(phase==='after'&&(!p.pledgeDone||!completeAll())){notice('أكملي بصمة وطن وجميع الفعاليات الست قبل القياس البعدي.');scrollTo(p.pledgeDone?'stations':'fingerprint');return;}
    if(phase==='after'&&p.postDone){finalScreen();return;}
    modal(surveyHtml(phase));$('#w38SurveyForm')?.addEventListener('submit',e=>saveSurvey(e,phase));
  }
  async function saveSurvey(event,phase){event.preventDefault();if(sending.has('survey'))return;const form=event.currentTarget;if(!form.reportValidity())return;
    const box=$('#w38FormStatus'),payload={};let sum=0;
    for(let i=1;i<=5;i++){const selected=form.querySelector('input[name="w38q'+i+'"]:checked');if(!selected){box.textContent='جميع الأسئلة الخمسة إلزامية.';return;}const n=Number(selected.value);payload[(phase==='before'?'before_q':'after_q')+i]=n;sum+=n;}
    let p;if(phase==='before'){const name=$('#w38Name')?.value.trim().replace(/\s+/g,' '),role=$('#w38Role')?.value;if(!name||name.length<2||!ROLES.includes(role)){box.textContent='أكملي الاسم والصفة.';return;}p={id:uuid(),name,role,preDone:true,pledgeDone:false,postDone:false,finalDone:false,beforeTotal:sum};}
    else{p=participant();if(!p||!completeAll())return;}
    const btn=$('#w38SaveSurvey');btn.disabled=true;sending.add('survey');box.textContent='جارٍ حفظ الإجابات في قاعدة البيانات…';
    try{
      if(phase==='before'){
        await apiPost('w38_pre_surveys',{id:p.id,participant_name:p.name,role:p.role,...payload});
        ['w38_pledge','w38_complete','w38_survey'].forEach(remove);const stored=store(IDKEY,p);remove('w38_v5_done_'+p.id);
        box.textContent='✅ وصل القياس القبلي إلى قاعدة البيانات. رقم التأكيد: '+p.id.slice(-8)+(stored?'':' — تنبيه: لا تغلقي الصفحة لأن المتصفح يمنع التخزين المحلي.');
      }else{
        await apiPost('w38_post_surveys',{pre_id:p.id,...payload});p.postDone=true;p.afterTotal=sum;store(IDKEY,p);
        box.textContent='✅ وصل القياس البعدي إلى قاعدة البيانات. نتيجتك القبلية '+(p.beforeTotal||'—')+' من ٢٥ والبعدية '+sum+' من ٢٥.';
      }
      updateUI();btn.remove();
      if(phase==='before'){
        $('#modal')?.classList.remove('open');
        if($('#w38PledgeStatus'))$('#w38PledgeStatus').textContent='✅ حُفظ القياس القبلي بنجاح. الآن اكتبي بصمة وطن واضغطي حفظ.';
        scrollTo('fingerprint');
      }else{
        // لا تسمحي بترك الصفحة قبل الخطوة الأخيرة: التسليم النهائي.
        finalScreen();
      }
    }catch(e){box.textContent='⚠️ لم تصل الإجابات. '+errorText(e)+'؛ أعيدي الضغط على حفظ.';btn.disabled=false;}
    finally{sending.delete('survey');}
  }
  function redirectStage(n){const needed=nextStage();if(n>needed){notice('أكملي المحطة السابقة أولًا: '+ACTIVITIES[needed-1]+'.');scrollTo('stations');return false;}return true;}
  const originalOpen=window.openStation;
  window.openStation=function(n){const p=participant();if(!p)return openSurvey('before');if(!p.pledgeDone){scrollTo('fingerprint');return;}
    if(p.postDone)return finalScreen();
    if(n<1||n>6)return;
    if(!redirectStage(n))return;
    if(n===6)return openPulse();return originalOpen(n);
  };
  window.submitSurvey=()=>openSurvey('after');
  window.savePledge=async function(){const p=participant();if(!p)return openSurvey('before');if(p.pledgeDone){scrollTo('stations');return;}
    if(sending.has('pledge'))return;const message=$('#pledge')?.value.trim()||'',status=$('#w38PledgeStatus');if(message.length<8||message.length>240){if(status)status.textContent='اكتبي بصمة وطن من ٨ إلى ٢٤٠ حرفًا.';return;}
    const btn=$('#fingerprint button[onclick="savePledge()"]');if(btn)btn.disabled=true;sending.add('pledge');if(status)status.textContent='جارٍ حفظ بصمة وطن باسمك وصفتك…';
    try{await saveEntry({kind:'fingerprint',activity:'بصمة وطن',message});p.pledgeDone=true;store(IDKEY,p);store('w38_pledge',{name:p.name,text:message});try{window.refresh?.();}catch(e){}updateUI();
      if(status)status.textContent='✅ حُفظت بصمة وطن. انتقلي الآن إلى الفعاليات الست.';
      scrollTo('stations');
      window.openStation(1); // بعد حفظ البصمة تبدأ المحطة الأولى تلقائيًا.
      publishPublic('بصمة وطن','بصمة وطنية',message).catch(e=>console.warn('Optional public copy skipped',e));
    }catch(e){if(status)status.textContent='⚠️ لم تصل بصمة وطن إلى قاعدة البيانات: '+errorText(e);}
    finally{sending.delete('pledge');if(btn)btn.disabled=false;}
  };
  function completionButton(n){
    if(n===6)return openSurvey('after');
    // الانتقال تلقائيّ بمجرد أن يؤكد الخادم نجاح حفظ المحطة السابقة.
    window.openStation(n+1);
  }
  async function saveStation(n,kind,activity,category,message,publicWall){if(!participant())return openSurvey('before');if(!pledgeDone()||!redirectStage(n))return;if(sending.has('station'+n))return;
    if(message.length<3||message.length>500){notice('أكملي الاستجابة المطلوبة قبل الحفظ.');return;}
    sending.add('station'+n);notice('جارٍ حفظ نشاطك في السجل الخاص…');
    try{await saveEntry({kind,activity,message});markStage(n);notice('✅ تم حفظ '+activity+' في قاعدة البيانات باسمك وصفتك.');completionButton(n);
      if(publicWall)publishPublic(activity,category,message).catch(e=>console.warn('Optional public copy skipped',e));
    }catch(e){notice('⚠️ لم يُحفظ النشاط: '+errorText(e)+'، أعيدي المحاولة.');}
    finally{sending.delete('station'+n);}
  }
  window.submitSimple=function(n){const choice=$('#modalBody .choice.selected');if(!choice)return notice('اختاري إجابة أولًا.');const message=choice.textContent.trim();
    if(n===1)return saveStation(1,'mission','سفير الطمأنينة','فكرة أو مقترح',message,false);
    if(n===5)return saveStation(5,'action','الطمأنينة فعل','مبادرة تطوعية',message,true);
  };
  window.submitText=function(n){const message=$('#stationText')?.value.trim()||'';if(message.length<8)return notice('اكتبي ثمانية أحرف على الأقل.');
    if(n===2)return saveStation(2,'message','رسالة اطمئنان','رسالة وطنية',message,true);
    if(n===4)return saveStation(4,'idea','مجلس وطن مطمئن','فكرة أو مقترح',message,true);
  };
  window.submitQuiz=function(){const choice=$('#modalBody .choice.selected');if(!choice)return notice('اختاري إجابة أولًا.');if(choice.dataset.good!=='true')return notice('الاختيار غير صحيح. تحققي من المصدر الرسمي قبل النشر.');
    return saveStation(3,'quiz','مختبر الوعي الرقمي','تجربة أو إنجاز',choice.textContent.trim(),false);
  };
  function openPulse(){if(!pledgeDone()||!redirectStage(6))return;let h='<h2 id="modalTitle">📊 نبض الطمأنينة المجتمعي</h2><p>هذه فعالية مستقلة عن الاستبانتين القبلية والبعدية، وفق التعميم. أجيبي عن الأسئلة الثلاثة لقياس الاحتياجات المعرفية، دون إدخال معلومات حساسة.</p><form id="w38PulseForm">';
    h+='<label for="w38PulseScore"><strong>ما مدى معرفتك بالمصادر الرسمية للمعلومات؟ *</strong></label><select id="w38PulseScore" class="field" required><option value="">اختاري الإجابة</option>'+ANSWERS.map((a,i)=>'<option value="'+(i+1)+'">'+safe(a)+'</option>').join('')+'</select>';
    h+='<label for="w38PulseTopic"><strong>ما الموضوع الذي تحتاجين المزيد من التوعية بشأنه؟ *</strong></label><select id="w38PulseTopic" class="field" required><option value="">اختاري الموضوع</option>'+TOPICS.map(a=>'<option>'+safe(a)+'</option>').join('')+'</select>';
    h+='<label for="w38PulseSource"><strong>من أين تحصلين على المعلومات الموثوقة عادة؟ *</strong></label><select id="w38PulseSource" class="field" required><option value="">اختاري المصدر</option>'+SOURCES.map(a=>'<option>'+safe(a)+'</option>').join('')+'</select>';
    h+='<p id="w38PulseStatus" role="status" style="font-weight:700"></p><button id="w38PulseSubmit" class="btn primary" type="submit">✅ حفظ نبض الطمأنينة والانتقال للبعدي</button></form>';
    modal(h);$('#w38PulseForm').addEventListener('submit',async e=>{e.preventDefault();if(sending.has('pulse'))return;const f=e.currentTarget;if(!f.reportValidity())return;
      const score=$('#w38PulseScore').value,topic=$('#w38PulseTopic').value,source=$('#w38PulseSource').value;
      const text='معرفة المصادر الرسمية: '+score+'/5؛ موضوع التوعية: '+topic+'؛ المصدر المعتاد: '+source;
      const status=$('#w38PulseStatus'),btn=$('#w38PulseSubmit');sending.add('pulse');btn.disabled=true;status.textContent='جارٍ حفظ الاستبانة المجتمعية…';
      try{await saveEntry({kind:'general',activity:'نبض الطمأنينة المجتمعي',message:text});markStage(6);status.textContent='✅ تم حفظ الفعالية السادسة. سيفتح القياس البعدي الآن.';openSurvey('after');}
      catch(err){status.textContent='⚠️ لم تحفظ الإجابات: '+errorText(err);btn.disabled=false;}
      finally{sending.delete('pulse');}
    });
  }
  function finalScreen(){const p=participant();if(!p)return openSurvey('before');if(!p.postDone||!completeAll()){notice('يجب إكمال الفعاليات الست والاختبار البعدي قبل التسليم النهائي.');return;}
    const h='<h2 id="modalTitle">🏅 تسليم رحلة وطن مطمئن</h2><p>👤 <strong>'+safe(p.name)+'</strong> — '+safe(p.role)+'</p><p>✅ بصمة وطن، ٦ فعاليات، القياس القبلي والبعدي.</p><p>درجتك القبلية: <strong>'+safe(p.beforeTotal??'—')+'/25</strong> — البعدية: <strong>'+safe(p.afterTotal??'—')+'/25</strong></p><p id="w38FinalStatus" role="status"></p><button id="w38FinalSubmit" type="button" class="btn primary">🇸🇦 التسليم النهائي الآن</button>';
    modal(h);$('#w38FinalSubmit')?.addEventListener('click',()=>finalSubmit());
  }
  async function finalSubmit(){const p=participant();if(!p){return openSurvey('before');}if(!p.pledgeDone||!completeAll()||!p.postDone){scrollTo('impact');return;}
    if(p.finalDone)return completedScreen();if(sending.has('finish'))return;
    sending.add('finish');let box=$('#w38FinalStatus');if(!box){finalScreen();box=$('#w38FinalStatus');}
    const btn=$('#w38FinalSubmit');if(btn)btn.disabled=true;if(box)box.textContent='جارٍ التحقق من جميع المتطلبات في قاعدة البيانات…';
    try{await apiPost('w38_final_submissions',{pre_id:p.id});p.finalDone=true;store(IDKEY,p);updateUI();completedScreen();}
    catch(e){if(box)box.textContent='⚠️ لم يُعتمد التسليم النهائي: '+errorText(e)+'. يرجى التأكد من حفظ كل فعالية والبعدي.';if(btn)btn.disabled=false;}
    finally{sending.delete('finish');}
  }
  function completedScreen(){const p=participant();if(!p)return;
    modal('<h2 id="modalTitle">🇸🇦 اكتملت رحلتك في وطن مطمئن</h2><p style="font-size:19px;color:#145749">✅ تم تسجيل التسليم النهائي في قاعدة بيانات المدرسة.</p><p>شكرًا لكِ <strong>'+safe(p.name)+'</strong> على مشاركتك في بناء وطن مطمئن.</p><p>رقم التوثيق: <strong>'+safe(p.id.slice(-8))+'</strong></p><p>تُوثَّق فعاليات المدرسة الواقعية مستقلًا وفق تعميم المبادرة.</p><button id="w38BackToGate" type="button" class="btn primary">🇸🇦 العودة إلى شاشة البصمة الافتتاحية</button>');
    // نجاح الإرسال هو لحظة نهاية الجلسة؛ لا نترك اسم الشخص مسجلاً لمن يستخدم الجهاز بعده.
    remove('w38_v5_done_'+p.id);remove(IDKEY);
    ['w38_pledge','w38_survey','w38_complete'].forEach(remove);
    updateUI();
    $('#w38BackToGate')?.addEventListener('click',()=>{location.reload();});
  }
  // بوابة الدخول الأصلية مسؤولة عن تشغيل النشيد والتأكد من اكتماله؛ نضيف القبلي عند الضغط على زر الدخول فقط.
  const gateEnter=$('#gateEnter');if(gateEnter)gateEnter.addEventListener('click',()=>{
    if(!gateEnter.disabled){
      const p=participant();
      if(!p)openSurvey('before');
      else if(!p.pledgeDone)scrollTo('fingerprint');
      else if(!completeAll())window.openStation(nextStage());
      else if(!p.postDone)openSurvey('after');
      else if(!p.finalDone)finalScreen();
      else completedScreen();
      syncStrictJourney();
      recoverStrictDialog();
    }
  });
  // الجدار العام اختياري وغير محسوب كواحدة من الفعاليات الست. اسما المشاركة وصفتها محفوظان في سجلات خاصة فقط.
  const communityForm=$('#communityForm');let snapshot=null;
  communityForm?.addEventListener('submit',event=>{
    const p=participant();if(!p){event.preventDefault();event.stopImmediatePropagation();openSurvey('before');return;}
    if(!p.pledgeDone){event.preventDefault();event.stopImmediatePropagation();scrollTo('fingerprint');return;}
    const message=$('#communityMessage')?.value.trim()||'';
    if(message.includes(p.name)){event.preventDefault();event.stopImmediatePropagation();$('#communityStatus').textContent='🔒 لا تضعي اسمك في نص المشاركة العامة؛ اسمك محفوظ في السجل الخاص.';return;}
    const roleButton=Array.from(document.querySelectorAll('#communityForm .role-option')).find(b=>b.dataset.role===p.role);if(roleButton){roleButton.disabled=false;roleButton.click();}
    const activity=$('#communityActivity')?.value||'';snapshot=message.length>=8&&activity?{message,activity}:null;
  },true);
  const cs=$('#communityStatus');if(cs){new MutationObserver(()=>{
    if(!cs.textContent.startsWith('✅')||!snapshot)return;const data=snapshot;snapshot=null;
    saveEntry({kind:'general',activity:data.activity,message:data.message}).catch(e=>{console.warn(e);cs.textContent+=' ⚠️ النسخة الخاصة باسمك لم تُحفظ، حاولي إعادة المشاركة.';});
  }).observe(cs,{childList:true,characterData:true,subtree:true});}
  // عرض الفعاليات مرة واحدة فقط: المحطات التفاعلية تحتفظ بآلية التنفيذ
  // والنواتج داخل نافذة كل نشاط؛ قسم الخطة المكرر لا يضيف مراحل جديدة.
  function unifyActivitySections() {
    const duplicate = document.getElementById('plan');
    if (duplicate) duplicate.remove();
    document.querySelectorAll('nav a[href="#plan"]').forEach(link => link.remove());

    const title = document.querySelector('#stations .section-head h2');
    if (title) title.textContent = 'الفعاليات التفاعلية للمبادرة';
    const intro = document.querySelector('#stations .section-head p');
    if (intro) intro.textContent = 'ست فعاليات وفق التعميم، تنفَّذ بالترتيب. اضغطي على كل فعالية لمشاهدة طريقة تنفيذها وحفظ مشاركتك، ثم يظهر القياس البعدي.';

    // التنقل المباشر إلى رابط قديم للخطة يعرض المحطات بدل فراغ في الصفحة.
    if (location.hash === '#plan') {
      history.replaceState(null, '', location.pathname + location.search + '#stations');
      document.getElementById('stations')?.scrollIntoView({ block: 'start' });
    }
  }

  // الإصدار السابع: لا تتجاوز المشاركة أي مرحلة، حتى لو ضغطت × أو رجعت بالرابط.
  const strictCSS=document.createElement('style');
  strictCSS.id='w38StrictCSS';
  strictCSS.textContent=`
    body.w38-strict-pre > header.top,
    body.w38-strict-pre > main,
    body.w38-strict-pre > footer.footer,
    body.w38-strict-post > header.top,
    body.w38-strict-post > main,
    body.w38-strict-post > footer.footer,
    body.w38-strict-final > header.top,
    body.w38-strict-final > main,
    body.w38-strict-final > footer.footer {display:none!important}
    body.w38-strict-pledge > header.top,
    body.w38-strict-activities > header.top,
    body.w38-strict-pledge > footer.footer,
    body.w38-strict-activities > footer.footer {display:none!important}
    body.w38-strict-pledge main > section:not(#fingerprint),
    body.w38-strict-activities main > section:not(#stations) {display:none!important}
    body.w38-strict-pre #modal .close,
    body.w38-strict-activities #modal .close,
    body.w38-strict-post #modal .close,
    body.w38-strict-final #modal .close {display:none!important}
    body.w38-strict-pre #modal,
    body.w38-strict-activities #modal,
    body.w38-strict-post #modal,
    body.w38-strict-final #modal {z-index:250!important}
    body.w38-strict-activities #stationGrid article button:disabled {opacity:.48;cursor:not-allowed}
    #w38StrictBanner {position:sticky;top:0;z-index:9;background:#104639;color:#fff5cf;
      text-align:center;padding:12px 18px;font-family:inherit;font-weight:700;font-size:14px;
      border-bottom:2px solid #d5b775;line-height:1.9}
    #w38StrictBanner[hidden] {display:none!important}
  `;
  document.head.append(strictCSS);
  const strictBanner=document.createElement('div');
  strictBanner.id='w38StrictBanner';strictBanner.setAttribute('role','status');strictBanner.hidden=true;
  document.body.prepend(strictBanner);
  const PHASE_CLASSES=['pre','pledge','activities','post','final'];
  function phaseOfJourney(){
    if($('#w38BackToGate'))return 'done';
    const gate=$('#entryGate');
    if(gate&&!gate.hidden)return 'gate';
    if(document.body.classList.contains('gate-locked'))return 'gate';
    const p=participant();
    if(!p)return 'pre';
    if(!p.pledgeDone)return 'pledge';
    if(!completeAll())return 'activities';
    if(!p.postDone)return 'post';
    if(!p.finalDone)return 'final';
    return 'done';
  }
  function syncStrictJourney(){
    const phase=phaseOfJourney();
    for(const name of PHASE_CLASSES)document.body.classList.toggle('w38-strict-'+name,phase===name);
    const progress=stages().length;
    const statuses={
      pre:'١/١٠ · احفظي الاستبانة القبلية (٥ أسئلة) للمتابعة',
      pledge:'٢/١٠ · اكتبي بصمة وطن واحفظيها أولًا',
      activities:'محطات المبادرة · '+progress+' من ٦ مكتملة · التالية: '+(ACTIVITIES[nextStage()-1]||''),
      post:'٩/١٠ · الاستبانة البعدية إلزامية بعد المحطات الست',
      final:'١٠/١٠ · بقي التسليم النهائي، اضغطي زر التسليم لتكتمل المشاركة'
    };
    const label=statuses[phase]||'';
    strictBanner.hidden=!label;
    if(strictBanner.textContent!==label)strictBanner.textContent=label;
    document.querySelectorAll('#stationGrid article').forEach((card,i)=>{
      const button=card.querySelector('button');
      if(!button)return;
      const permitted=phase==='activities'&&i+1===nextStage();
      if(button.disabled!==!permitted)button.disabled=!permitted;
      if(phase==='activities')card.style.opacity=permitted?'1':stages().includes(i+1)?'.72':'.55';
    });
  }
  function recoverStrictDialog(){
    const phase=phaseOfJourney();
    const modalEl=$('#modal');
    if(!modalEl||modalEl.classList.contains('open'))return;
    if(phase==='pre')openSurvey('before');
    else if(phase==='activities')window.openStation(nextStage());
    else if(phase==='post')openSurvey('after');
    else if(phase==='final')finalScreen();
  }
  // منع تجاوز النموذج عبر × أو النقر في خلفية النافذة أو مفتاح Escape.
  const previousClose=window.closeModal;
  window.closeModal=function(){
    if(['pre','activities','post','final'].includes(phaseOfJourney()))return;
    if(typeof previousClose==='function')return previousClose();
  };
  document.addEventListener('click',event=>{
    if(!['pre','activities','post','final'].includes(phaseOfJourney()))return;
    const el=event.target;
    if(el===$('#modal')||el.closest?.('#modal .close')){
      event.preventDefault();event.stopImmediatePropagation();
      recoverStrictDialog();
    }
  },true);
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&['pre','activities','post','final'].includes(phaseOfJourney())){
      event.preventDefault();event.stopImmediatePropagation();
    }
  },true);
  const modalEl=$('#modal');
  if(modalEl)new MutationObserver(()=>queueMicrotask(()=>{
    syncStrictJourney();recoverStrictDialog();
  })).observe(modalEl,{attributes:true,attributeFilter:['class']});
  window.addEventListener('pageshow',()=>{
    syncStrictJourney();
    if(phaseOfJourney()!=='gate')recoverStrictDialog();
  });
  addGuidance();
  unifyActivitySections();
  syncStrictJourney();
  // منع استعادة بطاقة باسم سابق بعد الرجوع من سجل التصفح على Safari.
  window.addEventListener('pageshow', e=>{
    if(e.persisted){
      if(!participant()&&!$('#w38BackToGate')){$('#modal')?.classList.remove('open');const oldGate=$('#entryGate');if(oldGate){oldGate.hidden=false;document.body.classList.add('gate-locked');}}
      updateUI();syncStrictJourney();
      if(phaseOfJourney()!=='gate')recoverStrictDialog();
    }
  });
})();
