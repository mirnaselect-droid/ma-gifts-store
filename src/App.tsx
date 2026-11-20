import { useEffect, useMemo, useState, type FormEvent } from 'react'
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
 const [cartItems,setCartItems]=useState<{product:Product;quantity:number}[]>([])
 const [cartOpen,setCartOpen]=useState(false)
 const [checkoutOpen,setCheckoutOpen]=useState(false)
 const [checkoutMessage,setCheckoutMessage]=useState('')
 const [shipping,setShipping]=useState({name:'',phone:'',country:'مصر',city:'',address:'',notes:'',payment:'cash_on_delivery'})
 const [menuOpen,setMenuOpen]=useState(false)
 const [search,setSearch]=useState('')
 const [showSearch,setShowSearch]=useState(false)
 const [dbStatus,setDbStatus]=useState<'loading'|'connected'|'offline'>('loading')
 const [session,setSession]=useState<any>(null)
 const [isAdmin,setIsAdmin]=useState(false)
 const [authOpen,setAuthOpen]=useState(false)
 const [authMode,setAuthMode]=useState<'signin'|'signup'>('signin')
 const [authName,setAuthName]=useState('')
 const [authEmail,setAuthEmail]=useState('')
 const [authPassword,setAuthPassword]=useState('')
 const [authMessage,setAuthMessage]=useState('')
 const [authBusy,setAuthBusy]=useState(false)
 const isArabic=locale.startsWith('ar')
 const t=copy[locale as keyof typeof copy] ?? (isArabic?copy['ar-EG']:copy.en)
 const currency = locale==='ar-EG'?'EGP':locale==='ar-SA'?'SAR':locale==='ar-AE'?'AED':locale==='ar-KW'?'KWD':'EGP'
 useEffect(()=>{document.documentElement.lang=isArabic?'ar':locale;document.documentElement.dir=isArabic?'rtl':'ltr'},[locale,isArabic])
 useEffect(()=>{try{const saved=localStorage.getItem('ma-gifts-cart');if(saved){const parsed=JSON.parse(saved);if(Array.isArray(parsed))setCartItems(parsed)}}catch{}},[])
 useEffect(()=>{try{localStorage.setItem('ma-gifts-cart',JSON.stringify(cartItems))}catch{}},[cartItems])

 useEffect(()=>{
  if(!supabase)return
  let alive=true
  supabase.auth.getSession().then(({data})=>{if(alive)setSession(data.session)})
  const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,next)=>{if(alive)setSession(next)})
  return()=>{alive=false;subscription.unsubscribe()}
 },[])
 useEffect(()=>{
  let alive=true
  if(!supabase||!session?.user){setIsAdmin(false);return}
  supabase.from('store_admins').select('user_id').eq('user_id',session.user.id).maybeSingle()
   .then(({data,error})=>{if(alive)setIsAdmin(!error&&!!data)})
  return()=>{alive=false}
 },[session])
 useEffect(()=>{let alive=true;(async()=>{if(!supabase){setDbStatus('offline');return}const [c,p]=await Promise.all([supabase.from('categories').select('id,slug,name_ar,name_en,image_url').eq('is_active',true).order('sort_order'),supabase.from('products').select('id,slug,name_ar,name_en,description_ar,description_en,images,price,currency,is_featured').eq('is_active',true).order('sort_order')]);if(!alive)return;if(!c.error&&c.data?.length)setCategories(c.data);if(!p.error)setProducts(p.data??[]);setDbStatus(c.error||p.error?'offline':'connected')})();return()=>{alive=false}},[])
 const filtered=useMemo(()=>products.filter(p=>(p.name_ar+' '+p.name_en).toLowerCase().includes(search.toLowerCase())),[products,search])
 const money=(n:number,c:string)=>new Intl.NumberFormat(locale,{style:'currency',currency:c||currency,maximumFractionDigits:0}).format(n)
 const cartCount=cartItems.reduce((sum,item)=>sum+item.quantity,0)
 const addToCart=(product:Product)=>setCartItems(items=>{const found=items.find(item=>item.product.id===product.id);return found?items.map(item=>item.product.id===product.id?{...item,quantity:item.quantity+1}:item):[...items,{product,quantity:1}]})
 const changeCartQuantity=(productId:string,delta:number)=>setCartItems(items=>items.map(item=>item.product.id===productId?{...item,quantity:item.quantity+delta}:item).filter(item=>item.quantity>0))

 const submitAuth=async(e:FormEvent)=>{
  e.preventDefault()
  if(!supabase){setAuthMessage(isArabic?'الاتصال بقاعدة البيانات غير جاهز.':'Store connection is not configured.');return}
  setAuthBusy(true);setAuthMessage('')
  try{
   if(authMode==='signup'){
    const {data,error}=await supabase.auth.signUp({email:authEmail.trim(),password:authPassword,options:{data:{first_name:authName.trim()}}})
    if(error)throw error
    if(data.user && data.session){
     await supabase.from('profiles').upsert({id:data.user.id,first_name:authName.trim()},{onConflict:'id'})
     setAuthMessage(isArabic?'تم إنشاء الحساب بنجاح.':'Your account has been created.')
     setAuthOpen(false)
    }else setAuthMessage(isArabic?'راجعي بريدك الإلكتروني لتأكيد الحساب.':'Check your email to confirm your account.')
   }else{
    const {error}=await supabase.auth.signInWithPassword({email:authEmail.trim(),password:authPassword})
    if(error)throw error
    setAuthOpen(false);setAuthPassword('');setAuthMessage('')
   }
  }catch(err){setAuthMessage(err instanceof Error?err.message:(isArabic?'حصل خطأ، حاولي مرة تانية.':'Something went wrong. Please try again.'))}
  finally{setAuthBusy(false)}
 }
 const signOut=async()=>{if(supabase)await supabase.auth.signOut();setIsAdmin(false);setAuthOpen(false)}
 const reviewCheckout=(e:FormEvent)=>{e.preventDefault();setCheckoutMessage(isArabic?'بيانات التوصيل مكتملة. تأكيد الطلب والدفع هيتفعّلوا بعد ربط إجراء آمن لإنشاء الطلب والتحقق من الأسعار والمخزون.':'Delivery details are complete. Order placement will be enabled after secure server-side order creation and price/stock validation are connected.')}

 return <div className="site-shell">
  <div className="topbar"><div className="socials"><a aria-label="TikTok"><Music2/></a><a aria-label="WhatsApp"><MessageCircle/></a><a aria-label="Instagram"><Instagram/></a><a aria-label="Facebook"><Facebook/></a></div><div className="top-love">♥ Made with Love · Just for You ♥</div><div className="top-links"><a href="#track"><Truck size={15}/>{t.track}</a><a href="#account" onClick={e=>{e.preventDefault();setAuthOpen(true)}}><UserRound size={15}/>{session?.user?.email||t.login}</a></div></div>
  <header className="main-header"><button className="icon-btn mobile-menu" onClick={()=>setMenuOpen(true)} aria-label="Open menu"><Menu/></button><button className="cart-btn" onClick={()=>setCartOpen(true)} aria-label="Shopping bag"><ShoppingBag/><b>{cartCount}</b></button><div className="search-box"><Search size={18}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder={t.search}/></div><a className="brand" href="#"><span className="brand-mark">🎁</span><span><strong>M&A Gifts</strong><small>Made with Love, Just for You ♡</small></span></a><nav className="desktop-nav"><a className="active" href="#home">{t.home}</a><a href="#products">{t.products}<ChevronDown/></a><a href="#categories">{t.occasions}<ChevronDown/></a><a href="#about">{t.about}</a><a href="#contact">{t.contact}</a></nav><select aria-label="Language" className="language" value={locale} onChange={e=>setLocale(e.target.value)}>{localeNames.map(([v,n])=><option key={v} value={v}>{n}</option>)}</select></header>
  {menuOpen&&<div className="drawer-backdrop" onClick={()=>setMenuOpen(false)}><aside className="drawer" onClick={e=>e.stopPropagation()}><button className="icon-btn close" onClick={()=>setMenuOpen(false)}><X/></button><div className="drawer-brand">M&A Gifts<small>Made with Love, Just for You</small></div>{[t.home,t.products,t.occasions,t.about,t.contact,t.track,t.login].map((v,i)=><a key={v} href={['#home','#products','#categories','#about','#contact','#track','#account'][i]} onClick={e=>{setMenuOpen(false);if(i===6){e.preventDefault();setAuthOpen(true)}}}>{v}</a>)}</aside></div>}
  <main id="home">
   <section className="hero"><div className="hero-flower">✿</div><div className="hero-copy"><span className="eyebrow">M&A GIFTS · A LITTLE BOX OF HAPPINESS</span><h1>{t.hero}</h1><p>{t.sub}</p><a className="gold-btn" href="#products">{t.shop}<span>←</span></a><div className="hero-caption">M&A Gifts <i>—</i> Made with Love, Just for You</div></div><div className="gift-scene"><div className="gift gift-large"><span></span></div><div className="gift gift-small"><span></span></div><div className="gift gift-cream"><span></span></div><div className="ribbon-loop"></div></div><div className="hero-dots"><i className="selected"/><i/><i/><i/></div></section>
   <section className="category-section" id="categories"><div className="section-heading"><span></span><h2>♡ {t.categories} ♡</h2><span></span></div><div className="category-row">{categories.map((c,i)=><a className="category-card" href="#products" key={c.id}>{c.image_url?<img src={c.image_url} alt=""/>:<div className={'category-art art-'+i}><Gift/></div>}<strong>{isArabic?c.name_ar:c.name_en}</strong></a>)}</div></section>
   <section className="products-section" id="products"><div className="section-heading"><span></span><h2>♡ {t.latest} ♡</h2><span></span></div>{filtered.length? <div className="product-grid">{filtered.map(p=><article className="product-card" key={p.id}><div className="product-image">{p.images?.[0]?<img src={p.images[0]} alt={isArabic?p.name_ar:p.name_en}/>:<div className="product-placeholder"><Gift/><small>M&A Gifts</small></div>}<button className="heart"><Heart/></button></div><h3>{isArabic?p.name_ar:p.name_en}</h3><p>{money(p.price,p.currency)}</p><button className="add-btn" onClick={()=>addToCart(p)}><ShoppingBag size={15}/> {isArabic?'أضيفي إلى السلة':'Add to bag'}</button></article>)}</div>:<div className="empty-state"><div className="empty-gift"><Gift/></div><h3>{search?(isArabic?'مفيش نتائج للبحث ده':'No matching gifts'):t.empty}</h3><p>{t.emptySub}</p></div>}</section>
   <section className="custom-banner"><div className="custom-icon"><Sparkles/></div><div><h2>{t.custom}</h2><p>{t.customSub}</p></div><a className="gold-btn" href="#contact">{t.start}</a></section>
   <section className="benefits"><div><Gift/><span>{t.benefit1}</span></div><div><ShieldCheck/><span>{t.benefit2}</span></div><div><Truck/><span>{t.benefit3}</span></div><div><Headphones/><span>{t.benefit4}</span></div></section>
  </main>
  <footer id="contact"><div className="footer-brand"><span className="brand-mark">🎁</span><strong>M&A Gifts</strong><small>Made with Love, Just for You ♡</small></div><p>{t.footer}</p><div className="footer-links"><a href="#about">{t.about}</a><a href="#contact">{t.contact}</a><a href="#track">{t.track}</a></div><small>© {new Date().getFullYear()} M&A Gifts. Founded & owned by Mirna Mamdouh.</small><small className="credit">Built with the assistance of ChatGPT and OpenAI tools.</small><span className="db-indicator">{dbStatus==='connected'?'● Live store data':dbStatus==='loading'?'Connecting…':'Preview mode'}</span></footer>
  {cartOpen&&<div className="drawer-backdrop cart-backdrop" onClick={()=>setCartOpen(false)}><aside className="cart-panel" onClick={e=>e.stopPropagation()}>
   <div className="cart-heading"><h2>{isArabic?'سلة مشترياتك':'Your shopping bag'} ({cartCount})</h2><button className="icon-btn" onClick={()=>setCartOpen(false)} aria-label="Close"><X/></button></div>
   {cartItems.length===0?<div className="cart-empty"><ShoppingBag/><p>{isArabic?'السلة لسه فاضية':'Your bag is empty'}</p></div>:<>
    <div className="cart-lines">{cartItems.map(item=><article className="cart-line" key={item.product.id}>
     {item.product.images?.[0]?<img src={item.product.images[0]} alt=""/>:<div className="cart-thumb"><Gift/></div>}
     <div className="cart-line-info"><strong>{isArabic?item.product.name_ar:item.product.name_en}</strong><span>{money(item.product.price,item.product.currency)}</span>
      <div className="quantity-control"><button onClick={()=>changeCartQuantity(item.product.id,-1)} aria-label="Decrease quantity">−</button><b>{item.quantity}</b><button onClick={()=>changeCartQuantity(item.product.id,1)} aria-label="Increase quantity">+</button></div>
     </div>
     <button className="remove-line" onClick={()=>setCartItems(items=>items.filter(x=>x.product.id!==item.product.id))}>{isArabic?'حذف':'Remove'}</button>
    </article>)}</div>
    <p className="cart-note">{isArabic?'راجعي المنتجات والكميات قبل الانتقال لإتمام الطلب.':'Review your items and quantities before checkout.'}</p>
    <button className="add-btn cart-checkout" onClick={()=>{setCartOpen(false);if(!session){setAuthOpen(true)}else{setCheckoutMessage('');setCheckoutOpen(true)}}}>{isArabic?'متابعة لإتمام الطلب':'Continue to checkout'}</button>
   </>}
  </aside></div>}
  {checkoutOpen&&<div className="drawer-backdrop checkout-backdrop" onClick={()=>setCheckoutOpen(false)}><section className="checkout-panel" role="dialog" aria-modal="true" aria-label={isArabic?'إتمام الطلب':'Checkout'} onClick={e=>e.stopPropagation()}>
   <div className="cart-heading"><h2>{isArabic?'بيانات التوصيل والدفع':'Delivery & payment'}</h2><button className="icon-btn" onClick={()=>setCheckoutOpen(false)} aria-label="Close"><X/></button></div>
   <div className="checkout-summary"><strong>{isArabic?'ملخص السلة':'Order summary'}</strong>{cartItems.map(item=><div key={item.product.id}><span>{isArabic?item.product.name_ar:item.product.name_en} × {item.quantity}</span><b>{money(item.product.price*item.quantity,item.product.currency)}</b></div>)}<div className="checkout-total"><strong>{isArabic?'الإجمالي المبدئي':'Estimated subtotal'}</strong><strong>{money(cartItems.reduce((sum,item)=>sum+item.product.price*item.quantity,0),cartItems[0]?.product.currency||currency)}</strong></div></div>
   <form className="checkout-form" onSubmit={reviewCheckout}>
    <label>{isArabic?'اسم المستلم':'Recipient name'}<input required value={shipping.name} onChange={e=>setShipping({...shipping,name:e.target.value})} autoComplete="name"/></label>
    <label>{isArabic?'رقم الهاتف':'Phone number'}<input required type="tel" value={shipping.phone} onChange={e=>setShipping({...shipping,phone:e.target.value})} autoComplete="tel"/></label>
    <div className="checkout-two"><label>{isArabic?'الدولة':'Country'}<input required value={shipping.country} onChange={e=>setShipping({...shipping,country:e.target.value})} autoComplete="country-name"/></label><label>{isArabic?'المدينة':'City'}<input required value={shipping.city} onChange={e=>setShipping({...shipping,city:e.target.value})} autoComplete="address-level2"/></label></div>
    <label>{isArabic?'العنوان بالتفصيل':'Full address'}<textarea required rows={3} value={shipping.address} onChange={e=>setShipping({...shipping,address:e.target.value})} autoComplete="street-address"/></label>
    <label>{isArabic?'ملاحظات على الطلب (اختياري)':'Order notes (optional)'}<textarea rows={2} value={shipping.notes} onChange={e=>setShipping({...shipping,notes:e.target.value})}/></label>
    <label>{isArabic?'طريقة الدفع':'Payment method'}<select value={shipping.payment} onChange={e=>setShipping({...shipping,payment:e.target.value})}><option value="cash_on_delivery">{isArabic?'الدفع عند الاستلام':'Cash on delivery'}</option><option value="bank_transfer">{isArabic?'تحويل بنكي / محفظة':'Bank or wallet transfer'}</option></select></label>
    {checkoutMessage&&<p className="checkout-notice" role="status">{checkoutMessage}</p>}
    <button className="add-btn auth-submit" type="submit">{isArabic?'مراجعة بيانات الطلب':'Review delivery details'}</button>
    <p className="checkout-footnote">{isArabic?'لسه مش هنخصم أي مبلغ أو ننشئ طلب قبل اكتمال الربط الآمن.':'No payment will be taken and no order will be created until secure checkout is fully connected.'}</p>
   </form>
  </section></div>}
  {authOpen&&<div className="drawer-backdrop auth-backdrop" role="presentation" onClick={()=>setAuthOpen(false)}><section className="auth-modal" role="dialog" aria-modal="true" aria-label={isArabic?'حساب العميل':'Customer account'} onClick={e=>e.stopPropagation()}>
   <button className="icon-btn close" onClick={()=>setAuthOpen(false)} aria-label="Close"><X/></button>
   <h2>{authMode==='signin'?(isArabic?'تسجيل الدخول':'Sign in'):(isArabic?'إنشاء حساب جديد':'Create account')}</h2>
   <p>{isArabic?'أهلاً بيكي في M&A Gifts':'Welcome to M&A Gifts'}</p>
   <form onSubmit={submitAuth}>
    {authMode==='signup'&&<label>{isArabic?'الاسم':'Name'}<input required value={authName} onChange={e=>setAuthName(e.target.value)} autoComplete="name"/></label>}
    <label>{isArabic?'البريد الإلكتروني':'Email'}<input required type="email" value={authEmail} onChange={e=>setAuthEmail(e.target.value)} autoComplete="email"/></label>
    <label>{isArabic?'كلمة المرور':'Password'}<input required minLength={6} type="password" value={authPassword} onChange={e=>setAuthPassword(e.target.value)} autoComplete={authMode==='signin'?'current-password':'new-password'}/></label>
    {authMessage&&<p className="auth-message" role="status">{authMessage}</p>}
    <button className="add-btn auth-submit" disabled={authBusy}>{authBusy?(isArabic?'جاري التنفيذ…':'Please wait…'):(authMode==='signin'?(isArabic?'دخول':'Sign in'):(isArabic?'إنشاء الحساب':'Create account'))}</button>
   </form>
   <button className="auth-switch" onClick={()=>{setAuthMode(authMode==='signin'?'signup':'signin');setAuthMessage('')}}>{authMode==='signin'?(isArabic?'مفيش حساب؟ أنشئي حساب جديد':'New here? Create an account'):(isArabic?'عندك حساب؟ سجلي الدخول':'Already registered? Sign in')}</button>
  </section></div>}
  {session?.user&&<div className="account-chip"><span>{session.user.email}</span>{isAdmin&&<span>{isArabic?'صلاحية المالكة مؤكدة':'Owner access verified'}</span>}<button onClick={signOut}>{isArabic?'تسجيل الخروج':'Sign out'}</button></div>}
  <a className="support-float" href="#contact" aria-label="Customer support"><Headphones/></a>
 </div>
}
export default App