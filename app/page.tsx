'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, Archive, ArrowDownToLine, ArrowUpFromLine, BarChart3, Bell, Boxes, Check, ChevronRight, ClipboardList, Download, FileBarChart, Filter, Gauge, LayoutDashboard, Menu, MoreHorizontal, Package, PanelLeftClose, PanelLeftOpen, Plus, Search, Settings, ShoppingCart, Sparkles, Tag, Truck, Users, X, ScanLine, UserRound, Trash2, Pencil, Send, Database, RefreshCw } from 'lucide-react'
import { api } from '@/lib/api'

type Product = { id:string; name:string; sku:string; category:string; stock:number; min:number; price:number; supplier:string; location:string; barcode:string; expiry?:string; brand?:string }
type Movement = { id:string; product:string; type:'Stock in'|'Stock out'|'Adjustment'|'Transfer'; qty:number; date:string; reason:string }
type Supplier = { id:string; name:string; email:string; phone:string; leadTime:number }
type PurchaseOrder = { id:string; supplier:string; status:'Draft'|'Ordered'|'Received'; lines:{productId:string; quantity:number}[]; received:boolean }
const seedProducts:Product[]=[{id:'PRD-001',name:'Arduino Uno',sku:'ARD-UNO-R3',category:'Electronics',stock:24,min:12,price:29.9,supplier:'TechSource India',location:'Lab A',barcode:'890100000001',brand:'Arduino'},{id:'PRD-002',name:'Temperature Sensor',sku:'SEN-TMP-01',category:'Sensors',stock:8,min:15,price:29.8,supplier:'Circuit Hub',location:'Lab A',barcode:'890100000002',expiry:'2027-02-14',brand:'Circuit Hub'},{id:'PRD-003',name:'USB Cable',sku:'CAB-USB-C-2M',category:'Accessories',stock:0,min:20,price:8.5,supplier:'OfficeKart',location:'Store Room',barcode:'890100000003',brand:'OfficeKart'},{id:'PRD-004',name:'Wireless Mouse',sku:'MOU-WLS-02',category:'Peripherals',stock:42,min:10,price:29.97,supplier:'OfficeKart',location:'Store Room',barcode:'890100000004',brand:'Logitech'},{id:'PRD-005',name:'Mechanical Keyboard',sku:'KEY-MECH-87',category:'Peripherals',stock:6,min:8,price:89.9,supplier:'TechSource India',location:'Store Room',barcode:'890100000005',brand:'Keychron'}]
const seedMovements:Movement[]=[{id:'MOV-104',product:'Wireless Mouse',type:'Stock out',qty:-12,date:'Today, 10:42 AM',reason:'Department Issue'},{id:'MOV-103',product:'Arduino Uno',type:'Stock in',qty:20,date:'Today, 09:18 AM',reason:'Purchase order'},{id:'MOV-102',product:'Temperature Sensor',type:'Adjustment',qty:-4,date:'Yesterday, 4:32 PM',reason:'Cycle count'}]
const seedSuppliers:Supplier[]=[{id:'SUP-001',name:'TechSource India',email:'contact@techsource.demo',phone:'+91 98765 11111',leadTime:7},{id:'SUP-002',name:'Circuit Hub',email:'orders@circuithub.demo',phone:'+91 98765 22222',leadTime:10},{id:'SUP-003',name:'OfficeKart',email:'sales@officekart.demo',phone:'+91 98765 33333',leadTime:5}]
const navGroups=[
 {label:'Workspace',items:[['Dashboard',LayoutDashboard],['Products',Package],['Categories',Tag],['Brands',Tag]]},
 {label:'Inventory',items:[['Barcode Scanner',ScanLine],['Stock In',ArrowDownToLine],['Stock Out',ArrowUpFromLine],['Stock Adjustments',ClipboardList],['Stock Transfers',Truck]]},
 {label:'Procurement',items:[['Suppliers',Users],['Purchase Orders',ShoppingCart],['Receiving History',Archive]]},
 {label:'Insights',items:[['Low Stock Alerts',AlertTriangle],['Expiry Tracking',Archive],['Notifications',Bell],['Inventory Reports',FileBarChart],['Stock Movement',BarChart3],['AI Inventory Assistant',Sparkles],['Settings',Settings]]}
]
function Button({children,primary=false,onClick,disabled=false}:{children:React.ReactNode;primary?:boolean;onClick?:()=>void;disabled?:boolean}){return <button className={`button ${primary?'primary':'secondary'}`} onClick={onClick} disabled={disabled}>{children}</button>}

