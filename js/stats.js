// Actualiza las estadísticas del home desde la API PHP
(function () {
  const byId = (id) => document.getElementById(id);

  async function fetchStats() {
    try {
      const base = (window.apiConfig && window.apiConfig.baseURL) 
        ? window.apiConfig.baseURL.replace(/\/+$/, '')
        : window.location.pathname.replace(/[^/]+$/, '') + 'php/api';
      const url = `${base}/estadisticas.php`;
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const payload = await res.json();
      if (payload && payload.success === false) return null;
      return payload.data || payload;
    } catch (e) {
      console.warn('Fallo cargando estadísticas:', e.message);
      return null;
    }
  }

  function renderStats(data) {
    const nf = new Intl.NumberFormat('es-CO');
    const toNumber = (val) => {
      if (typeof val === 'number' && isFinite(val)) return val;
      if (typeof val === 'string') {
        const digits = val.match(/\d+/g);
        return digits ? parseInt(digits.join(''), 10) : 0;
      }
      if (val && typeof val === 'object' && typeof val.total === 'number') {
        return val.total;
      }
      return 0;
    };
    const setVal = (id, val) => {
      const el = byId(id);
      if (el) {
        const num = toNumber(val);
        el.setAttribute('data-target', String(num));
        el.textContent = nf.format(num) + '+';
      }
    };
    console.debug('Estadísticas recibidas:', data);
    setVal('plantasCount', data?.plantas);
    setVal('recetasCount', data?.recetas);
    setVal('comunidadesCount', data?.comunidades);
    setVal('usuariosCount', data?.usuarios_activos);
  }

  async function initStats() {
    // Solo si existen los contadores en esta página
    if (!byId('plantasCount')) return;
    const data = await fetchStats();
    if (data) renderStats(data);
  }

  // Exponer inicializador global y ejecutar según el estado del documento
  window.initHomeStats = initStats;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStats);
  } else {
    // DOM ya listo
    initStats();
  }
})();
