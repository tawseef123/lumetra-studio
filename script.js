const C=window.LUMETRA_CONTENT||{projects:[],assets:[]};
const projectCard=p=>`<a class="project" href="${p.url||'#'}"><img src="${p.image}" alt="${p.title}" loading="lazy"><div class="project-info"><h3>${p.title}</h3><p>${p.type||p.category}</p></div></a>`;
const assetCard=(a,download=false)=>`<article class="asset-card"><img src="${a.image}" alt="${a.title}" loading="lazy"><div class="asset-info"><h3>${a.title}</h3><p>${a.count}</p>${download?`<a class="asset-download ${a.driveUrl?'':'disabled'}" ${a.driveUrl?`href="${a.driveUrl}" target="_blank" rel="noopener"`:'aria-disabled="true" title="Add a Google Drive link in content.js"'}>↓ Download</a>`:''}</div></article>`;
const fp=document.getElementById('featuredProjects');if(fp)fp.innerHTML=C.projects.slice(0,3).map(projectCard).join('');
const fa=document.getElementById('featuredAssets');if(fa)fa.innerHTML=C.assets.slice(0,4).map(assetCard).join('');
const ap=document.getElementById('allProjects');if(ap){const render=f=>{const list=C.projects.filter(p=>f==='All'||p.category===f);ap.innerHTML=list.map(projectCard).join('');document.getElementById('workEmpty').hidden=list.length>0};render('All');document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('[data-filter]').forEach(x=>x.classList.remove('active'));b.classList.add('active');render(b.dataset.filter)}));}
const aa=document.getElementById('allAssets');if(aa)aa.innerHTML=C.assets.map(a=>assetCard(a,true)).join('');
// FAQ accordion: one panel open at a time; first item is open by default.
(()=>{
  const items=[...document.querySelectorAll('.faq-item')];
  if(!items.length)return;
  items.forEach(item=>{
    const button=item.querySelector('.faq-question');
    const panel=item.querySelector('.faq-answer');
    button?.addEventListener('click',()=>{
      const shouldOpen=!item.classList.contains('is-open');
      items.forEach(other=>{
        const open=other===item&&shouldOpen;
        other.classList.toggle('is-open',open);
        const trigger=other.querySelector('.faq-question');
        const answer=other.querySelector('.faq-answer');
        trigger?.setAttribute('aria-expanded',String(open));
        if(answer)answer.hidden=!open;
      });
    });
  });
})();

const menu=document.getElementById('menuBtn'),nav=document.getElementById('mainNav');
if(menu&&nav){
  const closeMenu=()=>{nav.classList.remove('open');menu.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Open navigation')};
  menu.addEventListener('click',()=>{const opening=!nav.classList.contains('open');nav.classList.toggle('open',opening);menu.classList.toggle('open',opening);menu.setAttribute('aria-expanded',String(opening));menu.setAttribute('aria-label',opening?'Close navigation':'Open navigation')});
  nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu()});
  document.addEventListener('click',e=>{if(nav.classList.contains('open')&&!nav.contains(e.target)&&!menu.contains(e.target))closeMenu()});
  window.addEventListener('resize',()=>{if(window.innerWidth>760)closeMenu()});
}

// Smooth eased in-page navigation (ease-in-out cubic)
(()=>{
  const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
  document.querySelectorAll('a[href^="#"],a[href*="index.html#"]').forEach(link=>{
    link.addEventListener('click',event=>{
      const url=new URL(link.href,location.href);
      if(url.pathname!==location.pathname && !url.pathname.endsWith('/index.html')) return;
      const id=url.hash.slice(1),target=document.getElementById(id);if(!target)return;
      event.preventDefault();
      if(reduce){target.scrollIntoView();history.pushState(null,'','#'+id);return;}
      const start=window.scrollY,navH=document.querySelector('.nav')?.offsetHeight||0;
      const end=target.getBoundingClientRect().top+start-navH-8,distance=end-start,duration=Math.min(420,Math.max(180,Math.abs(distance)*.22));
      let begin;
      const step=now=>{if(begin===undefined)begin=now;const p=Math.min(1,(now-begin)/duration);window.scrollTo(0,start+distance*ease(p));if(p<1)requestAnimationFrame(step);else history.pushState(null,'','#'+id);};
      requestAnimationFrame(step);
    });
  });
})();

