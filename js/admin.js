import { supabase } from './supabase.js';
import { formatPrice, slugify } from './data.js';
import { ADMIN_EMAIL } from './config.js';

const $=s=>document.querySelector(s); const $$=s=>[...document.querySelectorAll(s)];
let products=[], categories=[], settings;
let currentImagePath=null, newImageFile=null, productSaving=false, serviceRows=[];
const imgFallback='../assets/images/vts-logo.jpg';

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function toast(msg,type='success'){const el=document.createElement('div');el.className=`admin-toast ${type}`;el.setAttribute('role','status');el.textContent=msg;document.body.appendChild(el);setTimeout(()=>el.remove(),3600)}
function error(msg){const el=$('#login-error');el.textContent=msg;el.classList.remove('hidden')}
function editorError(msg){const el=$('#editor-error');el.textContent=msg;el.classList.remove('hidden');el.setAttribute('role','alert')}
function setSaving(state){
  productSaving=state;
  const button=$('#product-form button[type="submit"]');
  if(button){button.disabled=state;button.setAttribute('aria-busy',String(state));button.textContent=state?'Saving…':'Save Product'}
}
async function isAdmin(){try{const {data,error}=await supabase.rpc('is_admin');return !error&&data===true}catch{return false}}

async function boot(){
  const {data:{session}}=await supabase.auth.getSession();
  if(session&&await isAdmin()) showApp(); else showLogin();
  supabase.auth.onAuthStateChange(async(_event,s)=>{if(s&&await isAdmin())showApp();else if(!s)showLogin()});

  $('#login-form').addEventListener('submit',login);
  $('#logout').addEventListener('click',logout);
  $('#mobile-menu').addEventListener('click',toggleMobileNav);
  $$('.admin-sidebar nav button').forEach(b=>b.addEventListener('click',()=>{showSection(b.dataset.section);closeMobileNav()}));
  $$('[data-go]').forEach(b=>b.addEventListener('click',()=>showSection(b.dataset.go)));
  $('#add-product').addEventListener('click',()=>openEditor());
  $('#product-form').addEventListener('submit',saveProduct);
  $('#product-image').addEventListener('change',previewImage);
  $('#clear-image').addEventListener('click',clearImage);
  $$('[data-close-editor]').forEach(b=>b.addEventListener('click',closeEditor));
  $('#save-company').addEventListener('click',saveCompany);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeMobileNav();if(!$('#product-editor').classList.contains('hidden'))closeEditor()}});
  $('#admin-nav-backdrop')?.addEventListener('click',closeMobileNav);
  document.addEventListener('click',e=>{
    const sidebar=$('.admin-sidebar'), menu=$('#mobile-menu');
    if(window.innerWidth<=760 && sidebar.classList.contains('open') && !sidebar.contains(e.target) && e.target!==menu) closeMobileNav();
  });
}
function toggleMobileNav(){
  const sidebar=$('.admin-sidebar'), menu=$('#mobile-menu');
  const open=sidebar.classList.toggle('open');
  menu.setAttribute('aria-expanded',String(open));
  menu.setAttribute('aria-label',open?'Close navigation':'Open navigation');
  document.body.classList.toggle('admin-menu-open',open);
  $('#admin-nav-backdrop')?.classList.toggle('open',open);
}
function closeMobileNav(){const sidebar=$('.admin-sidebar');sidebar.classList.remove('open');$('#mobile-menu')?.setAttribute('aria-expanded','false');$('#mobile-menu')?.setAttribute('aria-label','Open navigation');document.body.classList.remove('admin-menu-open');$('#admin-nav-backdrop')?.classList.remove('open')}

