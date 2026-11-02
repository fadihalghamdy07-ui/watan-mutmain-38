/* وطن مطمئن 38 — حفظ بصمة وطن وقياس الأثر في Supabase.
   نسخة إضافية: لا تغيّر وظائف البصمة الصوتية ولا النشيد. */
(function () {
  'use strict';
  const API = 'https://ddlkaqpbogrolwuvntbb.supabase.co/rest/v1/';
  // مفتاح نشر عام، وليس مفتاحًا سريًا أو service_role.
  const PUBLISHABLE_KEY = 'sb_publishable_FVo2S3pdcg8gZRnY1WJkJg_LSi3G0mD';
  const HEADERS = {apikey: PUBLISHABLE_KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal'};
  const sending = new Set();

  async function saveRemote(table, payload) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 16000);
    try {
      const response = await fetch(API + table, {
        method: 'POST', headers: HEADERS, body: JSON.stringify(payload), signal: controller.signal
      });
      if (!response.ok) throw new Error('Database HTTP ' + response.status);
    } finally { clearTimeout(timeout); }
  }
  function saveOnDevice(key, value) {
    try { localStorage.setItem('w38_' + key, JSON.stringify(value)); return true; }
    catch (error) { console.warn('تعذر الحفظ المحلي', error); return false; }
  }
  function feedback(message) {
    if (typeof window.notice === 'function') window.notice(message);
    else {
      const el = document.createElement('p'); el.className = 'result'; el.setAttribute('role','status');
      el.textContent = message;
      document.getElementById('modalBody')?.append(el);
    }
  }
  function currentChoice() { return document.querySelector('#modalBody .choice.selected'); }
  function updateProgress(n) { try { if (typeof window.mark === 'function') window.mark(n); } catch (e) { console.warn(e); } }

  // عرض بصمات وطن في جدار المشاركات مع عدم إرسال أسماء الطالبات مطلقًا.
  const fingerprint = document.querySelector('#fingerprint .card');
  let fingerprintStatus = document.getElementById('w38PledgeStatus');
  if (fingerprint && !fingerprintStatus) {
    fingerprintStatus = document.createElement('p');
    fingerprintStatus.id = 'w38PledgeStatus';
    fingerprintStatus.className = 'participation-success';
    fingerprintStatus.setAttribute('role', 'status');
    fingerprintStatus.setAttribute('aria-live', 'polite');
    const button = fingerprint.querySelector('button[onclick="savePledge()"]');
    button?.insertAdjacentElement('afterend', fingerprintStatus);
    const oldNote = Array.from(fingerprint.querySelectorAll('p')).find(p=>p.textContent.includes('المشاركات لا تُرفع إلى خادم'));
    if (oldNote) oldNote.textContent = '🔒 لا تكتبي أسماء كاملة أو معلومات خاصة. تُحفظ البصمة في قاعدة بيانات المبادرة، وقد يظهر نصها للجميع بعد الفحص الأولي، دون نشر الاسم.';
  }
  ['wallActivity','communityActivity'].forEach(id => {
    const select = document.getElementById(id);
    if (select && !Array.from(select.options).some(o => o.value === 'بصمة وطن')) {
      select.add(new Option('بصمة وطن', 'بصمة وطن'));
    }
  });
  window.savePledge = async function () {
    if (sending.has('pledge')) return;
    const name = document.getElementById('studentName')?.value.trim() || '';
    const message = document.getElementById('pledge')?.value.trim() || '';
    if (message.length < 8 || message.length > 240) {
      if (fingerprintStatus) fingerprintStatus.textContent = 'اكتبي بصمة وطنية من ٨ إلى ٢٤٠ حرفًا.';
      return;
    }
    const savedLocal = saveOnDevice('pledge', {name, text:message});
    try { if (typeof window.refresh === 'function') window.refresh(); } catch(e) { console.warn(e); }
    const btn = fingerprint?.querySelector('button[onclick="savePledge()"]');
    sending.add('pledge'); if (btn) btn.disabled = true;
    if (fingerprintStatus) fingerprintStatus.textContent = 'جارٍ حفظ بصمتك في قاعدة بيانات المدرسة…';
    try {
      await saveRemote('watan_responses', {
        role: 'طالبة', activity: 'بصمة وطن', category: 'بصمة وطنية', message, approved: false
      });
      if (fingerprintStatus) fingerprintStatus.textContent = '✅ تم حفظ بصمتك في قاعدة البيانات. تُنشر النصوص التي تجتاز الفحص الأولي، وتُراجع بقية المشاركات. الاسم لا يُنشر.';
      document.getElementById('refreshPublic')?.click();
    } catch (e) {
      console.error('تعذّر إرسال البصمة', e);
      if (fingerprintStatus) fingerprintStatus.textContent = savedLocal
        ? '⚠️ تعذّر إرسال البصمة إلى قاعدة البيانات. احتُفظ بها على هذا الجهاز فقط؛ تحققي من الاتصال ثم أعيدي الإرسال.'
        : '⚠️ تعذّر الحفظ. انسخي نص بصمتك ثم حاولي مجددًا عند توفر الاتصال.';
    } finally { sending.delete('pledge'); if (btn) btn.disabled = false; }
  };

  // تُحفظ أفكار «نبض الطمأنينة» ومبادراته العامة في جدار المشاركات.
  const originalSubmitText = window.submitText;
  window.submitText = async function (n) {
    if (n !== 4) return originalSubmitText(n);
    if (sending.has('impact_text')) return;
    const message = document.getElementById('stationText')?.value.trim() || '';
    if (message.length < 5 || message.length > 300) return feedback('اكتبي فكرة من ٥ إلى ٣٠٠ حرف.');
    const savedLocal = saveOnDevice('station4', message); updateProgress(4);
    sending.add('impact_text'); feedback('جارٍ إرسال الفكرة إلى قاعدة البيانات…');
    try {
      await saveRemote('watan_responses', {
        role: 'طالبة', activity: 'مجلس وطن مطمئن', category: 'فكرة أو مقترح', message, approved: false
      });
      feedback('✅ حُفظت فكرتك في قاعدة البيانات. قد تُنشر بعد الفحص الأولي، أو تُحال للمراجعة.');
      document.getElementById('refreshPublic')?.click();
    } catch (e) {
      console.error('تعذّر إرسال الفكرة', e);
      feedback(savedLocal ? '⚠️ الفكرة محفوظة على هذا الجهاز فقط؛ تعذّر إرسالها إلى قاعدة البيانات. أعيدي المحاولة.' : '⚠️ تعذّر الحفظ، انسخي فكرتك وحاولي مجددًا.');
    } finally { sending.delete('impact_text'); }
  };

  const originalSubmitSimple = window.submitSimple;
  window.submitSimple = async function (n) {
    if (n !== 5) return originalSubmitSimple(n);
    if (sending.has('impact_action')) return;
    const choice = currentChoice();
    if (!choice) return feedback('اختاري مبادرة أولًا.');
    const message = choice.textContent.trim();
    const savedLocal = saveOnDevice('station5', message); updateProgress(5);
    sending.add('impact_action'); feedback('جارٍ تسجيل مبادرتك…');
    try {
      await saveRemote('watan_responses', {
        role: 'طالبة', activity: 'الطمأنينة فعل', category: 'مبادرة تطوعية', message, approved: false
      });
      feedback('✅ حُفظت مبادرتك في قاعدة البيانات، وقد تظهر للجميع بعد الفحص الأولي.');
      document.getElementById('refreshPublic')?.click();
    } catch (e) {
      console.error('تعذّر إرسال المبادرة', e);
      feedback(savedLocal ? '⚠️ حُفظت المبادرة على جهازك فقط. تعذّر إرسالها؛ أعيدي المحاولة عند توفر الاتصال.' : '⚠️ تعذّر الحفظ؛ حاولي مجددًا.');
    } finally { sending.delete('impact_action'); }
  };

  // نتيجة الاستبانة مجهولة الهوية؛ لا أسماء ولا نصوص حرة ولا نشر فردي.
  window.submitSurvey = async function () {
    if (sending.has('survey')) return;
    const phase = document.getElementById('phase')?.value;
    const rating = Number(document.getElementById('rating')?.value);
    if (!['before','after'].includes(phase) || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      feedback('اختاري نوع القياس ودرجة الموافقة.'); return;
    }
    let localResult = {};
    try { localResult = JSON.parse(localStorage.getItem('w38_survey') || '{}') || {}; } catch(e) {}
    localResult[phase] = rating;
    const savedLocal = saveOnDevice('survey', localResult); updateProgress(6);
    try { if (typeof window.showSurvey === 'function') window.showSurvey(); } catch(e) { console.warn(e); }
    const result = document.getElementById('surveyResult');
    if (result) result.textContent = result.textContent.replace('النتائج خاصة بهذا الجهاز، وليست إحصاءً مدرسيًا.', 'هذه نتيجتك على جهازك؛ وتُرسل درجات الاستبانة إلى المدرسة دون أسماء.');
    sending.add('survey'); feedback('جارٍ حفظ درجة الاستبانة دون أي بيانات شخصية…');
    try {
      await saveRemote('w38_impact_votes', {phase, rating});
      feedback('✅ تم حفظ إجابتك في قاعدة بيانات المدرسة دون اسم أو معلومات شخصية.');
    } catch (e) {
      console.error('تعذّر إرسال قياس الأثر', e);
      feedback(savedLocal ? '⚠️ حُفظت إجابتك على جهازك فقط؛ تعذّر إرسالها إلى قاعدة البيانات. أعيدي المحاولة.' : '⚠️ تعذّر حفظ الاستبانة؛ حاولي مجددًا.');
    } finally { sending.delete('survey'); }
  };

  const impact = document.querySelector('#impact .section-head');
  if (impact) {
    const note = document.createElement('p');
    note.className = 'muted'; note.style.textAlign = 'center';
    note.textContent = 'تُحفظ الأفكار والمبادرات في قاعدة البيانات، وتُسجّل درجات الاستبانة بصورة مجهولة الهوية. يُعرض تقدّمك الشخصي على هذا الجهاز فقط.';
    impact.append(note);
  }
})();
