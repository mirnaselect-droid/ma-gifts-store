import { useEffect, useMemo, useState } from 'react'
import { Search, ShoppingBag, UserRound, Truck, Heart, Headphones, Menu, X, ChevronDown, Instagram, Facebook, Music2, MessageCircle, Sparkles, Gift, ShieldCheck, PackageCheck } from 'lucide-react'
import { isSupabaseConfigured, supabase } from './lib/supabase'

type Category = { id:string; slug:string; name_ar:string; name_en:string; image_url:string|null }
type Product = { id:string; slug:string; name_ar:string; name_en:string; description_ar:string|null; description_en:string|null; images:string[]; price:number; currency:string; is_featured:boolean }
const fallbackCategories:Category[] = [
  {id:'1',slug:'occasion-gifts',name_ar:'هدايا المناسبات',name_en:'Occasion Gifts',image_url:null},
  {id:'2',slug:'womens-gift-boxes',name_ar:'بوكسات بناتي',name_en:"Women's Gift Boxes",image_url:null},
  {id:'3',slug:'mens-gift-boxes',name_ar:'بوكسات رجالي',name_en:"Men's Gift Boxes",image_url:null},
  {id:'4',slug:'beauty-care',name_ar:'بوكسات العناية والجمال',name_en:'Beauty & Self-care',image_url:null},
  {id:'5',slug:'custom-gifts',name_ar:'صممي بوكسك بنفسك',name_en:'Create Your Own Box',image_url:null},
]
const localeNames:[string,string][]=[['ar-EG','العربية'],['en','English'],['ar-SA','السعودية'],['ar-AE','الإمارات'],['ar-KW','الكويت'],['tr','Türkçe'],['zh-CN','中文'],['ko','한국어'],['fr','Français'],['de','Deutsch'],['es','Español']]
const copy = {
'ar-EG':{home:'الرئيسية',products:'المنتجات',occasions:'المناسبات',about:'من نحن',contact:'تواصل معنا',login:'تسجيل الدخول',track:'تتبع طلبك',search:'ابحثي عن هديتك المفضلة...',hero:'كل هدية… حكاية حب',sub:'اختاري هدية تعبّر عن مشاعرك، وسيبيلنا التفاصيل علينا.',shop:'تسوقي الآن',categories:'تسوّقي حسب الفئة',latest:'اختيارات مميزة ليكي',empty:'قريبًا هنعرض أجمل الهدايا هنا',emptySub:'بنجهّز تشكيلتنا بعناية علشان كل هدية تبقى حكاية.',benefit1:'تغليف فاخر',benefit2:'دفع آمن وموثوق',benefit3:'توصيل حسب منطقتك',benefit4:'دعم ومساعدة',custom:'هدية على ذوقك وميزانيتك',customSub:'اختاري المنتجات والألوان والتفاصيل… واعملي بوكس شبه الشخص اللي هتفرحيه.',start:'صممي بوكسك',footer:'صُنعت بحب، خصيصًا ليكِ',all:'كل الهدايا'},
'en':{home:'Home',products:'Shop',occasions:'Occasions',about:'Our Story',contact:'Contact',login:'Sign in',track:'Track order',search:'Find your perfect gift...',hero:'Every gift tells a story of love',sub:'Thoughtfully chosen gifts, made personal just for them.',shop:'Shop now',categories:'Shop by category',latest:'Curated for you',empty:'Beautiful gifts are coming soon',emptySub:'We are carefully preparing our first collection.',benefit1:'Premium wrapping',benefit2:'Secure checkout',benefit3:'Regional delivery',benefit4:'Friendly support',custom:'A gift made your way',customSub:'Choose the products, colors and little details to create something personal.',start:'Create your box',footer:'Made with love, just for you',all:'All gifts'}
} as const
function App(){
 const [locale,setLocale]=useState('ar-EG')
 const [categories,setCategories]=useState<Category[]>(fallbackCategories)
 const [products,setProducts]=useState<Product[]>([])
 const [cart,setCart]=useState(0)
 const [menuOpen,setMenuOpen]=useState(false)
 const [search,setSearch]=useState('')
 const [showSearch,setShowSearch]=useState(false)
 const [dbStatus,setDbStatus]=useState<'loading'|'connected'|'offline'>('loading')
 const isArabic=locale.startsWith('ar')
 const t=copy[locale as keyof typeof copy] ?? (isArabic?copy['ar-EG']:copy.en)
 const currency = locale==='ar-EG'?'EGP':locale==='ar-SA'?'SAR':locale==='ar-AE'?'AED':locale==='ar-KW'?'KWD':'EGP'
 useEffect(()=>{document.documentElement.lang=isArabic?'ar':locale;document.documentElement.dir=isArabic?'rtl':'ltr'},[locale,isArabic])
 useEffect(()=>{let alive=true;(async()=>{if(!supabase){setDbStatus('offline');return}const [c,p]=await Promise.all([supabase.from('categories').select('id,slug,name_ar,name_en,image_url').eq('is_active',true).order('sort_order'),supabase.from('products').select('id,slug,name_ar,name_en,description_ar,description_en,images,price,currency,is_featured').eq('is_active',true).order('sort_order')]);if(!alive)return;if(!c.error&&c.data?.length)setCategories(c.data);if(!p.error)setProducts(p.data??[]);setDbStatus(c.error||p.error?'offline':'connected')})();return()=>{alive=false}},[])
 const filtered=useMemo(()=>products.filter(p=>(p.name_ar+' '+p.name_en).toLowerCase().includes(search.toLowerCase())),[products,search])
 const money=(n:number,c:string)=>new Intl.NumberFormat(locale,{style:'currency',currency:c||currency,maximumFractionDigits:0}).format(n)
 return <div className="site-shell">
  <div className="topbar"><div className="socials"><a aria-label="TikTok"><Music2/></a><a aria-label="WhatsApp"><MessageCircle/></a><a aria-label="Instagram"><Instagram/></a><a aria-label="Facebook"><Facebook/></a></div><div className="top-love">♥ Made with Love · Just for You ♥</div><div className="top-links"><a href="#track"><Truck size={15}/>{t.track}</a><a href="#account"><UserRound size={15}/>{t.login}</a></div></div>
  <header className="main-header"><button className="icon-btn mobile-menu" onClick={()=>setMenuOpen(true)} aria-label="Open menu"><Menu/></button><button className="cart-btn" onClick={()=>setCart(v=>v+0)} aria-label="Shopping bag"><ShoppingBag/><b>{cart}</b></button><div className="search-box"><Search size={18}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder={t.search}/></div><a className="brand" href="#"><span className="brand-mark">🎁</span><span><strong>M&A Gifts</strong><small>Made with Love, Just for You ♡</small></span></a><nav className="desktop-nav"><a className="active" href="#home">{t.home}</a><a href="#products">{t.products}<ChevronDown/></a><a href="#categories">{t.occasions}<ChevronDown/></a><a href="#about">{t.about}</a><a href="#contact">{t.contact}</a></nav><select aria-label="Language" className="language" value={locale} onChange={e=>setLocale(e.target.value)}>{localeNames.map(([v,n])=><option key={v} value={v}>{n}</option>)}</select></header>
  {menuOpen&&<div className="drawer-backdrop" onClick={()=>setMenuOpen(false)}><aside className="drawer" onClick={e=>e.stopPropagation()}><button className="icon-btn close" onClick={()=>setMenuOpen(false)}><X/></button><div className="drawer-brand">M&A Gifts<small>Made with Love, Just for You</small></div>{[t.home,t.products,t.occasions,t.about,t.contact,t.track,t.login].map((v,i)=><a key={v} href={['#home','#products','#categories','#about','#contact','#track','#account'][i]} onClick={()=>setMenuOpen(false)}>{v}</a>)}</aside></div>}
  <main id="home">
   <section className="hero"><div className="hero-flower">✿</div><div className="hero-copy"><span className="eyebrow">M&A GIFTS · A LITTLE BOX OF HAPPINESS</span><h1>{t.hero}</h1><p>{t.sub}</p><a className="gold-btn" href="#products">{t.shop}<span>←</span></a><div className="hero-caption">M&A Gifts <i>—</i> Made with Love, Just for You</div></div><div className="gift-scene"><div className="gift gift-large"><span></span></div><div className="gift gift-small"><span></span></div><div className="gift gift-cream"><span></span></div><div className="ribbon-loop"></div></div><div className="hero-dots"><i className="selected"/><i/><i/><i/></div></section>
   <section className="category-section" id="categories"><div className="section-heading"><span></span><h2>♡ {t.categories} ♡</h2><span></span></div><div className="category-row">{categories.map((c,i)=><a className="category-card" href="#products" key={c.id}>{c.image_url?<img src={c.image_url} alt=""/>:<div className={'category-art art-'+i}><Gift/></div>}<strong>{isArabic?c.name_ar:c.name_en}</strong></a>)}</div></section>
   <section className="products-section" id="products"><div className="section-heading"><span></span><h2>♡ {t.latest} ♡</h2><span></span></div>{filtered.length? <div className="product-grid">{filtered.map(p=><article className="product-card" key={p.id}><div className="product-image">{p.images?.[0]?<img src={p.images[0]} alt={isArabic?p.name_ar:p.name_en}/>:<div className="product-placeholder"><Gift/><small>M&A Gifts</small></div>}<button className="heart"><Heart/></button></div><h3>{isArabic?p.name_ar:p.name_en}</h3><p>{money(p.price,p.currency)}</p><button className="add-btn" onClick={()=>setCart(v=>v+1)}><ShoppingBag size={15}/> {isArabic?'أضيفي إلى السلة':'Add to bag'}</button></article>)}</div>:<div className="empty-state"><div className="empty-gift"><Gift/></div><h3>{search?(isArabic?'مفيش نتائج للبحث ده':'No matching gifts'):t.empty}</h3><p>{t.emptySub}</p></div>}</section>
   <section className="custom-banner"><div className="custom-icon"><Sparkles/></div><div><h2>{t.custom}</h2><p>{t.customSub}</p></div><a className="gold-btn" href="#contact">{t.start}</a></section>
   <section className="benefits"><div><Gift/><span>{t.benefit1}</span></div><div><ShieldCheck/><span>{t.benefit2}</span></div><div><Truck/><span>{t.benefit3}</span></div><div><Headphones/><span>{t.benefit4}</span></div></section>
  </main>
  <footer id="contact"><div className="footer-brand"><span className="brand-mark">🎁</span><strong>M&A Gifts</strong><small>Made with Love, Just for You ♡</small></div><p>{t.footer}</p><div className="footer-links"><a href="#about">{t.about}</a><a href="#contact">{t.contact}</a><a href="#track">{t.track}</a></div><small>© {new Date().getFullYear()} M&A Gifts. Founded & owned by Mirna Mamdouh.</small><small className="credit">Built with the assistance of ChatGPT and OpenAI tools.</small><span className="db-indicator">{dbStatus==='connected'?'● Live store data':dbStatus==='loading'?'Connecting…':'Preview mode'}</span></footer>
  <a className="support-float" href="#contact" aria-label="Customer support"><Headphones/></a>
 </div>
}
export default App