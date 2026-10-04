// Best-effort audit trail. Writes to audit_logs but NEVER breaks the
// request it instruments — auditing must not take down operations.
async function logAudit(actorId, action, entity, entityId, meta) {
  try {
    const db = require('./db');
    await db.query(
      `INSERT INTO audit_logs (actor_id, action, entity, entity_id, meta)
       VALUES ($1, $2, $3, $4, $5::jsonb)`,
      [actorId || null, action, entity || null, entityId || null, meta ? JSON.stringify(meta).slice(0, 4000) : null]
    );
  } catch (e) {
    console.warn('audit write skipped:', e.message);
  }
}

module.exports = { logAudit };
