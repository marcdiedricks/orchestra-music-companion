(()=>{
const d=window.ADDITIONAL_MUSIC_FOUNDATION;
if(!d)return;
const style=document.createElement('style');
style.textContent='.am-search{width:100%;padding:16px;border:2px solid #33445f;border-radius:16px;background:#050b16;color:#fff;font-size:1.1rem;margin:14px 0}.am-letter{color:#f59e0b;font-weight:900;font-size:1.3rem;margin:24px 0 8px}.am-work{width:100%;text-align:left;padding:16px;margin:6px 0;border:1px solid #33445f;border-radius:14px;background:#162238;color:#fff}.am-work strong{display:block;font-size:1.05rem}.am-work span{color:#aebbd0;font-size:.9rem}.am-empty{color:#aebbd0;padding:16px 0}';
document.head.appendChild(style);
const grid=document.querySelector('#home .grid');
if(!grid)return;
const card=document.createElement('button');
card.className='card'; card.dataset.id='additional'; card.dataset.title='Additional Music';
card.innerHTML='<span class="num">5</span><h2>Additional Music</h2><p>29 musical works • browse A–Z • search by title</p>';
grid.appendChild(card);
const main=document.querySelector('main');
const sec=document.createElement('section');
sec.id='additionalMusic'; sec.className='screen';
sec.innerHTML='<button class="back" id="amBack">← Back to Collections</button><div class="collection"><div class="eyebrow">COLLECTION 5</div><h2>Additional Music</h2><p class="hint">Browse alphabetically or search by musical title.</p><input id="amSearch" class="am-search" type="search" placeholder="Search by title…" autocomplete="off"><div id="amList"></div></div>';
main.appendChild(sec);
const home=document.getElementById('home'), list=sec.querySelector('#amList'), search=sec.querySelector('#amSearch');
function render(q=''){const needle=q.trim().toLowerCase();const works=d.works.filter(w=>w.title.toLowerCase().includes(needle));let last='';list.innerHTML='';if(!works.length){list.innerHTML='<div class="am-empty">No matching title found.</div>';return}works.forEach(w=>{if(w.az_letter!==last){const h=document.createElement('div');h.className='am-letter';h.textContent=w.az_letter;list.appendChild(h);last=w.az_letter}const b=document.createElement('button');b.className='am-work';b.innerHTML='<strong></strong><span></span>';b.querySelector('strong').textContent=w.title;b.querySelector('span').textContent=w.sheet_count+' available sheet'+(w.sheet_count===1?'':'s');b.onclick=()=>alert(w.title+'\n\n'+w.sheet_count+' available sheets.\nPDF connection follows in BUILD 0.1B-01B.');list.appendChild(b)})}
card.onclick=()=>{home.classList.remove('active');document.getElementById('collection').classList.remove('active');sec.classList.add('active');search.value='';render();scrollTo(0,0)};
sec.querySelector('#amBack').onclick=()=>{sec.classList.remove('active');home.classList.add('active');scrollTo(0,0)};
search.addEventListener('input',()=>render(search.value));
render();
})();