import { getSettings, whatsappUrl, HOMEPAGE_COVERAGE, REQUIRED_PHONE, REQUIRED_PHONE2 } from './data.js?v20260911-1600';

const nav = document.querySelector('#site-nav');
const footer = document.querySelector('#site-footer');
const page = document.body.dataset.page || '';
let settings;

function navMarkup(){return `<header class="nav" id="nav"><div class="container nav-inner"><a class="brand" href="index.html" aria-label="VTS Energy & Security home"><img src="assets/images/vts-logo.jpg" alt="VTS Energy & Security"></a><button class="nav-toggle" id="nav-toggle" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="primary-nav">☰</button><nav class="nav-links" id="primary-nav" aria-label="Primary"><a class="${page==='home'?'active':''}" href="index.html">Home</a><a class="${page==='services'?'active':''}" href="services.html">Services</a><a class="${page==='products'?'active':''}" href="products.html">Products</a><a class="${page==='about'?'active':''}" href="about.html">About</a><a class="${page==='contact'?'active':''}" href="contact.html">Contact</a><a class="nav-cta" href="contact.html">Request a Quote</a></nav></div></header>`}
function footerMarkup(s){return `<footer class="site-footer"><div class="container"><div class="footer-grid"><div class="footer-col"><img class="footer-logo" src="assets/images/vts-logo.jpg" alt="VTS Energy & Security logo"><p>Integrated energy and digital security solutions for Southern Africa.</p></div><div class="footer-col"><h4>Quick Links</h4><a href="index.html">Home</a><a href="services.html">Services</a><a href="products.html">Products</a><a href="about.html">About</a><a href="contact.html">Contact</a><a class="footer-vts" href="admin/" aria-label="VTS administrator login">VTS</a></div><div class="footer-col"><h4>Solutions</h4><a href="services.html#energy">Energy Solutions</a><a href="services.html#security">Digital Security</a><a href="products.html">Product Catalogue</a></div><div class="footer-col"><h4>Contact</h4><a href="tel:${s.phone.replace(/\s/g,'')}">${s.phone}</a>${s.phone2?`<a href="tel:${s.phone2.replace(/\s/g,'')}">${s.phone2}</a>`:''}<a href="mailto:${s.sales_email}">${s.sales_email}</a><a href="mailto:${s.info_email}">${s.info_email}</a><p>${s.address}</p></div></div><div class="footer-bottom"><span>© 2026 VTS Energy & Security. All Rights Reserved.</span><span>${s.legal_name} · ${s.registration_number}</span></div></div></footer>`}
function toast(message,type='success'){const el=document.createElement('div');el.className='toast';el.textContent=message;document.body.appendChild(el);setTimeout(()=>el.remove(),3400)}
window.VTS={toast,whatsappUrl,get settings(){return settings}};

async function boot(){
  if(nav){
    nav.innerHTML=navMarkup();
    const navEl=document.querySelector('#nav'), toggle=document.querySelector('#nav-toggle');
    const closeMenu=()=>{navEl.classList.remove('open');toggle?.setAttribute('aria-expanded','false');toggle?.setAttribute('aria-label','Open menu')};
    toggle?.addEventListener('click',()=>{
      const open=navEl.classList.toggle('open');
      toggle.setAttribute('aria-expanded',String(open));
      toggle.setAttribute('aria-label',open?'Close menu':'Open menu');
    });
    navEl.querySelectorAll('.nav-links a').forEach(link=>link.addEventListener('click',closeMenu));
    document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu()});
  }
  const fallback={phone:REQUIRED_PHONE,phone2:REQUIRED_PHONE2,sales_email:'sales@vtsenergysecurity.co.za',info_email:'info@vtsenergysecurity.co.za',address:'18 Stott Rd, Prestbury, Pietermaritzburg, 3201, South Africa',legal_name:'Volt Tech Solutions (Pty) Ltd',registration_number:'2023/259917/7'};
  // Render the footer immediately so a slow/offline Supabase connection can never make Quick Links disappear.
  if(footer) footer.innerHTML=footerMarkup(fallback);
  try{settings=await getSettings()}catch(e){settings=fallback}
  if(footer) footer.innerHTML=footerMarkup(settings||fallback);
  const coverage=document.querySelectorAll('#coverage-list');
  if(settings?.coverage) coverage.forEach(el=>{
    const value=page==='home' ? HOMEPAGE_COVERAGE : settings.coverage;
    el.innerHTML=value.split('|').map(x=>`<span>${x.trim()}</span>`).join('');
  });
  const heroCoverage=document.querySelector('#hero-coverage-list');
  if(heroCoverage){
    heroCoverage.innerHTML=HOMEPAGE_COVERAGE.split('|').map(x=>`<span>${x.trim()}</span>`).join('');
  }
  const homeWa=document.querySelector('#home-wa'); if(homeWa) homeWa.href=whatsappUrl(settings?.whatsapp);
}
boot();
