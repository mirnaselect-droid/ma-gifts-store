import { useState } from 'react'
import { LayoutDashboard, Package, ShoppingCart, Users, ChartNoAxesCombined, Warehouse, CreditCard, Percent, Megaphone, Star, MessageSquare, Settings, Palette, Menu, X, Search, Bell, ChevronDown, ArrowUpRight, Gift, Truck, ShieldCheck, CircleHelp } from 'lucide-react'

type Props={onClose:()=>void;email?:string}
const items=[
 ['dashboard','لوحة المعلومات',LayoutDashboard],['products','المنتجات',Package],['orders','الطلبات',ShoppingCart],['customers','العملاء',Users],['analytics','التحليلات',ChartNoAxesCombined],['inventory','المخزون',Warehouse],['payments','المدفوعات',CreditCard],['marketing','التسويق والعروض',Megaphone],['reviews','التقييمات',Star],['messages','الرسائل والدعم',MessageSquare],['appearance','المظهر والهوية',Palette],['settings','إعدادات المتجر',Settings]
] as const
export default function AdminDashboard({onClose,email}:Props){
 const [active,setActive]=useState<string>('dashboard')
 const [mobileNav,setMobileNav]=useState(false)
 const [period,setPeriod]=useState('الشهر')
 const current=items.find(x=>x[0]===active)??items[0]
 const Icon=current[2]
 const titles:Record<string,string>={dashboard:'نظرة عامة على متجرك',products:'إدارة المنتجات',orders:'إدارة الطلبات',customers:'إدارة العملاء',analytics:'تحليلات المبيعات',inventory:'إدارة المخزون',payments:'المدفوعات والمعاملات',marketing:'التسويق والعروض',reviews:'تقييمات العملاء',messages:'الرسائل وخدمة العملاء',appearance:'تخصيص شكل المتجر',settings:'إعدادات المتجر'}
 return <div className="ma-admin" dir="rtl">
  {mobileNav&&<button className="ma-admin-scrim" onClick={()=>setMobileNav(false)} aria-label="إغلاق القائمة"/>}
  <aside className={'ma-admin-side '+(mobileNav?'is-open':'')}>
   <div className="ma-admin-brand"><span className="ma-admin-logo"><Gift/></span><span><b>M&A Gifts</b><small>OWNER CONTROL CENTER</small></span><button className="ma-admin-mobile-close" onClick={()=>setMobileNav(false)}><X/></button></div>
   <div className="ma-admin-side-label">القائمة الرئيسية</div>
   <nav>{items.map(([id,label,ItemIcon])=><button key={id} className={active===id?'active':''} onClick={()=>{setActive(id);setMobileNav(false)}}><ItemIcon size={17}/><span>{label}</span>{id==='orders'&&<i> </i>}</button>)}</nav>
   <div className="ma-admin-side-bottom"><ShieldCheck/><span>وضع المالكة الآمن</span><small>الدخول مخصص لحساب الإدارة</small></div>
   <button className="ma-admin-exit" onClick={onClose}>العودة إلى المتجر ↩</button>
  </aside>
  <section className="ma-admin-main">
   <header className="ma-admin-top"><button className="ma-admin-menu" onClick={()=>setMobileNav(true)}><Menu/></button><div className="ma-admin-breadcrumb">M&A Gifts <span>/</span> {current[1]}</div><div className="ma-admin-top-actions"><button aria-label="الإشعارات"><Bell size={18}/></button><div className="ma-admin-user"><span className="ma-admin-avatar">م</span><span><b>المالكة</b><small>{email||'Owner account'}</small></span><ChevronDown size={15}/></div></div></header>
   <div className="ma-admin-content">
    <div className="ma-admin-welcome"><div><span className="ma-admin-kicker">M&A GIFTS · ADMINISTRATION</span><h1>{active==='dashboard'?'مرحبًا بك في إدارة متجرك':titles[active]}</h1><p>{active==='dashboard'?'كل تفاصيل متجرك في مكان واحد. تابع الأداء وأدر تجربة العملاء بسهولة.':'إدارة منظمة وواضحة تمنحك رؤية كاملة لتفاصيل المتجر.'}</p></div><div className="ma-admin-date">لوحة المالكة <ShieldCheck size={15}/></div></div>
    {active==='dashboard'?<>
     <div className="ma-admin-stats">
      {[['إجمالي المبيعات','يظهر بعد ربط بيانات الطلبات','sales'],['إجمالي الطلبات','يظهر بعد ربط بيانات الطلبات','orders'],['العملاء','يظهر بعد ربط حسابات العملاء','customers'],['المنتجات النشطة','يتم جلبها من قاعدة البيانات','products']].map(([label,value,key],i)=><article className={'ma-admin-stat stat-'+i} key={key}><span>{label}</span><b>—</b><small>{value}</small><i>{[<CreditCard/>,<ShoppingCart/>,<Users/>,<Package/>][i]}</i></article>)}
     </div>
     <div className="ma-admin-grid">
      <article className="ma-admin-panel ma-admin-revenue"><div className="ma-admin-panel-head"><div><h2>تحليل الإيرادات</h2><p>ملخص أداء المتجر خلال الفترة المحددة</p></div><select value={period} onChange={e=>setPeriod(e.target.value)}><option>الأسبوع</option><option>الشهر</option><option>السنة</option></select></div><div className="ma-admin-empty-chart"><ChartNoAxesCombined/><b>تحليلات المبيعات هتظهر هنا</b><span>بمجرد ربط بيانات الطلبات المكتملة</span></div></article>
      <article className="ma-admin-panel ma-admin-shortcuts"><div className="ma-admin-panel-head"><div><h2>وصول سريع</h2><p>أهم المهام اليومية</p></div></div>{[['إضافة منتج جديد',Package,'products'],['مراجعة الطلبات',ShoppingCart,'orders'],['تعديل شكل المتجر',Palette,'appearance'],['إعدادات التوصيل والدفع',Truck,'settings']].map(([label,QuickIcon,id]:any)=><button className="ma-admin-shortcut" key={id} onClick={()=>setActive(id)}><QuickIcon size={18}/><span>{label}</span><ArrowUpRight size={15}/></button>)}</article>
     </div>
     <article className="ma-admin-panel ma-admin-recent"><div className="ma-admin-panel-head"><div><h2>أحدث الطلبات</h2><p>متابعة الطلبات الجديدة وحالاتها</p></div><button onClick={()=>setActive('orders')}>عرض كل الطلبات</button></div><div className="ma-admin-empty-table"><ShoppingCart/><span>لا توجد بيانات طلبات معروضة حاليًا</span><small>سيظهر سجل الطلبات هنا بعد توصيله بقاعدة البيانات.</small></div></article>
    </>:<article className="ma-admin-panel ma-admin-module"><div className="ma-admin-module-icon"><Icon size={26}/></div><h2>{titles[active]}</h2><p>{active==='appearance'?'تخصيص شعار المتجر والبانر والألوان والخطوط وترتيب أقسام الصفحة الرئيسية.':active==='products'?'إضافة المنتجات وتعديل الصور والأسعار والوصف والتصنيفات والمخزون.':active==='orders'?'عرض الطلبات وتحديث حالتها ومراجعة بيانات الشحن والدفع.':active==='settings'?'إدارة بيانات المتجر واللغات والعملات ومناطق التوصيل وطرق الدفع.':'سيتم تفعيل أدوات هذا القسم وربطها بقاعدة البيانات قبل اعتباره جاهزًا للاستخدام.'}</p><div className="ma-admin-module-note"><ShieldCheck size={18}/> واجهة الإدارة قيد التجهيز — لم يتم تفعيل حفظ التعديلات أو عمليات البيانات في هذا القسم بعد.</div></article>}
    <footer className="ma-admin-footer">M&A Gifts · لوحة تحكم المالكة <span>© {new Date().getFullYear()}</span></footer>
   </div>
  </section>
 </div>
}