// Replaying pop-in blur reveal on every viewport entry
(()=>{
  const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sections=[...document.querySelectorAll('main > section')];
  if(reduce){return;}
  const selectors='.eyebrow,h1,h2,h3,p,.btn,.stat,.service,.project,.asset-card,.faq-item,.about>img,.benefit,.contact-form input,.contact-form textarea,.contact-form button';
  let lastY=window.scrollY;
  let direction='down';
  window.addEventListener('scroll',()=>{
    const y=window.scrollY;
    if(Math.abs(y-lastY)>2) direction=y>lastY?'down':'up';
    lastY=y;
  },{passive:true});
  sections.forEach(section=>{
    [...section.querySelectorAll(selectors)].forEach((el,i)=>{
      el.classList.add('pop-reveal');
      el.style.setProperty('--pop-delay',`${Math.min((i%8)*35,245)}ms`);
    });
  });
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
    const items=entry.target.querySelectorAll('.pop-reveal');
    if(entry.isIntersecting){
      items.forEach(el=>{
        el.classList.remove('pop-in','pop-from-up','pop-from-down');
        void el.offsetWidth;
        el.classList.add('pop-in',direction==='down'?'pop-from-down':'pop-from-up');
      });
    }else{
      items.forEach(el=>el.classList.remove('pop-in','pop-from-up','pop-from-down'));
    }
  }),{threshold:.12,rootMargin:'0px 0px -5% 0px'});
  sections.forEach(section=>observer.observe(section));
})();


// Persistent dark/light theme toggle
(()=>{
  const body=document.body;
  const toggle=document.getElementById('themeToggle');
  if(!toggle)return;
  const icon=toggle.querySelector('.theme-icon');
  const apply=theme=>{
    body.dataset.theme=theme;
    const light=theme==='light';
    toggle.setAttribute('aria-label',light?'Switch to dark theme':'Switch to light theme');
    toggle.setAttribute('title',light?'Switch to dark theme':'Switch to light theme');
    if(icon){icon.textContent=light?'☾':'☼';icon.classList.remove('spin');void icon.offsetWidth;icon.classList.add('spin');}
    const meta=document.querySelector('meta[name="theme-color"]');
    if(meta)meta.content=light?'#E1E4EA':'#020b1d';
  };
  let saved='dark';
  try{saved=localStorage.getItem('lumetra-theme')||'dark'}catch(e){}
  apply(saved==='light'?'light':'dark');
  toggle.addEventListener('click',()=>{
    const next=body.dataset.theme==='light'?'dark':'light';
    apply(next);
    try{localStorage.setItem('lumetra-theme',next)}catch(e){}
  });
})();