async function login(e){
  e.preventDefault(); $('#login-error').classList.add('hidden');
  const password=$('#login-password').value;
  if(!password)return error('Please enter a password');
  const {error:e1}=await supabase.auth.signInWithPassword({email:ADMIN_EMAIL,password});
  if(e1)return error(`Login failed: ${e1.message}`);
  if(!await isAdmin()){await supabase.auth.signOut();return error('User is not an administrator')}
  showApp();
}
async function logout(){await supabase.auth.signOut();showLogin()}
function showLogin(){$('#login-view').classList.remove('hidden');$('#app-view').classList.add('hidden');closeMobileNav()}
async function showApp(){$('#login-view').classList.add('hidden');$('#app-view').classList.remove('hidden');await loadData();showSection('dashboard')}
function showSection(name){
  const target=$(`#section-${name}`); if(!target)return;
  $$('.admin-section').forEach(s=>s.classList.add('hidden'));target.classList.remove('hidden');
  $$('.admin-sidebar nav button').forEach(b=>b.classList.toggle('active',b.dataset.section===name));
  $('#section-title').textContent=target.querySelector('.panel-head h3')?.textContent||'Dashboard';
}
async function loadData(){
  try{
    const [p,c,s,sv]=await Promise.all([
      supabase.from('products').select('*').order('display_order',{ascending:true}).order('created_at',{ascending:false}),
      supabase.from('categories').select('*').eq('active',true).order('display_order',{ascending:true}),
      supabase.from('site_settings').select('*').single(),
      supabase.from('services').select('*').order('display_order',{ascending:true})
    ]);
    if(p.error||c.error||s.error) throw p.error||c.error||s.error;
    products=p.data||[];categories=c.data||[];settings=s.data;serviceRows=sv.data||[];
    renderDashboard(serviceRows);renderProducts();renderServices(serviceRows);fillCompany();fillCategories();
  }catch(e){console.error('Management data load failed:',e);toast('Could not load management data. Please check the connection and permissions.','error')}
}
function renderDashboard(services){$('#stat-products').textContent=products.length;$('#stat-featured').textContent=products.filter(p=>p.featured).length;$('#stat-energy').textContent=services.filter(s=>s.category==='Energy Solutions').length;$('#stat-security').textContent=services.filter(s=>s.category==='Digital Security Solutions').length;$('#dashboard-recent').innerHTML=products.slice(0,5).map(p=>`<div class="recent-item"><strong>${esc(p.name)}</strong><small>${esc(p.category)} • ${p.active?'Active':'Inactive'}</small></div>`).join('')}
function renderProducts(){$('#product-table').innerHTML=products.map(p=>`<tr><td><img class="table-img" src="${esc(p.image_url||imgFallback)}" alt=""></td><td><b>${esc(p.name)}</b>${p.is_demo?'<br><small style="color:#f59e0b">Demo</small>':''}</td><td>${esc(p.category)}</td><td>${formatPrice(p)}</td><td>${p.active?'✓':'✗'}</td><td>${p.featured?'✓':'✗'}</td><td><div class="action-row"><button class="mini-btn" data-edit="${esc(p.id)}" type="button">Edit</button><button class="mini-btn" data-toggle="${esc(p.id)}" type="button">${p.active?'Hide':'Show'}</button><button class="mini-btn danger" data-delete="${esc(p.id)}" type="button">Delete</button></div></td></tr>`).join('')||'<tr><td colspan="7">No products found.</td></tr>';
  $('#product-table').querySelectorAll('[data-edit]').forEach(b=>b.addEventListener('click',()=>openEditor(products.find(p=>p.id===b.dataset.edit))));
  $('#product-table').querySelectorAll('[data-toggle]').forEach(b=>b.addEventListener('click',()=>toggleProduct(b.dataset.toggle)));
  $('#product-table').querySelectorAll('[data-delete]').forEach(b=>b.addEventListener('click',()=>deleteProduct(b.dataset.delete)));
}
function renderServices(rows){$('#service-admin-grid').innerHTML=rows.map(s=>`<article class="service-admin-card"><small>${esc(s.category)}</small><h3>${esc(s.name)}</h3><p>${esc(s.description)}</p></article>`).join('')}
function fillCategories(){const select=$('#product-category');select.innerHTML=categories.map(c=>`<option value="${esc(c.name)}">${esc(c.name)}</option>`).join('')}
function fillCompany(){const f=$('#company-form');Object.entries(settings||{}).forEach(([k,v])=>{const el=f.elements[k];if(el)el.value=v??''})}
function openEditor(p){
  const form=$('#product-form');form.reset();$('#editor-error').classList.add('hidden');newImageFile=null;currentImagePath=p?.image_url||null;$('#product-image').value='';
  fillCategories();
  if(p){
    $('#editor-title').textContent='Edit Product';
    Object.entries(p).forEach(([k,v])=>{const el=form.elements[k];if(el)el.value=typeof v==='object'?arrayLines(v):v??''});
  }else $('#editor-title').textContent='Add Product';
  renderImagePreview(currentImagePath);
  $('#product-editor').classList.remove('hidden');$('#product-editor').setAttribute('aria-hidden','false');
  setTimeout(()=>form.elements.name.focus(),0);
}
function arrayLines(v){if(!Array.isArray(v))return '';return v.map(x=>typeof x==='string'?x:(x?.label?`${x.label}: ${x.value||''}`:'')).join('\n')}
function closeEditor(){if(productSaving)return;newImageFile=null;$('#product-image').value='';$('#product-editor').classList.add('hidden');$('#product-editor').setAttribute('aria-hidden','true')}
function clearImage(){newImageFile=null;$('#product-image').value='';currentImagePath=null;renderImagePreview(null)}
function renderImagePreview(src){const el=$('#image-preview');if(src){el.style.backgroundImage=`url("${src}")`;el.textContent=''}else{el.style.backgroundImage='';el.textContent='No image selected'}}
function previewImage(e){
  const file=e.target.files?.[0];if(!file)return;
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)){e.target.value='';return editorError('Invalid image format. Use JPG, PNG, or WebP.')}
  if(file.size>5*1024*1024){e.target.value='';return editorError('Image is too large. Please choose an image under 5 MB.')}
  $('#editor-error').classList.add('hidden');newImageFile=file;
  const reader=new FileReader();reader.onload=ev=>{const el=$('#image-preview');el.style.backgroundImage=`url("${ev.target.result}")`;el.textContent=''};reader.onerror=()=>editorError('The selected image could not be read.');reader.readAsDataURL(file);
}
async function uploadImage(file){
  let ext=file.type==='image/jpeg'?'jpg':file.type.split('/')[1];
  let path;
  try{path=`products/${crypto.randomUUID()}.${ext}`}catch{path=`products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`}
  const {error:e}=await supabase.storage.from('product-images').upload(path,file,{upsert:false,contentType:file.type});
  if(e)throw new Error(`Image upload failed: ${e.message}`);
  const {data}=supabase.storage.from('product-images').getPublicUrl(path);
  return data.publicUrl;
}
function parseLines(value){return String(value||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean)}
async function saveProduct(e){
  e.preventDefault();
  if(productSaving)return;
  const f=e.currentTarget;$('#editor-error').classList.add('hidden');
  if(!f.reportValidity())return;
  const submitter=e.submitter;
  try{
    setSaving(true);
    const name=f.elements.name.value.trim();
    if(!name)throw new Error('Product name is required.');
    const priceValue=f.elements.price.value.trim();
    const data={
      name,category:f.elements.category.value,slug:slugify(name),
      short_description:f.elements.short_description.value.trim(),
      description:f.elements.description.value.trim(),
      price:priceValue===''?null:Number(priceValue),
      price_type:f.elements.price_type.value,
      active:f.elements.active.checked,featured:f.elements.featured.checked,
      display_order:Math.max(0,parseInt(f.elements.display_order.value,10)||0)
    };
    const features=parseLines(f.elements.features.value);
    const specifications=parseLines(f.elements.specifications.value);
    if(features.length)data.features=features;
    if(specifications.length)data.specifications=specifications;

    if(newImageFile)data.image_url=await uploadImage(newImageFile);

    const id=f.elements.id.value.trim();
    let res;
    if(id)res=await supabase.from('products').update(data).eq('id',id).select().single();
    else res=await supabase.from('products').insert(data).select().single();
    // Older V2 databases may not yet have the optional specifications column.
    // Keep product saving reliable while the migration is being applied.
    if(res.error && data.specifications && /specifications.*column|column.*specifications/i.test(res.error.message||'')){
      const retry={...data};delete retry.specifications;
      if(id)res=await supabase.from('products').update(retry).eq('id',id).select().single();
      else res=await supabase.from('products').insert(retry).select().single();
    }
    if(res.error)throw new Error(res.error.message);
    const saved=res.data;
    if(id)products=products.map(p=>p.id===id?saved:p);else products=[saved,...products];
    renderProducts();renderDashboard(serviceRows);
    toast(`Product ${id?'updated':'added'} successfully.`);
    closeEditor();
  }catch(err){
    console.error('Product save failed:',err);
    editorError(`Save failed: ${err?.message||'An unexpected error occurred. Please try again.'}`);
  }finally{
    setSaving(false);
  }
}
async function toggleProduct(id){const p=products.find(x=>x.id===id);if(!p)return;try{const {data,error:e}=await supabase.from('products').update({active:!p.active}).eq('id',id).select().single();if(e)throw e;products=products.map(x=>x.id===id?data:x);renderProducts();renderDashboard(serviceRows);toast(`Product ${!p.active?'activated':'deactivated'}.`)}catch(e){console.error(e);toast(`Could not update product: ${e.message||'Unknown error'}`,'error')}}
async function deleteProduct(id){const p=products.find(x=>x.id===id);if(!p||!confirm(`Are you sure you want to delete this product?\n\n${p.name}`))return;try{const {error:e}=await supabase.from('products').delete().eq('id',id);if(e)throw e;products=products.filter(x=>x.id!==id);renderProducts();renderDashboard(serviceRows);toast('Product deleted.')}catch(e){console.error(e);toast(`Could not delete product: ${e.message||'Unknown error'}`,'error')}}
async function saveCompany(){
  const f=$('#company-form');
  if(!f.reportValidity())return;
  const row={company_name:f.elements.company_name.value.trim(),legal_name:f.elements.legal_name.value.trim(),registration_number:f.elements.registration_number.value.trim(),phone:f.elements.phone.value.trim(),phone2:f.elements.phone2.value.trim(),whatsapp:f.elements.whatsapp.value.trim(),sales_email:f.elements.sales_email.value.trim(),info_email:f.elements.info_email.value.trim(),address:f.elements.address.value.trim(),coverage:f.elements.coverage.value.trim(),mission:f.elements.mission.value.trim(),vision:f.elements.vision.value.trim(),values:f.elements.values.value.trim()};
  try{const {error:e}=await supabase.from('site_settings').update(row).eq('id',1);if(e)throw e;settings={...settings,...row};toast('Company information saved.')}catch(e){console.error(e);toast(`Failed to save company information: ${e.message||'Unknown error'}`,'error')}
}
boot();
