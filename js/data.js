import { supabase } from './supabase.js';

const REQUEST_TIMEOUT=10000;
function timed(promise,label='The VTS data service timed out.'){return Promise.race([promise,new Promise((_,reject)=>setTimeout(()=>reject(new Error(label)),REQUEST_TIMEOUT))])}

export const REQUIRED_PHONE = '+27 33 032 2153';
export const REQUIRED_PHONE2 = '+27 82 269 2150';
export const REQUIRED_WHATSAPP = '+27822692150';
export const HOMEPAGE_COVERAGE = 'South Africa | Zimbabwe | Zambia | Botswana | Namibia | Mozambique | Lesotho | Eswatini | Malawi';
export const REQUIRED_MISSION = 'To provide reliable, affordable, and professional energy and security solutions that keep African businesses and communities powered, protected, and productive.';
export const REQUIRED_VISION = "To become Southern Africa's most trusted partner for integrated energy resilience and digital protection.";
export const REQUIRED_VALUES = 'Reliability — We deliver what we promise, on time and to standard. | Trust — We build long-term relationships through honesty and transparency. | Excellence — We use quality products and certified professionals. | Innovation — We embrace modern technology to solve African challenges. | Safety — We protect people, property, and data at all times.';

export const fallbackSettings = {
  company_name: 'VTS Energy & Security',
  legal_name: 'Volt Tech Solutions (Pty) Ltd',
  registration_number: '2023/259917/7',
  phone: REQUIRED_PHONE,
  phone2: REQUIRED_PHONE2,
  whatsapp: REQUIRED_WHATSAPP,
  sales_email: 'sales@vtsenergysecurity.co.za',
  info_email: 'info@vtsenergysecurity.co.za',
  address: '18 Stott Rd, Prestbury, Pietermaritzburg, 3201, South Africa',
  coverage: 'South Africa | Zimbabwe | Zambia | Botswana | Namibia | Mozambique | Lesotho | Eswatini | Malawi',
  mission: REQUIRED_MISSION,
  vision: REQUIRED_VISION,
  values: REQUIRED_VALUES
};

export async function getSettings() {
  try {
    const { data, error } = await timed(supabase.from('site_settings').select('*').eq('id', 1).maybeSingle(),'Company information request timed out.');
    if (error) throw error;
    localStorage.setItem('vts_site_settings', JSON.stringify(data || fallbackSettings));
    return {
      ...(data || fallbackSettings),
    phone: REQUIRED_PHONE,
    phone2: REQUIRED_PHONE2,
    whatsapp: REQUIRED_WHATSAPP,
    mission: REQUIRED_MISSION,
    vision: REQUIRED_VISION,
      values: REQUIRED_VALUES
    };
  } catch (error) {
    try {
      const cached = JSON.parse(localStorage.getItem('vts_site_settings') || 'null');
      return { ...(cached || fallbackSettings), phone: REQUIRED_PHONE, phone2: REQUIRED_PHONE2, whatsapp: REQUIRED_WHATSAPP, mission: REQUIRED_MISSION, vision: REQUIRED_VISION, values: REQUIRED_VALUES };
    } catch {
      return { ...fallbackSettings };
    }
  }
}

export async function getPublicProducts() {
  try {
    const { data, error } = await timed(supabase.from('products').select('*').eq('active', true).order('display_order', { ascending: true }).order('created_at', { ascending: false }),'Product catalogue request timed out.');
    if (error) throw error;
    const rows = data || [];
    localStorage.setItem('vts_public_products', JSON.stringify(rows));
    return rows;
  } catch (error) {
    try { return JSON.parse(localStorage.getItem('vts_public_products') || '[]'); } catch { return []; }
  }
}

export async function getFeaturedProducts() {
  try {
    const { data, error } = await timed(supabase.from('products').select('*').eq('active', true).eq('featured', true).order('display_order', { ascending: true }).limit(6),'Featured products request timed out.');
    if (error) throw error;
    const rows = data || [];
    localStorage.setItem('vts_featured_products', JSON.stringify(rows));
    return rows;
  } catch (error) {
    try { return JSON.parse(localStorage.getItem('vts_featured_products') || '[]'); } catch { return []; }
  }
}

export async function getServices() {
  const { data, error } = await timed(supabase.from('services').select('*').eq('active', true).order('display_order', { ascending: true }),'Services request timed out.');
  if (error) throw error;
  return data || [];
}

export function formatMoney(value) {
  if (value === null || value === undefined || value === '') return '';
  const n = Number(value);
  return Number.isFinite(n) ? `R${new Intl.NumberFormat('en-ZA', { maximumFractionDigits: 2 }).format(n)}` : String(value);
}

export function hasPromotion(product) {
  return Boolean(product?.promotion_status && product.promotion_status !== 'none' &&
    product?.original_price !== null && product?.original_price !== undefined &&
    product?.sale_price !== null && product?.sale_price !== undefined);
}

export function formatPrice(product) {
  if (hasPromotion(product)) return formatMoney(product.sale_price);
  if (product.price_type === 'quote') return 'Request a Quote';
  if (product.price === null || product.price === undefined || product.price === '') return 'Request a Quote';
  const value = Number(product.price);
  const formatted = Number.isFinite(value) ? new Intl.NumberFormat('en-ZA', { maximumFractionDigits: 2 }).format(value) : product.price;
  return product.price_type === 'starting' ? `From R${formatted}` : `R${formatted}`;
}

export function whatsappUrl(number, productName = '') {
  const digits = String(number || '').replace(/\D/g, '');
  const message = productName
    ? `Hello VTS Energy & Security, I would like to enquire about the ${productName}. Please provide me with more information and pricing.`
    : 'Hello VTS Energy & Security, I would like to enquire about your energy and security solutions.';
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function slugify(value) {
  return String(value || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