type AuthView='signin'|'signup'|'forgot'
function AuthPage({onSignedIn, onError}:{onSignedIn:(user:{name:string;email:string})=>void; onError:(msg:string)=>void}){
  const [view,setView]=useState<AuthView>('signin');
  const [showPassword,setShowPassword]=useState(false);
  const [submitted,setSubmitted]=useState(false);
  const [error,setError]=useState('');
  const [loading,setLoading]=useState(false);
  const [form,setForm]=useState({name:'',email:'jordan@acmecampus.edu',password:'password123',confirm:'password123'});
  const update=(key:string,value:string)=>setForm(f=>({...f,[key]:value}));
  
  const submit=async (e:React.FormEvent)=>{
    e.preventDefault();
    setError('');
    if(!form.email||!/^\S+@\S+\.\S+$/.test(form.email)) return setError('Enter a valid email address.');
    if(view==='forgot'){ setSubmitted(true); return; }
    if(view==='signup'&&(!form.name.trim()||form.password.length<8||form.password!==form.confirm)) return setError(!form.name.trim()?'Enter your full name.':form.password.length<8?'Use at least 8 characters for your password.':'Passwords do not match.');
    if(view==='signin'&&(!form.password||form.password.length<8)) return setError('Password must be at least 8 characters.');
    
    setLoading(true);
    try {
      if(view==='signin'){
        const res = await api.login(form.email, form.password);
        onSignedIn({name: res.user.name, email: res.user.email});
      } else if(view==='signup'){
        const res = await api.register(form.name.trim(), form.email, form.password);
        onSignedIn({name: res.user.name, email: res.user.email});
      }
    } catch(err:any) {
      // If backend offline, allow fallback demo login
      console.warn('Backend login attempt:', err.message);
      onSignedIn({name:form.name.trim()||'Jordan Davis',email:form.email});
      onError(`Backend authentication notice: ${err.message}. Logging into local session.`);
    } finally {
      setLoading(false);
    }
  };

  return <main className="auth-page"><section className="auth-brand"><div className="brand-mark"><Boxes size={20}/></div><div><strong>stockwise</strong><span>inventory intelligence</span></div></section><section className="auth-card"><div className="auth-heading"><span className="eyebrow">Acme Campus Store</span><h1>{view==='signin'?'Welcome back':view==='signup'?'Create your account':'Reset your password'}</h1><p>{view==='signin'?'Sign in to manage your inventory workspace.':view==='signup'?'Set up your workspace profile.':'Enter your email and we’ll show a confirmation state.'}</p></div>{view==='forgot'&&submitted?<div className="auth-success"><div className="auth-success-icon"><Check size={19}/></div><h2>Check your inbox</h2><p>Password reset link simulated for <strong>{form.email}</strong>.</p><button className="text-button" onClick={()=>{setSubmitted(false);setView('signin')}}>Return to sign in</button></div>:<form className="auth-form" onSubmit={submit} noValidate>{view==='signup'&&<label>Full name<input value={form.name} onChange={e=>update('name',e.target.value)} placeholder="Jordan Davis" autoComplete="name"/></label>}<label>Email address<input type="email" value={form.email} onChange={e=>update('email',e.target.value)} placeholder="jordan@acmecampus.edu" autoComplete="email"/></label>{view!=='forgot'&&<label>Password<div className="password-field"><input type={showPassword?'text':'password'} value={form.password} onChange={e=>update('password',e.target.value)} placeholder="At least 8 characters" autoComplete={view==='signin'?'current-password':'new-password'}/><button type="button" onClick={()=>setShowPassword(!showPassword)}>{showPassword?'Hide':'Show'}</button></div></label>}{view==='signup'&&<label>Confirm password<input type={showPassword?'text':'password'} value={form.confirm} onChange={e=>update('confirm',e.target.value)} placeholder="Repeat your password" autoComplete="new-password"/></label>}{error&&<div className="form-error" role="alert">{error}</div>}{view==='signin'&&<div className="auth-options"><label className="check-label"><input type="checkbox"/> Remember me</label><button type="button" className="text-button" onClick={()=>setView('forgot')}>Forgot password?</button></div>}<button className="button primary auth-submit" type="submit" disabled={loading}>{loading?'Connecting...':view==='signin'?'Sign in':view==='signup'?'Create account':'Send reset request'}</button><p className="auth-demo-note">Default login: jordan@acmecampus.edu / password123</p></form>}<div className="auth-switch">{view==='signin'?<>New to StockWise? <button onClick={()=>setView('signup')}>Create an account</button></>:view==='signup'?<>Already have an account? <button onClick={()=>setView('signin')}>Sign in</button></>:<button onClick={()=>setView('signin')}>Back to sign in</button>}</div></section></main>
}

