"use client";
import { useEffect, useState } from "react";
import { ArrowLeft, Copy, KeyRound, Plus, Trash2 } from "lucide-react";

type Product = { id: string; name: string };
type License = { id: string; key: string; duration: string; status: string; hwidRequired: boolean; hwid: string | null; expiresAt: string | null; createdAt: string; product: Product };
const periods: Record<string,string> = { DAILY: "Diária", WEEKLY: "Semanal", MONTHLY: "Mensal", LIFETIME: "Lifetime" };

export default function LicensesPage() {
  const [products,setProducts] = useState<Product[]>([]);
  const [licenses,setLicenses] = useState<License[]>([]);
  const [name,setName] = useState("");
  const [description,setDescription] = useState("");
  const [productId,setProductId] = useState("");
  const [duration,setDuration] = useState("MONTHLY");
  const [hwidRequired,setHwidRequired] = useState(false);
  const [quantity,setQuantity] = useState("1");
  const [message,setMessage] = useState("");
  const [loading,setLoading] = useState(true);
  const [busy,setBusy] = useState(false);

  async function load() {
    const me = await fetch("/api/auth/me");
    if (!me.ok) { window.location.href = "/"; return; }
    const [p,l] = await Promise.all([fetch("/api/products"),fetch("/api/licenses")]);
    if (p.ok) { const d = await p.json(); setProducts(d.products); if (d.products[0]) setProductId((old:string)=>old || d.products[0].id); }
    if (l.ok) { const d = await l.json(); setLicenses(d.licenses); }
    setLoading(false);
  }
  useEffect(()=>{ void load(); },[]);
  async function createProduct(e:React.FormEvent) {
    e.preventDefault(); setBusy(true); setMessage("");
    try { const r=await fetch("/api/products",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name,description})}); const d=await r.json(); if(!r.ok) throw new Error(d.error||"Falha ao criar produto"); setName("");setDescription("");setMessage("Produto criado.");await load();setProductId(d.product.id); }
    catch(e){setMessage(e instanceof Error?e.message:"Erro inesperado");} finally{setBusy(false);}
  }
  async function createLicenses(e:React.FormEvent) {
    e.preventDefault(); setBusy(true); setMessage("");
    try { const r=await fetch("/api/licenses",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({productId,duration,hwidRequired,quantity:Number(quantity)})}); const d=await r.json(); if(!r.ok) throw new Error(d.error||"Falha ao criar licenças"); setMessage(`${d.licenses.length} licença(s) criada(s) com sucesso.`); await load(); }
    catch(e){setMessage(e instanceof Error?e.message:"Erro inesperado");} finally{setBusy(false);}
  }
  async function remove(id:string) { if(!window.confirm("Excluir esta licença permanentemente?")) return; const r=await fetch("/api/licenses",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({id})});const d=await r.json();if(!r.ok){setMessage(d.error||"Não foi possível excluir.");return;}setLicenses(old=>old.filter(x=>x.id!==id));setMessage("Licença excluída."); }
  if(loading) return <main className="feature-page"><p>Carregando suas licenças...</p></main>;
  return <main className="feature-page"><header className="feature-header"><a href="/" className="feature-back"><ArrowLeft size={17}/> Voltar ao painel</a><span className="feature-brand">NEXUS · LICENÇAS</span></header><div className="feature-title"><span className="eyebrow">GERENCIAMENTO DE PRODUTOS</span><h1>Produtos e licenças</h1><p>Crie produtos e gere chaves com duração e proteção HWID configuráveis.</p></div>{message&&<div className="feature-message">{message}</div>}<div className="feature-grid"><section className="panel feature-card"><div className="feature-card-title"><div className="settings-icon"><Plus size={20}/></div><div><h2>Criar produto</h2><p>Cadastre o produto ao qual as licenças pertencerão.</p></div></div><form onSubmit={createProduct} className="feature-form"><label>Nome do produto<input value={name} onChange={e=>setName(e.target.value)} minLength={2} maxLength={100} required placeholder="Ex.: Meu software"/></label><label>Descrição (opcional)<textarea value={description} onChange={e=>setDescription(e.target.value)} maxLength={500} placeholder="Descreva seu produto"/></label><button className="primary-btn" disabled={busy}>Criar produto</button></form><div className="feature-product-list"><b>Seus produtos ({products.length})</b>{products.map(p=><div key={p.id} className="feature-product"><span>{p.name}</span><small>{p.id.slice(0,8)}</small></div>)}{!products.length&&<p className="muted">Cadastre seu primeiro produto para começar.</p>}</div></section><section className="panel feature-card"><div className="feature-card-title"><div className="settings-icon"><KeyRound size={20}/></div><div><h2>Gerar licenças</h2><p>Personalize a duração, a quantidade e a exigência de HWID.</p></div></div><form onSubmit={createLicenses} className="feature-form"><label>Produto<select value={productId} onChange={e=>setProductId(e.target.value)} required disabled={!products.length}><option value="">Selecione um produto</option>{products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label>Duração<select value={duration} onChange={e=>setDuration(e.target.value)}><option value="DAILY">Diária — 24 horas</option><option value="WEEKLY">Semanal — 7 dias</option><option value="MONTHLY">Mensal — 30 dias</option><option value="LIFETIME">Lifetime — sem expiração</option></select></label><label>Quantidade (1 a 50)<input type="number" min="1" max="50" value={quantity} onChange={e=>setQuantity(e.target.value)} required/></label><label className="feature-check"><input type="checkbox" checked={hwidRequired} onChange={e=>setHwidRequired(e.target.checked)}/> Exigir vínculo por HWID</label><button className="primary-btn" disabled={busy||!products.length}><KeyRound size={16}/> Gerar licença(s)</button></form><p className="feature-hint">As chaves são geradas no servidor e vinculadas à sua conta e ao produto selecionado.</p></section></div><section className="panel feature-card feature-license-list"><div className="feature-card-title"><div className="settings-icon"><KeyRound size={20}/></div><div><h2>Licenças geradas</h2><p>{licenses.length} chave(s) no seu espaço</p></div></div>{!licenses.length?<div className="feature-empty">Ainda não há licenças. Crie um produto e gere sua primeira chave.</div>:<div className="feature-table-wrap"><table><thead><tr><th>CHAVE</th><th>PRODUTO</th><th>DURAÇÃO</th><th>HWID</th><th>EXPIRA</th><th>AÇÃO</th></tr></thead><tbody>{licenses.map(l=><tr key={l.id}><td><code>{l.key}</code><button className="copy-key" title="Copiar chave" onClick={()=>navigator.clipboard.writeText(l.key)}><Copy size={13}/></button></td><td>{l.product.name}</td><td>{periods[l.duration]||l.duration}</td><td>{l.hwidRequired?"Obrigatório":"Livre"}</td><td>{l.expiresAt?new Date(l.expiresAt).toLocaleDateString("pt-BR"):"Nunca"}</td><td><button className="delete-license" onClick={()=>remove(l.id)}><Trash2 size={14}/> Excluir</button></td></tr>)}</tbody></table></div>}</section></main>;
}
