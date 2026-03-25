/**
 * Expense Controller
 *
 * Categories endpoints:
 *   GET    /api/v1/expenses/categories          – list all ACTIVE categories only
 *   POST   /api/v1/expenses/categories          – create a category
 *   PUT    /api/v1/expenses/categories/:id      – update a category (or toggle active/inactive)
 *   DELETE /api/v1/expenses/categories/:id      – hard-delete a category permanently from database
 *
 * Expenses endpoints:
 *   GET    /api/v1/expenses                     – list expenses (filters: from, to, category_id, search)
 *   POST   /api/v1/expenses                     – create expense
 *   PUT    /api/v1/expenses/:id                 – update expense
 *   DELETE /api/v1/expenses/:id                 – delete expense
 *   GET    /api/v1/expenses/summary             – total for current filters
 */

const pool = require('../../config/database');

// ─────────────────────────────────────────────────────────
// Ensure tables exist (idempotent – safe to call every time)
// ─────────────────────────────────────────────────────────
const ensureTables = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS expense_categories (
      id          INT(11)      NOT NULL AUTO_INCREMENT,
      name        VARCHAR(100) NOT NULL,
      description VARCHAR(255) DEFAULT NULL,
      color       VARCHAR(20)  DEFAULT '#3B82F6',
      is_active   TINYINT(1)   NOT NULL DEFAULT 1,
      created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_category_name (name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS expenses (
      id            INT(11)       NOT NULL AUTO_INCREMENT,
      category_id   INT(11)       DEFAULT NULL,
      category_name VARCHAR(100)  NOT NULL,
      amount        DECIMAL(12,2) NOT NULL,
      note          TEXT          DEFAULT NULL,
      expense_date  DATE          NOT NULL,
      expense_time  TIME          NOT NULL,
      created_by    INT(11)       DEFAULT NULL,
      created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_expense_date (expense_date),
      KEY idx_category_id  (category_id),
      CONSTRAINT fk_expense_category
        FOREIGN KEY (category_id) REFERENCES expense_categories (id)
        ON DELETE SET NULL ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
};

// Run once at module load
ensureTables().catch(err => console.error('❌ Expense tables init error:', err.message));

// ─────────────────────────────────────────────────────────
// CATEGORIES
// ─────────────────────────────────────────────────────────

// GET /categories – Returns ONLY ACTIVE categories
exports.getCategories = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, name, description, color, is_active, created_at
       FROM expense_categories
       WHERE is_active = 1
       ORDER BY name ASC`
    );
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('getCategories error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /categories
exports.createCategory = async (req, res) => {
  try {
    const { name, description = '', color = '#3B82F6' } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }

    const [result] = await pool.query(
      `INSERT INTO expense_categories (name, description, color) VALUES (?, ?, ?)`,
      [name.trim(), description.trim(), color]
    );

    const [rows] = await pool.query(
      `SELECT id, name, description, color, is_active FROM expense_categories WHERE id = ?`,
      [result.insertId]
    );

    return res.status(201).json({ success: true, message: 'Category created', data: rows[0] });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'Category name already exists' });
    }
    console.error('createCategory error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /categories/:id
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, color, is_active } = req.body;

    const fields = [];
    const values = [];

    if (name !== undefined)        { fields.push('name = ?');        values.push(name.trim()); }
    if (description !== undefined)  { fields.push('description = ?');  values.push(description); }
    if (color !== undefined)        { fields.push('color = ?');        values.push(color); }
    if (is_active !== undefined)    { fields.push('is_active = ?');    values.push(is_active ? 1 : 0); }

    if (!fields.length) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    values.push(id);
    await pool.query(`UPDATE expense_categories SET ${fields.join(', ')} WHERE id = ?`, values);

    const [rows] = await pool.query(
      `SELECT id, name, description, color, is_active FROM expense_categories WHERE id = ?`, [id]
    );

    return res.json({ success: true, message: 'Category updated', data: rows[0] });
  } catch (err) {
    console.error('updateCategory error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// DELETE /categories/:id  (hard-delete from database)
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query(`DELETE FROM expense_categories WHERE id = ?`, [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    return res.json({ success: true, message: 'Category deleted permanently' });
  } catch (err) {
    console.error('deleteCategory error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete category. It may be linked to expenses.' });
  }
};

// ─────────────────────────────────────────────────────────
// EXPENSES
// ─────────────────────────────────────────────────────────

// GET /  (with optional query params: from, to, category_id, search)
exports.getExpenses = async (req, res) => {
  try {
    const { from, to, category_id, search } = req.query;

    let where = ['1=1'];
    const params = [];

    if (from)        { where.push('e.expense_date >= ?'); params.push(from); }
    if (to)          { where.push('e.expense_date <= ?'); params.push(to); }
    if (category_id) { where.push('e.category_id = ?');   params.push(category_id); }
    if (search)      {
      where.push('(e.category_name LIKE ? OR e.note LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    const [rows] = await pool.query(
      `SELECT e.id,
              e.category_id,
              e.category_name,
              e.amount,
              e.note,
              e.expense_date,
              e.expense_time,
              e.created_at,
              c.color AS category_color
       FROM   expenses e
       LEFT   JOIN expense_categories c ON c.id = e.category_id
       WHERE  ${where.join(' AND ')}
       ORDER  BY e.expense_date DESC, e.expense_time DESC`,
      params
    );

    // Also return the total
    const [totalRows] = await pool.query(
      `SELECT COALESCE(SUM(e.amount), 0) AS total
       FROM   expenses e
       WHERE  ${where.join(' AND ')}`,
      params
    );

    return res.json({
      success: true,
      data: rows,
      total: parseFloat(totalRows[0].total),
      count: rows.length
    });
  } catch (err) {
    console.error('getExpenses error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /
exports.createExpense = async (req, res) => {
  try {
    const { category_id, amount, note = '' } = req.body;

    if (!category_id || !amount) {
      return res.status(400).json({ success: false, message: 'category_id and amount are required' });
    }

    // Fetch category name for denormalization
    const [cats] = await pool.query(
      `SELECT name FROM expense_categories WHERE id = ? AND is_active = 1`, [category_id]
    );
    if (!cats.length) {
      return res.status(404).json({ success: false, message: 'Category not found or inactive' });
    }

    const now = new Date();
    // Accept custom date from request body; fall back to today
    const expense_date = req.body.expense_date || now.toISOString().slice(0, 10);
    const expense_time = req.body.expense_time || now.toTimeString().slice(0, 8);

    const [result] = await pool.query(
      `INSERT INTO expenses (category_id, category_name, amount, note, expense_date, expense_time, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [category_id, cats[0].name, parseFloat(amount), note.trim(), expense_date, expense_time, req.user?.userId || req.user?.id || null]
    );

    const [rows] = await pool.query(
      `SELECT e.*, c.color AS category_color
       FROM expenses e
       LEFT JOIN expense_categories c ON c.id = e.category_id
       WHERE e.id = ?`,
      [result.insertId]
    );

    return res.status(201).json({ success: true, message: 'Expense created', data: rows[0] });
  } catch (err) {
    console.error('createExpense error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /:id
exports.updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { category_id, amount, note, expense_date, expense_time } = req.body;

    const fields = [];
    const values = [];

    if (category_id !== undefined) {
      const [cats] = await pool.query(
        `SELECT name FROM expense_categories WHERE id = ? AND is_active = 1`, [category_id]
      );
      if (!cats.length) {
        return res.status(404).json({ success: false, message: 'Category not found or inactive' });
      }
      fields.push('category_id = ?', 'category_name = ?');
      values.push(category_id, cats[0].name);
    }
    if (amount !== undefined) { fields.push('amount = ?'); values.push(parseFloat(amount)); }
    if (note   !== undefined) { fields.push('note = ?');   values.push(note.trim()); }
    if (expense_date !== undefined) { fields.push('expense_date = ?'); values.push(expense_date); }
    if (expense_time !== undefined) { fields.push('expense_time = ?'); values.push(expense_time); }

    if (!fields.length) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    values.push(id);
    await pool.query(`UPDATE expenses SET ${fields.join(', ')} WHERE id = ?`, values);

    const [rows] = await pool.query(
      `SELECT e.*, c.color AS category_color FROM expenses e
       LEFT JOIN expense_categories c ON c.id = e.category_id WHERE e.id = ?`, [id]
    );

    return res.json({ success: true, message: 'Expense updated', data: rows[0] });
  } catch (err) {
    console.error('updateExpense error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// DELETE /:id
exports.deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query(`DELETE FROM expenses WHERE id = ?`, [id]);
    if (!result.affectedRows) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }
    return res.json({ success: true, message: 'Expense deleted' });
  } catch (err) {
    console.error('deleteExpense error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /summary/monthly — Monthly totals for last 12 months
exports.getMonthlySummary = async (req, res) => {
  try {
    await ensureExpenseTables();

    const [rows] = await pool.query(`
      SELECT 
        DATE_FORMAT(expense_date, '%Y-%m') AS month_key,
        DATE_FORMAT(expense_date, '%M %Y') AS month_label,
        YEAR(expense_date) AS year,
        MONTH(expense_date) AS month,
        SUM(amount) AS total,
        COUNT(*) AS count
      FROM expenses
      WHERE expense_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
      GROUP BY month_key, month_label, year, month
      ORDER BY year DESC, month DESC
    `);

    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('getMonthlySummary error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
