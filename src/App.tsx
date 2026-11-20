import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Search, ShoppingBag, UserRound, Truck, Heart, Headphones, Menu, X, ChevronDown, Instagram, Facebook, Music2, MessageCircle, Sparkles, Gift, ShieldCheck, PackageCheck, LogOut } from 'lucide-react'
import { isSupabaseConfigured, supabase } from './lib/supabase'
import AdminDashboard from './AdminDashboard'
import CustomerAccount from './CustomerAccount'

type Category = { id:string; slug:string; name_ar:string; name_en:string; image_url:string|null; parent_id?:string|null }
type Product = { id:string; category_id:string|null; slug:string; name_ar:string; name_en:string; description_ar:string|null; description_en:string|null; images:string[]; price:number; currency:string; is_featured:boolean }
const fallbackCategories:Category[] = [
 {id:'2',slug:'gifts-for-her',name_ar:'هدايا نسائية',name_en:'Gifts for Her',image_url:null},
 {id:'3',slug:'gifts-for-him',name_ar:'هدايا رجالية',name_en:'Gifts for Him',image_url:null},
 {id:'5',slug:'create-your-gift',name_ar:'اختاري هديتك بذوقك',name_en:'Create Your Gift',image_url:null},
 {id:'6',slug:'original-products',name_ar:'منتجات Original',name_en:'Original Products',image_url:null,parent_id:'5'},
 {id:'7',slug:'mirror-products',name_ar:'منتجات Mirror',name_en:'Mirror Products',image_url:null,parent_id:'5'},
 {id:'8',slug:'high-copy-products',name_ar:'منتجات High Copy',name_en:'High-Copy Products',image_url:null,parent_id:'5'},
 {id:'9',slug:'copy-products',name_ar:'منتجات Copy',name_en:'Copy Products',image_url:null,parent_id:'5'},
 {id:'10',slug:'local-brands',name_ar:'منتجات Local Brands',name_en:'Local Brands',image_url:null,parent_id:'5'},
 {id:'11',slug:'accessories',name_ar:'الإكسسوارات',name_en:'Accessories',image_url:null,parent_id:'5'},
 {id:'12',slug:'stainless-steel-accessories',name_ar:'إكسسوارات ستانلس ستيل',name_en:'Stainless Steel Accessories',image_url:null,parent_id:'5'},
 {id:'13',slug:'fashion-clothing',name_ar:'الأزياء والملابس',name_en:'Fashion & Clothing',image_url:null,parent_id:'5'},
 {id:'14',slug:'fashion-original-brands',name_ar:'براندات أصلية',name_en:'Original Brands',image_url:null,parent_id:'13'},
 {id:'15',slug:'fashion-mirror',name_ar:'Mirror',name_en:'Mirror',image_url:null,parent_id:'13'},
 {id:'16',slug:'fashion-high-copy',name_ar:'High Copy',name_en:'High Copy',image_url:null,parent_id:'13'},
 {id:'17',slug:'fashion-copy',name_ar:'Copy',name_en:'Copy',image_url:null,parent_id:'13'},
 {id:'18',slug:'fashion-local-brands',name_ar:'Local Brands',name_en:'Local Brands',image_url:null,parent_id:'13'},
]
const localeNames:[string,string][]=[['ar-EG','العربية'],['en','English'],['ar-SA','السعودية'],['ar-AE','الإمارات'],['ar-KW','الكويت'],['tr','Türkçe'],['zh-CN','中文'],['ko','한국어'],['fr','Français'],['de','Deutsch'],['es','Español']]
const copy = {
'ar-EG':{home:'الرئيسية',products:'المنتجات',occasions:'المناسبات',about:'من نحن',contact:'تواصل معنا',login:'تسجيل الدخول',track:'تتبع طلبك',search:'ابحث عن الهدية المناسبة...',hero:'كل هدية… حكاية حب',sub:'هدايا مختارة بعناية، وتفاصيل تصنع لحظات لا تُنسى.',shop:'تسوّق الآن',categories:'تصفّح حسب الفئة',latest:'هدايا مميزة للجميع',empty:'قريبًا هنعرض أجمل الهدايا هنا',emptySub:'بنجهّز تشكيلتنا بعناية علشان كل هدية تبقى حكاية.',benefit1:'تغليف فاخر',benefit2:'دفع آمن وموثوق',benefit3:'توصيل حسب منطقتك',benefit4:'دعم ومساعدة',custom:'هدية بتصميمك الخاص',customSub:'نسّق المنتجات والألوان والتفاصيل المناسبة لتصميم هدية تناسب ذوقك ومناسبتك.',start:'ابدأ تصميم هديتك',footer:'صُنعت بحب، خصيصًا لك',all:'كل الهدايا'},
'en':{home:'Home',products:'Shop',occasions:'Occasions',about:'Our Story',contact:'Contact',login:'Sign in',track:'Track order',search:'Find your perfect gift...',hero:'Every gift tells a story of love',sub:'Thoughtfully chosen gifts, made personal just for them.',shop:'Shop now',categories:'Shop by category',latest:'Gifts for every style',empty:'Beautiful gifts are coming soon',emptySub:'We are carefully preparing our first collection.',benefit1:'Premium wrapping',benefit2:'Secure checkout',benefit3:'Regional delivery',benefit4:'Friendly support',custom:'A gift made your way',customSub:'Choose the products, colors and little details to create a gift that feels personal.',start:'Create your gift',footer:'Made with love, just for you',all:'All gifts'}
} as const
function App(){
 const isOwnerRoute=window.location.pathname.replace(/\/+$/,'')==='/owner'
 const isWalletRoute=window.location.pathname.replace(/\/+$/,'')==='/wallets'
 const [locale,setLocale]=useState('ar-EG')
 const [categories,setCategories]=useState<Category[]>(fallbackCategories)
 const [products,setProducts]=useState<Product[]>([])
 const [storeConfig,setStoreConfig]=useState<any>({})
 const [cartItems,setCartItems]=useState<{product:Product;quantity:number}[]>([])
 const [cartOpen,setCartOpen]=useState(false)
 const [checkoutOpen,setCheckoutOpen]=useState(false)
 const [checkoutMessage,setCheckoutMessage]=useState('')
 const [shipping,setShipping]=useState({name:'',phone:'',country:'مصر',city:'',address:'',notes:'',payment:'cash_on_delivery'})
 const [menuOpen,setMenuOpen]=useState(false)
 const [search,setSearch]=useState('')
 const [selectedCategoryId,setSelectedCategoryId]=useState<string|null>(null)
 const [currentPath,setCurrentPath]=useState(window.location.pathname)
 const [showSearch,setShowSearch]=useState(false)
 const [dbStatus,setDbStatus]=useState<'loading'|'connected'|'offline'>('loading')
 const [session,setSession]=useState<any>(null)
 const [isAdmin,setIsAdmin]=useState(false)
 const [adminCheckDone,setAdminCheckDone]=useState(false)
 const [ownerAccessMessage,setOwnerAccessMessage]=useState('')
 const [adminOpen,setAdminOpen]=useState(false)
 const [accountOpen,setAccountOpen]=useState(false)
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
  if(!supabase||!session?.user){setIsAdmin(false);setAdminCheckDone(true);return}
  setAdminCheckDone(false)
  supabase.from('store_admins').select('user_id').eq('user_id',session.user.id).maybeSingle()
   .then(({data,error})=>{if(alive){setIsAdmin(!error&&!!data);setAdminCheckDone(true)}})
  return()=>{alive=false}
 },[session])
 useEffect(()=>{
  if(!isOwnerRoute)return
  if(!session?.user){setAdminOpen(false);setAuthOpen(true);return}
  if(!adminCheckDone)return
  if(isAdmin){setOwnerAccessMessage('');setAuthOpen(false);setAdminOpen(true)}
  else{setAdminOpen(false);setAuthOpen(false);setOwnerAccessMessage('الحساب الحالي غير مسجل كحساب مالكة. سجّلي الدخول بالحساب المصرح له بإدارة المتجر.')}
 },[isOwnerRoute,session,isAdmin,adminCheckDone])
 useEffect(()=>{let alive=true;(async()=>{if(!supabase){setDbStatus('offline');return}const [c,p]=await Promise.all([supabase.from('categories').select('id,slug,name_ar,name_en,image_url,parent_id').eq('is_active',true).order('sort_order'),supabase.from('products').select('id,category_id,slug,name_ar,name_en,description_ar,description_en,images,price,currency,is_featured').eq('is_active',true).order('sort_order')]);if(!alive)return;if(!c.error&&c.data?.length)setCategories(c.data);if(!p.error)setProducts(p.data??[]);setDbStatus(c.error||p.error?'offline':'connected')})();return()=>{alive=false}},[])
 useEffect(()=>{if(!supabase)return;let alive=true;supabase.from('store_settings').select('value').eq('key','storefront').maybeSingle().then(({data})=>{if(alive&&data?.value)setStoreConfig(data.value)});return()=>{alive=false}},[])
 const filtered=useMemo(()=>products.filter(p=>(!selectedCategoryId||p.category_id===selectedCategoryId)&&(p.name_ar+' '+p.name_en).toLowerCase().includes(search.toLowerCase())),[products,search,selectedCategoryId])
 const navigate=(path:string)=>{if(path!==window.location.pathname){window.history.pushState({},'',path);setCurrentPath(path)}setMenuOpen(false);window.scrollTo({top:0,behavior:'smooth'})}
 useEffect(()=>{const onPop=()=>setCurrentPath(window.location.pathname);window.addEventListener('popstate',onPop);return()=>window.removeEventListener('popstate',onPop)},[])
 const routeSlug=decodeURIComponent(currentPath.split('/').filter(Boolean).pop()||'')
 const routeCategory=categories.find(c=>c.slug===routeSlug && currentPath.startsWith('/category/'))||null
 const routeProduct=products.find(p=>p.slug===routeSlug && currentPath.startsWith('/product/'))||null
 const routeCategoryIds=routeCategory?[routeCategory.id,...categories.filter(c=>c.parent_id===routeCategory.id).map(c=>c.id),...categories.filter(c=>categories.some(p=>p.parent_id===routeCategory.id&&p.id===c.parent_id)).map(c=>c.id)]:[]
 const routeProducts=routeCategory?products.filter(p=>routeCategoryIds.includes(p.category_id||'')):products
 const isHomeRoute=currentPath==='/'||currentPath==='/index.html'
 const isShopRoute=currentPath==='/shop'||currentPath==='/occasions'
 const routePageTitle=currentPath==='/about'?(isArabic?'من نحن':'Our Story'):currentPath==='/contact'?(isArabic?'تواصلي معنا':'Contact Us'):currentPath==='/track'?(isArabic?'تتبّع طلبك':'Track Your Order'):currentPath==='/custom-gift'?(isArabic?'صممي هديتك':'Create Your Gift'):(isArabic?'المنتجات':'Shop')
 const categoryLabel=(name:string)=>name.replace(/بوكسات|بوكس/gi,'هدايا').replace(/Gift Boxes|Gift Box/gi,'Gifts').replace(/Boxes|Box/gi,'Gifts')
 const productLabel=(name:string)=>name.replace(/بوكسات|بوكس/gi,'هدية').replace(/Gift Boxes|Gift Box/gi,'Gift').replace(/Boxes|Box/gi,'Gift')
 const money=(n:number,c:string)=>new Intl.NumberFormat(locale,{style:'currency',currency:c||currency,maximumFractionDigits:0}).format(n)
 const cartCount=cartItems.reduce((sum,item)=>sum+item.quantity,0)
 const accountName=String(session?.user?.user_metadata?.first_name||session?.user?.user_metadata?.full_name||session?.user?.email?.split('@')[0]||'').trim()
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


 if(isWalletRoute)return <div className="wallets-page" dir={isArabic?'rtl':'ltr'}><header><a href="/">M&A Gifts 🎀</a><a href="/">الرئيسية</a></header><main><span className="wallets-kicker">M&A GIFTS · TRANSFER OPTIONS</span><h1>المحافظ الإلكترونية</h1><p>اختاري المحفظة المناسبة للتحويل، ثم استخدمي الرقم الموضح.</p>{Object.entries({orange_cash:storeConfig.wallets?.orange_cash||"01288089942",vodafone_cash:storeConfig.wallets?.vodafone_cash,etisalat_cash:storeConfig.wallets?.etisalat_cash,we_pay:storeConfig.wallets?.we_pay}).filter(([,number])=>!!number).map(([key,number])=><article className="wallet-card" key={key}><div className="wallet-icon">↗</div><div><small>{key.replace("_"," ").toUpperCase()}</small><h2>{{orange_cash:"Orange Cash",vodafone_cash:"Vodafone Cash",etisalat_cash:"Etisalat Cash",we_pay:"WE Pay"}[key]}</h2><p>رقم المحفظة الإلكترونية</p><strong>{number as string}</strong></div><a href={"tel:"+String(number).replace(/\s/g,"")}>اتصال</a></article>)}<p className="wallets-note">بعد التحويل، تواصلي معنا على واتساب وأرسلي بيانات الطلب وإثبات التحويل.</p><a className="wallets-whatsapp" href="https://wa.me/201288089942" target="_blank" rel="noreferrer">التواصل عبر واتساب</a></main><footer>M&A Gifts · Made with Love, Just for You ♡</footer></div>
 return <div className="site-shell" style={{backgroundColor:storeConfig.branding?.background_color||undefined,fontFamily:storeConfig.branding?.font_family||undefined,height:undefined,["--ma-primary" as any]:storeConfig.branding?.primary_color||"#5a3047",["--ma-secondary" as any]:storeConfig.branding?.secondary_color||"#4b263b",["--ma-accent" as any]:storeConfig.branding?.accent_color||"#d7b58a"} as any}>
  <div className="topbar"><div className="socials"><a href={storeConfig.social?.tiktok||"https://www.tiktok.com/@ma.gifts.made.wit?_r=1&_t=ZS-9BYHlN6uWpw"} target="_blank" rel="noreferrer" aria-label="TikTok"><Music2/></a><a href={"https://wa.me/"+String(storeConfig.contact?.whatsapp||"201288089942").replace(/\D/g,"")} target="_blank" rel="noreferrer" aria-label="WhatsApp"><MessageCircle/></a><a href={storeConfig.social?.instagram||"https://www.instagram.com/m_a_gifts_made_with_love?lqvp=OXpvOGpsMDhkamZm"} target="_blank" rel="noreferrer" aria-label="Instagram"><Instagram/></a><a href={storeConfig.social?.facebook||"https://www.facebook.com/share/1CPtxLhLxQ/"} target="_blank" rel="noreferrer" aria-label="Facebook"><Facebook/></a></div><div className="top-love">♥ Made with Love · Just for You ♥</div><div className="top-links"><a href="#track"><Truck size={15}/>{t.track}</a><a href="#account" onClick={e=>{e.preventDefault();setMenuOpen(true)}}><UserRound size={15}/>{session?.user?.email||t.login}</a></div></div>
  <header className="main-header" style={{...(storeConfig.branding?.header_image_url?{backgroundImage:"linear-gradient(#fffdf9dd,#fffdf9dd),url("+storeConfig.branding.header_image_url+")",backgroundSize:"cover",backgroundPosition:"center"}:{}),...(storeConfig.branding?.header_height?{height:storeConfig.branding.header_height+"px"}:{})}}><button className="icon-btn mobile-menu" onClick={()=>setMenuOpen(true)} aria-label="Open menu"><Menu/></button><button className="cart-btn" onClick={()=>setCartOpen(true)} aria-label="Shopping bag"><ShoppingBag/><b>{cartCount}</b></button><div className="search-box"><Search size={18}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder={t.search}/></div><a className="brand" href="#">{storeConfig.branding?.logo_url?<img className="store-logo-image" src={storeConfig.branding.logo_url} alt="M&A Gifts" style={{width:(storeConfig.branding.logo_width||118)+"px",height:(storeConfig.branding.logo_height||52)+"px",maxWidth:"none",maxHeight:"none",objectFit:"contain"}}/>:<span className="brand-mark">🎀</span>}<span><strong>{storeConfig.content?.store_name||"M&A Gifts"}</strong><small>{storeConfig.content?.tagline||"Made with Love, Just for You ♡"}</small></span></a><nav className="desktop-nav"><a className={isHomeRoute?'active':''} href="/" onClick={e=>{e.preventDefault();navigate('/')}}>{t.home}</a><a href="/shop" onClick={e=>{e.preventDefault();navigate('/shop')}}>{t.products}<ChevronDown/></a><a href="/occasions" onClick={e=>{e.preventDefault();navigate('/occasions')}}>{t.occasions}<ChevronDown/></a><a href="/about" onClick={e=>{e.preventDefault();navigate('/about')}}>{t.about}</a><a href="/contact" onClick={e=>{e.preventDefault();navigate('/contact')}}>{t.contact}</a></nav><select aria-label="Language" className="language" value={locale} onChange={e=>setLocale(e.target.value)}>{localeNames.map(([v,n])=><option key={v} value={v}>{n}</option>)}</select></header>
  {menuOpen&&<div className="drawer-backdrop" onClick={()=>setMenuOpen(false)}><aside className="drawer" onClick={e=>e.stopPropagation()}><div className="drawer-top"><div className="drawer-brand">M&A Gifts<small>Made with Love, Just for You ♡</small></div><button className="icon-btn close" onClick={()=>setMenuOpen(false)} aria-label="Close menu"><X/></button></div><section className="drawer-account">{session?.user?<><div className="drawer-avatar"><UserRound/></div><div className="drawer-account-copy"><strong>{accountName}</strong><small>{session.user.email}</small><span>{isAdmin?(isArabic?'حساب المالكة':'Owner account'):(isArabic?'حسابك':'Customer account')}</span></div><button className="drawer-account-link" onClick={()=>{setMenuOpen(false);setAccountOpen(true)}}>{isArabic?'حسابك':'Your account'} <span>›</span></button><button className="drawer-signout" onClick={signOut}><LogOut size={16}/>{isArabic?'تسجيل الخروج':'Sign out'}</button></>:<><div className="drawer-avatar"><UserRound/></div><div className="drawer-account-copy"><strong>{isArabic?'أهلاً بيكي في M&A Gifts':'Welcome to M&A Gifts'}</strong><small>{isArabic?'سجّلي الدخول لمتابعة حسابك وطلباتك':'Sign in to manage your account and orders'}</small></div><button className="drawer-signin" onClick={()=>{setMenuOpen(false);setAuthMode('signin');setAuthOpen(true)}}>{isArabic?'تسجيل الدخول':'Sign in'}</button></>}</section><nav className="drawer-links">{[t.home,t.products,t.occasions,t.about,t.contact,t.track].map((v,i)=><a key={v} href={['/','/shop','/occasions','/about','/contact','/track'][i]} onClick={e=>{e.preventDefault();navigate(['/','/shop','/occasions','/about','/contact','/track'][i])}}>{v}<span>‹</span></a>)}</nav><div className="drawer-footer">M&A Gifts <span>♡</span></div></aside></div>}
  <main id="home">
   {isHomeRoute ? <>

   <section className="hero" style={storeConfig.branding?.hero_image_url?{backgroundImage:"linear-gradient(90deg,#321525aa,#32152555),url("+storeConfig.branding.hero_image_url+")",backgroundSize:"cover",backgroundPosition:"center"}:{}}><div className="hero-flower">✿</div><div className="hero-copy"><span className="eyebrow">M&A GIFTS · A LITTLE GIFT OF HAPPINESS</span><h1>{(isArabic?storeConfig.content?.hero_title_ar:storeConfig.content?.hero_title_en)||t.hero}</h1><p>{(isArabic?storeConfig.content?.hero_subtitle_ar:storeConfig.content?.hero_subtitle_en)||t.sub}</p><a className="gold-btn" href="/shop" onClick={e=>{e.preventDefault();navigate("/shop")}}>{t.shop}<span>←</span></a><div className="hero-caption">M&A Gifts <i>—</i> Made with Love, Just for You</div></div><div className="gift-scene"><div className="gift gift-large"><span></span></div><div className="gift gift-small"><span></span></div><div className="gift gift-cream"><span></span></div><div className="ribbon-loop"></div></div><div className="hero-dots"><i className="selected"/><i/><i/><i/></div></section>
   <section className="category-section" id="categories"><div className="section-heading"><span></span><h2>♡ {t.categories} ♡</h2><span></span></div><div className="category-row">{categories.filter(c=>!c.parent_id).map((c,i)=><a className="category-card" href={'/category/'+c.slug} onClick={e=>{e.preventDefault();navigate('/category/'+c.slug)}} key={c.id}>{c.image_url?<img src={c.image_url} alt=""/>:<div className={'category-art art-'+i}><Gift/></div>}<strong>{categoryLabel(isArabic?c.name_ar:c.name_en)}</strong></a>)}</div>{categories.some(c=>c.parent_id)&&<div className="build-your-gift" id="build-your-gift"><div className="section-heading"><span></span><h2>{isArabic?'اختاري مكونات هديتك':'Choose Your Gift Style'}</h2><span></span></div><p>{isArabic?'اختاري الجودة التي تناسب ذوقك وميزانيتك، واجمعي هديتك بطريقتك':'Choose the quality that suits your style and budget'}</p><div className="category-row">{categories.filter(c=>c.parent_id===categories.find(p=>p.slug==='create-your-gift')?.id||c.parent_id==='5').map((c,i)=><a className="category-card" href={'/category/'+c.slug} onClick={e=>{e.preventDefault();navigate('/category/'+c.slug)}} key={c.id}><div className={'category-art art-'+(i+3)}><Gift/></div><strong>{categoryLabel(isArabic?c.name_ar:c.name_en)}</strong></a>)}</div></div>}</section>
   <section className="products-section" id="products"><div className="section-heading"><span></span><h2>♡ {t.latest} ♡</h2><span></span></div>{selectedCategoryId&&<button className="clear-category-filter" onClick={()=>setSelectedCategoryId(null)}>{isArabic?'عرض كل الهدايا':'Show all gifts'} ×</button>}{filtered.length? <div className="product-grid">{filtered.map(p=><article className="product-card" key={p.id}><a className="product-detail-link" href={'/product/'+p.slug} onClick={e=>{e.preventDefault();navigate('/product/'+p.slug)}}><div className="product-image">{p.images?.[0]?<img src={p.images[0]} alt={isArabic?p.name_ar:p.name_en}/>:<div className="product-placeholder"><Gift/><small>M&A Gifts</small></div>}<button className="heart" onClick={e=>e.stopPropagation()}><Heart/></button></div><h3>{productLabel(isArabic?p.name_ar:p.name_en)}</h3></a><p>{money(p.price,p.currency)}</p><a className="product-detail-cta" href={'/product/'+p.slug} onClick={e=>{e.preventDefault();navigate('/product/'+p.slug)}}>{isArabic?'عرض التفاصيل':'View details'}</a><button className="add-btn" onClick={()=>addToCart(p)}><ShoppingBag size={15}/> {isArabic?'أضف إلى السلة':'Add to bag'}</button></article>)}</div>:<div className="empty-state"><div className="empty-gift"><Gift/></div><h3>{search?(isArabic?'مفيش نتائج للبحث ده':'No matching gifts'):t.empty}</h3><p>{t.emptySub}</p></div>}</section>
   <section className="custom-banner"><div className="custom-icon"><Sparkles/></div><div><h2>{t.custom}</h2><p>{t.customSub}</p></div><a className="gold-btn" href="/custom-gift" onClick={e=>{e.preventDefault();navigate("/custom-gift")}}>{t.start}</a></section>
   <section className="benefits"><div><Gift/><span>{t.benefit1}</span></div><div><ShieldCheck/><span>{t.benefit2}</span></div><div><Truck/><span>{t.benefit3}</span></div><div><Headphones/><span>{t.benefit4}</span></div></section>
  
   </> : routeCategory ? <section className="route-page category-route">
    <div className="route-breadcrumb"><a href="/" onClick={e=>{e.preventDefault();navigate('/')}}>{t.home}</a> / {categoryLabel(isArabic?routeCategory.name_ar:routeCategory.name_en)}</div>
    <div className="section-heading"><span></span><h1>{categoryLabel(isArabic?routeCategory.name_ar:routeCategory.name_en)}</h1><span></span></div>
    {categories.some(c=>c.parent_id===routeCategory.id)&&<div className="category-row route-subcategories">{categories.filter(c=>c.parent_id===routeCategory.id).map((c,i)=><a className="category-card" href={'/category/'+c.slug} onClick={e=>{e.preventDefault();navigate('/category/'+c.slug)}} key={c.id}>{c.image_url?<img src={c.image_url} alt=""/>:<div className={'category-art art-'+i}><Gift/></div>}<strong>{categoryLabel(isArabic?c.name_ar:c.name_en)}</strong></a>)}</div>}
    {routeProducts.length?<div className="product-grid">{routeProducts.map(p=><article className="product-card" key={p.id}><a className="product-detail-link" href={'/product/'+p.slug} onClick={e=>{e.preventDefault();navigate('/product/'+p.slug)}}><div className="product-image">{p.images?.[0]?<img src={p.images[0]} alt={isArabic?p.name_ar:p.name_en}/>:<div className="product-placeholder"><Gift/><small>M&A Gifts</small></div>}</div><h3>{productLabel(isArabic?p.name_ar:p.name_en)}</h3></a><p>{money(p.price,p.currency)}</p><button className="add-btn" onClick={()=>addToCart(p)}><ShoppingBag size={15}/> {isArabic?'أضف إلى السلة':'Add to bag'}</button></article>)}</div>:<div className="empty-state"><div className="empty-gift"><Gift/></div><h3>{t.empty}</h3><p>{t.emptySub}</p></div>}
   </section> : routeProduct ? <section className="route-page product-detail-page">
    <div className="route-breadcrumb"><a href="/" onClick={e=>{e.preventDefault();navigate('/')}}>{t.home}</a> / <a href="/shop" onClick={e=>{e.preventDefault();navigate('/shop')}}>{t.products}</a> / {productLabel(isArabic?routeProduct.name_ar:routeProduct.name_en)}</div>
    <div className="product-detail-layout"><div className="product-detail-image">{routeProduct.images?.[0]?<img src={routeProduct.images[0]} alt={isArabic?routeProduct.name_ar:routeProduct.name_en}/>:<div className="product-placeholder"><Gift/><small>M&A Gifts</small></div>}</div><div className="product-detail-info"><span className="eyebrow">M&A GIFTS</span><h1>{productLabel(isArabic?routeProduct.name_ar:routeProduct.name_en)}</h1><strong className="product-detail-price">{money(routeProduct.price,routeProduct.currency)}</strong><p>{(isArabic?routeProduct.description_ar:routeProduct.description_en)|| (isArabic?'هدية مختارة بعناية من M&A Gifts.':'A thoughtful gift, carefully selected by M&A Gifts.')}</p><button className="add-btn" onClick={()=>addToCart(routeProduct)}><ShoppingBag size={16}/>{isArabic?'أضف إلى السلة':'Add to bag'}</button><button className="text-back-link" onClick={()=>navigate('/shop')}>{isArabic?'العودة للتسوق':'Back to shopping'}</button></div></div>
   </section> : isShopRoute ? <section className="route-page"><div className="route-breadcrumb"><a href="/" onClick={e=>{e.preventDefault();navigate('/')}}>{t.home}</a> / {t.products}</div><div className="section-heading"><span></span><h1>{currentPath==='/occasions'?t.occasions:t.products}</h1><span></span></div><div className="category-row route-subcategories">{categories.filter(c=>!c.parent_id).map((c,i)=><a className="category-card" href={'/category/'+c.slug} onClick={e=>{e.preventDefault();navigate('/category/'+c.slug)}} key={c.id}>{c.image_url?<img src={c.image_url} alt=""/>:<div className={'category-art art-'+i}><Gift/></div>}<strong>{categoryLabel(isArabic?c.name_ar:c.name_en)}</strong></a>)}</div><div className="product-grid">{products.map(p=><article className="product-card" key={p.id}><a className="product-detail-link" href={'/product/'+p.slug} onClick={e=>{e.preventDefault();navigate('/product/'+p.slug)}}><div className="product-image">{p.images?.[0]?<img src={p.images[0]} alt=""/>:<div className="product-placeholder"><Gift/></div>}</div><h3>{productLabel(isArabic?p.name_ar:p.name_en)}</h3></a><p>{money(p.price,p.currency)}</p><button className="add-btn" onClick={()=>addToCart(p)}>{isArabic?'أضف إلى السلة':'Add to bag'}</button></article>)}</div></section> : <section className="route-page simple-route-page"><div className="route-breadcrumb"><a href="/" onClick={e=>{e.preventDefault();navigate('/')}}>{t.home}</a> / {routePageTitle}</div><div className="section-heading"><span></span><h1>{routePageTitle}</h1><span></span></div>{currentPath==='/about'?<p>{isArabic?'M&A Gifts متجر هدايا ومنتجات تجميل وعناية بالبشرة وعطور وإكسسوارات وهدايا شخصية. بنختار التفاصيل بعناية علشان كل هدية تناسب ذوقك ومناسبتك وميزانيتك.':'M&A Gifts brings together thoughtful gifts, beauty and skincare, fragrances, accessories and personalized gift boxes for every style and occasion.'}</p>:currentPath==='/contact'?<div className="route-contact-links"><a href={'https://wa.me/'+String(storeConfig.contact?.whatsapp||'201288089942').replace(/\D/g,'')} target="_blank" rel="noreferrer"><MessageCircle/> واتساب · {storeConfig.contact?.whatsapp||'01288089942'}</a><a href={storeConfig.social?.facebook||'https://www.facebook.com/share/1CPtxLhLxQ/'} target="_blank" rel="noreferrer"><Facebook/> Facebook</a><a href={storeConfig.social?.instagram||'https://www.instagram.com/m_a_gifts_made_with_love?lqvp=OXpvOGpsMDhkamZm'} target="_blank" rel="noreferrer"><Instagram/> Instagram</a><a href={storeConfig.social?.tiktok||'https://www.tiktok.com/@ma.gifts.made.wit?_r=1&_t=ZS-9BYHlN6uWpw'} target="_blank" rel="noreferrer"><Music2/> TikTok</a></div>:currentPath==='/track'?<p>{isArabic?'أدخلي رقم الطلب لمتابعة حالته. سيتم تفعيل الاستعلام المباشر عند ربط خدمة تتبّع الطلبات.':'Enter your order number to track its status. Live tracking will be available once the order tracking service is connected.'}</p>:<p>{isArabic?'اختاري المنتجات والتفاصيل المناسبة لهديتك.':'Choose the products and details for your gift.'}</p>}<button className="text-back-link" onClick={()=>navigate('/')} >{isArabic?'العودة للرئيسية':'Back to home'}</button></section>}
  </main>
  <footer id="contact" style={{...(storeConfig.branding?.footer_image_url?{backgroundImage:"linear-gradient(#3c2034dd,#3c2034dd),url("+storeConfig.branding.footer_image_url+")",backgroundSize:"cover",backgroundPosition:"center"}:{}),...(storeConfig.branding?.footer_height?{minHeight:storeConfig.branding.footer_height+"px"}:{})}}><div className="footer-brand"><span className="brand-mark">🎀</span><strong>M&A Gifts</strong><small>Made with Love, Just for You ♡</small></div><p>{t.footer}</p><div className="footer-links"><a href="/about" onClick={e=>{e.preventDefault();navigate("/about")}}>{t.about}</a><a href="/contact" onClick={e=>{e.preventDefault();navigate("/contact")}}>{t.contact}</a><a href="/track" onClick={e=>{e.preventDefault();navigate("/track")}}>{t.track}</a></div><section className="contact-payment"><h3>{isArabic?'تواصلي معانا':'Get in touch'}</h3><a href={"https://wa.me/"+String(storeConfig.contact?.whatsapp||"201288089942").replace(/\D/g,"")} target="_blank" rel="noreferrer"><MessageCircle size={17}/>{isArabic?'واتساب الطلبات والاستفسارات والشكاوى':'WhatsApp orders & support'} · {storeConfig.contact?.whatsapp||"01288089942"}</a><a className="wallets-link" href="/wallets">{isArabic?'المحافظ الإلكترونية':'E-wallets'}</a><a href={storeConfig.payments?.instapay_url||"https://ipn.eg/S/merna.mamdouh2696/instapay/1me6lo"} target="_blank" rel="noreferrer"><span className="instapay-mark">IP</span>{isArabic?'الدفع عبر InstaPay':'Pay with InstaPay'} · {storeConfig.payments?.instapay_handle||"merna.mamdouh2696@instapay"}</a><div className="contact-socials"><a href={storeConfig.social?.facebook||"https://www.facebook.com/share/1CPtxLhLxQ/"} target="_blank" rel="noreferrer"><Facebook/>Facebook</a><a href={storeConfig.social?.instagram||"https://www.instagram.com/m_a_gifts_made_with_love?lqvp=OXpvOGpsMDhkamZm"} target="_blank" rel="noreferrer"><Instagram/>Instagram</a><a href={storeConfig.social?.tiktok||"https://www.tiktok.com/@ma.gifts.made.wit?_r=1&_t=ZS-9BYHlN6uWpw"} target="_blank" rel="noreferrer"><Music2/>TikTok</a></div></section><small>© {new Date().getFullYear()} M&A Gifts. Founded & owned by Mirna Mamdouh.</small><span className="db-indicator">{dbStatus==='connected'?'● Live store data':dbStatus==='loading'?'Connecting…':'Preview mode'}</span></footer>
  {cartOpen&&<div className="drawer-backdrop cart-backdrop" onClick={()=>setCartOpen(false)}><aside className="cart-panel" onClick={e=>e.stopPropagation()}>
   <div className="cart-heading"><h2>{isArabic?'سلة المشتريات':'Your shopping bag'} ({cartCount})</h2><button className="icon-btn" onClick={()=>setCartOpen(false)} aria-label="Close"><X/></button></div>
   {cartItems.length===0?<div className="cart-empty"><ShoppingBag/><p>{isArabic?'السلة لسه فاضية':'Your bag is empty'}</p></div>:<>
    <div className="cart-lines">{cartItems.map(item=><article className="cart-line" key={item.product.id}>
     {item.product.images?.[0]?<img src={item.product.images[0]} alt=""/>:<div className="cart-thumb"><Gift/></div>}
     <div className="cart-line-info"><strong>{productLabel(isArabic?item.product.name_ar:item.product.name_en)}</strong><span>{money(item.product.price,item.product.currency)}</span>
      <div className="quantity-control"><button onClick={()=>changeCartQuantity(item.product.id,-1)} aria-label="Decrease quantity">−</button><b>{item.quantity}</b><button onClick={()=>changeCartQuantity(item.product.id,1)} aria-label="Increase quantity">+</button></div>
     </div>
     <button className="remove-line" onClick={()=>setCartItems(items=>items.filter(x=>x.product.id!==item.product.id))}>{isArabic?'حذف':'Remove'}</button>
    </article>)}</div>
    <p className="cart-note">{isArabic?'راجع المنتجات والكميات قبل الانتقال لإتمام الطلب.':'Review your items and quantities before checkout.'}</p>
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
    <label>{isArabic?'طريقة الدفع':'Payment method'}<select value={shipping.payment} onChange={e=>setShipping({...shipping,payment:e.target.value})}>{storeConfig.payments?.cash_on_delivery!==false&&<option value="cash_on_delivery">{isArabic?'الدفع عند الاستلام':'Cash on delivery'}</option>}{storeConfig.payments?.instapay_enabled!==false&&<option value="instapay">InstaPay</option>}<option value="wallets">{isArabic?'المحافظ الإلكترونية':'E-wallets'}</option>{storeConfig.payments?.bank_cards_enabled&&<option value="bank_cards">{isArabic?'البطاقات البنكية':'Bank cards'}</option>}</select></label>{shipping.payment==='instapay'&&<div className="payment-instructions"><strong>InstaPay</strong><a href={storeConfig.payments?.instapay_url||"https://ipn.eg/S/merna.mamdouh2696/instapay/1me6lo"} target="_blank" rel="noreferrer">{isArabic?'افتحي رابط الدفع عبر InstaPay':'Open InstaPay payment link'}</a></div>}{shipping.payment==='wallets'&&<div className="payment-instructions"><strong>{isArabic?'المحافظ الإلكترونية':'E-wallets'}</strong><a href="/wallets">{isArabic?'عرض أرقام المحافظ الإلكترونية':'View e-wallet numbers'}</a></div>}{shipping.payment==='bank_cards'&&<div className="payment-instructions"><strong>{isArabic?'الدفع بالبطاقات البنكية':'Bank card payment'}</strong><a href={storeConfig.payments?.card_payment_url||'#'}>{isArabic?'الانتقال إلى صفحة الدفع':'Continue to card payment'}</a></div>}
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
  
  {accountOpen&&session?.user&&<CustomerAccount user={session.user} onClose={()=>setAccountOpen(false)} onSignOut={()=>{setAccountOpen(false);signOut()}}/>}
  {isOwnerRoute&&ownerAccessMessage&&<div className="owner-access-message" role="alert"><h2>تعذر فتح لوحة المالكة</h2><p>{ownerAccessMessage}</p><a href="/">العودة إلى المتجر</a></div>}
  {adminOpen&&isAdmin&&<AdminDashboard email={session?.user?.email} onClose={()=>{setAdminOpen(false);if(isOwnerRoute)window.location.href='/'}}/>}
  <a className="support-float" href="/contact" onClick={e=>{e.preventDefault();navigate("/contact")}} aria-label="Customer support"><Headphones/></a>
 </div>
}
export default App