function Heading({title,desc,actions}:{title:string;desc:string;actions?:React.ReactNode}){return <div className="page-heading"><div><div className="breadcrumbs">Workspace <ChevronRight size={13}/> {title}</div><h1>{title}</h1><p>{desc}</p></div><div className="heading-actions">{actions}</div></div>}
function Status({children}:{children:string}){const cls=children==='Healthy'||children==='Completed'||children==='Active'||children==='Received'?'status-healthy':children.includes('Out')||children==='Critical'||children==='Expired'?'status-danger':'status-warning';return <span className={`status-pill ${cls}`}><span className="status-dot"/>{children}</span>}
function Modal({title,children,onClose}:{title:string;children:React.ReactNode;onClose:()=>void}){return <div className="modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&onClose()}><div className="modal"><div className="modal-head"><div><span className="eyebrow">StockWise</span><h2>{title}</h2></div><button className="icon-button" onClick={onClose} aria-label="Close"><X size={18}/></button></div>{children}</div></div>}
function downloadCsv(rows:Record<string,unknown>[],filename:string){const keys=Object.keys(rows[0]||{});const csv=[keys.join(','),...rows.map(row=>keys.map(key=>JSON.stringify(String(row[key]??''))).join(','))].join('\n');const blob=new Blob([csv],{type:'text/csv'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;a.click();URL.revokeObjectURL(url)}

export default function Page(){
 const [active,setActive]=useState('Dashboard'),[collapsed,setCollapsed]=useState(false),[mobileOpen,setMobileOpen]=useState(false),[query,setQuery]=useState(''),[notice,setNotice]=useState(''),[modal,setModal]=useState<string|null>(null)
 const [products,setProducts]=useState(seedProducts),[movements,setMovements]=useState(seedMovements),[suppliers,setSuppliers]=useState(seedSuppliers),[purchaseOrders,setPurchaseOrders]=useState<PurchaseOrder[]>([]),[transfers,setTransfers]=useState<{id:string;product:string;from:string;to:string;quantity:number}[]>([])
 const [categories,setCategories]=useState(['Electronics','Sensors','Accessories','Peripherals']),[brands,setBrands]=useState(['Arduino','Circuit Hub','OfficeKart','Logitech','Keychron'])
 const [settings,setSettings]=useState({threshold:10,expiry:30,dark:false}); const [profile,setProfile]=useState({name:'Jordan Davis',email:'jordan@acmecampus.edu',role:'Administrator'}); const [hydrated,setHydrated]=useState(false); const [signedIn,setSignedIn]=useState(true); const [authMenu,setAuthMenu]=useState(false)
 const [backendOnline, setBackendOnline] = useState<boolean>(false)

 const loadFromBackend = async () => {
   try {
     const isAlive = await api.checkHealth();
     if (isAlive) {
       setBackendOnline(true);
       const [pList, mList, sList, oList, tList, cList, bList, setObj] = await Promise.all([
         api.getProducts(),
         api.getMovements(),
         api.getSuppliers(),
         api.getOrders(),
         api.getTransfers(),
         api.getCategories(),
         api.getBrands(),
         api.getSettings()
       ]);
       if(pList && pList.length) setProducts(pList);
       if(mList) setMovements(mList);
       if(sList && sList.length) setSuppliers(sList);
       if(oList) setPurchaseOrders(oList);
       if(tList) setTransfers(tList.map(t=>({id:t.id, product:t.product, from:t.fromLocation||t.from_location||t.from, to:t.toLocation||t.to_location||t.to, quantity:t.quantity})));
       if(cList && cList.length) setCategories(cList);
       if(bList && bList.length) setBrands(bList);
       if(setObj) setSettings(setObj);
       return true;
     } else {
       setBackendOnline(false);
       return false;
     }
   } catch (e) {
     setBackendOnline(false);
     return false;
   }
 };

 useEffect(()=>{
   (async () => {
     try {
       const connected = await loadFromBackend();
       if (!connected) {
         // Fallback to local storage if backend offline
         const read=(key:string,fallback:any)=>{const raw=localStorage.getItem(key);if(!raw)return fallback;try{return JSON.parse(raw)}catch{return fallback}};
         setProducts(read('stockwise-products',seedProducts));
         setMovements(read('stockwise-movements',seedMovements));
         setSuppliers(read('stockwise-suppliers',seedSuppliers));
         setPurchaseOrders(read('stockwise-orders',[]));
         setTransfers(read('stockwise-transfers',[]));
         setCategories(read('stockwise-categories',['Electronics','Sensors','Accessories','Peripherals']));
         setBrands(read('stockwise-brands',['Arduino','Circuit Hub','OfficeKart','Logitech','Keychron']));
         setSettings({...settings,...read('stockwise-settings',{})});
         setProfile(read('stockwise-profile',profile));
       }
     } finally {
       setHydrated(true);
     }
   })();
 },[])

 useEffect(()=>{
   if(!hydrated)return;
   const save=(key:string,value:any)=>localStorage.setItem(key,JSON.stringify(value));
   save('stockwise-products',products);save('stockwise-movements',movements);save('stockwise-suppliers',suppliers);save('stockwise-orders',purchaseOrders);save('stockwise-transfers',transfers);save('stockwise-categories',categories);save('stockwise-brands',brands);save('stockwise-settings',settings);save('stockwise-profile',profile);
 },[hydrated,products,movements,suppliers,purchaseOrders,transfers,categories,brands,settings,profile])

 const notify=(text:string)=>{setNotice(text);window.setTimeout(()=>setNotice(''),2800)}; 
 const navigate=(name:string)=>{setActive(name);setMobileOpen(false);setQuery('')}

 const changeStock=async (id:string,delta:number,type:Movement['type'],reason='Stock transaction')=>{
   const p=products.find(x=>x.id===id);
   if(!p||p.stock+delta<0)return notify('Stock out quantity cannot exceed available stock');
   
   if (backendOnline) {
     try {
       const updatedProduct = await api.adjustStock(id, delta, type, reason);
       setProducts(ps=>ps.map(x=>x.id===id?{...x,stock:updatedProduct.stock}:x));
       const mList = await api.getMovements();
       setMovements(mList);
       notify(`${type} saved to database`);
       return;
     } catch (err: any) {
       console.error(err);
     }
   }
   setProducts(ps=>ps.map(x=>x.id===id?{...x,stock:x.stock+delta}:x));
   setMovements(ms=>[{id:`MOV-${Date.now()}`,product:p.name,type,qty:delta,date:'Just now',reason},...ms]);
   notify(`${type} recorded successfully`);
 }

 const low=products.filter(p=>p.stock<=settings.threshold); const out=products.filter(p=>p.stock===0); const units=products.reduce((n,p)=>n+p.stock,0); const value=products.reduce((n,p)=>n+p.stock*p.price,0); 
 if(!signedIn)return <AuthPage onSignedIn={user=>{setProfile(p=>({...p,...user}));setSignedIn(true)}} onError={notify}/>

 const saveProduct=async (p:Product)=>{
   if(!p.name.trim()||!p.category||!p.brand||!p.supplier||!p.sku.trim()||!Number.isFinite(p.price)||p.price<0||!Number.isInteger(p.stock)||p.stock<0)return notify('Complete required fields with valid non-negative numbers');
   if(products.some(x=>x.sku.toLowerCase()===p.sku.toLowerCase()))return notify('SKU must be unique, ignoring letter case');
   
   if (backendOnline) {
     try {
       const created = await api.createProduct(p);
       setProducts(xs=>[...xs, created]);
       setModal(null);
       notify('Product created & saved to database');
       return;
     } catch (err:any) {
       notify(`Backend error: ${err.message}`);
       return;
     }
   }
   setProducts(xs=>[...xs,{...p,id:`PRD-${String(xs.length+1).padStart(3,'0')}`}]);
   setModal(null);
   notify('Product added to catalog');
 }

 const content=active==='Dashboard'?<Dashboard backendOnline={backendOnline} profile={profile} products={products} low={low} out={out} units={units} value={value} movements={movements} navigate={navigate} onAdd={()=>setModal('product')} onRefresh={loadFromBackend}/>:active==='Products'?<Products products={products} onAdd={()=>setModal('product')} onStock={(p:Product)=>changeStock(p.id,1,'Stock in')}/>:<Workspace backendOnline={backendOnline} active={active} products={products} low={low} movements={movements} suppliers={suppliers} orders={purchaseOrders} transfers={transfers} categories={categories} brands={brands} expiryDays={settings.expiry} threshold={settings.threshold} onNotice={notify} onStock={changeStock} onSuppliers={setSuppliers} onOrders={setPurchaseOrders} onProducts={setProducts} onMovements={setMovements} onTransfers={setTransfers} onCategories={setCategories} onBrands={setBrands} onExport={(rows:Record<string,unknown>[],name:string)=>downloadCsv(rows,name)}/>;

 return <div className="app-shell"><aside className={`sidebar ${collapsed?'is-collapsed':''} ${mobileOpen?'mobile-open':''}`}><div className="brand"><div className="brand-mark"><Boxes size={19}/></div>{!collapsed&&<div><strong>stockwise</strong><span>inventory intelligence</span></div>}<button className="mobile-close" onClick={()=>setMobileOpen(false)}><X size={18}/></button></div><div className="workspace-switch"><div className="workspace-avatar">AC</div>{!collapsed&&<div className="workspace-copy"><strong>Acme Campus Store</strong><span>Production Workspace</span></div>}</div><nav>{navGroups.map(g=><div className="nav-group" key={g.label}><span className="nav-label">{!collapsed&&g.label}</span>{g.items.map(([name,Icon]:any)=><button key={name} className={`nav-item ${active===name?'active':''}`} onClick={()=>navigate(name)}><Icon size={17}/>{!collapsed&&<span>{name}</span>}{name==='Low Stock Alerts'&&!collapsed&&<b className="nav-badge">{low.length}</b>}</button>)}</div>)}</nav><div className="sidebar-bottom"><button className="user-mini" onClick={()=>setModal('profile')}><div className="avatar">JD</div>{!collapsed&&<div><strong>{profile.name}</strong><span>{profile.role}</span></div>}</button></div></aside><main className="main-area"><header className="topbar"><button className="menu-button" onClick={()=>setMobileOpen(true)}><Menu size={20}/></button><button className="collapse-button" onClick={()=>setCollapsed(!collapsed)}>{collapsed?<PanelLeftOpen size={19}/>:<PanelLeftClose size={19}/>}</button><div className="global-search"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search inventory..."/></div><div className="top-actions"><span className={`status-pill ${backendOnline ? 'status-healthy' : 'status-warning'}`} title="Backend API status"><span className="status-dot"/>{backendOnline ? 'FastAPI / MySQL Online' : 'Local Fallback'}</span><button className="icon-button" onClick={async ()=>{ const ok = await loadFromBackend(); notify(ok ? 'Refreshed from backend database' : 'Backend is currently unreachable'); }} aria-label="Refresh Database" title="Sync with backend database"><RefreshCw size={16}/></button><button className="icon-button" onClick={()=>notify('No new notifications')} aria-label="Notifications"><Bell size={17}/></button><div className="profile-menu"><button className="top-profile" onClick={()=>setAuthMenu(!authMenu)} aria-expanded={authMenu}><span className="top-avatar">{profile.name.split(' ').map(x=>x[0]).join('').slice(0,2)}</span><span>{profile.name}</span><ChevronRight size={14}/></button>{authMenu&&<div className="profile-dropdown"><strong>{profile.name}</strong><span>{profile.email}</span><button onClick={()=>{setModal('profile');setAuthMenu(false)}}>View profile</button><button className="signout-button" onClick={()=>{setAuthMenu(false);setSignedIn(false);notify('Signed out')}}>Sign out</button></div>}</div></div></header><div className="content-wrap">{content}</div></main>{notice&&<div className="toast"><Check size={15}/>{notice}</div>}{modal==='product'&&<ProductModal categories={categories} brands={brands} suppliers={suppliers} onSave={saveProduct} onClose={()=>setModal(null)}/>}</div>
}

function Dashboard({backendOnline,profile,products,low,out,units,value,movements,navigate,onAdd,onRefresh}:any){
  return <>
    <Heading title={`Good morning, ${profile.name.split(' ')[0]}`} desc="Here’s what’s happening with your inventory today." actions={<><Button onClick={()=>navigate('Inventory Reports')}><Download size={16}/>Export report</Button><Button primary onClick={onAdd}><Plus size={16}/>Add product</Button></>}/>
    <div className={`demo-banner ${backendOnline ? 'backend-active' : ''}`}>
      <div className="demo-icon">{backendOnline ? <Database size={16}/> : <Sparkles size={15}/>}</div>
      <div>
        <strong>{backendOnline ? 'Connected to FastAPI & Database' : 'Running in Local Mode'}</strong>
        <span>{backendOnline ? 'All transactions, products, and movements are synced with your backend server.' : 'Start the FastAPI backend with "uvicorn main:app --reload" on port 8000 to enable shared MySQL persistence.'}</span>
      </div>
      <Button onClick={onRefresh}><RefreshCw size={14}/> Sync Now</Button>
    </div>
    <div className="dashboard-toolbar"><div><span className="eyebrow">Workspace overview</span><h2>Inventory snapshot</h2></div><span className="muted">{backendOnline ? 'Live database feed' : 'Local state'}</span></div>
    <div className="kpi-grid">
      <Kpi label="Total products" value={products.length} icon={Package} tone="violet"/>
      <Kpi label="Stock units" value={units} icon={Boxes} tone="blue"/>
      <Kpi label="Inventory value" value={`$${value.toLocaleString(undefined,{maximumFractionDigits:0})}`} icon={Gauge} tone="green"/>
      <Kpi label="Low stock items" value={low.length} icon={AlertTriangle} tone="amber"/>
      <Kpi label="Out of stock" value={out.length} icon={Archive} tone="red"/>
    </div>
    <section className="panel movement-panel">
      <div className="panel-head"><div><h3>Recent stock movement</h3><p>Live inventory logs</p></div><button className="text-button" onClick={()=>navigate('Stock Movement')}>View all</button></div>
      {movements.slice(0,5).map((m:Movement)=><div className="movement-row" key={m.id}><div className="movement-icon"><ArrowDownToLine size={15}/></div><div><strong>{m.product}</strong><span>{m.reason} · {m.date}</span></div><b className={m.qty<0?'negative':''}>{m.qty>0?'+':''}{m.qty}</b></div>)}
    </section>
  </>
}

function Kpi({label,value,icon:Icon,tone}:any){return <div className="kpi-card"><div className={`kpi-icon ${tone}`}><Icon size={18}/></div><div className="kpi-body"><span>{label}</span><strong>{value}</strong><small>Catalog count</small></div><MoreHorizontal size={16} className="kpi-more"/></div>}
function Products({products,onAdd,onStock}:any){const [search,setSearch]=useState('');const shown=products.filter((p:Product)=>`${p.name} ${p.sku} ${p.category} ${p.supplier}`.toLowerCase().includes(search.toLowerCase()));return <><Heading title="Products" desc="Manage your catalog, stock levels, and product details." actions={<><Button onClick={()=>downloadCsv(products,'stockwise-products.csv')}><Download size={16}/>Export CSV</Button><Button primary onClick={onAdd}><Plus size={16}/>Add product</Button></>}/><div className="products-toolbar"><div className="table-search"><Search size={15}/><input aria-label="Search catalog" placeholder="Search catalog" value={search} onChange={e=>setSearch(e.target.value)}/><Filter size={15}/></div></div><section className="panel product-table-panel"><div className="table-meta"><span><strong>{shown.length}</strong> products shown</span><span className="muted">Live data</span></div><div className="table-scroll"><table><thead><tr><th>Product</th><th>SKU</th><th>Category</th><th>Stock</th><th>Status</th><th>Supplier</th><th>Action</th></tr></thead><tbody>{shown.map((p:Product)=><tr key={p.id}><td><div className="product-cell"><div className="product-thumb violet">{p.name[0]}</div><div><strong>{p.name}</strong><span>{p.id} · {p.location}</span></div></div></td><td className="mono">{p.sku}</td><td>{p.category}</td><td><strong>{p.stock}</strong> <span className="muted">/ {p.min}</span></td><td><Status>{p.stock===0?'Out of stock':p.stock<=p.min?'Low stock':'Healthy'}</Status></td><td>{p.supplier}</td><td><button className="text-button" onClick={()=>onStock(p)}>+ stock</button></td></tr>)}</tbody></table></div></section></>}

function ProductModal({categories,brands,suppliers,onSave,onClose}:{categories:string[];brands:string[];suppliers:Supplier[];onSave:(p:Product)=>void;onClose:()=>void}){const [p,setP]=useState<Product>({id:'',name:'',sku:'',category:categories[0]||'',stock:0,min:1,price:0,supplier:suppliers[0]?.name||'',location:'Store Room',barcode:'',brand:brands[0]||''});return <Modal title="Add product" onClose={onClose}><div className="form-grid"><label>Name<input autoFocus value={p.name} onChange={e=>setP({...p,name:e.target.value})}/></label><label>SKU<input value={p.sku} onChange={e=>setP({...p,sku:e.target.value})}/></label><label>Category<select value={p.category} onChange={e=>setP({...p,category:e.target.value})}>{categories.map(x=><option key={x}>{x}</option>)}</select></label><label>Brand<select value={p.brand} onChange={e=>setP({...p,brand:e.target.value})}>{brands.map(x=><option key={x}>{x}</option>)}</select></label><label>Supplier<select value={p.supplier} onChange={e=>setP({...p,supplier:e.target.value})}>{suppliers.map(x=><option key={x.name}>{x.name}</option>)}</select></label><label>Opening stock<input type="number" value={p.stock} onChange={e=>setP({...p,stock:Number(e.target.value)})}/></label><label>Minimum stock<input type="number" value={p.min} onChange={e=>setP({...p,min:Number(e.target.value)})}/></label><label>Unit price<input type="number" step="0.01" value={p.price} onChange={e=>setP({...p,price:Number(e.target.value)})}/></label></div><Button primary onClick={()=>onSave(p)}><Plus size={15}/>Add product</Button></Modal>}

function Workspace({backendOnline,active,products,low,movements,suppliers,orders,transfers,categories,brands,expiryDays,threshold,onNotice,onStock,onSuppliers,onOrders,onProducts,onMovements,onTransfers,onCategories,onBrands,onExport}:any){
 if(active==='Categories'||active==='Brands')return <Taxonomy backendOnline={backendOnline} title={active} values={active==='Categories'?categories:brands} products={products} field={active==='Categories'?'category':'brand'} onProducts={onProducts} onValues={active==='Categories'?onCategories:onBrands} onNotice={onNotice}/>
 if(active==='Suppliers')return <SupplierPage backendOnline={backendOnline} suppliers={suppliers} products={products} onSuppliers={onSuppliers} onNotice={onNotice}/>
 if(active==='Purchase Orders')return <PurchaseOrders backendOnline={backendOnline} products={products} suppliers={suppliers} orders={orders} onOrders={onOrders} onProducts={onProducts} onStock={onStock} onNotice={onNotice}/>
 if(active==='Stock Transfers')return <Transfers backendOnline={backendOnline} products={products} transfers={transfers} onTransfers={onTransfers} onProducts={onProducts} onMovements={onMovements} onNotice={onNotice}/>
 if(active==='Expiry Tracking')return <Expiry products={products} days={expiryDays}/>
 if(active==='Low Stock Alerts')return <Alerts products={low} threshold={threshold} onExport={onExport}/>
 if(active==='Inventory Reports')return <Reports products={products} movements={movements} threshold={threshold} onExport={onExport}/>
 if(active==='Stock Movement'||active==='Receiving History')return <MovementPage movements={movements} title={active}/>
 if(active==='AI Inventory Assistant')return <AiAssistantView backendOnline={backendOnline} onNotice={onNotice}/>
 return <SimpleWorkspace backendOnline={backendOnline} active={active} products={products} onStock={onStock} onNotice={onNotice}/>
}

function AiAssistantView({backendOnline, onNotice}:{backendOnline:boolean; onNotice:(msg:string)=>void}){
  const [messages, setMessages] = useState<Array<{sender:'user'|'assistant'; text:string; recommendations?:any[]}>>([
    {
      sender: 'assistant',
      text: 'Hello! I am your StockWise AI Assistant. Ask me anything about stock valuation, low-stock reorder forecasts, fastest suppliers, or overall inventory health.'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendQuery = async (queryText?: string) => {
    const q = queryText || input;
    if (!q.trim()) return;
    const userMsg = { sender: 'user' as const, text: q.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      if (backendOnline) {
        const res = await api.askAiAssistant(q.trim());
        setMessages(prev => [...prev, { sender: 'assistant', text: res.reply, recommendations: res.recommendations }]);
      } else {
        setMessages(prev => [...prev, { sender: 'assistant', text: 'Backend is offline. Please start FastAPI on port 8005 to query the live database.' }]);
      }
    } catch (err: any) {
      setMessages(prev => [...prev, { sender: 'assistant', text: `Error processing query: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const samplePrompts = [
    'What items need reordering?',
    'What is our total stock valuation?',
    'Which supplier is the fastest?',
    'Summarize overall inventory health'
  ];

  return (
    <>
      <Heading title="AI Inventory Assistant" desc="Query stock intelligence, forecasting, and automated reorder recommendations." />
      <section className="panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: '450px' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {samplePrompts.map(p => (
            <button
              key={p}
              className="button secondary"
              style={{ fontSize: '0.82rem', padding: '0.4rem 0.75rem' }}
              onClick={() => sendQuery(p)}
              disabled={loading}
            >
              <Sparkles size={13} style={{ marginRight: '4px' }} />
              {p}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '420px', paddingRight: '0.5rem' }}>
          {messages.map((m, idx) => (
            <div
              key={idx}
              style={{
                alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                padding: '0.8rem 1.1rem',
                borderRadius: '12px',
                background: m.sender === 'user' ? 'var(--primary, #6366f1)' : 'rgba(0,0,0,0.04)',
                color: m.sender === 'user' ? '#fff' : 'inherit',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
              }}
            >
              <div style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '0.2rem', fontWeight: 600 }}>
                {m.sender === 'user' ? 'You' : 'StockWise Assistant'}
              </div>
              <div style={{ whiteSpace: 'pre-line', lineHeight: '1.45' }}>{m.text}</div>
              {m.recommendations && m.recommendations.length > 0 && (
                <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>Actionable Recommendations:</div>
                  {m.recommendations.map((rec: any, i: number) => (
                    <div key={i} style={{ padding: '0.5rem 0.75rem', background: 'rgba(0,0,0,0.04)', borderRadius: '6px', fontSize: '0.82rem' }}>
                      <strong>{rec.product}</strong> ({rec.sku}): Current stock <strong>{rec.current_stock}</strong> (Min: {rec.min_required}). Suggest ordering <strong>+{rec.suggested_order_qty}</strong> from <em>{rec.supplier}</em> (Lead time: {rec.lead_time_days}d).
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div style={{ alignSelf: 'flex-start', padding: '0.6rem 1rem', background: 'rgba(0,0,0,0.04)', borderRadius: '12px', fontSize: '0.85rem' }}>
              <Sparkles size={14} style={{ display: 'inline', marginRight: '6px' }} /> Analyzing inventory data...
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); sendQuery(); }}
          style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}
        >
          <input
            style={{ flex: 1, padding: '0.65rem 0.9rem', borderRadius: '8px', border: '1px solid #ddd' }}
            placeholder="Ask about inventory, restocking, trends, valuation..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <button className="button primary" type="submit" disabled={loading || !input.trim()}>
            <Send size={15} /> Send
          </button>
        </form>
      </section>
    </>
  );
}

function Taxonomy({backendOnline,title,values,products,field,onProducts,onValues,onNotice}:any){
  const [show,setShow]=useState(false);
  const [name,setName]=useState('');
  const add=async ()=>{
    const trimmed = name.trim();
    if(!trimmed||values.includes(trimmed))return onNotice('Enter a unique name');
    if (backendOnline) {
      try {
        if (field === 'category') await api.createCategory(trimmed);
        else await api.createBrand(trimmed);
      } catch (e: any) {
        return onNotice(`Database error: ${e.message}`);
      }
    }
    onValues([...values,trimmed]);
    setName('');
    setShow(false);
    onNotice(`${trimmed} added successfully.`);
  };
  
  const remove=async (v:string)=>{
    if(products.some((p:any)=>p[field]===v)) return onNotice('Reassign products before deleting this record');
    if (backendOnline) {
      try {
        if (field === 'category') await api.deleteCategory(v);
        else await api.deleteBrand(v);
      } catch (e:any) {
        return onNotice(`Database error: ${e.message}`);
      }
    }
    onValues(values.filter((x:string)=>x!==v));
    onNotice('Record deleted');
  };

  return <><Heading title={title} desc={`Manage ${title.toLowerCase()} assignments across the catalog.`} actions={<Button primary onClick={()=>setShow(true)}><Plus size={16}/>Add {title.slice(0,-1).toLowerCase()}</Button>}/><section className="panel product-table-panel"><div className="table-meta"><span><strong>{values.length}</strong> records</span><span className="muted">Deletion is blocked while products are assigned.</span></div><table><thead><tr><th>Name</th><th>Products</th><th>Stock units</th><th>Action</th></tr></thead><tbody>{values.map((v:string)=><tr key={v}><td><strong>{v}</strong></td><td>{products.filter((p:any)=>p[field]===v).length}</td><td>{products.filter((p:any)=>p[field]===v).reduce((n:number,p:Product)=>n+p.stock,0)}</td><td><button className="text-button" onClick={()=>remove(v)}>Delete</button></td></tr>)}</tbody></table></section>{show&&<Modal title={`Add ${title.slice(0,-1)}`} onClose={()=>setShow(false)}><label>Name<input autoFocus value={name} onChange={e=>setName(e.target.value)}/></label><Button primary onClick={add}><Check size={15}/>Save</Button></Modal>}</>
}

function SupplierPage({backendOnline,suppliers,products,onSuppliers,onNotice}:any){
  const [show,setShow]=useState(false);
  const [draft,setDraft]=useState({name:'',email:'',phone:'',leadTime:7});
  const save=async ()=>{
    if(!draft.name||!draft.email)return onNotice('Supplier name and email are required');
    if (backendOnline) {
      try {
        const created = await api.createSupplier(draft);
        onSuppliers((s:Supplier[])=>[...s, created]);
        setDraft({name:'',email:'',phone:'',leadTime:7});
        setShow(false);
        return onNotice('Supplier saved to database');
      } catch(e:any) {
        return onNotice(`Database error: ${e.message}`);
      }
    }
    onSuppliers((s:Supplier[])=>[...s,{...draft,id:`SUP-${Date.now()}`,leadTime:Number(draft.leadTime)}]);
    setDraft({name:'',email:'',phone:'',leadTime:7});
    setShow(false);
    onNotice('Supplier saved');
  };
  return <><Heading title="Suppliers" desc="Manage supplier contacts used by products and purchase orders." actions={<Button primary onClick={()=>setShow(true)}><Plus size={16}/>Add supplier</Button>}/><section className="panel product-table-panel"><table><thead><tr><th>Supplier</th><th>Contact</th><th>Products</th><th>Lead time</th><th>Status</th></tr></thead><tbody>{suppliers.map((s:Supplier)=><tr key={s.id}><td><strong>{s.name}</strong></td><td>{s.email}<span className="table-sub">{s.phone}</span></td><td>{products.filter((p:Product)=>p.supplier===s.name).length}</td><td>{s.leadTime} days</td><td><Status>Active</Status></td></tr>)}</tbody></table></section>{show&&<Modal title="Add supplier" onClose={()=>setShow(false)}><div className="form-grid"><label>Name<input autoFocus value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})}/></label><label>Email<input value={draft.email} onChange={e=>setDraft({...draft,email:e.target.value})}/></label><label>Phone<input value={draft.phone} onChange={e=>setDraft({...draft,phone:e.target.value})}/></label><label>Lead time<input type="number" value={draft.leadTime} onChange={e=>setDraft({...draft,leadTime:Number(e.target.value)})}/></label></div><Button primary onClick={save}><Check size={15}/>Save supplier</Button></Modal>}</>
}

function PurchaseOrders({backendOnline,products,suppliers,orders,onOrders,onProducts,onStock,onNotice}:any){
  const [show,setShow]=useState(false);
  const [supplier,setSupplier]=useState(suppliers[0]?.name||'');
  const [productId,setProductId]=useState(products[0]?.id||'');
  const [quantity,setQuantity]=useState(1);
  
  const create=async ()=>{
    if(!supplier||!productId||quantity<1)return onNotice('Choose a supplier, product, and positive quantity');
    if (backendOnline) {
      try {
        const created = await api.createOrder(supplier, [{productId, quantity: Number(quantity)}]);
        onOrders((xs:PurchaseOrder[])=>[...xs, created]);
        setShow(false);
        return onNotice('Purchase order created in database');
      } catch (e: any) {
        return onNotice(`Database error: ${e.message}`);
      }
    }
    onOrders((xs:PurchaseOrder[])=>[...xs,{id:`PO-${String(xs.length+1).padStart(3,'0')}`,supplier,status:'Draft',lines:[{productId,quantity:Number(quantity)}],received:false}]);
    setShow(false);
    onNotice('Purchase order created as draft');
  };

  const order=async (id:string)=>{
    if (backendOnline) {
      try {
        await api.markOrdered(id);
      } catch (e: any) {
        return onNotice(`Database error: ${e.message}`);
      }
    }
    onOrders((xs:PurchaseOrder[])=>xs.map(o=>o.id===id&&o.status==='Draft'?{...o,status:'Ordered'}:o));
  };

  const receive=async (o:PurchaseOrder)=>{
    if(o.received||o.status==='Received')return onNotice('This order has already been received');
    if (backendOnline) {
      try {
        await api.receiveOrder(o.id);
        const [pList, mList, oList] = await Promise.all([api.getProducts(), api.getMovements(), api.getOrders()]);
        onProducts(pList);
        onOrders(oList);
        return onNotice('Order received and stock updated in database');
      } catch (e: any) {
        return onNotice(`Database error: ${e.message}`);
      }
    }
    o.lines.forEach((l:any)=>onStock(l.productId,l.quantity,'Stock in','Purchase order receiving'));
    onOrders((xs:PurchaseOrder[])=>xs.map(x=>x.id===o.id?{...x,status:'Received',received:true}:x));
  };

  return <><Heading title="Purchase Orders" desc="Create, order, and receive procurement records." actions={<Button primary onClick={()=>setShow(true)}><Plus size={16}/>Create order</Button>}/><section className="panel product-table-panel"><table><thead><tr><th>Order</th><th>Supplier</th><th>Items</th><th>Status</th><th>Actions</th></tr></thead><tbody>{orders.map((o:PurchaseOrder)=><tr key={o.id}><td><strong>{o.id}</strong></td><td>{o.supplier}</td><td>{o.lines.map(l=>products.find((p:Product)=>p.id===l.productId)?.name || l.productId).join(', ')} × {o.lines.reduce((n,l)=>n+l.quantity,0)}</td><td><Status>{o.status}</Status></td><td>{o.status==='Draft'&&<button className="text-button" onClick={()=>order(o.id)}>Mark ordered</button>}{o.status==='Ordered'&&<button className="text-button" onClick={()=>receive(o)}>Receive</button>}</td></tr>)}</tbody></table>{!orders.length&&<div className="empty-state"><ShoppingCart size={30}/><h2>No purchase orders yet</h2><p>Create a draft order to start procurement.</p></div>}</section>{show&&<Modal title="Create purchase order" onClose={()=>setShow(false)}><div className="form-grid"><label>Supplier<select value={supplier} onChange={e=>setSupplier(e.target.value)}>{suppliers.map((s:Supplier)=><option key={s.id}>{s.name}</option>)}</select></label><label>Product<select value={productId} onChange={e=>setProductId(e.target.value)}>{products.map((p:Product)=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label>Quantity<input type="number" min="1" value={quantity} onChange={e=>setQuantity(Number(e.target.value))}/></label></div><Button primary onClick={create}><Check size={15}/>Create draft</Button></Modal>}</>
}

function Transfers({backendOnline,products,transfers,onTransfers,onProducts,onMovements,onNotice}:any){
  const [productId,setProductId]=useState(products[0]?.id||''),[from,setFrom]=useState('Store Room'),[to,setTo]=useState('Lab A'),[quantity,setQuantity]=useState(1);
  const confirm=async ()=>{
    const p=products.find((x:Product)=>x.id===productId);
    if(!p||from===to||quantity<1)return onNotice('Choose different locations and a positive quantity');
    if(p.location!==from||p.stock<quantity)return onNotice('Transfer quantity exceeds available stock at the source');
    
    if (backendOnline) {
      try {
        const created = await api.createTransfer(p.name, from, to, Number(quantity));
        onTransfers((xs:any[])=>[...xs, {id:created.id, product:p.name, from, to, quantity:Number(quantity)}]);
        const [pList, mList] = await Promise.all([api.getProducts(), api.getMovements()]);
        onProducts(pList);
        onMovements(mList);
        return onNotice('Stock transfer recorded in database');
      } catch (e: any) {
        return onNotice(`Database error: ${e.message}`);
      }
    }
    onProducts(products.map((x:Product)=>x.id===p.id?{...x,location:to}:x));
    onTransfers((xs:any[])=>[...xs,{id:`TR-${Date.now()}`,product:p.name,from,to,quantity:Number(quantity)}]);
    onMovements((xs:Movement[])=>[{id:`MOV-${Date.now()}`,product:p.name,type:'Transfer',qty:0,date:'Just now',reason:`Transfer ${from} to ${to}`},...xs]);
    onNotice('Stock transfer confirmed');
  };
  return <><Heading title="Stock Transfers" desc="Move inventory between locations without changing total stock."/><section className="panel form-panel"><div className="form-grid"><label>Product<select value={productId} onChange={e=>setProductId(e.target.value)}>{products.map((p:Product)=><option key={p.id} value={p.id}>{p.name} ({p.stock})</option>)}</select></label><label>Quantity<input type="number" min="1" value={quantity} onChange={e=>setQuantity(Number(e.target.value))}/></label><label>Source location<select value={from} onChange={e=>setFrom(e.target.value)}><option>Store Room</option><option>Lab A</option></select></label><label>Destination location<select value={to} onChange={e=>setTo(e.target.value)}><option>Lab A</option><option>Store Room</option></select></label></div><Button primary onClick={confirm}><Send size={15}/>Confirm transfer</Button></section><section className="panel product-table-panel"><table><thead><tr><th>Product</th><th>From</th><th>To</th><th>Quantity</th></tr></thead><tbody>{transfers.map((t:any)=><tr key={t.id}><td>{t.product}</td><td>{t.from}</td><td>{t.to}</td><td>{t.quantity}</td></tr>)}</tbody></table></section></>
}

function Expiry({products,days}:{products:Product[];days:number}){const now=Date.now();return <><Heading title="Expiry Tracking" desc={`Expiry warnings use your saved ${days}-day warning setting.`}/><section className="panel product-table-panel"><table><thead><tr><th>Product</th><th>Expiry</th><th>Status</th></tr></thead><tbody>{products.map(p=>{const date=p.expiry?new Date(`${p.expiry}T00:00:00`).getTime():null;const diff=date?Math.ceil((date-now)/86400000):null;const status=!date?'No expiry date':diff !== null && diff < 0?'Expired':diff !== null && diff <= days?'Expiring soon':'Safe';return <tr key={p.id}><td><strong>{p.name}</strong></td><td>{p.expiry||'—'}</td><td><Status>{status}</Status></td></tr>})}</tbody></table></section></>}
function Alerts({products,threshold,onExport}:any){return <><Heading title="Low Stock Alerts" desc={`Alerts use the global threshold of ${threshold} units.`} actions={<Button onClick={()=>onExport(products.map((p:Product)=>({product:p.name,sku:p.sku,stock:p.stock,threshold})), 'stockwise-low-stock-alerts.csv')}><Download size={16}/>Export alerts</Button>}/><section className="panel product-table-panel"><table><thead><tr><th>Product</th><th>Stock</th><th>Threshold</th><th>Status</th></tr></thead><tbody>{products.map((p:Product)=><tr key={p.id}><td>{p.name}</td><td>{p.stock}</td><td>{threshold}</td><td><Status>{p.stock===0?'Out of stock':'Low stock'}</Status></td></tr>)}</tbody></table></section></>}
function Reports({products,movements,threshold,onExport}:any){return <><Heading title="Inventory Reports" desc="Reports reflect the rows currently in the catalog." actions={<Button primary onClick={()=>onExport(products.map((p:Product)=>({product:p.name,sku:p.sku,stock:p.stock,value:(p.stock*p.price).toFixed(2)})),'stockwise-inventory-report.csv')}><Download size={16}/>Export CSV</Button>}/><div className="quick-stats"><div className="panel mini-stat"><span>Stock valuation</span><strong>${products.reduce((n:number,p:Product)=>n+p.stock*p.price,0).toFixed(2)}</strong></div><div className="panel mini-stat"><span>Low-stock items (global)</span><strong>{products.filter((p:Product)=>p.stock<=threshold).length}</strong></div><div className="panel mini-stat"><span>Movements</span><strong>{movements.length}</strong></div></div></>}
function MovementPage({movements,title}:{movements:Movement[];title:string}){return <><Heading title={title} desc="Movement history recorded in this workspace."/><section className="panel product-table-panel"><table><thead><tr><th>Product</th><th>Type</th><th>Quantity</th><th>Reason</th><th>Date</th></tr></thead><tbody>{movements.map(m=><tr key={m.id}><td>{m.product}</td><td>{m.type}</td><td className={m.qty<0?'negative':''}>{m.qty}</td><td>{m.reason}</td><td>{m.date}</td></tr>)}</tbody></table></section></>}

function SimpleWorkspace({backendOnline,active,products,onStock,onNotice}:any){
  const [productId,setProductId]=useState(products[0]?.id||''),[quantity,setQuantity]=useState(1),[reason,setReason]=useState('');
  const stockOut=active==='Stock Out';
  const submit=()=>{
    const qty=Number(quantity);
    if(!productId||!Number.isInteger(qty)||qty<1||!reason.trim())return onNotice('Choose a product, positive whole quantity, and reason');
    onStock(productId,stockOut?-qty:qty,stockOut?'Stock out':'Stock in',reason.trim());
  };
  return <><Heading title={active} desc="Record an inventory movement with an audit reason."/><section className="panel form-panel"><p className="muted">{backendOnline ? 'Transactions are committed directly to your database.' : 'Running in local cache mode. Start the FastAPI backend to persist across devices.'}</p><div className="form-grid"><label>Product<select value={productId} onChange={e=>setProductId(e.target.value)}>{products.map((p:Product)=><option key={p.id} value={p.id}>{p.name} ({p.stock} available)</option>)}</select></label><label>Quantity<input type="number" min="1" step="1" value={quantity} onChange={e=>setQuantity(Number(e.target.value))}/></label><label>Reason<input value={reason} onChange={e=>setReason(e.target.value)} placeholder="e.g. Department issue"/></label></div><Button primary onClick={submit}>{active==='Stock Out'?'Record stock out':'Record stock in'}</Button></section></>
}
