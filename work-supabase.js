/* Lumetra Studio — live Portfolio powered by Supabase CMS */
(() => {
  const grid = document.getElementById('allProjects');
  const empty = document.getElementById('workEmpty');
  const filters = document.getElementById('workFilters');
  if (!grid || !window.supabase || !window.LUMETRA_SUPABASE_CONFIG) return;

  const cfg = window.LUMETRA_SUPABASE_CONFIG;
  const client = window.supabase.createClient(cfg.url, cfg.anonKey);
  let projects = [];

  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  }[c]));

  const imageUrl = value => {
    const raw = String(value || '').trim();
    if (!raw) return '';
    if (/^https?:\/\//i.test(raw)) return raw;
    if (raw.startsWith('/')) return raw;
    // Support Supabase Storage object paths in the lumetra-media bucket.
    const path = raw.replace(/^lumetra-media\//, '').replace(/^\/+/, '');
    return client.storage.from('lumetra-media').getPublicUrl(path).data.publicUrl;
  };

  const render = category => {
    const list = projects.filter(p => category === 'All' || p.category === category);
    grid.innerHTML = list.map(p => {
      const image = imageUrl(p.image);
      const title = esc(p.title);
      const href = /^https?:\/\//i.test(p.url || '') ? esc(p.url) : '#';
      return `<a class="project" href="${href}" ${href !== '#' ? 'target="_blank" rel="noopener noreferrer"' : ''}>
        ${image ? `<img src="${esc(image)}" alt="${title}" loading="lazy">` : `<div class="project-placeholder" aria-hidden="true"></div>`}
        <div class="project-info"><h3>${title}</h3><p>${esc(p.type || p.category || '')}</p></div>
      </a>`;
    }).join('');
    empty.hidden = list.length > 0;
    empty.textContent = projects.length ? 'No projects in this category yet.' : 'No published projects yet. Check back soon.';
  };

  const setFilters = () => {
    const categories = [...new Set(projects.map(p => p.category).filter(Boolean))];
    filters.innerHTML = `<button class="filter active" data-filter="All">All Work</button>` +
      categories.map(c => `<button class="filter" data-filter="${esc(c)}">${esc(c)}</button>`).join('');
    filters.querySelectorAll('[data-filter]').forEach(button => {
      button.addEventListener('click', () => {
        filters.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('active'));
        button.classList.add('active');
        render(button.dataset.filter);
      });
    });
  };

  const load = async () => {
    grid.innerHTML = '<p class="empty-note">Loading published projects…</p>';
    const { data, error } = await client.from('projects')
      .select('id,title,category,type,image,url,sort_order,status')
      .eq('status', 'published')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Lumetra Portfolio load failed:', error);
      grid.innerHTML = '';
      empty.hidden = false;
      empty.textContent = 'Portfolio is temporarily unavailable. Please try again later.';
      return;
    }
    projects = data || [];
    setFilters();
    render('All');
  };

  load();
})();
