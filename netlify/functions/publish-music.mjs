export default async (req, context) => {
  const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
  if(req.method!=='POST') return json({error:'POST required'},405);
  const auth=req.headers.get('authorization')||'';
  if(!auth.startsWith('Bearer ')) return json({error:'Owner sign-in required'},401);
  const site=new URL(req.url).origin;
  const me=await fetch(site+'/.netlify/identity/user',{headers:{Authorization:auth}});
  if(!me.ok) return json({error:'Owner sign-in required'},401);
  const user=await me.json();
  const owner=(Netlify.env.get('ORCHESTRA_OWNER_EMAIL')||'').toLowerCase();
  if(!owner||String(user.email||'').toLowerCase()!==owner) return json({error:'Owner access only'},403);
  const token=Netlify.env.get('ORCHESTRA_GITHUB_TOKEN');
  if(!token) return json({error:'Publisher configuration required'},503);
  try{
    const body=await req.json(),title=String(body.title||'').trim(),part=String(body.part||'').trim(),content=String(body.content||''),filename=String(body.filename||'').trim();
    if(!title||!part||!filename||!content) throw new Error('PDF, title and part are required');
    if(!/\.pdf$/i.test(filename)||!/^data:application\/pdf;base64,/.test(content)) throw new Error('A PDF file is required');
    const bytes=Uint8Array.from(atob(content.split(',')[1]||''),c=>c.charCodeAt(0));
    if(new TextDecoder().decode(bytes.slice(0,5))!=='%PDF-') throw new Error('Invalid PDF');
    if(bytes.length>4*1024*1024) throw new Error('PDF is larger than the 4 MB upload limit');
    const slug=s=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/&/g,' ').replace(/[’']/g,' ').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
    const safePart=part.replace(/[\\/:*?"<>|]/g,'-').replace(/\s+/g,' ').trim();
    const path='assets/additional-music/additional-music/'+slug(title)+'/'+safePart+'.pdf';
    const gh={'Authorization':'Bearer '+token,'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','Content-Type':'application/json'};
    const url='https://api.github.com/repos/marcdiedricks/orchestra-music-companion/contents/'+path.split('/').map(encodeURIComponent).join('/');
    const exists=await fetch(url,{headers:gh}); if(exists.ok) return json({error:'That title/part already exists. Nothing was changed.'},409);
    let binary='';for(let i=0;i<bytes.length;i+=0x8000) binary+=String.fromCharCode(...bytes.subarray(i,i+0x8000));
    const put=await fetch(url,{method:'PUT',headers:gh,body:JSON.stringify({message:'Add Additional Music PDF: '+title+' - '+part,content:btoa(binary),branch:'main'})});
    if(!put.ok) throw new Error('GitHub publish failed ('+put.status+')');
    return json({ok:true,path});
  }catch(e){return json({error:e.message||'Publish failed'},400)}
}