document.addEventListener('DOMContentLoaded',function(){
  // set footer year
  const y = document.getElementById('year'); if(y) y.textContent = new Date().getFullYear();

  const navToggle = document.getElementById('navToggle');
  const mainNav = document.getElementById('mainNav');
  const siteHeader = document.getElementById('siteHeader');
  if(navToggle && mainNav){
    navToggle.addEventListener('click', ()=>{
      const expanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!expanded));
      // toggle header open state for mobile nav
      if(siteHeader) siteHeader.classList.toggle('open');
      // ensure main nav is visible when open
      if(siteHeader && siteHeader.classList.contains('open')) mainNav.style.display = 'block'; else mainNav.style.display = '';
    });

    // close mobile nav with Escape
    document.addEventListener('keydown', (e)=>{
      if(e.key === 'Escape' && siteHeader && siteHeader.classList.contains('open')){
        siteHeader.classList.remove('open');
        navToggle.setAttribute('aria-expanded','false');
        mainNav.style.display = '';
        navToggle.focus();
      }
    });
  }

  // fetch recent articles from API and append to the grid (if available)
  (async function loadArticles(){
    const grid = document.getElementById('articleGrid');
    if(!grid) return;
    try{
      const res = await fetch('/api/articles');
      if(!res.ok) return;
      const json = await res.json();
      const items = Array.isArray(json.data) ? json.data : [];
      // append any articles from the API (skip if none)
      items.forEach(a=>{
        const html = `
          <article class="card">
            <img src="https://via.placeholder.com/400x240" alt="${escapeHtml(a.title)}">
            <h3><a href="#">${escapeHtml(a.title)}</a></h3>
            <p class="excerpt">${escapeHtml(a.excerpt || '')}</p>
            <div class="meta">By <strong>${escapeHtml(a.author || '—')}</strong> · ${escapeHtml(String(a.readingTime || ''))} min read</div>
          </article>`;
        grid.insertAdjacentHTML('beforeend', html);
      });
    }catch(e){
      // ignore — API not available locally
      // console.warn('Could not load articles', e);
    }
  })();

  function escapeHtml(str){
    return String(str).replace(/[&<>"']/g, function(m){
      return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m];
    });
  }
});
