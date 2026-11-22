(()=>{
const cfg=window.LUMETRA_SUPABASE_CONFIG||{};
if(!window.supabase||!cfg.url||!cfg.anonKey)return;
const db=window.supabase.createClient(cfg.url,cfg.anonKey);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icons={
 address:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>',
 email:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
 phone:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h3l2 5-2 2a15 15 0 0 0 4 4l2-2 5 2v3c0 1.1-.9 2-2 2C10 19 5 14 5 5c0-1.1.9-2 2-2Z"/></svg>'
};
const socials=['facebook','instagram','youtube','linkedin','whatsapp'];
async function apply(){
 const {data,error}=await db.from('site_content').select('content_key,content_value').eq('section','footer').eq('status','published');
 if(error||!data)return;
 const v=Object.fromEntries(data.map(x=>[x.content_key,x.content_value||'']));
 document.querySelectorAll('.footer-column').forEach(col=>{
  if(!col.querySelector('.footer-detail'))return;
  const details=[
   {key:'address',value:v.address,href:v.map_url||'',icon:icons.address,label:'Office address'},
   {key:'email',value:v.email,href:v.email?'mailto:'+v.email:'',icon:icons.email,label:'Email address'},
   {key:'phone',value:v.phone,href:v.phone?'tel:'+v.phone.replace(/[^\d+]/g,''):'',icon:icons.phone,label:'Phone number'}
  ];
  col.querySelectorAll('.footer-detail').forEach((a,i)=>{
   const d=details[i];if(!d)return;
   if(!d.value){a.hidden=true;return}
   a.hidden=false;a.classList.remove('footer-inert');a.href=d.href||'#';a.innerHTML=`<span class="footer-symbol footer-contact-icon">${d.icon}</span><span>${esc(d.value)}</span>`;
   if(d.href&&/^https?:/i.test(d.href)){a.target='_blank';a.rel='noopener noreferrer'}else{a.removeAttribute('target');a.removeAttribute('rel')}
  });
 });
 const emailButton=document.getElementById('contactEmailLink');
 if(emailButton){
  const officialEmail=(v.email||'').trim();
  if(officialEmail){
   const subject='Project Enquiry — Lumetra Studio';
   const body='Hello Lumetra Studio,\\n\\nI would like to discuss a project.\\n\\nProject details:\\n\\nThank you.';
   emailButton.href='https://mail.google.com/mail/?view=cm&fs=1&to='+encodeURIComponent(officialEmail)+'&su='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);
   emailButton.target='_blank';emailButton.rel='noopener noreferrer';emailButton.hidden=false;
  }else{emailButton.hidden=true;emailButton.removeAttribute('href');}
 }
 const contactLink=document.getElementById('contactWhatsAppLink');
 const contactNote=document.getElementById('contactWhatsAppNote');
 if(contactLink){
  const wa=v.whatsapp||'';
  if(wa){contactLink.href=wa;contactLink.hidden=false;if(contactNote)contactNote.textContent='Opens a direct WhatsApp conversation with Lumetra Studio.';}
  else{contactLink.hidden=true;if(contactNote)contactNote.textContent='WhatsApp contact is being configured. Please check back soon.';}
 }
 document.querySelectorAll('.footer-social-column .social-row').forEach(a=>{
  const key=(a.getAttribute('aria-label')||'').toLowerCase();
  if(!socials.includes(key))return;
  const href=v[key]||'';
  if(!href){a.hidden=true;a.removeAttribute('href');return}
  a.hidden=false;a.href=href;a.target='_blank';a.rel='noopener noreferrer';a.classList.remove('footer-inert');
 });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply);else apply();
})();