/* =========================================================
   ui.js · Funciones de interfaz
   Pinta el listado, las estadísticas, la ventana modal y los
   mensajes. No guarda datos: solo muestra lo que recibe.
   ========================================================= */
const UI = (() => {
  const $ = (selector) => document.querySelector(selector);

  // Escapa texto para evitar que alguien inyecte HTML (XSS)
  // al escribir etiquetas dentro del prompt.
  function escapeHTML(text = '') {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function formatDate(iso) {
    return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  // Construye el HTML de una tarjeta de prompt.
  function promptCard(p) {
    const resultClass = 'r-' + p.result.replace(/\s/g, '-');
    const control = p.verified
      ? '<span class="tag ok">✔ Verificado</span>'
      : '<span class="tag warn">⚠ Sin verificar</span>';
    const changes = p.changes
      ? `<p class="prompt-changes"><strong>Ajustes:</strong> ${escapeHTML(p.changes)}</p>`
      : '';

    return `
      <li class="prompt ${resultClass}" data-id="${p.id}">
        <div class="prompt-top">
          <p class="prompt-title">${escapeHTML(p.title)}</p>
          <span class="prompt-date">${formatDate(p.updatedAt)}</span>
        </div>
        <pre class="prompt-text">${escapeHTML(p.text)}</pre>
        ${changes}
        <div class="meta">
          <span class="tag tool">${escapeHTML(p.tool)}</span>
          <span class="tag">${escapeHTML(p.event)}</span>
          <span class="tag">${escapeHTML(p.purpose)}</span>
          <span class="tag">${escapeHTML(p.result)}</span>
          ${control}
          <div class="prompt-actions">
            <button class="btn ghost small" data-action="copy">Copiar</button>
            <button class="btn ghost small" data-action="edit">Editar</button>
            <button class="btn danger small" data-action="delete">Eliminar</button>
          </div>
        </div>
      </li>`;
  }

  // READ: dibuja la lista filtrada y muestra el mensaje vacío si aplica.
  function renderList(prompts, totalCount) {
    $('#prompt-list').innerHTML = prompts.map(promptCard).join('');
    const empty = $('#empty');
    empty.classList.toggle('hidden', prompts.length > 0);
    // El botón de ejemplos solo aparece si la bitácora está realmente vacía.
    empty.querySelector('p').textContent = totalCount === 0
      ? 'Todavía no hay prompts registrados.'
      : 'Ningún prompt coincide con los filtros.';
    $('#seed-btn').classList.toggle('hidden', totalCount > 0);
  }

  // Indicadores rápidos sobre toda la bitácora.
  function renderStats(all) {
    const total = all.length;
    const verified = all.filter((p) => p.verified).length;
    const useful = all.filter((p) => p.result === 'Útil').length;
    const pct = (n) => (total ? Math.round((n / total) * 100) : 0);
    $('#stats').innerHTML = `
      <span class="stat">${total} prompts</span>
      <span class="stat">${pct(verified)} % verificados</span>
      <span class="stat">${pct(useful)} % útiles</span>`;
  }

  function showToast(message) {
    const toast = $('#toast');
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove('show'), 2200);
  }

  // DELETE: abre la ventana de confirmación y devuelve una promesa
  // que se resuelve en true (eliminar) o false (cancelar).
  function confirmDelete(title) {
    return new Promise((resolve) => {
      const modal = $('#modal');
      $('#modal-text').textContent = `Se eliminará "${title}". Esta acción no se puede deshacer.`;
      modal.classList.remove('hidden');
      $('#modal-confirm').focus();

      const close = (answer) => {
        modal.classList.add('hidden');
        $('#modal-confirm').onclick = null;
        $('#modal-cancel').onclick = null;
        document.onkeydown = null;
        resolve(answer);
      };
      $('#modal-confirm').onclick = () => close(true);
      $('#modal-cancel').onclick = () => close(false);
      document.onkeydown = (e) => { if (e.key === 'Escape') close(false); };
    });
  }

  return { renderList, renderStats, showToast, confirmDelete };
})();
