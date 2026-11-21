(()=>{
const cfg=window.LUMETRA_SUPABASE_CONFIG||{};const configured=cfg.url&&!cfg.url.includes('YOUR-PROJECT')&&cfg.anonKey&&!cfg.anonKey.includes('YOUR_SUPABASE');
const client=window.supabase&&configured?window.supabase.createClient(cfg.url,cfg.anonKey):null;
const $=id=>document.getElementById(id);let current='overview',rows=[],editing=null,toastTimer,categories=[],assetCategories=[],currentRole=null,currentUser=null;
const models={categories:{title:'Portfolio Categories',desc:'Create categories with a JPG thumbnail. Published categories appear on the homepage and Portfolio page.',table:'project_categories',fields:[['name','Category name','text',1],['sort_order','Display order','number',0],['status','Publishing status','select',0,['draft','published']] ]},assetCategories:{title:'Asset Categories',desc:'Create asset categories with a JPG thumbnail. Published categories appear on the homepage and Assets page.',table:'asset_categories',fields:[['name','Category name','text',1],['thumbnail','Category thumbnail (JPG)','file',1],['sort_order','Display order','number',0],['status','Publishing status','select',0,['draft','published']] ]},projects:{title:'Portfolio Content',desc:'Add a project, select its category and paste its YouTube link. Videos play in an on-page popup.',table:'projects',fields:[['title','Project title','text',1],['category_id','Category','category',1],['type','Short description','text',0],['youtube_url','YouTube link','url',1],['sort_order','Display order','number',0],['status','Publishing status','select',0,['draft','published']]]},assets:{title:'Assets',desc:'Add downloadable resources under an Asset Category.',table:'assets',fields:[['title','Asset title','text',1],['category_id','Asset category','assetCategory',1],['description','Description','textarea',0],['drive_url','Download URL','url',0],['sort_order','Display order','number',0],['status','Publishing status','select',0,['draft','published']] ]},services:{title:'Services',desc:'Edit the services presented across your website.',table:'services',fields:[['title','Service title','text',1],['description','Description','textarea',1],['icon','Icon name / URL','text',0],['sort_order','Display order','number',0],['status','Publishing status','select',0,['draft','published']] ]},faqs:{title:'FAQs',desc:'Manage questions and answers in your FAQ section.',table:'faqs',fields:[['question','Question','text',1],['answer','Answer','textarea',1],['sort_order','Display order','number',0],['status','Publishing status','select',0,['draft','published']] ]},pages:{title:'Page Content',desc:'Manage editable homepage, about, contact and footer content by key.',table:'site_content',fields:[['section','Section','select',1,['hero','about','contact','footer','global']],['content_key','Content key','text',1],['content_value','Content value','textarea',1],['status','Publishing status','select',0,['draft','published']] ]}};
function notify(msg){const t=$('toast');t.textContent=msg;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),2800)}
function showApp(user){currentUser=user;$('loginView').classList.add('hidden');$('appView').classList.remove('hidden');const displayName=user.user_metadata?.full_name||user.user_metadata?.name||user.email||'Account';$('userAvatar').textContent=(displayName.trim().slice(0,2)||'LS').toUpperCase();$('profileDisplayName').textContent=displayName;$('profileEmail').textContent=user.email||'';$('profileRole').textContent=(currentRole||'editor').toUpperCase();$('profileNameInput').value=user.user_metadata?.full_name||user.user_metadata?.name||'';document.querySelectorAll('[data-owner-only]').forEach(el=>el.classList.toggle('hidden',currentRole!=='owner'))}
async function loadCurrentRole(){const {data:{user},error:userError}=await client.auth.getUser();if(userError||!user)throw new Error('Please sign in again.');const {data,error}=await client.from('admin_users').select('role').eq('user_id',user.id).maybeSingle();if(error)throw error;if(!data?.role)throw new Error('Your account has no CMS role. Ask the owner to grant access.');currentRole=data.role;}
function showLogin(){
 $('appView').classList.add('hidden');
 $('loginView').classList.remove('hidden');
 const cta=$('loginCta');
 cta.classList.remove('loading');
 cta.disabled=true;
 $('loginError').textContent='';
 $('loginForm').reset();
 cta.classList.remove('unlocked');
}
function setConnection(ok,msg){$('connectionStatus').textContent=msg;$('connectionStatus').className='status '+(ok?'ok':'bad')}
async function init(){if(!client){setConnection(false,'Supabase not configured');return}try{const {data:{session},error}=await client.auth.getSession();if(error)throw error;if(session){await loadCurrentRole();showApp(session.user);await loadCategories();await loadOverview()}setConnection(true,'Supabase connected');client.auth.onAuthStateChange(async(_event,session)=>{if(session){await loadCurrentRole();showApp(session.user);await loadCategories();if(current==='overview')loadOverview()}else showLogin()})}catch(e){setConnection(false,'Connection error');console.error(e)}}
const loginCta=$('loginCta'),loginEmail=$('email'),loginPassword=$('password'),loginDock=$('loginDock');
let loginReady=false,ctaOffset={x:0,y:0};
function validEmail(value){return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(value.trim())}
function validateLoginButton(){
 loginReady=validEmail(loginEmail.value)&&loginPassword.value.length>=6;
 loginCta.disabled=!loginReady;
 loginCta.classList.toggle('unlocked',loginReady);
 if(loginReady){ctaOffset={x:0,y:0};loginCta.style.transform='translate(0,0)';}
}
function dodgeLoginButton(event){
 if(loginReady||event.pointerType==='touch')return;
 const rect=loginCta.getBoundingClientRect(),dockRect=loginDock.getBoundingClientRect();
 const dx=event.clientX-(rect.left+rect.width/2),dy=event.clientY-(rect.top+rect.height/2);
 if(Math.hypot(dx,dy)>100)return;
 const maxX=Math.max(0,(dockRect.width-loginCta.offsetWidth)/2-8),maxY=24;
 let x=ctaOffset.x+(dx>=0?-1:1)*(Math.random()*70+45),y=ctaOffset.y+(dy>=0?-1:1)*(Math.random()*24+12);
 x=Math.max(-maxX,Math.min(maxX,x));y=Math.max(-maxY,Math.min(maxY,y));
 if(Math.abs(x-ctaOffset.x)<25)x=Math.max(-maxX,Math.min(maxX,x+(x>=0?-35:35)));
 ctaOffset={x,y};loginCta.style.transform='translate('+x+'px,'+y+'px)';
}
['input','change','keyup'].forEach(type=>{loginEmail.addEventListener(type,validateLoginButton);loginPassword.addEventListener(type,validateLoginButton)});
loginDock.addEventListener('pointermove',dodgeLoginButton);
loginDock.addEventListener('pointerenter',dodgeLoginButton);
validateLoginButton();
$('loginForm').addEventListener('submit',async e=>{
 e.preventDefault();
 $('loginError').textContent='';
 validateLoginButton();
 if(loginCta.disabled)return;
 if(!client){$('loginError').textContent='Add your Supabase URL and anon key in admin/config.js first.';return}
 loginCta.classList.add('loading');
 loginCta.disabled=true;
 try{
  const {error}=await client.auth.signInWithPassword({email:loginEmail.value.trim(),password:loginPassword.value});
  if(error)throw error;
  notify('Signed in successfully');
 }catch(error){
  $('loginError').textContent=error.message||'Unable to sign in. Please try again.';
  loginCta.classList.remove('loading');
  validateLoginButton();
 }
});
$('logoutBtn').addEventListener('click',async()=>{if(client)await client.auth.signOut();showLogin()});
$('userAvatar').addEventListener('click',()=>{const menu=$('profileMenu');const open=menu.classList.toggle('hidden')===false;$('userAvatar').setAttribute('aria-expanded',String(open))});
document.addEventListener('click',e=>{if(!e.target.closest('.profile-wrap')){$('profileMenu').classList.add('hidden');$('userAvatar').setAttribute('aria-expanded','false')}});
$('profileNameForm').addEventListener('submit',async e=>{
 e.preventDefault();const form=e.currentTarget,btn=$('saveProfileName');btn.disabled=true;$('profileNameError').textContent='';
 try{const name=String(form.elements.name.value||'').trim();if(!name)throw new Error('Enter your display name.');const {data,error}=await client.auth.updateUser({data:{...currentUser?.user_metadata,full_name:name,name}});if(error)throw error;currentUser=data.user;showApp(data.user);notify('Profile name updated');}
 catch(err){$('profileNameError').textContent=err.message||'Could not update name.'}finally{btn.disabled=false}
});
$('profilePasswordForm').addEventListener('submit',async e=>{
 e.preventDefault();const form=e.currentTarget,btn=$('saveProfilePassword');btn.disabled=true;$('profilePasswordError').textContent='';
 try{const password=String(form.elements.password.value||''),confirm=String(form.elements.confirmPassword.value||'');if(password.length<8)throw new Error('Password must be at least 8 characters.');if(password!==confirm)throw new Error('Passwords do not match.');const {error}=await client.auth.updateUser({password});if(error)throw error;form.reset();notify('Password changed successfully');$('profileMenu').classList.add('hidden');}
 catch(err){$('profilePasswordError').textContent=err.message||'Could not change password.'}finally{btn.disabled=false}
});
function navigate(section){if((section==='footerSettings'||section==='userManagement')&&currentRole!=='owner'){notify('Owner access required');return}current=section;document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.section===section));$('overviewSection').classList.toggle('hidden',section!=='overview');$('managerSection').classList.toggle('hidden',!models[section]);$('mediaSection').classList.toggle('hidden',section!=='media');$('footerSettingsSection').classList.toggle('hidden',section!=='footerSettings');$('userManagementSection').classList.toggle('hidden',section!=='userManagement');$('pageTitle').textContent=section==='overview'?'Overview':section==='media'?'Media Library':section==='footerSettings'?'Footer & Contact':section==='userManagement'?'User Management':models[section]?.title||'Overview';if(models[section]){const m=models[section];$('sectionDescription').textContent=m.desc;loadRows()}else if(section==='overview')loadOverview();else if(section==='media')loadMedia();else if(section==='footerSettings')loadFooterSettings();else if(section==='userManagement')loadUsers()}
document.querySelectorAll('.nav-item').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.section)));document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.go)));
async function loadOverview(){if(!client)return;const results=await Promise.all(['projects','assets','services','faqs'].map(t=>client.from(t).select('id',{count:'exact',head:true})));['projectCount','assetCount','serviceCount','faqCount'].forEach((id,i)=>$(id).textContent=results[i].count??'—')}
async function loadCategories(){if(!client)return;const [p,a]=await Promise.all([client.from('project_categories').select('id,name,thumbnail,status,sort_order').order('sort_order').order('name'),client.from('asset_categories').select('id,name,thumbnail,status,sort_order').order('sort_order').order('name')]);if(!p.error)categories=p.data||[];if(!a.error)assetCategories=a.data||[]}
async function loadRows(){if(!client){$('tableBody').innerHTML='<tr><td class="empty">Connect Supabase to manage content.</td></tr>';return}const m=models[current];$('tableBody').innerHTML='<tr><td class="empty">Loading…</td></tr>';let q=client.from(m.table).select('*').order('sort_order',{ascending:true});const {data,error}=await q;if(error){$('tableBody').innerHTML=`<tr><td class="empty">${esc(error.message)}</td></tr>`;return}rows=data||[];renderRows()}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function renderRows(){const m=models[current],search=$('searchInput').value.toLowerCase(),filter=$('statusFilter').value;let list=rows.filter(r=>JSON.stringify(r).toLowerCase().includes(search)&&(filter==='all'||r.status===filter));let cols=current==='categories'||current==='assetCategories'?['name','thumbnail','status']:current==='projects'?['title','category_id','youtube_url','status']:current==='assets'?['title','category_id','description','status']:current==='services'?['title','description','status']:current==='faqs'?['question','answer','status']:['section','content_key','content_value','status'];$('tableHead').innerHTML='<tr>'+cols.map(c=>`<th>${esc(c.replace('_',' ').toUpperCase())}</th>`).join('')+'<th>ACTIONS</th></tr>';$('tableBody').innerHTML=list.length?list.map(r=>`<tr>${cols.map(c=>{let val=r[c];if(c==='category_id')val=(current==='assets'?assetCategories:categories).find(x=>x.id===val)?.name||'Unassigned';if(c==='thumbnail'&&val)val='JPG uploaded';if(c==='youtube_url'&&val)val='YouTube video linked';return `<td>${c==='status'?`<span class="pill ${r[c]==='draft'?'draft':''}">${esc(r[c]||'draft')}</span>`:`<span title="${esc(val)}">${esc(String(val||'').slice(0,75))}</span>`}</td>`}).join('')}<td><div class="row-actions"><button class="small-btn" data-edit="${r.id}">Edit</button><button class="small-btn" data-toggle="${r.id}">${r.status==='published'?'Unpublish':'Publish'}</button><button class="small-btn danger" data-delete="${r.id}">Delete</button></div></td></tr>`).join(''):'<tr><td colspan="8" class="empty">No content found. Add your first item.</td></tr>';$('tableBody').querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>openEditor(rows.find(r=>String(r.id)===b.dataset.edit)));$('tableBody').querySelectorAll('[data-delete]').forEach(b=>b.onclick=()=>deleteRow(b.dataset.delete));$('tableBody').querySelectorAll('[data-toggle]').forEach(b=>b.onclick=()=>togglePublish(b.dataset.toggle))}
$('searchInput').addEventListener('input',renderRows);$('statusFilter').addEventListener('change',renderRows);$('addNewBtn').addEventListener('click',()=>openEditor(null));
function openEditor(row){editing=row;$('editorTitle').textContent=row?'Edit '+models[current].title:'Add '+models[current].title;$('editorError').textContent='';const m=models[current];$('editorFields').innerHTML=m.fields.map(([key,label,type,full,opts])=>{let value=row?.[key]??(key==='status'?'draft':key==='sort_order'?rows.length*10:'');let el;if(type==='textarea')el=`<textarea name="${key}" ${full?'required':''}>${esc(value)}</textarea>`;else if(type==='select')el=`<select name="${key}">${opts.map(o=>`<option value="${esc(o)}" ${o===value?'selected':''}>${esc(o)}</option>`).join('')}</select>`;else if(type==='category'||type==='assetCategory'){const source=type==='category'?categories:assetCategories;el=`<select name="${key}" required><option value="">Select category</option>${source.filter(c=>c.status==='published'||c.id===value).map(c=>`<option value="${c.id}" ${c.id===value?'selected':''}>${esc(c.name)}</option>`).join('')}</select>${!source.length?`<small>Create a category first in ${type==='category'?'Portfolio Categories':'Asset Categories'}.</small>`:''}`;}else if(type==='file')el=`<input name="${key}" type="file" accept="image/jpeg,.jpg,.jpeg" ${row?'':'required'}>${row?.[key]?`<small>Current thumbnail uploaded. Select a JPG to replace it.</small>`:''}`;else el=`<input name="${key}" type="${type}" value="${esc(value)}" ${full?'required':''}>`;return `<label class="${full?'field-full':''}">${esc(label)}${el}</label>`}).join('');$('editorModal').classList.remove('hidden')}
function closeEditor(){$('editorModal').classList.add('hidden');editing=null}$('closeModal').onclick=$('cancelEdit').onclick=closeEditor;
async function uploadJpg(file,folder='portfolio-categories'){if(!file)return '';if(file.type!=='image/jpeg'&&!/\.jpe?g$/i.test(file.name))throw new Error('Please upload a JPG/JPEG image only.');if(file.size>50*1024*1024)throw new Error('Image must be smaller than 50 MB.');const path=folder+'/'+Date.now()+'-'+file.name.replace(/[^a-zA-Z0-9._-]/g,'-');const {error}=await client.storage.from('lumetra-media').upload(path,file,{upsert:false,contentType:'image/jpeg'});if(error)throw error;return client.storage.from('lumetra-media').getPublicUrl(path).data.publicUrl}
$('editorForm').addEventListener('submit',async e=>{e.preventDefault();if(!client){$('editorError').textContent='Supabase is not configured.';return}const m=models[current],fd=new FormData(e.target),payload={};m.fields.forEach(([key,,type])=>{if(type==='file')return;let v=fd.get(key);payload[key]=key==='sort_order'?Number(v||0):v});$('saveBtn').disabled=true;try{if(current==='assetCategories'){const file=fd.get('thumbnail');if(file&&file.size)payload.thumbnail=await uploadJpg(file,'asset-categories');else if(editing)payload.thumbnail=editing.thumbnail;if(!payload.thumbnail)throw new Error('Category thumbnail is required. Please upload a JPG image.')}if(current==='categories'){delete payload.thumbnail;}if(current==='projects'){const cat=categories.find(c=>c.id===payload.category_id);if(!cat)throw new Error('Select a valid category.');payload.category=cat.name;payload.image='';payload.url=payload.youtube_url;}if(current==='assets'){const cat=assetCategories.find(c=>c.id===payload.category_id);if(!cat)throw new Error('Select a valid Asset Category.');payload.image=cat.thumbnail||'';payload.count='';}let q=editing?client.from(m.table).update(payload).eq('id',editing.id):client.from(m.table).insert(payload);const {error}=await q;if(error)throw error;closeEditor();notify('Content saved');if(current==='categories'||current==='assetCategories')await loadCategories();await loadRows();await loadOverview()}catch(err){$('editorError').textContent=err.message}finally{$('saveBtn').disabled=false}});
async function deleteRow(id){if(!confirm('Delete this item permanently?'))return;const {error}=await client.from(models[current].table).delete().eq('id',id);if(error)notify(error.message);else{notify('Item deleted');if(current==='categories'||current==='assetCategories')await loadCategories();await loadRows();await loadOverview()}}
async function togglePublish(id){const row=rows.find(r=>String(r.id)===String(id));const {error}=await client.from(models[current].table).update({status:row.status==='published'?'draft':'published'}).eq('id',id);if(error)notify(error.message);else{notify('Publishing status updated');if(current==='categories'||current==='assetCategories')await loadCategories();await loadRows()}}
async function loadMedia(){if(!client)return;$('mediaGrid').innerHTML='<p class="empty">Loading media…</p>';const {data,error}=await client.storage.from('lumetra-media').list('',{limit:100,sortBy:{column:'created_at',order:'desc'}});if(error){$('mediaGrid').innerHTML=`<p class="empty">${esc(error.message)}</p>`;return}if(!data?.length){$('mediaGrid').innerHTML='<p class="empty">No uploaded media yet.</p>';return}$('mediaGrid').innerHTML=data.map(f=>{const {data:u}=client.storage.from('lumetra-media').getPublicUrl(f.name);const video=/\.(mp4|webm|mov)$/i.test(f.name);return `<article class="media-item">${video?`<video src="${u.publicUrl}" controls></video>`:`<img src="${u.publicUrl}" alt="">`}<p>${esc(f.name)}</p></article>`}).join('')}
$('mediaUpload').addEventListener('change',async e=>{if(!client)return;for(const file of e.target.files){const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,'-');const path=Date.now()+'-'+safe;const {error}=await client.storage.from('lumetra-media').upload(path,file,{upsert:false});if(error)notify(error.message);else notify('Uploaded '+file.name)}e.target.value='';loadMedia()});
const footerKeys=['address','map_url','email','phone','facebook','instagram','youtube','linkedin','whatsapp'];
async function loadFooterSettings(){
 if(!client)return;
 $('footerSettingsError').textContent='';
 const {data,error}=await client.from('site_content').select('content_key,content_value').eq('section','footer').eq('status','published');
 if(error){$('footerSettingsError').textContent=error.message;return}
 const values=Object.fromEntries((data||[]).map(x=>[x.content_key,x.content_value]));
 const form=$('footerSettingsForm');
 footerKeys.forEach(k=>{if(form.elements[k])form.elements[k].value=values[k]||''});
}
$('footerSettingsForm').addEventListener('submit',async e=>{
 e.preventDefault();if(!client)return;
 const btn=$('saveFooterSettings'),form=e.currentTarget;btn.disabled=true;$('footerSettingsError').textContent='';
 try{
  const ops=footerKeys.map(key=>({section:'footer',content_key:key,content_value:String(form.elements[key].value||'').trim(),status:'published',updated_at:new Date().toISOString()}));
  const {error}=await client.from('site_content').upsert(ops,{onConflict:'section,content_key'});
  if(error)throw error;
  notify('Footer settings saved successfully');
 }catch(err){$('footerSettingsError').textContent=err.message}
 finally{btn.disabled=false}
});

