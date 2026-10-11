exports.handler = async (event) => {
  const headers={'Content-Type':'application/json','Cache-Control':'no-store'};
  if(event.httpMethod!=='POST') return {statusCode:405,headers,body:JSON.stringify({error:'POST required'})};
  const user=event.clientContext&&event.clientContext.user;
  if(!user||!user.email) return {statusCode:401,headers,body:JSON.stringify({error:'Owner sign-in required'})};
  const owner=(process.env.ORCHESTRA_OWNER_EMAIL||'').toLowerCase();
  if(!owner||user.email.toLowerCase()!==owner) return {statusCode:403,headers,body:JSON.stringify({error:'Owner access only'})};
  const token=process.env.ORCHESTRA_GITHUB_TOKEN;
  if(!token) return {statusCode:503,headers,body:JSON.stringify({error:'Publisher is not configured'})};
  try{
    const body=JSON.parse(event.body||'{}'), title=String(body.title||'').trim(), part=String(body.part||'').trim(), content=String(body.content||''), filename=String(body.filename||'').trim();
    if(!title||!part||!filename||!content) throw new Error('PDF, title and part are required');
    if(!/\.pdf$/i.test(filename)||!/^data:application\/pdf;base64,/.test(content)) throw new Error('A PDF file is required');
    const bytes=Buffer.from(content.split(',')[1]||'','base64');
    if(bytes.length<5||bytes.slice(0,5).toString()!=='%PDF-') throw new Error('Invalid PDF');
    if(bytes.length>5*1024*1024) throw new Error('PDF is larger than the 5 MB safety limit');
    const slug=s=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/&/g,' ').replace(/[’']/g,' ').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
    const safePart=part.replace(/[\\/:*?"<>|]/g,'-').replace(/\s+/g,' ').trim();
    const path='assets/additional-music/additional-music/'+slug(title)+'/'+safePart+'.pdf';
    const ghHeaders={'Authorization':'Bearer '+token,'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','Content-Type':'application/json'};
    const url='https://api.github.com/repos/marcdiedricks/orchestra-music-companion/contents/'+path.split('/').map(encodeURIComponent).join('/');
    const exists=await fetch(url,{headers:ghHeaders}); if(exists.ok) return {statusCode:409,headers,body:JSON.stringify({error:'That title/part already exists. Nothing was changed.'})};
    const put=await fetch(url,{method:'PUT',headers:ghHeaders,body:JSON.stringify({message:'Add Additional Music PDF: '+title+' - '+part,content:bytes.toString('base64'),branch:'main'})});
    if(!put.ok){const detail=await put.text();throw new Error('GitHub publish failed: '+put.status+' '+detail.slice(0,180))}
    return {statusCode:200,headers,body:JSON.stringify({ok:true,path})};
  }catch(e){return {statusCode:400,headers,body:JSON.stringify({error:e.message||'Publish failed'})}
};