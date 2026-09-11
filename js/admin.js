console.info('VTS admin.js loaded: v20260911-1740-management-timeout-fix');
import { supabase } from './supabase.js?v20260911-1740-management-timeout-fix';
import { formatPrice, slugify, REQUIRED_PHONE, REQUIRED_PHONE2, REQUIRED_WHATSAPP, HOMEPAGE_COVERAGE, REQUIRED_MISSION, REQUIRED_VISION, REQUIRED_VALUES } from './data.js?v20260911-1740-management-timeout-fix';
import { ADMIN_EMAIL } from './config.js?v20260911-1740-management-timeout-fix';

const $=s=>document.querySelector(s); const $$=s=>[...document.querySelectorAll(s)];
let products=[], categories=[], settings;
let currentImagePath=null, newImageFile=null, productSaving=false, serviceRows=[], editorSession=0, authBusy=false;
const DEFAULT_PRODUCT_CATEGORIES = [
  'Solar',
  'Inverters',
  'Batteries',
  'UPS',
  'CCTV',
  'Access Control',
  'Security Systems',
  'Cybersecurity',
  'Other'
];
const imgFallback='../assets/images/vts-logo.jpg';
function imageSrc(value){const v=String(value||'').trim();return /^https?:\/\//i.test(v)?v:imgFallback;}
function formatMoney(value){ if(value===null||value===undefined||value==='') return ''; const n=Number(value); return Number.isFinite(n)?`R${new Intl.NumberFormat('en-ZA',{maximumFractionDigits:2}).format(n)}`:String(value); }
function hasPromotion(product){ return Boolean(product?.promotion_status && product.promotion_status!=='none' && product?.original_price!==null && product?.original_price!==undefined && product?.sale_price!==null && product?.sale_price!==undefined); }

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function toast(msg,type='success'){const el=document.createElement('div');el.className=`admin-toast ${type}`;el.setAttribute('role','status');el.textContent=msg;document.body.appendChild(el);setTimeout(()=>el.remove(),3600)}
function error(msg){const el=$('#login-error');el.textContent=msg;el.classList.remove('hidden')}
function editorError(msg){const el=$('#editor-error');el.textContent=msg;el.classList.remove('hidden');el.setAttribute('role','alert')}
function setSaving(state){
  productSaving=state;
  const button=$('#product-form button[type="submit"]');
  if(button){button.disabled=state;button.setAttribute('aria-busy',String(state));button.textContent=state?'Saving…':'Save Product'}
}
function withTimeout(promise,ms,label){return Promise.race([promise,new Promise((_,reject)=>setTimeout(()=>reject(new Error(label)),ms))])}
async function isAdmin(user=null){
  // The admin login is intentionally password-only in the UI. The email is
  // fixed to ADMIN_EMAIL, so Supabase Auth is the credential check; do not
  // make login depend on a second admin_users/RPC request that can stall.
  let currentUser=user;
  if(!currentUser){
    const {data,error}=await withTimeout(
      supabase.auth.getUser(),
      10000,
      'Administrator session check timed out. Please check your Supabase configuration.'
    );
    if(error) throw new Error(`Administrator session check failed: ${error.message||'Unable to read the authenticated user.'}`);
    currentUser=data?.user||null;
  }
  return String(currentUser?.email||'').trim().toLowerCase()===String(ADMIN_EMAIL||'').trim().toLowerCase();
}

function setLoginBusy(state){
  const button=$('#login-submit');
  if(!button)return;
  button.disabled=state;
  button.setAttribute('aria-busy',String(state));
  button.textContent=state?'Signing in…':'Sign In';
}

async function boot(){
  // Attach UI handlers first. If Supabase is temporarily unavailable, the login
  // form must still respond and show a useful error instead of appearing dead.
  $('#login-form').addEventListener('submit',login);
  $('#logout').addEventListener('click',logout);
  $('#mobile-menu').addEventListener('click',toggleMobileNav);
  $$('.admin-sidebar nav button').forEach(b=>b.addEventListener('click',()=>{showSection(b.dataset.section);closeMobileNav()}));
  $$('[data-go]').forEach(b=>b.addEventListener('click',()=>showSection(b.dataset.go)));
  $('#add-product')?.addEventListener('click',()=>openEditor());
  $('#product-form').addEventListener('submit',saveProduct);$('#product-form').elements.promotion_enabled.addEventListener('change',togglePromotionFields);
  $('#product-image').addEventListener('change',previewImage);
  $('#clear-image').addEventListener('click',clearImage);
  $$('[data-close-editor]').forEach(b=>b.addEventListener('click',closeEditor));
  $('#save-company').addEventListener('click',saveCompany);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeMobileNav();if(!$('#product-editor').classList.contains('hidden'))closeEditor()}});
  $('#admin-nav-backdrop')?.addEventListener('click',closeMobileNav);
  // Do not block the login screen on an automatic Supabase session check.
  // Supabase auth state can be locked by another browser tab/extension and
  // getSession() may wait indefinitely even when the REST API is healthy.
  // The password login below performs the authoritative check after sign-in.
  showLogin();
  supabase.auth.onAuthStateChange((_event,s)=>{
    if(!s && !authBusy) showLogin();
    // Deliberately do not call isAdmin() from the auth-state callback.
    // signInWithPassword() already verifies the credentials and login() then
    // performs the direct admin_users lookup exactly once.
  });

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
  if(authBusy)return;
  authBusy=true;
  try{
    setLoginBusy(true);
    const result=await withTimeout(supabase.auth.signInWithPassword({email:ADMIN_EMAIL,password}),12000,'Sign-in timed out. Please check your internet connection and Supabase configuration.');
    if(result.error)throw new Error(result.error.message);
    const user=result.data?.user;
    if(!user) throw new Error('Supabase authenticated the request but returned no user session.');
    if(String(user.email||'').trim().toLowerCase()!==String(ADMIN_EMAIL||'').trim().toLowerCase()){
      await withTimeout(supabase.auth.signOut(),10000,'Sign-out timed out.');
      throw new Error('This account is not the configured VTS administrator account.');
    }
    showApp();
  }catch(err){console.error('Admin login failed:',err);error(`Login failed: ${err?.message||'Unable to sign in. Please check the password and Supabase configuration.'}`);}
  finally{authBusy=false;setLoginBusy(false);}
}
async function logout(){try{await withTimeout(supabase.auth.signOut(),10000,'Sign-out timed out.')}catch(e){console.error(e)}finally{showLogin()}}
function showLogin(){$('#login-view').classList.remove('hidden');$('#app-view').classList.add('hidden');closeMobileNav()}
function showApp(){
  $('#login-view').classList.add('hidden');$('#app-view').classList.remove('hidden');showSection('dashboard');
  // Render the dashboard immediately; data loading must never block authentication UI.
  loadData();
}
function showSection(name){
  const target=$(`#section-${name}`); if(!target)return;
  $$('.admin-section').forEach(s=>s.classList.add('hidden'));target.classList.remove('hidden');
  $$('.admin-sidebar nav button').forEach(b=>b.classList.toggle('active',b.dataset.section===name));
  $('#section-title').textContent=target.querySelector('.panel-head h3')?.textContent||'Dashboard';
}
async function loadData(){
  // Load each resource independently. The admin screen must remain usable even
  // if one legacy table/policy is unavailable. Never turn a single failed query
  // into a generic "management data permissions" failure.
  const jobs=[
    ['products',()=>supabase.from('products').select('*').order('display_order',{ascending:true}).order('created_at',{ascending:false})],
    ['categories',()=>supabase.from('categories').select('*').eq('active',true).order('display_order',{ascending:true})],
    ['settings',()=>supabase.from('site_settings').select('*').limit(1)],
    ['services',()=>supabase.from('services').select('*').order('display_order',{ascending:true})]
  ];
  const results=await Promise.all(jobs.map(async ([name,fn])=>{
    try{
      const r=await withTimeout(fn(),30000,`${name} request timed out after 30 seconds. The Supabase project may be waking up, unreachable, or the request may be blocked by database/RLS configuration.`);
      return [name,r.data,r.error||null];
    }catch(e){return [name,null,e];}
  }));
  const failures=[];
  for(const [name,data,err] of results){
    if(err){
      failures.push(`${name}: ${err.message||err}`);
      continue;
    }
    if(name==='products') products=data||[];
    else if(name==='categories') categories=(data||[]);
    else if(name==='settings') settings=(Array.isArray(data)?(data[0]||{}):(data||{}));
    else if(name==='services') serviceRows=data||[];
  }
  // Categories are required for the product editor, so always provide the
  // known VTS categories even when the categories table is unavailable.
  renderDashboard(serviceRows);renderProducts();renderServices(serviceRows);fillCompany();fillCategories();
  if(failures.length){
    console.warn('VTS management data warnings:',failures);
    toast(`Management data warning: ${failures[0]}`,'error');
  }
}

