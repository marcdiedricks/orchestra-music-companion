const REPO='marcdiedricks/orchestra-music-companion';
const BRANCH='orchestra-private-admin-prototype';
const FOUNDATION='data/additional-music-foundation.js';

const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
const slug=s=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/&/g,' ').replace(/[’']/g,' ').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const api=(path,token,opts={})=>fetch('https://api.github.com/repos/'+REPO+path,{...opts,headers:{Authorization:'Bearer '+token,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','Content-Type':'application/json',...(opts.headers||{})}});
const b64bytes=bytes=>{let out='';for(let i=0;i<bytes.length;i+=0x8000)out+=String.fromCharCode(...bytes.subarray(i,i+0x8000));return btoa(out)};
const b64utf8=s=>btoa(unescape(encodeURIComponent(s)));

export default async req=>{
  if(req.method!=='POST') return json({error:'POST required'},405);
  const auth=req.headers.get('authorization')||'';
  if(!auth.startsWith('Bearer ')) return json({error:'Owner sign-in required'},401);

  const me=await fetch(new URL(req.url).origin+'/.netlify/identity/user',{headers:{Authorization:auth}});
  if(!me.ok) return json({error:'Owner sign-in required'},401);
  const user=await me.json();
  const owner=(Netlify.env.get('ORCHESTRA_OWNER_EMAIL')||'').trim().toLowerCase();
  if(!owner||String(user.email||'').toLowerCase()!==owner) return json({error:'Owner access only'},403);

  const token=Netlify.env.get('ORCHESTRA_GITHUB_TOKEN');
  if(!token) return json({error:'Publisher configuration required'},503);

  try{
    const body=await req.json();
    const title=String(body.title||'').trim(),part=String(body.part||'').trim(),filename=String(body.filename||'').trim(),content=String(body.content||'');
    if(!title||!part||!filename||!content) throw new Error('PDF, title and part are required');
    if(!/\.pdf$/i.test(filename)||!/^data:application\/pdf;base64,/.test(content)) throw new Error('A PDF file is required');

    const bytes=Uint8Array.from(atob(content.split(',')[1]||''),c=>c.charCodeAt(0));
    if(new TextDecoder().decode(bytes.slice(0,5))!=='%PDF-') throw new Error('Invalid PDF');
    if(bytes.length>4*1024*1024) throw new Error('PDF is larger than the 4 MB preview limit');

    const safePart=part.replace(/[\\/:*?"<>|]/g,'-').replace(/\s+/g,' ').trim();
    const pdfPath='assets/additional-music/additional-music/'+slug(title)+'/'+safePart+'.pdf';

    const headRes=await api('/git/ref/heads/'+encodeURIComponent(BRANCH),token);
    if(!headRes.ok) throw new Error('Could not read publisher branch');
    const head=await headRes.json(),parent=head.object.sha;

    const commitRes=await api('/git/commits/'+parent,token);
    if(!commitRes.ok) throw new Error('Could not read publisher commit');
    const commit=await commitRes.json();

    const existing=await api('/contents/'+pdfPath.split('/').map(encodeURIComponent).join('/')+'?ref='+encodeURIComponent(BRANCH),token);
    if(existing.ok) return json({error:'That title/part already exists. Nothing was changed.'},409);

    const foundationRes=await api('/contents/'+FOUNDATION+'?ref='+encodeURIComponent(BRANCH),token);
    if(!foundationRes.ok) throw new Error('Could not read Additional Music catalogue');
    const foundationFile=await foundationRes.json();
    const source=decodeURIComponent(escape(atob(String(foundationFile.content||'').replace(/\n/g,''))));
    const match=source.match(/^window\.ADDITIONAL_MUSIC_FOUNDATION=(.*);\s*$/s);
    if(!match) throw new Error('Catalogue format is not recognized');
    const catalogue=JSON.parse(match[1]);

    let work=catalogue.works.find(w=>String(w.title).toLowerCase()===title.toLowerCase());
    if(work) work.sheet_count=Number(work.sheet_count||0)+1;
    else {
      catalogue.works.push({title,az_letter:(title.match(/[A-Za-z]/)||['#'])[0].toUpperCase(),sheet_count:1});
      catalogue.works.sort((a,b)=>a.title.localeCompare(b.title,'en',{sensitivity:'base'}));
      catalogue.work_count=Number(catalogue.work_count||0)+1;
    }
    catalogue.pdf_count=Number(catalogue.pdf_count||0)+1;
    catalogue.owner_upload='owner-publish-preview';
    const newFoundation='window.ADDITIONAL_MUSIC_FOUNDATION='+JSON.stringify(catalogue)+';\n';

    const [pdfBlobRes,dataBlobRes]=await Promise.all([
      api('/git/blobs',token,{method:'POST',body:JSON.stringify({content:b64bytes(bytes),encoding:'base64'})}),
      api('/git/blobs',token,{method:'POST',body:JSON.stringify({content:b64utf8(newFoundation),encoding:'base64'})})
    ]);
    if(!pdfBlobRes.ok||!dataBlobRes.ok) throw new Error('Could not prepare the publish commit');
    const pdfBlob=await pdfBlobRes.json(),dataBlob=await dataBlobRes.json();

    const treeRes=await api('/git/trees',token,{method:'POST',body:JSON.stringify({base_tree:commit.tree.sha,tree:[
      {path:pdfPath,mode:'100644',type:'blob',sha:pdfBlob.sha},
      {path:FOUNDATION,mode:'100644',type:'blob',sha:dataBlob.sha}
    ]})});
    if(!treeRes.ok) throw new Error('Could not prepare the publish tree');
    const tree=await treeRes.json();

    const newCommitRes=await api('/git/commits',token,{method:'POST',body:JSON.stringify({message:'Publish Additional Music: '+title+' - '+part,tree:tree.sha,parents:[parent]})});
    if(!newCommitRes.ok) throw new Error('Could not create the publish commit');
    const newCommit=await newCommitRes.json();

    const refRes=await api('/git/refs/heads/'+encodeURIComponent(BRANCH),token,{method:'PATCH',body:JSON.stringify({sha:newCommit.sha,force:false})});
    if(!refRes.ok) throw new Error('Publish conflict. Nothing was activated; please try again.');

    return json({ok:true,path:pdfPath,commit:newCommit.sha,work_count:catalogue.work_count,pdf_count:catalogue.pdf_count});
  }catch(e){
    return json({error:e.message||'Publish failed'},400);
  }
};