async function callUserAdmin(payload){
 const {data,error}=await client.functions.invoke('invite-editor',{body:payload});
 if(error)throw error;if(data?.error)throw new Error(data.error);return data;
}
async function loadUsers(){
 if(currentRole!=='owner')return;
 $('usersTableBody').innerHTML='<tr><td colspan="5" class="empty">Loading users…</td></tr>';
 try{
  const data=await callUserAdmin({action:'list'});
  const users=data.users||[];
  $('usersTableBody').innerHTML=users.map(u=>{
   const active=!u.banned_until||new Date(u.banned_until)<new Date();
   const role=u.is_owner?'Owner':'Editor';
   const actions=u.is_owner?'<span class="muted">Protected</span>':
    '<button type="button" class="secondary user-toggle" data-user="'+esc(u.user_id)+'" data-active="'+(!active)+'">'+(active?'Deactivate':'Activate')+'</button> <button type="button" class="secondary user-remove" data-user="'+esc(u.user_id)+'">Remove</button>';
   return '<tr><td>'+esc(u.email||u.user_id)+'</td><td>'+role+'</td><td>'+(active?'Active':'Deactivated')+'</td><td>'+esc(u.created_at?new Date(u.created_at).toLocaleDateString():'—')+'</td><td>'+actions+'</td></tr>';
  }).join('')||'<tr><td colspan="5" class="empty">No CMS users found.</td></tr>';
 }catch(err){$('usersTableBody').innerHTML='<tr><td colspan="5" class="empty">'+esc(err.message)+'</td></tr>'}
}
$('refreshUsersBtn')?.addEventListener('click',loadUsers);
$('usersTableBody')?.addEventListener('click',async e=>{
 const toggle=e.target.closest('.user-toggle'),remove=e.target.closest('.user-remove');
 if(!toggle&&!remove)return;
 const user_id=(toggle||remove).dataset.user;
 try{
  if(toggle){
   const active=toggle.dataset.active==='true';
   await callUserAdmin({action:'set-active',user_id,active});
   notify(active?'Editor activated':'Editor deactivated');
  }else{
   if(!confirm('Permanently remove this editor account? This cannot be undone.'))return;
   await callUserAdmin({action:'remove',user_id});
   notify('Editor removed');
  }
  await loadUsers();
 }catch(err){notify(err.message||'User action failed')}
});
$('inviteEditorForm')?.addEventListener('submit',async e=>{
 e.preventDefault();if(currentRole!=='owner')return;
 const form=e.currentTarget;
 const btn=$('inviteEditorBtn');btn.disabled=true;$('inviteEditorError').textContent='';
 try{
  const fd=new FormData(form);
  const name=String(fd.get('name')||'').trim();
  const email=String(fd.get('email')||'').trim();
  const password=String(fd.get('password')||'');
  await callUserAdmin({action:'create',name,email,password});
  form.reset();
  notify('Editor account created for '+email);
  await loadUsers();
 }catch(err){$('inviteEditorError').textContent=err.message||'Could not create editor account.'}
 finally{btn.disabled=false}
});

init();
})();