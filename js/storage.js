/* =========================================================
   storage.js · Capa de datos
   Toda la lectura y escritura en localStorage pasa por aquí.
   Si mañana cambiamos a un servidor o a Firebase, solo se
   modifica este archivo; ui.js y app.js no se enteran.
   ========================================================= */
const Storage = (() => {
  const KEY = 'promptboard.prompts.v1';

  // READ: devuelve el arreglo de prompts guardados (o uno vacío).
  function getAll() {
    try {
      const data = JSON.parse(localStorage.getItem(KEY));
      return Array.isArray(data) ? data : [];
    } catch (error) {
      // Si el JSON está dañado no rompemos la app: empezamos de cero.
      console.warn('Datos dañados en localStorage, se reinicia la bitácora.', error);
      return [];
    }
  }

  // Guarda el arreglo completo.
  function saveAll(prompts) {
    localStorage.setItem(KEY, JSON.stringify(prompts));
  }

  // Genera un id único. randomUUID no existe en navegadores viejos,
  // así que hay un respaldo con la hora + un número aleatorio.
  function newId() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  // Busca un prompt por su id.
  function getById(id) {
    return getAll().find((p) => p.id === id) || null;
  }

  // CREATE: agrega un prompt nuevo con id y fecha automáticos.
  function create(data) {
    const prompts = getAll();
    const now = new Date().toISOString();
    const prompt = { ...data, id: newId(), createdAt: now, updatedAt: now };
    prompts.unshift(prompt); // el más reciente queda de primero
    saveAll(prompts);
    return prompt;
  }

  // UPDATE: reemplaza los campos de un prompt existente.
  function update(id, data) {
    const prompts = getAll();
    const index = prompts.findIndex((p) => p.id === id);
    if (index === -1) return null;
    prompts[index] = { ...prompts[index], ...data, updatedAt: new Date().toISOString() };
    saveAll(prompts);
    return prompts[index];
  }

  // DELETE: elimina un prompt por id. Devuelve true si existía.
  function remove(id) {
    const prompts = getAll();
    const filtered = prompts.filter((p) => p.id !== id);
    saveAll(filtered);
    return filtered.length < prompts.length;
  }

  return { getAll, getById, create, update, remove };
})();
