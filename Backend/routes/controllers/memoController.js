const pool = require('../../config/database');

// =====================================================
// MEMOS CONTROLLER
// =====================================================
// HR/Admin: full CRUD
// Employee:  read-only (own department + "all" memos)
// =====================================================

/**
 * Generate a unique memo number like MEMO-2026-A3F
 */
const generateMemoNumber = () => {
  const year = new Date().getFullYear();
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let suffix = '';
  for (let i = 0; i < 3; i++) suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  return `MEMO-${year}-${suffix}`;
};

// ── GET /memos/all ──────────────────────────────────────────
// HR/Admin view — returns every memo
exports.getAllMemos = async (req, res) => {
  try {
    const { category, target_type, target_department, is_active, search } = req.query;

    let sql = `SELECT * FROM memos WHERE 1=1`;
    const params = [];

    if (category) { sql += ` AND category = ?`; params.push(category); }
    if (target_type) { sql += ` AND target_type = ?`; params.push(target_type); }
    if (target_department) { sql += ` AND target_department = ?`; params.push(target_department); }
    if (is_active !== undefined) { sql += ` AND is_active = ?`; params.push(Number(is_active)); }
    if (search) {
      sql += ` AND (title LIKE ? OR content LIKE ? OR memo_number LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    sql += ` ORDER BY created_at DESC`;

    const [rows] = await pool.query(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('getAllMemos error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch memos' });
  }
};

// ── GET /memos/employee/:employeeId ─────────────────────────
// Returns memos visible to a given employee (target_type=all OR matching department)
exports.getEmployeeMemos = async (req, res) => {
  try {
    const { employeeId } = req.params;

    // Look up the employee's department
    const [empRows] = await pool.query(
      `SELECT department FROM employee_onboarding WHERE employee_id = ? LIMIT 1`,
      [employeeId]
    );
    const department = empRows.length > 0 ? empRows[0].department : null;

    let sql = `SELECT * FROM memos WHERE is_active = 1 AND (target_type = 'all'`;
    const params = [];
    if (department) {
      sql += ` OR (target_type = 'department' AND target_department = ?)`;
      params.push(department);
    }
    sql += `) ORDER BY created_at DESC`;

    const [rows] = await pool.query(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('getEmployeeMemos error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch memos' });
  }
};

// ── GET /memos/:id ──────────────────────────────────────────
exports.getMemoById = async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT * FROM memos WHERE id = ?`, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Memo not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('getMemoById error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch memo' });
  }
};

// ── POST /memos ─────────────────────────────────────────────
exports.createMemo = async (req, res) => {
  try {
    const {
      title, content, category, priority,
      target_type, target_department,
      effective_date, expiry_date,
    } = req.body;

    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content are required' });
    }
    if (target_type === 'department' && !target_department) {
      return res.status(400).json({ success: false, message: 'Department is required for department-targeted memos' });
    }

    const user = req.user; // from auth middleware
    const memo_number = generateMemoNumber();

    const [result] = await pool.query(
      `INSERT INTO memos
        (memo_number, title, content, category, priority,
         target_type, target_department,
         created_by_employee_id, created_by_name,
         effective_date, expiry_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        memo_number,
        title,
        content,
        category || 'general',
        priority || 'medium',
        target_type || 'all',
        target_type === 'department' ? target_department : null,
        user.employeeId || user.id,
        user.name || 'HR',
        effective_date || null,
        expiry_date || null,
      ]
    );

    const [created] = await pool.query(`SELECT * FROM memos WHERE id = ?`, [result.insertId]);
    res.status(201).json({ success: true, message: 'Memo created', data: created[0] });
  } catch (err) {
    console.error('createMemo error:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      // Memo number collision — retry once
      return exports.createMemo(req, res);
    }
    res.status(500).json({ success: false, message: 'Failed to create memo' });
  }
};

// ── PUT /memos/:id ──────────────────────────────────────────
exports.updateMemo = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title, content, category, priority,
      target_type, target_department,
      effective_date, expiry_date, is_active,
    } = req.body;

    const fields = [];
    const params = [];

    if (title !== undefined) { fields.push('title = ?'); params.push(title); }
    if (content !== undefined) { fields.push('content = ?'); params.push(content); }
    if (category !== undefined) { fields.push('category = ?'); params.push(category); }
    if (priority !== undefined) { fields.push('priority = ?'); params.push(priority); }
    if (target_type !== undefined) { fields.push('target_type = ?'); params.push(target_type); }
    if (target_department !== undefined) { fields.push('target_department = ?'); params.push(target_department); }
    if (effective_date !== undefined) { fields.push('effective_date = ?'); params.push(effective_date || null); }
    if (expiry_date !== undefined) { fields.push('expiry_date = ?'); params.push(expiry_date || null); }
    if (is_active !== undefined) { fields.push('is_active = ?'); params.push(Number(is_active)); }

    if (fields.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    params.push(id);
    await pool.query(`UPDATE memos SET ${fields.join(', ')} WHERE id = ?`, params);

    const [updated] = await pool.query(`SELECT * FROM memos WHERE id = ?`, [id]);
    if (updated.length === 0) return res.status(404).json({ success: false, message: 'Memo not found' });

    res.json({ success: true, message: 'Memo updated', data: updated[0] });
  } catch (err) {
    console.error('updateMemo error:', err);
    res.status(500).json({ success: false, message: 'Failed to update memo' });
  }
};

// ── DELETE /memos/:id ───────────────────────────────────────
exports.deleteMemo = async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await pool.query(`SELECT id FROM memos WHERE id = ?`, [id]);
    if (existing.length === 0) return res.status(404).json({ success: false, message: 'Memo not found' });

    await pool.query(`DELETE FROM memos WHERE id = ?`, [id]);
    res.json({ success: true, message: 'Memo deleted' });
  } catch (err) {
    console.error('deleteMemo error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete memo' });
  }
};

// ── GET /memos/departments ──────────────────────────────────
// Returns distinct departments from employee_onboarding for the UI dropdown
exports.getDepartments = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT DISTINCT department FROM employee_onboarding WHERE status = 'Active' ORDER BY department`
    );
    res.json({ success: true, data: rows.map(r => r.department) });
  } catch (err) {
    console.error('getDepartments error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch departments' });
  }
};
