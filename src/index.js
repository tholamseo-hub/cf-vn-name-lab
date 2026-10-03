const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8' }
});

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);

    if (url.pathname === '/api/status' && request.method === 'GET') {
      return json({ ok: true, d1: Boolean(env.DB), r2: Boolean(env.FILES) });
    }

    if (url.pathname === '/api/briefs' && request.method === 'GET') {
      if (!env.DB) return json({ error: 'D1 binding DB is not configured yet.' }, 503);
      const { results } = await env.DB.prepare('SELECT id, keyword, title, meta_description, notes, attachment_key, attachment_name, created_at FROM briefs ORDER BY id DESC LIMIT 50').all();
      return json({ briefs: results });
    }

    if (url.pathname === '/api/briefs' && request.method === 'POST') {
      if (!env.DB) return json({ error: 'D1 binding DB is not configured yet.' }, 503);
      const form = await request.formData();
      const keyword = String(form.get('keyword') || '').trim();
      const title = String(form.get('title') || '').trim();
      const meta = String(form.get('meta') || '').trim();
      const notes = String(form.get('notes') || '').trim();
      const file = form.get('file');
      if (!keyword) return json({ error: 'Keyword is required.' }, 400);

      let attachmentKey = null;
      let attachmentName = null;
      if (file && typeof file === 'object' && 'arrayBuffer' in file && file.size > 0) {
        if (!env.FILES) return json({ error: 'R2 binding FILES is not configured yet.' }, 503);
        const safeName = String(file.name || 'attachment').replace(/[^a-zA-Z0-9._-]+/g, '-');
        attachmentKey = `${crypto.randomUUID()}-${safeName}`;
        attachmentName = file.name || safeName;
        await env.FILES.put(attachmentKey, file.stream(), { httpMetadata: { contentType: file.type || 'application/octet-stream' } });
      }

      const result = await env.DB.prepare('INSERT INTO briefs (keyword, title, meta_description, notes, attachment_key, attachment_name) VALUES (?, ?, ?, ?, ?, ?)').bind(keyword, title, meta, notes, attachmentKey, attachmentName).run();
      return json({ ok: true, id: result.meta.last_row_id }, 201);
    }

    const attachmentMatch = url.pathname.match(/^\/api\/attachments\/(\d+)$/);
    if (attachmentMatch && request.method === 'GET') {
      if (!env.DB || !env.FILES) return json({ error: 'D1/R2 bindings are not configured yet.' }, 503);
      const row = await env.DB.prepare('SELECT attachment_key, attachment_name FROM briefs WHERE id = ?').bind(Number(attachmentMatch[1])).first();
      if (!row?.attachment_key) return json({ error: 'Attachment not found.' }, 404);
      const object = await env.FILES.get(row.attachment_key);
      if (!object) return json({ error: 'Attachment not found.' }, 404);
      const headers = new Headers();
      object.writeHttpMetadata(headers);
      headers.set('content-disposition', `attachment; filename="${String(row.attachment_name || 'attachment').replace(/"/g, '')}"`);
      return new Response(object.body, { headers });
    }

    const briefMatch = url.pathname.match(/^\/api\/briefs\/(\d+)$/);
    if (briefMatch && request.method === 'DELETE') {
      if (!env.DB) return json({ error: 'D1 binding DB is not configured yet.' }, 503);
      const id = Number(briefMatch[1]);
      const row = await env.DB.prepare('SELECT attachment_key FROM briefs WHERE id = ?').bind(id).first();
      if (row?.attachment_key && env.FILES) await env.FILES.delete(row.attachment_key);
      await env.DB.prepare('DELETE FROM briefs WHERE id = ?').bind(id).run();
      return json({ ok: true });
    }

    return json({ error: 'Not found.' }, 404);
  }
};
