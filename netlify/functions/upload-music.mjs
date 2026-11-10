export default async (req) => {
  if (req.method !== "POST") return Response.json({error:"Method not allowed"},{status:405});
  const token=Netlify.env.get("ORCHESTRA_GITHUB_TOKEN");
  if(!token) return Response.json({error:"Publishing is not enabled yet."},{status:503});
  try{
    const form=await req.formData(), title=String(form.get("title")||"").trim(), label=String(form.get("label")||"").trim(), pdf=form.get("pdf");
    if(!title||!label||!pdf||typeof pdf==="string"||pdf.type!=="application/pdf") return Response.json({error:"Title, sheet name and PDF are required."},{status:400});
    if(pdf.size>4_000_000) return Response.json({error:"This PDF is too large for direct upload. Please use a PDF under 4 MB."},{status:413});
    const slug=s=>s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/&/g," ").replace(/[’']/g," ").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
    const safe=(label+" - "+pdf.name.replace(/\.pdf$/i,"")).replace(/[\\/:*?"<>|]/g," ").replace(/\s+/g," ").trim()+".pdf";
    const path="assets/additional-music/additional-music/"+slug(title)+"/"+safe;
    const bytes=new Uint8Array(await pdf.arrayBuffer()); let binary=""; for(let i=0;i<bytes.length;i+=0x8000) binary+=String.fromCharCode(...bytes.subarray(i,i+0x8000));
    const ghHeaders={Authorization:"Bearer "+token,Accept:"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28","Content-Type":"application/json"};
    const put=await fetch("https://api.github.com/repos/marcdiedricks/orchestra-music-companion/contents/"+path.split("/").map(encodeURIComponent).join("/"),{method:"PUT",headers:ghHeaders,body:JSON.stringify({message:"Add music sheet: "+title+" — "+label,content:btoa(binary),branch:"main"})});
    if(!put.ok){const e=await put.json().catch(()=>({}));throw new Error(e.message||"Could not publish PDF");}
    const dataUrl="https://api.github.com/repos/marcdiedricks/orchestra-music-companion/contents/data/additional-music-foundation.js?ref=main";
    const dr=await fetch(dataUrl,{headers:ghHeaders}); if(!dr.ok)throw new Error("PDF uploaded, but catalogue could not be read.");
    const dj=await dr.json(), source=atob(dj.content.replace(/\n/g,"")), prefix="window.ADDITIONAL_MUSIC_FOUNDATION=", obj=JSON.parse(source.slice(prefix.length,-1));
    let work=obj.works.find(w=>w.title.toLowerCase()===title.toLowerCase());
    if(work) work.sheet_count=Number(work.sheet_count||0)+1; else obj.works.push({title,az_letter:(title[0]||"#").toUpperCase(),sheet_count:1});
    obj.works.sort((a,b)=>a.title.localeCompare(b.title)); obj.work_count=obj.works.length; obj.pdf_count=Number(obj.pdf_count||0)+1; obj.owner_upload="simple-direct-upload";
    const updated=prefix+JSON.stringify(obj)+";";
    const enc=btoa(unescape(encodeURIComponent(updated)));
    const wr=await fetch("https://api.github.com/repos/marcdiedricks/orchestra-music-companion/contents/data/additional-music-foundation.js",{method:"PUT",headers:ghHeaders,body:JSON.stringify({message:"Register music sheet: "+title,content:enc,sha:dj.sha,branch:"main"})});
    if(!wr.ok)throw new Error("PDF uploaded, but catalogue update failed.");
    return Response.json({ok:true,title,label});
  }catch(err){return Response.json({error:err instanceof Error?err.message:"Upload failed"},{status:500})}
};