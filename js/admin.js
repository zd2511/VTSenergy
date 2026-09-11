import { supabase } from './supabase.js';
import { formatPrice, slugify } from './data.js';
import { ADMIN_EMAIL } from './config.js';

const $=s=>document.querySelector(s); const $$=s=>[...document.querySelectorAll(s)];
let products=[], categories=[], settings, currentImagePath=null, newImageFile=null;
const imgFallback='../assets/images/vts-logo.jpg';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function toast(msg){const el=document.createElement('div');el.className='admin-toast';el.textContent=msg;document.body.appendChild(el);setTimeout(()=>el.remove(),3200)}
function error(msg){$('#login-error').textContent=msg;$('#login-error').classList.remove('hidden')}
async function isAdmin(){const {data,error}=await supabase.rpc('is_admin');return !error&&data===true}
async function boot(){
  const {data:{session}}=await supabase.auth.getSession(); if(session&&await isAdmin()) showApp(); else showLogin();
  supabase.auth.onAuthStateChange(async(_event,s)=>{if(s&&await isAdmin())showApp();else if(!s)showLogin()});
  $('#login-form').addEventListener('submit',login); $('#logout').addEventListener('click',logout); $('#mobile-menu').addEventListener('click',()=>$('.admin-sidebar').classList.toggle('open'));
  $$('.admin-sidebar nav button').forEach(b=>b.addEventListener('click',()=>showSection(b.dataset.section)));
  $$('[data-go]').forEach(b=>b.addEventListener('click',()=>showSection(b.dataset.go)));
  $('#add-product').addEventListener('click',()=>openEditor()); $('#product-form').addEventListener('submit',saveProduct); $('#product-image').addEventListener('change',previewImage); $('#clear-image').addEventListener('click',()=>{newImageFile=null;$('#product-image').value='';$('#image-preview').classList.add('hidden')});
  $$('[data-close-editor]').forEach(b=>b.addEventListener('click',closeEditor)); $('#save-company').addEventListener('click',saveCompany);
}
async function login(e){
  e.preventDefault();
  $('#login-error').classList.add('hidden');
  const email = ADMIN_EMAIL;
  const password = $('#login-password').value;
  
  if(!password){
    error('Please enter a password');
    return;
  }
  
  const {data, error: e1} = await supabase.auth.signInWithPassword({
    email: email,
    password: password
  });
  
  if(e1){
    error(`Login failed: ${e1.message}`);
    return;
  }
  
  const isAdminUser = await isAdmin();
  if(!isAdminUser){
    await supabase.auth.signOut();
    error('User is not an administrator');
    return;
  }
  
  showApp();
}
async function logout(){await supabase.auth.signOut();showLogin()}
function showLogin(){$('#login-view').classList.remove('hidden');$('#app-view').classList.add('hidden');}
async function showApp(){$('#login-view').classList.add('hidden');$('#app-view').classList.remove('hidden');await loadData();showSection('dashboard')}
function showSection(name){$$('.admin-section').forEach(s=>s.classList.add('hidden'));$(`#section-${name}`).classList.remove('hidden');$$('.admin-sidebar nav button').forEach(b=>b.classList.toggle('active',b.dataset.section===name));$('#section-title').textContent=$(`#section-${name} .panel-head h3`)?.textContent||'Dashboard'}
async function loadData(){
  const [p,c,s,sv]=await Promise.all([supabase.from('products').select('*').order('display_order').order('created_at',{ascending:false}),supabase.from('categories').select('*').eq('active',true).order('display_order'),supabase.from('site_settings').select('*').single(),supabase.from('services').select('*').order('display_order')]);
  if(p.error||c.error||s.error){toast('Could not load management data. Check Supabase configuration.');return}
  products=p.data||[];categories=c.data||[];settings=s.data;renderDashboard(sv.data||[]);renderProducts();renderServices(sv.data||[]);fillCompany();fillCategories();
}
function renderDashboard(services){$('#stat-products').textContent=products.length;$('#stat-featured').textContent=products.filter(p=>p.featured).length;$('#stat-energy').textContent=services.filter(s=>s.category==='Energy Solutions').length;$('#stat-security').textContent=services.filter(s=>s.category==='Digital Security Solutions').length;$('#dashboard-recent').innerHTML=products.slice(0,5).map(p=>`<div class="recent-item"><strong>${esc(p.name)}</strong><small>${p.category} • ${p.active?'Active':'Inactive'}</small></div>`).join('')}
function renderProducts(){$('#product-table').innerHTML=products.map(p=>`<tr><td><img class="table-img" src="${p.image_url||imgFallback}" alt=""></td><td><b>${esc(p.name)}</b>${p.is_demo?'<br><small style="color:#f59e0b">Demo</small>':''}</td><td>${esc(p.category)}</td><td>${formatPrice(p)}</td><td>${p.active?'✓':'✗'}</td><td>${p.featured?'✓':'✗'}</td><td><button class="btn-icon" data-edit="${esc(p.id)}" onclick="window.editProduct('${esc(p.id)}')">✎</button><button class="btn-icon" data-toggle="${esc(p.id)}" onclick="window.toggleProduct('${esc(p.id)}')">${p.active?'Hide':'Show'}</button><button class="btn-icon" data-delete="${esc(p.id)}" onclick="window.deleteProduct('${esc(p.id)}')" style="color:#ef4444">🗑</button></td></tr>`).join('')}
function renderServices(rows){$('#service-admin-grid').innerHTML=rows.map(s=>`<article class="service-admin-card"><small>${esc(s.category)}</small><h3>${esc(s.name)}</h3><p>${esc(s.description)}</p></article>`).join('')}
function fillCategories(){const select=$('#product-category');select.innerHTML=categories.map(c=>`<option value="${esc(c.name)}">${esc(c.name)}</option>`).join('')}
function fillCompany(){const f=$('#company-form');Object.entries(settings||{}).forEach(([k,v])=>{const el=f.elements[k];if(el)el.value=v??''})}
function openEditor(p){$('#product-editor').classList.remove('hidden');$('#editor-error').classList.add('hidden');$('#product-form').reset();fillCategories();newImageFile=null;currentImagePath=p?.image_url||null;if(p){$('#editor-title').textContent='Edit Product';Object.entries(p).forEach(([k,v])=>{const el=$('#product-form').elements[k];if(el)el.value=typeof v==='object'?arrayLines(v):v??''});}else{$('#editor-title').textContent='Add Product';}if(currentImagePath){$('#image-preview').src=currentImagePath;$('#image-preview').classList.remove('hidden');}else{$('#image-preview').classList.add('hidden')}}
function arrayLines(v){if(!Array.isArray(v))return '';return v.map(x=>typeof x==='string'?x:(x.label?`${x.label}: ${x.value||''}`:'')).join('\n')}
function closeEditor(){newImageFile=null;$('#product-editor').classList.add('hidden')}
function previewImage(e){const file=e.target.files?.[0];if(!file)return;if(!['image/jpeg','image/png','image/webp'].includes(file.type)){e.target.value='';$('#editor-error').textContent='Invalid image format. Use JPG, PNG, or WebP.';return}newImageFile=file;const reader=new FileReader();reader.onload=ev=>{$('#image-preview').src=ev.target.result;$('#image-preview').classList.remove('hidden')};reader.readAsDataURL(file)}
async function uploadImage(file){const ext=file.type.split('/')[1].replace('jpeg','jpg');const path=`products/${crypto.randomUUID()}.${ext}`;const {error:e}=await supabase.storage.from('product-images').upload(path,file);if(e){editorError('Image upload failed. Check storage permissions.');return null}const {data:{publicUrl}}=supabase.storage.from('product-images').getPublicUrl(path);return publicUrl}
async function saveProduct(e){e.preventDefault();$('#editor-error').classList.add('hidden');const f=e.currentTarget;const name=f.elements.name.value.trim();if(!name){return editorError('Product name is required')}const id=f.elements.id.value;const data={name:name,category:f.elements.category.value,slug:slugify(name),short_description:f.elements.short_description.value.trim(),description:f.elements.description.value.trim(),price:f.elements.price.value?parseFloat(f.elements.price.value):null,price_type:f.elements.price_type.value,active:f.elements.active.checked,featured:f.elements.featured.checked,display_order:parseInt(f.elements.display_order.value)||0};if(newImageFile){const url=await uploadImage(newImageFile);if(!url)return;data.image_url=url}let res;if(id){res=await supabase.from('products').update(data).eq('id',id)}else{res=await supabase.from('products').insert([data])}if(res.error){return editorError(`Save failed: ${res.error.message}`)}toast(`Product ${id?'updated':'added'} successfully`);closeEditor();loadData()}
function editorError(msg){$('#editor-error').textContent=msg;$('#editor-error').classList.remove('hidden')}
async function toggleProduct(id){const p=products.find(x=>x.id===id);if(!p)return;const {error:e}=await supabase.from('products').update({active:!p.active}).eq('id',id);if(e)return toast('Could not update product status.');toast(`Product ${!p.active?'activated':'deactivated'}`);loadData()}
async function deleteProduct(id){const p=products.find(x=>x.id===id);if(!p)return;if(!confirm(`Are you sure you want to delete this product?\n\n${p.name}`))return;const {error:e}=await supabase.from('products').delete().eq('id',id);if(e)return toast('Could not delete product.');toast('Product deleted');loadData()}
async function saveCompany(){const f=$('#company-form');const row={company_name:f.elements.company_name.value.trim(),legal_name:f.elements.legal_name.value.trim(),registration_number:f.elements.registration_number.value.trim(),phone:f.elements.phone.value.trim(),phone2:f.elements.phone2.value.trim(),whatsapp:f.elements.whatsapp.value.trim(),sales_email:f.elements.sales_email.value.trim(),info_email:f.elements.info_email.value.trim(),address:f.elements.address.value.trim(),coverage:f.elements.coverage.value.trim(),mission:f.elements.mission.value.trim(),vision:f.elements.vision.value.trim(),values:f.elements.values.value.trim()};const {error:e}=await supabase.from('site_settings').update(row).eq('id',1);if(e){return toast('Failed to save company info')}toast('Company information saved')}

// Expose functions to window for onclick handlers
window.editProduct = async (id) => {
  const p = products.find(x => x.id === id);
  if(p) openEditor(p);
};
window.toggleProduct = toggleProduct;
window.deleteProduct = deleteProduct;

boot();
