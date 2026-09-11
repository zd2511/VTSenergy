import { getPublicProducts, getFeaturedProducts, getSettings, formatPrice, formatMoney, hasPromotion, whatsappUrl } from './data.js';

let allProducts=[]; let siteSettings;
const imgFallback='https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=80';
function imageSrc(value){const v=String(value||'').trim();return /^https?:\/\//i.test(v)?v:imgFallback;}
function promotionMarkup(p){
  if(!hasPromotion(p)) return '';
  const type=p.promotion_type==='special_offer'?'SPECIAL OFFER':'ON SALE';
  const saving=Number(p.original_price)-Number(p.sale_price);
  return `<div class="product-promo"><span>${type}</span><div class="promo-prices"><del>${formatMoney(p.original_price)}</del><strong>${formatMoney(p.sale_price)}</strong>${saving>0?`<small>Save ${formatMoney(saving)}</small>`:''}</div></div>`;
}
function card(p){return `<article class="product-card">${promotionMarkup(p)}<div class="product-img" style="background-image:url('${imageSrc(p.image_url)}')"></div><div class="product-body"><span class="product-cat">${p.category||'Other'}</span><h3>${esc(p.name)}</h3><p>${esc(p.short_description||'Explore this VTS solution.')}</p><div class="price ${hasPromotion(p)?'hidden':''}">${formatPrice(p)}</div><div class="card-actions"><button class="btn btn-dark" data-view="${p.id}">View Product</button><a class="btn btn-primary" target="_blank" rel="noopener" href="${whatsappUrl(siteSettings?.whatsapp,p.name)}">WhatsApp</a></div></div></article>`}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function openProduct(p){if(!p||!p.id)return; const modal=document.querySelector('#product-modal'), content=document.querySelector('#product-modal-content'); if(!modal||!content){if(p.slug) window.location.href=`products.html?product=${encodeURIComponent(p.slug)}`; return;} const features=Array.isArray(p.features)?p.features:[]; const specs=Array.isArray(p.specifications)?p.specifications:[]; content.innerHTML=`<div class="modal-product"><div class="modal-product-image" style="background-image:url('${imageSrc(p.image_url)}')"></div><div class="modal-product-body"><span class="product-cat">${esc(p.category||'Other')}</span><h2>${esc(p.name)}</h2><div class="price ${hasPromotion(p)?'hidden':''}">${formatPrice(p)}</div>${promotionMarkup(p)}<p>${esc(p.description||p.short_description)}</p>${features.length?`<h3>Features</h3><ul class="spec-list">${features.map(x=>`<li>${esc(typeof x==='string'?x:x.label||'')}</li>`).join('')}</ul>`:''}${specs.length?`<h3>Specifications</h3><ul class="spec-list">${specs.map(x=>`<li>${esc(typeof x==='string'?x:`${x.label||''}: ${x.value||''}`)}</li>`).join('')}</ul>`:''}<a class="btn btn-primary" target="_blank" rel="noopener" href="${whatsappUrl(siteSettings?.whatsapp,p.name)}">Enquire About This Product on WhatsApp ↗</a></div></div>`; modal.classList.remove('hidden');modal.setAttribute('aria-hidden','false'); history.replaceState(null,'',`products.html?product=${encodeURIComponent(p.slug)}`)}
function closeProduct(){const modal=document.querySelector('#product-modal');if(modal){modal.classList.add('hidden');modal.setAttribute('aria-hidden','true');if(location.search)history.replaceState(null,'','products.html')}}
function solutionGroup(category=''){
  const value=String(category).toLowerCase();
  if(/cctv|camera|surveillance/.test(value)) return 'CCTV';
  if(/solar|panel|photovoltaic|pv/.test(value)) return 'Solar';
  if(/battery|backup/.test(value)) return 'Batteries';
  if(/ups|uninterrupt/.test(value)) return 'UPS';
  if(/inverter/.test(value)) return 'Inverters';
  if(/generator/.test(value)) return 'Generators';
  if(/access|biometric/.test(value)) return 'Access Control';
  if(/alarm/.test(value)) return 'Alarms';
  if(/cyber|network|data|security/.test(value)) return 'Digital Security';
  return category || 'Other';
}

function renderFeaturedFilters(products, render){
  const host=document.querySelector('#featured-filters');
  if(!host)return;
  const groups=[...new Set(products.map(p=>solutionGroup(p.category)).filter(Boolean))];
  const preferred=['Solar','Batteries','UPS','Inverters','Generators','CCTV','Access Control','Alarms','Digital Security'];
  const ordered=preferred.filter(x=>groups.includes(x)).concat(groups.filter(x=>!preferred.includes(x)).sort());
  host.innerHTML=['All',...ordered].map((name,i)=>`<button type="button" class="solution-filter${i===0?' active':''}" data-filter="${esc(name)}" aria-pressed="${i===0?'true':'false'}">${esc(name)}</button>`).join('');
  host.querySelectorAll('.solution-filter').forEach(button=>button.addEventListener('click',()=>{
    host.querySelectorAll('.solution-filter').forEach(b=>{const active=b===button;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active))});
    render(button.dataset.filter);
  }));
}