function renderDashboard(services){$('#stat-products').textContent=products.length;$('#stat-featured').textContent=products.filter(p=>p.featured).length;$('#stat-energy').textContent=services.filter(s=>s.category==='Energy Solutions').length;$('#stat-security').textContent=services.filter(s=>s.category==='Digital Security Solutions').length;$('#dashboard-recent').innerHTML=products.slice(0,5).map(p=>`<div class="recent-item"><strong>${esc(p.name)}</strong><small>${esc(p.category)} • ${p.active?'Active':'Inactive'}</small></div>`).join('')}
function renderProducts(){$('#product-table').innerHTML=products.map(p=>`<tr><td><img class="table-img" src="${esc(imageSrc(p.image_url))}" alt=""></td><td><b>${esc(p.name)}</b>${p.is_demo?'<br><small style="color:#f59e0b">Demo</small>':''}</td><td>${esc(p.category)}</td><td>${hasPromotion(p)?`<span class="admin-promo-badge">${p.promotion_type==='special_offer'?'Special Offer':'On Sale'}</span><br><del>${formatMoney(p.original_price)}</del> <b>${formatMoney(p.sale_price)}</b>`:formatPrice(p)}</td><td>${p.active?'✓':'✗'}</td><td>${p.featured?'✓':'✗'}</td><td><div class="action-row"><button class="mini-btn" data-edit="${esc(p.id)}" type="button">Edit</button><button class="mini-btn" data-toggle="${esc(p.id)}" type="button">${p.active?'Hide':'Show'}</button><button class="mini-btn danger" data-delete="${esc(p.id)}" type="button">Delete</button></div></td></tr>`).join('')||'<tr><td colspan="7">No products found.</td></tr>';
  $('#product-table').querySelectorAll('[data-edit]').forEach(b=>b.addEventListener('click',()=>openEditor(products.find(p=>p.id===b.dataset.edit))));
  $('#product-table').querySelectorAll('[data-toggle]').forEach(b=>b.addEventListener('click',()=>toggleProduct(b.dataset.toggle)));
  $('#product-table').querySelectorAll('[data-delete]').forEach(b=>b.addEventListener('click',()=>deleteProduct(b.dataset.delete)));
}
function renderServices(rows){$('#service-admin-grid').innerHTML=rows.map(s=>`<article class="service-admin-card"><small>${esc(s.category)}</small><h3>${esc(s.name)}</h3><p>${esc(s.description)}</p></article>`).join('')}
function fillCategories(selected=''){const select=$('#product-category');if(!select)return;const dbNames=categories.map(c=>String(c?.name||'').trim()).filter(Boolean);const names=[...new Set([...dbNames,...DEFAULT_PRODUCT_CATEGORIES])];select.innerHTML='<option value="">Select a category</option>'+names.map(name=>`<option value="${esc(name)}">${esc(name)}</option>`).join('');if(selected)select.value=selected;if(!select.value&&names.length)select.value=names[0]||''}
function fillCompany(){
  const f=$('#company-form');
  Object.entries(settings||{}).forEach(([k,v])=>{const el=f.elements[k];if(el)el.value=v??''});
  f.elements.phone.value=REQUIRED_PHONE;
  f.elements.phone2.value=REQUIRED_PHONE2;
  f.elements.whatsapp.value=REQUIRED_WHATSAPP;
  f.elements.coverage.value=HOMEPAGE_COVERAGE;
  f.elements.mission.value=REQUIRED_MISSION;
  f.elements.vision.value=REQUIRED_VISION;
  f.elements.values.value=REQUIRED_VALUES;
}
function openEditor(p){
  const form=$('#product-form');form.reset();$('#editor-error').classList.add('hidden');newImageFile=null;currentImagePath=p?.image_url||null;$('#product-image').value='';
  fillCategories(p?.category||'');
  const promotionEnabled=form.elements.promotion_enabled;
  if(p){
    $('#editor-title').textContent='Edit Product';
    Object.entries(p).forEach(([k,v])=>{const el=form.elements[k];if(el)el.value=typeof v==='object'?arrayLines(v):v??''});
  }else $('#editor-title').textContent='Add Product';
  promotionEnabled.checked=hasPromotion(p);
  form.elements.promotion_type.value=p?.promotion_type||'on_sale';
  form.elements.original_price.value=p?.original_price??'';
  form.elements.sale_price.value=p?.sale_price??'';
  togglePromotionFields();
  renderImagePreview(currentImagePath);
  $('#product-editor').classList.remove('hidden');$('#product-editor').setAttribute('aria-hidden','false');
  setTimeout(()=>form.elements.name.focus(),0);
}
function arrayLines(v){if(!Array.isArray(v))return '';return v.map(x=>typeof x==='string'?x:(x?.label?`${x.label}: ${x.value||''}`:'')).join('\n')}
function closeEditor(){editorSession++;productSaving=false;setSaving(false);newImageFile=null;$('#product-image').value='';$('#product-editor').classList.add('hidden');$('#product-editor').setAttribute('aria-hidden','true')}
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
  const {error:e}=await withTimeout(supabase.storage.from('product-images').upload(path,file,{upsert:false,contentType:file.type}),15000,'Image upload timed out. Please check your connection and try again.');
  if(e)throw new Error(`Image upload failed: ${e.message}`);
  const {data}=supabase.storage.from('product-images').getPublicUrl(path);
  return data.publicUrl;
}
function parseLines(value){return String(value||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean)}
function syncProductCaches(){try{localStorage.setItem('vts_public_products',JSON.stringify(products.filter(p=>p.active)));localStorage.setItem('vts_featured_products',JSON.stringify(products.filter(p=>p.active&&p.featured).slice(0,6)))}catch{}}
function togglePromotionFields(){const enabled=$('#product-form')?.elements.promotion_enabled?.checked;document.querySelector('.promotion-fields')?.classList.toggle('promotion-disabled',!enabled)}
async function saveProduct(e){
  e.preventDefault();
  if(productSaving)return;
  const f=e.currentTarget;
  const session=editorSession;
  $('#editor-error').classList.add('hidden');
  if(!f.reportValidity())return;
  try{
    setSaving(true);
    const name=f.elements.name.value.trim();
    if(!name)throw new Error('Product name is required.');
    const priceValue=f.elements.price.value.trim();
    const promotionEnabled=f.elements.promotion_enabled.checked;
    const originalPrice=f.elements.original_price.value.trim();
    const salePrice=f.elements.sale_price.value.trim();
    if(promotionEnabled){
      if(originalPrice===''||salePrice==='')throw new Error('Original price and sale/current price are required for a promotion.');
      if(Number(salePrice)>=Number(originalPrice))throw new Error('Sale/current price must be lower than the original price.');
    }
    const data={
      name,category:f.elements.category.value,slug:slugify(name),
      short_description:f.elements.short_description.value.trim(),
      description:f.elements.description.value.trim(),
      price:priceValue===''?null:Number(priceValue),
      price_type:f.elements.price_type.value,
      promotion_status:promotionEnabled?'active':'none',
      promotion_type:promotionEnabled?f.elements.promotion_type.value:'on_sale',
      original_price:promotionEnabled?Number(originalPrice):null,
      sale_price:promotionEnabled?Number(salePrice):null,
      active:f.elements.active.checked,featured:f.elements.featured.checked,
      display_order:Math.max(0,parseInt(f.elements.display_order.value,10)||0)
    };
    const features=parseLines(f.elements.features.value);
    const specifications=parseLines(f.elements.specifications.value);
    if(features.length)data.features=features;
    if(specifications.length)data.specifications=specifications;
    if(newImageFile)data.image_url=await uploadImage(newImageFile);
    if(session!==editorSession)return;

    const id=f.elements.id.value.trim();
    let res;
    if(id)res=await withTimeout(supabase.from('products').update(data).eq('id',id).select().single(),15000,'Product save timed out. Please check Supabase connectivity and try again.');
    else res=await withTimeout(supabase.from('products').insert(data).select().single(),15000,'Product save timed out. Please check Supabase connectivity and try again.');

    // The promotion columns live in the supplied migration, but an existing
    // Supabase project may still be using the older products table/schema cache.
    // In that case, save the core product instead of leaving the editor stuck.
    if(res.error && /original_price|sale_price|promotion_status|promotion_type/i.test(res.error.message||'')){
      if(promotionEnabled){
        throw new Error('Promotion fields are not available in the Supabase products table. Run supabase/migration_promotions.sql, reload the PostgREST schema cache, then try again. No product was saved.');
      }
      const core={...data};
      delete core.promotion_status; delete core.promotion_type; delete core.original_price; delete core.sale_price;
      res=id
        ? await withTimeout(supabase.from('products').update(core).eq('id',id).select().single(),15000,'Product save timed out. Please check Supabase connectivity and try again.')
        : await withTimeout(supabase.from('products').insert(core).select().single(),15000,'Product save timed out. Please check Supabase connectivity and try again.');
    }
    // Older V2 databases may not yet have the optional specifications column.
    if(res.error && /specifications.*column|column.*specifications/i.test(res.error.message||'')){
      const retry={...data};delete retry.specifications;
      if(id)res=await withTimeout(supabase.from('products').update(retry).eq('id',id).select().single(),15000,'Product save timed out. Please check Supabase connectivity and try again.');
      else res=await withTimeout(supabase.from('products').insert(retry).select().single(),15000,'Product save timed out. Please check Supabase connectivity and try again.');
    }
    if(res.error)throw new Error(res.error.message);
    if(session!==editorSession)return;
    const saved=res.data;
    if(id)products=products.map(p=>p.id===id?saved:p);else products=[saved,...products];
    renderProducts();renderDashboard(serviceRows);syncProductCaches();
    toast(`Product ${id?'updated':'added'} successfully.`);
    closeEditor();
  }catch(err){
    console.error('Product save failed:',err);
    if(session===editorSession)editorError(`Save failed: ${err?.message||'An unexpected error occurred. Please try again.'}`);
  }finally{
    if(session===editorSession)setSaving(false);
  }
}
async function toggleProduct(id){const p=products.find(x=>x.id===id);if(!p)return;try{const {data,error:e}=await withTimeout(supabase.from('products').update({active:!p.active}).eq('id',id).select().single(),15000,'Product status update timed out.');if(e)throw e;products=products.map(x=>x.id===id?data:x);renderProducts();renderDashboard(serviceRows);syncProductCaches();toast(`Product ${!p.active?'activated':'deactivated'}.`)}catch(e){console.error(e);toast(`Could not update product: ${e.message||'Unknown error'}`,'error')}}
async function deleteProduct(id){const p=products.find(x=>x.id===id);if(!p||!confirm(`Are you sure you want to delete this product?\n\n${p.name}`))return;try{const {error:e}=await withTimeout(supabase.from('products').delete().eq('id',id),15000,'Product deletion timed out.');if(e)throw e;products=products.filter(x=>x.id!==id);renderProducts();renderDashboard(serviceRows);syncProductCaches();toast('Product deleted.')}catch(e){console.error(e);toast(`Could not delete product: ${e.message||'Unknown error'}`,'error')}}
async function saveCompany(){
  const f=$('#company-form');
  if(!f.reportValidity())return;
  const row={company_name:f.elements.company_name.value.trim(),legal_name:f.elements.legal_name.value.trim(),registration_number:f.elements.registration_number.value.trim(),phone:REQUIRED_PHONE,phone2:REQUIRED_PHONE2,whatsapp:REQUIRED_WHATSAPP,sales_email:f.elements.sales_email.value.trim(),info_email:f.elements.info_email.value.trim(),address:f.elements.address.value.trim(),coverage:HOMEPAGE_COVERAGE,mission:REQUIRED_MISSION,vision:REQUIRED_VISION,values:REQUIRED_VALUES};
  try{const {error:e}=await withTimeout(supabase.from('site_settings').update(row).eq('id',1),15000,'Company information save timed out.');if(e)throw e;settings={...settings,...row};toast('Company information saved.')}catch(e){console.error(e);toast(`Failed to save company information: ${e.message||'Unknown error'}`,'error')}
}
const loginEmail=$('#login-email');
if(loginEmail)loginEmail.value=ADMIN_EMAIL;
boot();
