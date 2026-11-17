/* =========================================================
   app.js · Lógica principal
   Conecta el formulario y los botones con Storage (datos)
   y con UI (pantalla). Aquí viven las 4 operaciones CRUD.
   ========================================================= */
(() => {
  const $ = (selector) => document.querySelector(selector);
  const form = $('#prompt-form');

  // Campos del formulario que se guardan tal cual.
  const FIELDS = ['title', 'text', 'tool', 'event', 'purpose', 'result', 'changes'];

  // ---------- Utilidades del formulario ----------

  // Lee el formulario y arma un objeto con los datos limpios.
  function readForm() {
    const data = {};
    FIELDS.forEach((f) => { data[f] = $('#' + f).value.trim(); });
    data.verified = $('#verified').checked;
    return data;
  }

  // Valida los campos obligatorios. Devuelve un mensaje de error o "".
  function validate(data) {
    ['title', 'text'].forEach((f) => $('#' + f).classList.remove('invalid'));
    if (!data.title) { $('#title').classList.add('invalid'); return 'El nombre corto es obligatorio.'; }
    if (data.text.length < 10) { $('#text').classList.add('invalid'); return 'El prompt debe tener al menos 10 caracteres.'; }
    return '';
  }

  // Deja el formulario en modo "crear".
  function resetForm() {
    form.reset();
    $('#prompt-id').value = '';
    $('#event').value = 'Desarrollo';
    $('#form-title').textContent = 'Registrar prompt';
    $('#submit-btn').textContent = 'Guardar prompt';
    $('#cancel-btn').classList.add('hidden');
    $('#form-error').textContent = '';
    ['title', 'text'].forEach((f) => $('#' + f).classList.remove('invalid'));
  }

  // Pasa el formulario a modo "editar" con los datos del prompt.
  function fillForm(prompt) {
    FIELDS.forEach((f) => { $('#' + f).value = prompt[f] || ''; });
    $('#verified').checked = Boolean(prompt.verified);
    $('#prompt-id').value = prompt.id;
    $('#form-title').textContent = 'Editar prompt';
    $('#submit-btn').textContent = 'Actualizar prompt';
    $('#cancel-btn').classList.remove('hidden');
    $('#title').focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ---------- READ: filtrar y pintar ----------
  function render() {
    const all = Storage.getAll();
    const term = $('#search').value.trim().toLowerCase();
    const tool = $('#filter-tool').value;
    const event = $('#filter-event').value;

    const visible = all.filter((p) => {
      const matchesText = !term || [p.title, p.text, p.changes].join(' ').toLowerCase().includes(term);
      return matchesText && (!tool || p.tool === tool) && (!event || p.event === event);
    });

    UI.renderList(visible, all.length);
    UI.renderStats(all);
  }

  // ---------- CREATE y UPDATE: envío del formulario ----------
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = readForm();
    const error = validate(data);
    $('#form-error').textContent = error;
    if (error) return;

    const id = $('#prompt-id').value;
    if (id) {
      Storage.update(id, data);            // UPDATE
      UI.showToast('Prompt actualizado');
    } else {
      Storage.create(data);                // CREATE
      UI.showToast('Prompt guardado');
    }
    resetForm();
    render();
  });

  $('#cancel-btn').addEventListener('click', resetForm);

  // ---------- Acciones de cada tarjeta (delegación de eventos) ----------
  // Un solo listener en la lista atiende los botones de todas las tarjetas.
  $('#prompt-list').addEventListener('click', async (e) => {
    const button = e.target.closest('button[data-action]');
    if (!button) return;
    const id = button.closest('.prompt').dataset.id;
    const prompt = Storage.getById(id);
    if (!prompt) return;

    switch (button.dataset.action) {
      case 'edit':
        fillForm(prompt);
        break;

      case 'delete': {                     // DELETE con confirmación
        const ok = await UI.confirmDelete(prompt.title);
        if (!ok) return;
        Storage.remove(id);
        if ($('#prompt-id').value === id) resetForm(); // si se estaba editando
        UI.showToast('Prompt eliminado');
        render();
        break;
      }

      case 'copy':
        try {
          await navigator.clipboard.writeText(prompt.text);
          UI.showToast('Prompt copiado al portapapeles');
        } catch {
          UI.showToast('No se pudo copiar en este navegador');
        }
        break;
    }
  });

  // ---------- Filtros: se vuelve a pintar al escribir o cambiar ----------
  ['#search', '#filter-tool', '#filter-event'].forEach((sel) => {
    $(sel).addEventListener('input', render);
  });

  // ---------- Datos de ejemplo para la demostración ----------
  $('#seed-btn').addEventListener('click', () => {
    const examples = [
      { title: 'Estructura base del CRUD', tool: 'Claude', event: 'Desarrollo', purpose: 'Generar código', result: 'Útil', verified: true,
        text: 'Crea la estructura de una app web CRUD con HTML, CSS y JavaScript puro que guarde los datos en localStorage.',
        changes: 'Separé el código en storage.js, ui.js y app.js y traduje los textos al español.' },
      { title: 'Historias de usuario del módulo de pedidos', tool: 'ChatGPT', event: 'Refinamiento', purpose: 'Historias de usuario', result: 'Parcial', verified: true,
        text: 'Redacta 3 historias de usuario con criterios Dado/Cuando/Entonces para pedir comida en la cafetería universitaria.',
        changes: 'El Product Owner eliminó una historia que inventaba pagos con tarjeta.' },
      { title: 'Resumen para la Sprint Review', tool: 'Gemini', event: 'Sprint Review', purpose: 'Documentar', result: 'No útil', verified: false,
        text: 'Resume en 5 viñetas lo que el equipo terminó en el Sprint 2 a partir de esta lista de tareas.',
        changes: '' },
    ];
    examples.forEach((ex) => Storage.create(ex));
    UI.showToast('Ejemplos cargados');
    render();
  });

  // Primera pintura al abrir la página.
  render();
})();
