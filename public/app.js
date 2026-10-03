const $ = (s) => document.querySelector(s);
const form = $('#brief-form');
const title = $('#title');
const meta = $('#meta');
function syncPreview(){
  $('#title-count').textContent = title.value.length;
  $('#meta-count').textContent = meta.value.length;
  $('#preview-title').textContent = title.value || 'Your SEO title appears here';
  $('#preview-meta').textContent = meta.value || 'Your meta description appears here. Use this preview to keep the snippet clear before saving the brief.';
}
title.addEventListener('input', syncPreview); meta.addEventListener('input', syncPreview);
async function checkStatus(){
  try{ const r=await fetch('/api/status'); const s=await r.json(); $('#status').textContent=`Worker ✓  D1 ${s.d1?'✓':'—'}  R2 ${s.r2?'✓':'—'}`; }
  catch{ $('#status').textContent='Stack status unavailable'; }
}
async function loadBriefs(){
  const box=$('#briefs');
  try{
    const r=await fetch('/api/briefs'); const data=await r.json();
    if(!r.ok){box.innerHTML=`<p class="muted">${data.error} Add the D1 binding named <b>DB</b>, then refresh.</p>`;return;}
    if(!data.briefs.length){box.innerHTML='<p class="muted">No briefs yet.</p>';return;}
    box.innerHTML=data.briefs.map(b=>`<article class="brief"><div class="brief-top"><div><h3>${escapeHtml(b.keyword)}</h3><div class="meta">${escapeHtml(b.created_at)}</div></div></div>${b.title?`<p><strong>Title:</strong> ${escapeHtml(b.title)}</p>`:''}${b.meta_description?`<p>${escapeHtml(b.meta_description)}</p>`:''}<div class="brief-actions">${b.attachment_key?`<a href="/api/attachments/${b.id}">Download ${escapeHtml(b.attachment_name||'file')}</a>`:''}<button class="danger" data-delete="${b.id}" type="button">Delete</button></div></article>`).join('');
  }catch{box.innerHTML='<p class="muted">Could not load briefs.</p>';}
}
form.addEventListener('submit',async(e)=>{e.preventDefault();const msg=$('#form-message');msg.textContent='Saving…';try{const r=await fetch('/api/briefs',{method:'POST',body:new FormData(form)});const data=await r.json();if(!r.ok)throw new Error(data.error||'Save failed');form.reset();syncPreview();msg.textContent='Saved.';await loadBriefs();await checkStatus();}catch(err){msg.textContent=err.message;}});
$('#refresh').addEventListener('click',loadBriefs);
$('#briefs').addEventListener('click',async(e)=>{const id=e.target.dataset.delete;if(!id)return;await fetch(`/api/briefs/${id}`,{method:'DELETE'});await loadBriefs();});
function escapeHtml(v=''){return String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
syncPreview();checkStatus();loadBriefs();
