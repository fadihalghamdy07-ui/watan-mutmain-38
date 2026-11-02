/* وطن مطمئن 38 — وضع المعاينة الإدارية للواجهة فقط.
 * لا يحفظ قياسات أو مشاركات، ولا يتيح الوصول إلى الأسماء والنتائج الخاصة.
 * فعّليه برابط ?preview=1 بعد تحميل ملف رحلة المنصة الأساسي.
 */
(function () {
  'use strict';
  const params = new URLSearchParams(window.location.search);
  if (params.get('preview') !== '1') return;

  // في وضع المعاينة امنعي جميع طلبات كتابة البيانات، كإجراء احترازي إضافي.
  const originalFetch = window.fetch.bind(window);
  window.fetch = function (input, options) {
    const method = String(options?.method || (input instanceof Request ? input.method : 'GET')).toUpperCase();
    const uri = String(input instanceof Request ? input.url : input);
    if (method !== 'GET' && uri.startsWith('https://ddlkaqpbogrolwuvntbb.supabase.co/')) {
      return Promise.reject(new Error('وضع المعاينة لا يحفظ استجابات.'));
    }
    return originalFetch(input, options);
  };

  // افتحي صفحات المنصة للعرض دون تخطي أي شرط في رحلة المشاركات الفعلية.
  const gate = document.getElementById('entryGate');
  if (gate) { gate.hidden = true; gate.style.display = 'none'; }
  document.body.classList.remove('gate-locked');
  document.body.classList.add('w38-preview-mode');
  for (const id of ['fingerprint','stations','impact']) {
    const section = document.getElementById(id);
    if (section) { section.hidden = false; section.style.display = ''; }
  }
  const oldPledge = document.getElementById('pledgeResult');
  if (oldPledge) oldPledge.textContent = 'بطاقة بصمة وطن — مثال للمعاينة، لا توجد مشاركة مسجلة.';
  const oldName = document.getElementById('studentName');
  if (oldName) { oldName.value=''; oldName.placeholder='الاسم يظهر هنا بعد حفظ القبلي في رحلة المشاركة'; oldName.readOnly = true; }
  const journey = document.getElementById('w38JourneyStatus');
  if (journey) journey.textContent = 'هذه معاينة للتصميم فقط؛ الإجابات والأنشطة لن تُحفظ.';
  const controls = document.getElementById('w38JourneyButtons');
  if (controls) controls.style.display = 'none';
  const count = document.getElementById('countBadge');
  if (count) count.textContent = '٦ فعاليات — عرض فقط';
  const progress = document.getElementById('progressBar');
  if (progress) progress.style.width='0%';

  // الأدوات التفاعلية في المعاينة تعرض وصف الفعالية فقط.
  const STATIONS = [
    'سفير الطمأنينة', 'رسالة اطمئنان', 'مختبر الوعي الرقمي',
    'مجلس وطن مطمئن', 'الطمأنينة فعل', 'نبض الطمأنينة المجتمعي'
  ];
  const SURVEY_QUESTIONS = [
    'أتحقق من صحة الأخبار والمعلومات قبل مشاركتها.',
    'أعرف كيف أتعامل مع الرسائل والروابط الإلكترونية المشبوهة.',
    'أحترم الآخرين وأساهم في الحوار الإيجابي داخل المدرسة والمجتمع.',
    'أحرص على المشاركة في الأعمال والمبادرات التي تخدم المجتمع.',
    'أتصرف بمسؤولية للمحافظة على أمن الوطن ومكتسباته.'
  ];
  const container = document.getElementById('modal');
  const modalBody = document.getElementById('modalBody');
  function openPreview(title, contentBuilder) {
    if (!container || !modalBody) return;
    modalBody.replaceChildren();
    const heading=document.createElement('h2');heading.id='modalTitle';heading.textContent=title;
    const note=document.createElement('p');note.textContent='👁️ وضع معاينة فقط — لا توجد إجابات مطلوبة، ولن يُحفظ أي شيء.';
    note.style.cssText='background:#f4ecce;border-radius:10px;padding:9px;color:#274e42';
    modalBody.append(heading,note);
    contentBuilder(modalBody);
    container.classList.add('open');
    container.querySelector('.modal-inner')?.scrollTo(0,0);
  }
  function paragraph(parent, title, value) {
    const p=document.createElement('p');p.style.cssText='line-height:1.9;margin:12px 0';
    const strong=document.createElement('strong');strong.textContent=title+' ';p.append(strong,document.createTextNode(value));parent.append(p);
  }
  window.openStation = function (n) {
    if (!Number.isInteger(n) || n < 1 || n > 6) return;
    const details = (typeof activityDetails !== 'undefined' && Array.isArray(activityDetails)) ? activityDetails[n-1] : null;
    const card = document.querySelectorAll('#stationGrid article')[n-1];
    openPreview('🇸🇦 الفعالية '+n+' — '+STATIONS[n-1], parent => {
      if (details) {
        paragraph(parent, '📋 آلية التنفيذ:', details.method || '');
        paragraph(parent, '🎯 الناتج المتوقع:', details.outcome || '');
      } else if(card) paragraph(parent,'وصف الفعالية:',card.querySelector('p')?.textContent||'');
      const p=document.createElement('p');p.textContent='في المشاركة الحقيقية تستطيع المشاركة إكمال النشاط وحفظ إجابتها باسمها وصفَتها، بعد الاستبانة القبلية.';
      parent.append(p);
    });
  };
  function previewSurvey(kind) {
    const before=kind==='before';
    openPreview(before?'📝 نموذج الاستبانة القبلية':'📊 نموذج الاستبانة البعدية',parent=>{
      if (before) {
        paragraph(parent,'الاسم:','حقل إلزامي تكتبه المشاركة بنفسها');
        paragraph(parent,'الصفة:','طالبة / معلمة / إدارية / ولي أمر');
      } else paragraph(parent,'التوقيت:','تُعرض بعد حفظ جميع الفعاليات الست');
      const answers=['لا أوافق إطلاقًا','لا أوافق','محايدة','أوافق','أوافق بشدة'];
      SURVEY_QUESTIONS.forEach((question,i)=>{
        const field=document.createElement('fieldset');field.style.cssText='border:1px solid #d6c69b;border-radius:12px;margin:12px 0;padding:12px';
        const legend=document.createElement('legend');legend.textContent=(i+1)+'- '+question;field.append(legend);
        answers.forEach(answer=>{
          const line=document.createElement('div');line.style.cssText='padding:3px 0';
          const circle=document.createElement('span');circle.textContent='○  ';circle.style.color='#526d61';
          line.append(circle,document.createTextNode(answer));field.append(line);
        });
        parent.append(field);
      });
    });
  }

  const banner=document.createElement('div');banner.id='w38PreviewBar';banner.dir='rtl';
  banner.style.cssText='position:sticky;top:0;z-index:220;display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap;background:#103f36;color:#fff9e3;padding:11px 12px;box-shadow:0 2px 12px #0004;text-align:center;font-family:inherit';
  const label=document.createElement('strong');label.textContent='👁️ وضع المعاينة — مشاهدة فقط';label.style.marginInlineEnd='8px';banner.append(label);
  const makeButton=(title,action)=>{
    const button=document.createElement('button');button.type='button';button.textContent=title;
    button.style.cssText='background:#ead59c;color:#1e4137;border:0;border-radius:10px;font-weight:700;padding:7px 11px;cursor:pointer';
    button.addEventListener('click',action);banner.append(button);return button;
  };
  makeButton('القبلي',()=>previewSurvey('before'));
  makeButton('البعدي',()=>previewSurvey('after'));
  makeButton('الفعاليات',()=>document.getElementById('stations')?.scrollIntoView({behavior:'smooth'}));
  const exit=document.createElement('a');exit.href=window.location.pathname+'?v=20261102-v6';
  exit.textContent='الخروج من المعاينة';exit.style.cssText='color:#fff8cb;text-decoration:underline;padding:6px';banner.append(exit);
  document.body.prepend(banner);

  // عرض تفاصيل أي محطة عند الضغط عليها، دون السماح بإرسال استجابة.
  document.querySelectorAll('#stationGrid article button').forEach((button,i)=>{
    button.disabled=false;
    button.textContent='👁️ مشاهدة تفاصيل الفعالية';
    button.onclick=()=>window.openStation(i+1);
  });

  // منع النماذج من الإرسال، مع الإبقاء على زر إغلاق المعاينة.
  document.addEventListener('submit',event=>{event.preventDefault();event.stopImmediatePropagation();},true);
  document.addEventListener('click',event=>{
    const button=event.target.closest?.('button');
    if (!button || button.closest('#w38PreviewBar') || button.closest('#stationGrid') || button.closest('#modal') && button.classList.contains('close')) return;
    event.preventDefault();event.stopImmediatePropagation();
  },true);
  for(const item of document.querySelectorAll('input,textarea,select')) item.disabled=true;
})();
