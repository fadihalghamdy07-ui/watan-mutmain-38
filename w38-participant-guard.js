/* وطن مطمئن 38 — قفل الاستبانة القبلية في رابط المشاركة العام.
 * لا يمنح صلاحيات الاطلاع على بيانات الآخرين.
 * يتجاوز متصفح الإدارة هذا الملف فقط لأنه صفحة منفصلة admin.html.
 */
(() => {
  'use strict';
  const IDKEY = 'w38_v5_active_participant';
  // لا تُدرج معاينة المشرفات داخل صفحة المشاركة؛ هذه حراسة رابط المشاركات فقط.
  const gate = document.getElementById('entryGate');
  const enter = document.getElementById('gateEnter');
  const modal = document.getElementById('modal');
  const modalBody = document.getElementById('modalBody');
  const preButton = document.getElementById('w38PreButton');
  if (!gate || !enter || !modal || !modalBody || !preButton) return;

  const style = document.createElement('style');
  style.textContent = `
    body.w38-pre-required > header.top,
    body.w38-pre-required > main,
    body.w38-pre-required > footer.footer { display: none !important; }
    body.w38-pre-required #modal .close { display: none !important; }
    body.w38-pre-required #modal { z-index: 250 !important; }
    body.w38-pre-required #w38SurveyForm { padding-bottom: 20px; }
  `;
  document.head.append(style);
  let entered = false;
  let checking = false;
  function registered() {
    try {
      const p = JSON.parse(localStorage.getItem(IDKEY) || 'null');
      return !!(p && p.preDone === true && typeof p.name === 'string' && p.name.trim().length >= 2 &&
          ['طالبة','معلمة','إدارية','ولي أمر'].includes(p.role) &&
          /^[0-9a-f-]{36}$/i.test(String(p.id || '')));
    } catch { return false; }
  }
  function journeyEntered() {
    return entered || (gate.hidden && !document.body.classList.contains('gate-locked'));
  }
  function needsPre() { return journeyEntered() && !registered(); }
  function ensurePre() {
    if (checking) return;
    checking = true;
    try {
      const locked = needsPre();
      document.body.classList.toggle('w38-pre-required', locked);
      if (!locked) return;
      if (!modal.classList.contains('open') || !modalBody.querySelector('#w38SurveyForm')) {
        // تشغيل الاستبانة الحقيقية نفسها، لا نسخة مزيفة من نموذجها.
        preButton.click();
      }
    } finally { checking = false; }
  }
  enter.addEventListener('click', () => {
    if (enter.disabled) return;
    entered = true;
    queueMicrotask(ensurePre);
  });
  // علامة × والنقر خارج الصندوق واختصار Escape لا تتجاوز القبلي.
  document.addEventListener('click', event => {
    if (!needsPre()) return;
    const target = event.target;
    if (target === modal || target.closest?.('#modal .close')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      ensurePre();
    }
  }, true);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && needsPre()) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);
  // إعادة عرض القبلي لو أغلقته إضافة أو تحديث آخر في المتصفح.
  const observer = new MutationObserver(() => queueMicrotask(ensurePre));
  observer.observe(modal, { attributes: true, attributeFilter: ['class'] });
  observer.observe(modalBody, { childList: true });
  window.addEventListener('pageshow', ensurePre);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) ensurePre(); });
  ensurePre();
})();