// V4.0 — Keep the navigation item selected for the visible homepage segment
// and keep Portfolio / Assets selected on their dedicated pages.
(()=>{
  const nav=document.getElementById('mainNav');
  if(!nav)return;
  const links=[...nav.querySelectorAll('a')];
  const setActive=key=>{
    links.forEach(a=>{
      const href=a.getAttribute('href')||'';
      const match=href===key || href.endsWith('#'+key) ||
        (key==='portfolio' && /(^|\/)work\.html(?:$|[?#])/.test(href)) ||
        (key==='assets' && /(^|\/)assets\.html(?:$|[?#])/.test(href));
      a.classList.toggle('active',match);
      if(match)a.setAttribute('aria-current','page'); else a.removeAttribute('aria-current');
    });
  };
  const path=location.pathname;
  if(/(^|\/)work\.html$/.test(path)){setActive('portfolio');return;}
  if(/(^|\/)assets\.html$/.test(path)){setActive('assets');return;}
  const sections=['home','services','portfolio','assets','faq','about','contact']
    .map(id=>document.getElementById(id)).filter(Boolean);
  if(!sections.length)return;
  let scheduled=false;
  const update=()=>{
    scheduled=false;
    const marker=(document.querySelector('.nav')?.getBoundingClientRect().bottom||64)+Math.min(150,window.innerHeight*.22);
    let current=sections[0];
    for(const section of sections){
      if(section.getBoundingClientRect().top<=marker)current=section;
      else break;
    }
    // At the very bottom, make the final segment active even if its top is above the marker.
    if(window.innerHeight+window.scrollY>=document.documentElement.scrollHeight-4)current=sections[sections.length-1];
    setActive(current.id);
  };
  const requestUpdate=()=>{if(!scheduled){scheduled=true;requestAnimationFrame(update);}};
  window.addEventListener('scroll',requestUpdate,{passive:true});
  window.addEventListener('resize',requestUpdate,{passive:true});
  window.addEventListener('hashchange',requestUpdate);
  requestUpdate();
})();


// V4.1 — Lightweight interactive particle network on the homepage hero.
// Brand-colour nodes, connecting lines, occasional triangles and cursor response.
(()=>{
  const canvas=document.getElementById('heroParticles');
  const hero=canvas?.closest('.hero');
  if(!canvas||!hero)return;
  const ctx=canvas.getContext('2d',{alpha:true});
  if(!ctx)return;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse=window.matchMedia('(pointer: coarse)').matches;
  let w=0,h=0,dpr=1,nodes=[],raf=0,visible=true,last=0;
  const pointer={x:-1000,y:-1000,active:false};
  const rand=(a,b)=>a+Math.random()*(b-a);
  const palette=['0,190,255','42,91,255','151,42,255','225,35,226'];
  const makeNode=()=>({x:rand(0,w),y:rand(0,h),vx:rand(-.22,.22),vy:rand(-.2,.2),r:rand(1.1,2.2),hue:palette[Math.floor(Math.random()*palette.length)],phase:rand(0,Math.PI*2)});
  const resize=()=>{
    const rect=hero.getBoundingClientRect();
    w=Math.max(1,rect.width);h=Math.max(1,rect.height);dpr=Math.min(window.devicePixelRatio||1,1.55);
    canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
    canvas.style.width=w+'px';canvas.style.height=h+'px';ctx.setTransform(dpr,0,0,dpr,0,0);
    const count=Math.max(22,Math.min(coarse?34:76,Math.round(w*h/(coarse?14500:10500))));
    nodes=Array.from({length:count},makeNode);draw();
  };
  const draw=()=>{
    ctx.clearRect(0,0,w,h);
    const light=document.body.dataset.theme==='light';
    const maxDist=coarse?118:150, mouseDist=coarse?145:210;
    // Move particles gently; cursor adds a soft attraction and local energy.
    nodes.forEach(p=>{
      if(!reduced){
        p.phase+=.012;
        p.vx+=Math.cos(p.phase)*.0018;p.vy+=Math.sin(p.phase*.9)*.0016;
        if(pointer.active){
          const dx=pointer.x-p.x,dy=pointer.y-p.y,dist=Math.hypot(dx,dy)||1;
          if(dist<mouseDist){const force=(1-dist/mouseDist)*.012;p.vx+=dx/dist*force;p.vy+=dy/dist*force;}
        }
        p.vx=Math.max(-.42,Math.min(.42,p.vx));p.vy=Math.max(-.38,Math.min(.38,p.vy));
        p.x+=p.vx;p.y+=p.vy;
        if(p.x<-8)p.x=w+8;if(p.x>w+8)p.x=-8;if(p.y<-8)p.y=h+8;if(p.y>h+8)p.y=-8;
      }
    });
    // Fine network lines and subtle triangular meshes.
    for(let i=0;i<nodes.length;i++){
      const a=nodes[i];
      for(let j=i+1;j<nodes.length;j++){
        const b=nodes[j],dx=a.x-b.x,dy=a.y-b.y,dist=Math.hypot(dx,dy);
        if(dist<maxDist){
          const alpha=(1-dist/maxDist)*(light?.19:.34);
          ctx.strokeStyle=`rgba(${a.hue},${alpha})`;ctx.lineWidth=.65;
          ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
        }
      }
    }
    // Sparse triangular facets, similar to the reference interaction.
    for(let i=0;i<nodes.length;i++){
      const a=nodes[i];let near=[];
      for(let j=i+1;j<nodes.length;j++){
        const b=nodes[j],d=Math.hypot(a.x-b.x,a.y-b.y);if(d<maxDist*.72)near.push({b,d});
      }
      near=near.slice(0,5);
      for(let j=0;j<near.length;j++)for(let k=j+1;k<near.length;k++){
        const b=near[j].b,c=near[k].b;
        if(Math.hypot(b.x-c.x,b.y-c.y)<maxDist*.72){
          ctx.fillStyle=light?'rgba(23,78,166,.025)':'rgba(93,70,255,.045)';
          ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.lineTo(c.x,c.y);ctx.closePath();ctx.fill();
        }
      }
    }
    // Cursor field: glowing halo, nearby links and brighter nodes.
    if(pointer.active){
      const glow=ctx.createRadialGradient(pointer.x,pointer.y,0,pointer.x,pointer.y,mouseDist);
      glow.addColorStop(0,light?'rgba(23,78,166,.10)':'rgba(0,174,255,.13)');
      glow.addColorStop(.55,light?'rgba(123,25,214,.045)':'rgba(151,42,255,.055)');glow.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=glow;ctx.beginPath();ctx.arc(pointer.x,pointer.y,mouseDist,0,Math.PI*2);ctx.fill();
      nodes.forEach(p=>{const d=Math.hypot(pointer.x-p.x,pointer.y-p.y);if(d<mouseDist){
        const alpha=(1-d/mouseDist)*(light?.58:.9);
        ctx.strokeStyle=`rgba(${p.hue},${alpha*.6})`;ctx.lineWidth=1;
        ctx.beginPath();ctx.moveTo(pointer.x,pointer.y);ctx.lineTo(p.x,p.y);ctx.stroke();
        ctx.shadowBlur=12;ctx.shadowColor=`rgba(${p.hue},.8)`;ctx.fillStyle=`rgba(${p.hue},${alpha})`;
        ctx.beginPath();ctx.arc(p.x,p.y,p.r+1.2,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
      }});
      ctx.strokeStyle=light?'rgba(23,78,166,.20)':'rgba(100,160,255,.25)';ctx.lineWidth=1;
      ctx.beginPath();ctx.arc(pointer.x,pointer.y,18,0,Math.PI*2);ctx.stroke();
    }
    // Small glowing particle points.
    nodes.forEach(p=>{
      ctx.shadowBlur=pointer.active&&Math.hypot(pointer.x-p.x,pointer.y-p.y)<mouseDist?10:5;
      ctx.shadowColor=`rgba(${p.hue},.72)`;ctx.fillStyle=`rgba(${p.hue},${light?.62:.82})`;
      ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();
    });ctx.shadowBlur=0;
  };
  const loop=now=>{
    raf=0;if(!visible)return;
    if(now-last>(coarse?42:28)){draw();last=now;}
    if(!reduced)raf=requestAnimationFrame(loop);
  };
  const start=()=>{if(!raf&&visible&&!reduced)raf=requestAnimationFrame(loop);else if(reduced)draw()};
  const stop=()=>{if(raf)cancelAnimationFrame(raf);raf=0};
  const move=e=>{const r=hero.getBoundingClientRect();pointer.x=e.clientX-r.left;pointer.y=e.clientY-r.top;pointer.active=true;if(reduced)draw()};
  const leave=()=>{pointer.active=false;if(reduced)draw()};
  hero.addEventListener('pointermove',move,{passive:true});hero.addEventListener('pointerleave',leave,{passive:true});
  hero.addEventListener('touchstart',e=>{const t=e.touches[0];if(t){const r=hero.getBoundingClientRect();pointer.x=t.clientX-r.left;pointer.y=t.clientY-r.top;pointer.active=true;if(reduced)draw()}},{passive:true});
  hero.addEventListener('touchmove',e=>{const t=e.touches[0];if(t){const r=hero.getBoundingClientRect();pointer.x=t.clientX-r.left;pointer.y=t.clientY-r.top;pointer.active=true;if(reduced)draw()}},{passive:true});
  hero.addEventListener('touchend',leave,{passive:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else start()});
  if('IntersectionObserver'in window){new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)start();else stop()},{threshold:0}).observe(hero)}
  window.addEventListener('resize',resize,{passive:true});resize();start();
})();




// V10.0 — hover pop + smooth active-pill travel, including cross-page navigation.
(()=>{
  const bar=document.getElementById('magicBottomNav');
  if(!bar)return;
  const items=[...bar.querySelectorAll('.magic-nav-item')];
  if(!items.length)return;
  const sectionMap={home:0,services:1,portfolio:2,assets:3,faq:4,about:5,contact:6};
  const path=location.pathname;
  const pageTarget=path.endsWith('/work.html')?2:path.endsWith('/assets.html')?3:null;
  let activeIndex=items.findIndex(item=>item.classList.contains('is-active'));
  if(activeIndex<0)activeIndex=0;
  const markActive=(index)=>{
    const safe=Math.max(0,Math.min(items.length-1,index));
    activeIndex=safe;
    items.forEach((item,i)=>{
      const active=i===safe;
      item.classList.toggle('is-active',active);
      if(active)item.setAttribute('aria-current','page');
      else item.removeAttribute('aria-current');
    });
  };
  const setActive=(index)=>{
    const safe=Math.max(0,Math.min(items.length-1,index));
    if(safe===activeIndex && items[safe]?.classList.contains('is-active'))return;
    bar.style.setProperty('--active-index',String(safe));
    markActive(safe);
  };
  // Consume a one-time route transition saved by the page being left.
  let routeMove=null;
  try{
    const raw=sessionStorage.getItem('lumetra-nav-route');
    if(raw){routeMove=JSON.parse(raw);sessionStorage.removeItem('lumetra-nav-route');}
  }catch(e){}
  if(routeMove && Number.isInteger(routeMove.from) && Number.isInteger(routeMove.to) &&
     routeMove.from>=0 && routeMove.from<items.length && routeMove.to>=0 && routeMove.to<items.length){
    bar.style.setProperty('--active-index',String(routeMove.from));
    markActive(routeMove.to);
    void bar.offsetWidth;
    requestAnimationFrame(()=>bar.style.setProperty('--active-index',String(routeMove.to)));
  }else if(pageTarget!==null){
    bar.style.setProperty('--active-index',String(pageTarget));
    markActive(pageTarget);
  }
  let pendingTarget=null;
  let settleTimer=null;
  const markerY=()=> (document.querySelector('.nav')?.getBoundingClientRect().bottom||64)+Math.min(145,window.innerHeight*.2);
  const sections=Object.keys(sectionMap).map(id=>document.getElementById(id)).filter(Boolean);
  const update=()=>{
    if(!sections.length)return;
    if(pendingTarget){
      const target=document.getElementById(pendingTarget);
      if(target && target.getBoundingClientRect().top<=markerY()+10){
        const idx=sectionMap[pendingTarget];pendingTarget=null;
        if(Number.isFinite(idx))setActive(idx);
      }
      if(pendingTarget)return;
    }
    let current=sections[0];
    sections.forEach(section=>{if(section.getBoundingClientRect().top<=markerY())current=section;});
    if(window.innerHeight+window.scrollY>=document.documentElement.scrollHeight-4)current=sections[sections.length-1];
    if(current)setActive(sectionMap[current.id]??0);
  };
  items.forEach(item=>item.addEventListener('click',()=>{
    const href=item.getAttribute('href')||'';
    const targetIndex=Number(item.dataset.navIndex);
    let destination;
    try{destination=new URL(href,location.href);}catch(e){}
    if(destination && destination.pathname!==location.pathname){
      try{sessionStorage.setItem('lumetra-nav-route',JSON.stringify({from:activeIndex,to:targetIndex}));}catch(e){}
      return;
    }
    const targetHash=href.includes('#')?href.split('#').pop():'';
    if(targetHash && document.getElementById(targetHash)){
      pendingTarget=targetHash;
      setActive(targetIndex);
      clearTimeout(settleTimer);
      settleTimer=setTimeout(()=>{pendingTarget=null;update();},2200);
    }
  }));
  let queued=false;
  const schedule=()=>{
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;update();});
  };
  window.addEventListener('scroll',schedule,{passive:true});
  window.addEventListener('resize',schedule,{passive:true});
  window.addEventListener('hashchange',schedule);
  if('onscrollend' in window)window.addEventListener('scrollend',()=>{
    if(pendingTarget){
      const target=document.getElementById(pendingTarget);
      if(target && Math.abs(target.getBoundingClientRect().top-markerY())<100){
        const idx=sectionMap[pendingTarget];pendingTarget=null;clearTimeout(settleTimer);
        if(Number.isFinite(idx))setActive(idx);
      }
    }
    schedule();
  },{passive:true});
  if(!routeMove && pageTarget===null)schedule();
})();