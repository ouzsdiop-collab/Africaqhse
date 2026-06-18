import { qhseFetch } from '../utils/qhseFetch.js';
import { getSessionUser } from '../data/sessionUser.js';
import { canResource } from '../utils/permissionsUi.js';
import { showToast } from '../components/toast.js';
import { escapeHtml } from '../utils/escapeHtml.js';
import { createEmptyState } from '../utils/designSystem.js';

function fmtDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('fr-FR');
  } catch {
    return '';
  }
}

export function renderTrainings() {
  const page = document.createElement('section');
  page.className = 'page-stack page-stack--premium-saas trainings-page';

  const su = getSessionUser();
  const canRead = canResource(su?.role, 'trainings', 'read');
  const canWrite = canResource(su?.role, 'trainings', 'write');

  page.innerHTML = `
    <article class="content-card card-soft trainings-alerts-card">
      <div class="content-card-head">
        <div>
          <div class="section-kicker">Échéances</div>
          <h3>Alertes formations</h3>
        </div>
      </div>
      <div class="trainings-alerts-host stack" style="margin-top:12px"></div>
    </article>

    <article class="content-card card-soft">
      <div class="content-card-head">
        <div>
          <div class="section-kicker">Référentiel</div>
          <h3>Formations</h3>
        </div>
      </div>
      <div class="trainings-courses-host stack" style="margin-top:12px"></div>
      <div class="form-grid" style="gap:12px;margin-top:16px">
        <label class="field field-full">
          <span>Titre <span style="color:var(--text3)">(obligatoire)</span></span>
          <input type="text" class="control-input tr-course-title" maxlength="200" />
        </label>
        <label class="field">
          <span>Catégorie</span>
          <input type="text" class="control-input tr-course-category" maxlength="100" />
        </label>
        <label class="field">
          <span>Durée (heures)</span>
          <input type="number" min="0" step="0.5" class="control-input tr-course-duration" />
        </label>
        <label class="field">
          <span>Périodicité (mois, recyclage)</span>
          <input type="number" min="1" step="1" class="control-input tr-course-recurrence" />
        </label>
        <label class="field" style="display:flex;align-items:center;gap:8px;flex-direction:row">
          <input type="checkbox" class="tr-course-mandatory" />
          <span>Obligatoire</span>
        </label>
        <button type="button" class="btn btn-primary tr-btn-create-course field-full" style="min-height:48px;font-weight:700">
          Ajouter la formation
        </button>
      </div>
    </article>

    <article class="content-card card-soft">
      <div class="content-card-head">
        <div>
          <div class="section-kicker">Planification</div>
          <h3>Sessions</h3>
        </div>
      </div>
      <div class="trainings-sessions-host stack" style="margin-top:12px"></div>
      <div class="form-grid" style="gap:12px;margin-top:16px">
        <label class="field">
          <span>Formation <span style="color:var(--text3)">(obligatoire)</span></span>
          <select class="control-input tr-session-course"></select>
        </label>
        <label class="field">
          <span>Date <span style="color:var(--text3)">(obligatoire)</span></span>
          <input type="datetime-local" class="control-input tr-session-date" />
        </label>
        <label class="field">
          <span>Lieu</span>
          <input type="text" class="control-input tr-session-location" maxlength="200" />
        </label>
        <label class="field">
          <span>Formateur</span>
          <input type="text" class="control-input tr-session-trainer" maxlength="200" />
        </label>
        <button type="button" class="btn btn-primary tr-btn-create-session field-full" style="min-height:48px;font-weight:700">
          Planifier la session
        </button>
      </div>
    </article>

    <article class="content-card card-soft">
      <div class="content-card-head">
        <div>
          <div class="section-kicker">Suivi</div>
          <h3>Inscriptions & présences</h3>
        </div>
      </div>
      <div class="trainings-enrollments-host stack" style="margin-top:12px"></div>
      <div class="form-grid" style="gap:12px;margin-top:16px">
        <label class="field">
          <span>Session <span style="color:var(--text3)">(obligatoire)</span></span>
          <select class="control-input tr-enroll-session"></select>
        </label>
        <label class="field">
          <span>Identifiant utilisateur <span style="color:var(--text3)">(obligatoire)</span></span>
          <input type="text" class="control-input tr-enroll-userid" maxlength="100" />
        </label>
        <button type="button" class="btn btn-primary tr-btn-create-enroll field-full" style="min-height:48px;font-weight:700">
          Inscrire
        </button>
      </div>
    </article>
  `;

  const alertsHost = page.querySelector('.trainings-alerts-host');
  const coursesHost = page.querySelector('.trainings-courses-host');
  const sessionsHost = page.querySelector('.trainings-sessions-host');
  const enrollmentsHost = page.querySelector('.trainings-enrollments-host');

  const courseTitleIn = page.querySelector('.tr-course-title');
  const courseCategoryIn = page.querySelector('.tr-course-category');
  const courseDurationIn = page.querySelector('.tr-course-duration');
  const courseRecurrenceIn = page.querySelector('.tr-course-recurrence');
  const courseMandatoryIn = page.querySelector('.tr-course-mandatory');
  const createCourseBtn = page.querySelector('.tr-btn-create-course');

  const sessionCourseSel = page.querySelector('.tr-session-course');
  const sessionDateIn = page.querySelector('.tr-session-date');
  const sessionLocationIn = page.querySelector('.tr-session-location');
  const sessionTrainerIn = page.querySelector('.tr-session-trainer');
  const createSessionBtn = page.querySelector('.tr-btn-create-session');

  const enrollSessionSel = page.querySelector('.tr-enroll-session');
  const enrollUserIdIn = page.querySelector('.tr-enroll-userid');
  const createEnrollBtn = page.querySelector('.tr-btn-create-enroll');

  if (!canRead && su) {
    page.querySelectorAll('.form-grid input, .form-grid select, .form-grid button').forEach((el) => {
      el.disabled = true;
    });
    alertsHost.innerHTML = '<p style="margin:0;font-size:13px;color:var(--text2)">Lecture des formations non autorisée pour ce rôle.</p>';
    coursesHost.innerHTML = '';
    sessionsHost.innerHTML = '';
    enrollmentsHost.innerHTML = '';
    return page;
  }

  if (!canWrite && su) {
    page.querySelectorAll('.form-grid input, .form-grid select, .form-grid button').forEach((el) => {
      el.disabled = true;
    });
  }

  let coursesCache = [];
  let sessionsCache = [];

  async function refreshAlerts() {
    alertsHost.innerHTML = '<p style="margin:0;font-size:13px;color:var(--text2)">Chargement…</p>';
    try {
      const res = await qhseFetch('/api/trainings/alerts');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.json();
      const alerts = Array.isArray(body?.alerts) ? body.alerts : [];
      if (alerts.length === 0) {
        alertsHost.replaceChildren();
        alertsHost.append(createEmptyState('✅', 'Aucune alerte', 'Toutes les formations sont à jour ou aucune échéance n’est enregistrée.'));
        return;
      }
      alertsHost.replaceChildren();
      alerts.forEach((a) => {
        const row = document.createElement('article');
        row.className = 'list-row';
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.alignItems = 'flex-start';
        row.style.gap = '12px';
        const left = document.createElement('div');
        const title = document.createElement('strong');
        title.textContent = a.message || '';
        const sub = document.createElement('p');
        sub.style.margin = '6px 0 0';
        sub.style.fontSize = '12px';
        sub.style.color = 'var(--text2)';
        sub.textContent = a.date ? `Échéance : ${fmtDate(a.date)}` : '';
        left.append(title, sub);
        const badge = document.createElement('span');
        badge.textContent = a.severity === 'high' ? 'Expiré' : 'À prévoir';
        badge.style.fontSize = '11px';
        badge.style.fontWeight = '700';
        badge.style.padding = '2px 8px';
        badge.style.borderRadius = '999px';
        badge.style.color = '#fff';
        badge.style.background = a.severity === 'high' ? '#dc2626' : '#d97706';
        row.append(left, badge);
        alertsHost.append(row);
      });
    } catch {
      alertsHost.innerHTML = '<p style="margin:0;font-size:13px;color:var(--text2)">Alertes indisponibles : vérifiez l’API.</p>';
    }
  }

  async function refreshCourses() {
    coursesHost.innerHTML = '<p style="margin:0;font-size:13px;color:var(--text2)">Chargement…</p>';
    try {
      const res = await qhseFetch('/api/trainings/courses');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const rows = await res.json();
      coursesCache = Array.isArray(rows) ? rows : [];
      sessionCourseSel.innerHTML = coursesCache
        .map((c) => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.title)}</option>`)
        .join('');
      if (coursesCache.length === 0) {
        coursesHost.replaceChildren();
        coursesHost.append(createEmptyState('\u{1F4DA}', 'Aucune formation', 'Créez la première formation ci-dessous.'));
        return;
      }
      coursesHost.replaceChildren();
      coursesCache.forEach((c) => {
        const row = document.createElement('article');
        row.className = 'list-row';
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.alignItems = 'flex-start';
        row.style.gap = '12px';
        const left = document.createElement('div');
        const title = document.createElement('strong');
        title.textContent = c.title;
        const sub = document.createElement('p');
        sub.style.margin = '6px 0 0';
        sub.style.fontSize = '12px';
        sub.style.color = 'var(--text2)';
        const parts = [];
        if (c.category) parts.push(c.category);
        if (c.durationHours != null) parts.push(`${c.durationHours} h`);
        if (c.mandatory) parts.push('Obligatoire');
        if (c.recurrenceMonths) parts.push(`Recyclage ${c.recurrenceMonths} mois`);
        sub.textContent = parts.join(' · ');
        left.append(title, sub);
        row.append(left);
        if (canWrite) {
          const delBtn = document.createElement('button');
          delBtn.type = 'button';
          delBtn.className = 'btn btn-ghost';
          delBtn.textContent = 'Supprimer';
          delBtn.addEventListener('click', async () => {
            if (!window.confirm('Supprimer cette formation ?')) return;
            try {
              const r = await qhseFetch(`/api/trainings/courses/${encodeURIComponent(c.id)}`, { method: 'DELETE' });
              if (!r.ok && r.status !== 204) throw new Error('delete failed');
              showToast('Formation supprimée', 'info');
              await refreshCourses();
            } catch {
              showToast('Suppression impossible', 'error');
            }
          });
          row.append(delBtn);
        }
        coursesHost.append(row);
      });
    } catch {
      coursesHost.innerHTML = '<p style="margin:0;font-size:13px;color:var(--text2)">Liste indisponible : vérifiez l’API.</p>';
    }
  }

  async function refreshSessions() {
    sessionsHost.innerHTML = '<p style="margin:0;font-size:13px;color:var(--text2)">Chargement…</p>';
    try {
      const res = await qhseFetch('/api/trainings/sessions');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const rows = await res.json();
      sessionsCache = Array.isArray(rows) ? rows : [];
      enrollSessionSel.innerHTML = sessionsCache
        .map(
          (s) =>
            `<option value="${escapeHtml(s.id)}">${escapeHtml(s.course?.title || 'Formation')} — ${escapeHtml(fmtDate(s.date))}</option>`
        )
        .join('');
      if (sessionsCache.length === 0) {
        sessionsHost.replaceChildren();
        sessionsHost.append(createEmptyState('\u{1F4C5}', 'Aucune session', 'Planifiez la première session ci-dessous.'));
        return;
      }
      sessionsHost.replaceChildren();
      sessionsCache.forEach((s) => {
        const row = document.createElement('article');
        row.className = 'list-row';
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.alignItems = 'flex-start';
        row.style.gap = '12px';
        const left = document.createElement('div');
        const title = document.createElement('strong');
        title.textContent = `${s.course?.title || 'Formation'} — ${fmtDate(s.date)}`;
        const sub = document.createElement('p');
        sub.style.margin = '6px 0 0';
        sub.style.fontSize = '12px';
        sub.style.color = 'var(--text2)';
        const parts = [];
        if (s.location) parts.push(s.location);
        if (s.trainer) parts.push(`Formateur : ${s.trainer}`);
        if (s.siteRecord?.name) parts.push(s.siteRecord.name);
        sub.textContent = parts.join(' · ');
        left.append(title, sub);
        row.append(left);
        if (canWrite) {
          const delBtn = document.createElement('button');
          delBtn.type = 'button';
          delBtn.className = 'btn btn-ghost';
          delBtn.textContent = 'Supprimer';
          delBtn.addEventListener('click', async () => {
            if (!window.confirm('Supprimer cette session ?')) return;
            try {
              const r = await qhseFetch(`/api/trainings/sessions/${encodeURIComponent(s.id)}`, { method: 'DELETE' });
              if (!r.ok && r.status !== 204) throw new Error('delete failed');
              showToast('Session supprimée', 'info');
              await refreshSessions();
            } catch {
              showToast('Suppression impossible', 'error');
            }
          });
          row.append(delBtn);
        }
        sessionsHost.append(row);
      });
    } catch {
      sessionsHost.innerHTML = '<p style="margin:0;font-size:13px;color:var(--text2)">Liste indisponible : vérifiez l’API.</p>';
    }
  }

  async function refreshEnrollments() {
    enrollmentsHost.innerHTML = '<p style="margin:0;font-size:13px;color:var(--text2)">Chargement…</p>';
    try {
      const res = await qhseFetch('/api/trainings/enrollments');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const rows = await res.json();
      const list = Array.isArray(rows) ? rows : [];
      if (list.length === 0) {
        enrollmentsHost.replaceChildren();
        enrollmentsHost.append(createEmptyState('\u{1F465}', 'Aucune inscription', 'Inscrivez un utilisateur à une session ci-dessous.'));
        return;
      }
      enrollmentsHost.replaceChildren();
      list.forEach((e) => {
        const row = document.createElement('article');
        row.className = 'list-row';
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.alignItems = 'flex-start';
        row.style.gap = '12px';
        const left = document.createElement('div');
        const title = document.createElement('strong');
        title.textContent = e.user?.name || e.user?.email || 'Utilisateur';
        const sub = document.createElement('p');
        sub.style.margin = '6px 0 0';
        sub.style.fontSize = '12px';
        sub.style.color = 'var(--text2)';
        const parts = [e.session?.course?.title || 'Formation'];
        if (e.attended) parts.push('Présent');
        if (e.completedAt) parts.push(`Validé le ${fmtDate(e.completedAt)}`);
        if (e.expiresAt) parts.push(`Recyclage avant ${fmtDate(e.expiresAt)}`);
        sub.textContent = parts.join(' · ');
        left.append(title, sub);
        row.append(left);
        if (canWrite) {
          const right = document.createElement('div');
          right.style.display = 'flex';
          right.style.gap = '8px';
          const validateBtn = document.createElement('button');
          validateBtn.type = 'button';
          validateBtn.className = 'btn btn-secondary';
          validateBtn.textContent = 'Marquer présent / validé';
          validateBtn.addEventListener('click', async () => {
            try {
              const r = await qhseFetch(`/api/trainings/enrollments/${encodeURIComponent(e.id)}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ attended: true, completedAt: new Date().toISOString() })
              });
              if (!r.ok) throw new Error('update failed');
              showToast('Inscription mise à jour', 'info');
              await refreshEnrollments();
            } catch {
              showToast('Mise à jour impossible', 'error');
            }
          });
          const delBtn = document.createElement('button');
          delBtn.type = 'button';
          delBtn.className = 'btn btn-ghost';
          delBtn.textContent = 'Supprimer';
          delBtn.addEventListener('click', async () => {
            if (!window.confirm('Supprimer cette inscription ?')) return;
            try {
              const r = await qhseFetch(`/api/trainings/enrollments/${encodeURIComponent(e.id)}`, { method: 'DELETE' });
              if (!r.ok && r.status !== 204) throw new Error('delete failed');
              showToast('Inscription supprimée', 'info');
              await refreshEnrollments();
            } catch {
              showToast('Suppression impossible', 'error');
            }
          });
          right.append(validateBtn, delBtn);
          row.append(right);
        }
        enrollmentsHost.append(row);
      });
    } catch {
      enrollmentsHost.innerHTML = '<p style="margin:0;font-size:13px;color:var(--text2)">Liste indisponible : vérifiez l’API.</p>';
    }
  }

  createCourseBtn.addEventListener('click', async () => {
    if (!canWrite && su) {
      showToast('Création réservée', 'warning');
      return;
    }
    const title = (courseTitleIn.value || '').trim();
    if (!title) {
      showToast('Le titre est requis', 'error');
      return;
    }
    const category = (courseCategoryIn.value || '').trim() || undefined;
    const durationHours = courseDurationIn.value ? Number(courseDurationIn.value) : undefined;
    const recurrenceMonths = courseRecurrenceIn.value ? Number(courseRecurrenceIn.value) : undefined;
    const mandatory = courseMandatoryIn.checked;
    createCourseBtn.disabled = true;
    try {
      const res = await qhseFetch('/api/trainings/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, category, durationHours, mandatory, recurrenceMonths })
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(typeof body.error === 'string' ? body.error : 'Erreur création', 'error');
        return;
      }
      showToast('Formation créée', 'info');
      courseTitleIn.value = '';
      courseCategoryIn.value = '';
      courseDurationIn.value = '';
      courseRecurrenceIn.value = '';
      courseMandatoryIn.checked = false;
      await refreshCourses();
    } catch {
      showToast('Erreur serveur', 'error');
    } finally {
      createCourseBtn.disabled = false;
    }
  });

  createSessionBtn.addEventListener('click', async () => {
    if (!canWrite && su) {
      showToast('Création réservée', 'warning');
      return;
    }
    const courseId = sessionCourseSel.value;
    const dateRaw = sessionDateIn.value;
    if (!courseId || !dateRaw) {
      showToast('Formation et date requises', 'error');
      return;
    }
    const date = new Date(dateRaw).toISOString();
    const location = (sessionLocationIn.value || '').trim() || undefined;
    const trainer = (sessionTrainerIn.value || '').trim() || undefined;
    createSessionBtn.disabled = true;
    try {
      const res = await qhseFetch('/api/trainings/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, date, location, trainer })
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(typeof body.error === 'string' ? body.error : 'Erreur création', 'error');
        return;
      }
      showToast('Session planifiée', 'info');
      sessionDateIn.value = '';
      sessionLocationIn.value = '';
      sessionTrainerIn.value = '';
      await refreshSessions();
    } catch {
      showToast('Erreur serveur', 'error');
    } finally {
      createSessionBtn.disabled = false;
    }
  });

  createEnrollBtn.addEventListener('click', async () => {
    if (!canWrite && su) {
      showToast('Création réservée', 'warning');
      return;
    }
    const sessionId = enrollSessionSel.value;
    const userId = (enrollUserIdIn.value || '').trim();
    if (!sessionId || !userId) {
      showToast('Session et identifiant utilisateur requis', 'error');
      return;
    }
    createEnrollBtn.disabled = true;
    try {
      const res = await qhseFetch('/api/trainings/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, userId })
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(typeof body.error === 'string' ? body.error : 'Erreur création', 'error');
        return;
      }
      showToast('Inscription créée', 'info');
      enrollUserIdIn.value = '';
      await refreshEnrollments();
    } catch {
      showToast('Erreur serveur', 'error');
    } finally {
      createEnrollBtn.disabled = false;
    }
  });

  refreshAlerts();
  refreshCourses();
  refreshSessions();
  refreshEnrollments();

  const firstCard = page.querySelector('article');
  if (firstCard) firstCard.id = 'trainings-page-anchor';
  return page;
}