async function boot(){
  const catalogue=document.querySelector('#product-catalogue'); const featured=document.querySelector('#featured-products'); if(!catalogue&&!featured)return;
  try{siteSettings=await getSettings(); allProducts=await getPublicProducts()}catch(e){if(catalogue)catalogue.innerHTML='<div class="empty-state">Product catalogue unavailable. Please check the site connection.</div>';return}
  if(featured){
    let f=[]; try{f=await getFeaturedProducts()}catch(e){console.error('Featured products load failed:',e)}
    // If no products are explicitly marked Featured, keep the homepage populated with the latest catalogue items.
    if(!f.length) f=allProducts.slice(0,6);
    const renderFeatured=(filter='All')=>{
      const rows=filter==='All'?f:f.filter(p=>solutionGroup(p.category)===filter);
      featured.innerHTML=rows.length?rows.map(card).join(''):'<div class="empty-state">No selected solutions match this filter yet.</div>';
      attachViewHandlers(featured);
    };
    renderFeaturedFilters(f,renderFeatured);
    renderFeatured();
  }
  if(catalogue){
    const categories=[...new Set(allProducts.map(p=>p.category).filter(Boolean))].sort(); document.querySelector('#category-filter').insertAdjacentHTML('beforeend',categories.map(c=>`<option>${esc(c)}</option>`).join(''));
    const render=()=>{const q=document.querySelector('#product-search').value.toLowerCase().trim(),cat=document.querySelector('#category-filter').value,sort=document.querySelector('#sort-filter').value;let rows=allProducts.filter(p=>(!q||`${p.name} ${p.category} ${p.short_description}`.toLowerCase().includes(q))&&(!cat||p.category===cat));if(sort==='name')rows.sort((a,b)=>a.name.localeCompare(b.name));if(sort==='price-low')rows.sort((a,b)=>(a.price??Infinity)-(b.price??Infinity));if(sort==='price-high')rows.sort((a,b)=>(b.price??-1)-(a.price??-1));catalogue.innerHTML=rows.map(card).join('');document.querySelector('#product-empty').classList.toggle('hidden',rows.length>0);attachViewHandlers(catalogue)};
    ['product-search','category-filter','sort-filter'].forEach(id=>document.querySelector('#'+id).addEventListener('input',render)); render();
    const slug=new URLSearchParams(location.search).get('product'); if(slug){const p=allProducts.find(x=>x.slug===slug);if(p)openProduct(p)}
  }
  document.querySelectorAll('[data-close-product]').forEach(x=>x.addEventListener('click',closeProduct));
}
function attachViewHandlers(root){root.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>openProduct(allProducts.find(p=>p.id===b.dataset.view)||[])))}
boot();
