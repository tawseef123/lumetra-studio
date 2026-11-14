/* Lumetra Studio — category-first Portfolio + on-page YouTube player */
(()=>{
const cfg=window.LUMETRA_SUPABASE_CONFIG||{};if(!window.supabase||!cfg.url||!cfg.anonKey)return;
const db=window.supabase.createClient(cfg.url,cfg.anonKey);const home=document.getElementById('featuredCategories'),segments=document.getElementById('portfolioSegments'),empty=document.getElementById('workEmpty');
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ytId=url=>{try{const u=new URL(url);if(u.hostname==='youtu.be')return u.pathname.slice(1).split('/')[0];if(u.hostname.includes('youtube.com'))return u.searchParams.get('v')||u.pathname.split('/').filter(Boolean).pop();}catch(e){}return ''};
const imageUrl=v=>{if(!v)return '';if(/^https?:\/\//i.test(v)||String(v).startsWith('assets/'))return v;const path=String(v).replace(/^lumetra-media\//,'').replace(/^\/+/, '');return db.storage.from('lumetra-media').getPublicUrl(path).data.publicUrl};
function ensurePlayer(){if(document.getElementById('youtubeLightbox'))return;const box=document.createElement('div');box.id='youtubeLightbox';box.className='youtube-lightbox';box.innerHTML='<div class="youtube-dialog" role="dialog" aria-modal="true" aria-label="Portfolio video"><button class="youtube-close" type="button" aria-label="Close video">×</button><div class="youtube-frame"><iframe title="Portfolio video player" src="" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe></div></div>';document.body.appendChild(box);const close=()=>{box.classList.remove('open');box.querySelector('iframe').src='';document.body.classList.remove('video-modal-open')};box.querySelector('.youtube-close').onclick=close;box.addEventListener('click',e=>{if(e.target===box)close()});document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});}
function play(url){const id=ytId(url);if(!id)return;ensurePlayer();const box=document.getElementById('youtubeLightbox');box.querySelector('iframe').src='https://www.youtube-nocookie.com/embed/'+encodeURIComponent(id)+'?autoplay=1&rel=0';box.classList.add('open');document.body.classList.add('video-modal-open')}
function projectCard(p){const id=ytId(p.youtube_url||p.url);const thumb=id?'https://img.youtube.com/vi/'+encodeURIComponent(id)+'/hqdefault.jpg':imageUrl(p.image);return `<button class="portfolio-video-card" type="button" data-video="${esc(p.youtube_url||p.url||'')}"><span class="portfolio-video-thumb">${thumb?`<img src="${esc(thumb)}" alt="${esc(p.title)}" loading="lazy">`:''}<span class="portfolio-play" aria-hidden="true">▶</span></span><span class="portfolio-video-info"><strong>${esc(p.title)}</strong>${p.type?`<small>${esc(p.type)}</small>`:''}</span></button>`}
async function load(){
 const tasks=[];
 if(home) tasks.push(Promise.all([
   db.from('project_categories').select('id,name,sort_order').eq('status','published').order('sort_order'),
   db.from('projects').select('id,category_id,category,youtube_url,url,sort_order,created_at').eq('status','published').order('sort_order').order('created_at',{ascending:false})
 ]).then(([c,p])=>({kind:'home',categories:c.data||[],projects:p.data||[],error:c.error||p.error})));
 if(segments) tasks.push(Promise.all([
   db.from('project_categories').select('id,name,sort_order').eq('status','published').order('sort_order'),
   db.from('projects').select('id,title,category,category_id,type,image,url,youtube_url,sort_order').eq('status','published').order('sort_order').order('created_at',{ascending:false})
 ]).then(([c,p])=>({kind:'segments',categories:c.data||[],projects:p.data||[],error:c.error||p.error})));
 const results=await Promise.all(tasks);
 for(const result of results){
   if(result.error){console.error('Portfolio content load error',result.error);continue;}
   if(result.kind==='home'){
     const categories=result.categories||[], projects=result.projects||[];
     home.style.setProperty('--category-columns',String(Math.max(1,Math.ceil(categories.length/2))));
     home.innerHTML=categories.map(c=>{
       const items=projects.filter(p=>p.category_id===c.id||(!p.category_id&&String(p.category||'').toLowerCase()===c.name.toLowerCase()));
       const previews=items.slice(0,4).map(p=>{const id=ytId(p.youtube_url||p.url);return id?'https://img.youtube.com/vi/'+encodeURIComponent(id)+'/hqdefault.jpg':imageUrl(p.image)}).filter(Boolean);
       const tiles=previews.map((src,i)=>`<img class="portfolio-category-preview-image" src="${esc(src)}" alt="" loading="lazy">`).join('');
       return `<a class="portfolio-category-card portfolio-category-video-preview" href="work.html#category-${encodeURIComponent(c.id)}"><span class="portfolio-category-preview-grid preview-count-${previews.length}">${tiles}</span><span>${esc(c.name)}</span></a>`;
     }).join('');
   }else{
     const cats=result.categories,projects=result.projects;
     segments.innerHTML=cats.map(c=>{
       const items=projects.filter(p=>p.category_id===c.id||(!p.category_id&&String(p.category||'').toLowerCase()===c.name.toLowerCase()));
       return `<section class="portfolio-category-segment" id="category-${esc(c.id)}"><div class="portfolio-segment-heading"><div><p class="eyebrow">PORTFOLIO CATEGORY</p><h2>${esc(c.name)}</h2></div></div>${items.length?`<div class="all-grid">${items.map(projectCard).join('')}</div>`:'<p class="empty-note">Projects in this category will be added soon.</p>'}</section>`;
     }).join('');
     if(empty)empty.hidden=!!cats.length;
     segments.querySelectorAll('[data-video]').forEach(b=>b.addEventListener('click',()=>play(b.dataset.video)));
     if(location.hash.startsWith('#category-'))setTimeout(()=>document.querySelector(location.hash)?.scrollIntoView({behavior:'smooth',block:'start'}),200);
   }
 }
}
load();})();
