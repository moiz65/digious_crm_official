/**
 * Sales Controller
 *
 * Two tables:
 *   sales_categories – lookup table for project categories
 *   sales            – every sale/project record tied to an employee
 *
 * Tables are auto-created at module load (idempotent).
 */

const pool = require('../../config/database');
const { upsertCustomerFromSale } = require('./customerController');

// ─────────────────────────────────────────────────────────
// Ensure tables exist (idempotent – safe to call every time)
// ─────────────────────────────────────────────────────────
const ensureTables = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sales_categories (
      id          INT(11)       NOT NULL AUTO_INCREMENT,
      name        VARCHAR(100)  NOT NULL,
      slug        VARCHAR(100)  NOT NULL,
      description VARCHAR(255)  DEFAULT NULL,
      icon        VARCHAR(50)   DEFAULT 'Globe',
      color       VARCHAR(30)   DEFAULT '#3B82F6',
      is_active   TINYINT(1)    NOT NULL DEFAULT 1,
      created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_sales_cat_slug (slug)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // Seed default categories if the table is empty
  const [catRows] = await pool.query('SELECT COUNT(*) AS cnt FROM sales_categories');
  if (catRows[0].cnt === 0) {
    await pool.query(`
      INSERT INTO sales_categories (name, slug, icon, color) VALUES
        ('Website Design',  'website-design',  'Globe',        '#3B82F6'),
        ('Logo Design',     'logo-design',     'Palette',      '#8B5CF6'),
        ('Branding',        'branding',        'PenTool',      '#6366F1'),
        ('Marketing',       'marketing',       'Megaphone',    '#F97316'),
        ('Development',     'development',     'Code',         '#10B981'),
        ('E-commerce',      'ecommerce',       'ShoppingCart',  '#EC4899'),
        ('Photography',     'photography',     'Camera',       '#EAB308'),
        ('Graphic Design',  'graphic-design',  'Layout',       '#EF4444')
    `);
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS sales (
      id                  INT(11)        NOT NULL AUTO_INCREMENT,
      employee_id         INT(11)        NOT NULL,
      employee_name       VARCHAR(150)   DEFAULT NULL,
      employee_email      VARCHAR(150)   DEFAULT NULL,

      -- Client info
      client_name         VARCHAR(200)   NOT NULL,
      client_email        VARCHAR(200)   DEFAULT NULL,
      client_phone        VARCHAR(50)    DEFAULT NULL,

      -- Project info
      category_id         INT(11)        DEFAULT NULL,
      category_slug       VARCHAR(100)   DEFAULT NULL,
      project_description TEXT           DEFAULT NULL,

      -- Financials
      total_amount        DECIMAL(12,2)  NOT NULL DEFAULT 0.00,
      upfront_payment     DECIMAL(12,2)  NOT NULL DEFAULT 0.00,
      remaining_balance   DECIMAL(12,2)  GENERATED ALWAYS AS (total_amount - upfront_payment) STORED,

      -- Payment metadata
      merchant            VARCHAR(50)    DEFAULT NULL,
      payment_method      VARCHAR(50)    DEFAULT NULL,
      account_name        VARCHAR(200)   DEFAULT NULL,

      -- Dates
      sale_date           DATE           NOT NULL,
      deadline            DATE           DEFAULT NULL,

      -- Status
      status              ENUM('pending','in-progress','completed','cancelled','refunded')
                          NOT NULL DEFAULT 'pending',
      notes               TEXT           DEFAULT NULL,

      -- Audit
      created_by          INT(11)        DEFAULT NULL,
      created_at          TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at          TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

      PRIMARY KEY (id),
      KEY idx_sales_employee  (employee_id),
      KEY idx_sales_date      (sale_date),
      KEY idx_sales_status    (status),
      KEY idx_sales_category  (category_id),
      CONSTRAINT fk_sales_category
        FOREIGN KEY (category_id) REFERENCES sales_categories (id)
        ON DELETE SET NULL ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
};

// Run once at module load
ensureTables().catch(err => console.error('❌ Sales tables init error:', err.message));

// ═══════════════════════════════════════════════════════════
// CATEGORIES
// ═══════════════════════════════════════════════════════════

// GET /categories
exports.getCategories = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, name, slug, description, icon, color, is_active, created_at
       FROM sales_categories
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
    const { name, description = '', icon = 'Globe', color = '#3B82F6' } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }
    const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const [result] = await pool.query(
      `INSERT INTO sales_categories (name, slug, description, icon, color) VALUES (?, ?, ?, ?, ?)`,
      [name.trim(), slug, description.trim(), icon, color]
    );

    const [rows] = await pool.query(`SELECT * FROM sales_categories WHERE id = ?`, [result.insertId]);
    return res.status(201).json({ success: true, message: 'Category created', data: rows[0] });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'Category slug already exists' });
    }
    console.error('createCategory error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /categories/:id
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, icon, color, is_active } = req.body;

    const fields = [];
    const values = [];

    if (name !== undefined) {
      fields.push('name = ?', 'slug = ?');
      values.push(name.trim());
      values.push(name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
    }
    if (description !== undefined) { fields.push('description = ?'); values.push(description); }
    if (icon !== undefined)        { fields.push('icon = ?');        values.push(icon); }
    if (color !== undefined)       { fields.push('color = ?');       values.push(color); }
    if (is_active !== undefined)   { fields.push('is_active = ?');   values.push(is_active ? 1 : 0); }

    if (!fields.length) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    values.push(id);
    await pool.query(`UPDATE sales_categories SET ${fields.join(', ')} WHERE id = ?`, values);

    const [rows] = await pool.query(`SELECT * FROM sales_categories WHERE id = ?`, [id]);
    return res.json({ success: true, message: 'Category updated', data: rows[0] });
  } catch (err) {
    console.error('updateCategory error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// DELETE /categories/:id
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query(`DELETE FROM sales_categories WHERE id = ?`, [id]);
    if (!result.affectedRows) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    return res.json({ success: true, message: 'Category deleted' });
  } catch (err) {
    console.error('deleteCategory error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete category. It may be linked to sales.' });
  }
};

// ═══════════════════════════════════════════════════════════
// SALES – CRUD
// ═══════════════════════════════════════════════════════════

// GET / (all sales – with filters)
exports.getSales = async (req, res) => {
  try {
    const { from, to, category_id, status, employee_id, search } = req.query;

    let where = ['1=1'];
    const params = [];

    if (from)         { where.push('s.sale_date >= ?');   params.push(from); }
    if (to)           { where.push('s.sale_date <= ?');   params.push(to); }
    if (category_id)  { where.push('s.category_id = ?');  params.push(category_id); }
    if (status)       { where.push('s.status = ?');       params.push(status); }
    if (employee_id)  { where.push('s.employee_id = ?');  params.push(employee_id); }
    if (search) {
      where.push('(s.client_name LIKE ? OR s.client_email LIKE ? OR s.project_description LIKE ? OR s.employee_name LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    const [rows] = await pool.query(
      `SELECT s.*,
              c.name  AS category_name,
              c.slug  AS cat_slug,
              c.icon  AS category_icon,
              c.color AS category_color
       FROM   sales s
       LEFT   JOIN sales_categories c ON c.id = s.category_id
       WHERE  ${where.join(' AND ')}
       ORDER  BY s.sale_date DESC, s.created_at DESC`,
      params
    );

    // Totals for current filter
    const [totals] = await pool.query(
      `SELECT
         COALESCE(SUM(s.total_amount), 0)    AS total_sales,
         COALESCE(SUM(s.upfront_payment), 0) AS total_upfront,
         COALESCE(SUM(s.total_amount - s.upfront_payment), 0) AS total_remaining,
         COUNT(*) AS count,
         SUM(CASE WHEN s.status = 'completed'   THEN 1 ELSE 0 END) AS completed,
         SUM(CASE WHEN s.status = 'in-progress'  THEN 1 ELSE 0 END) AS in_progress,
         SUM(CASE WHEN s.status = 'pending'      THEN 1 ELSE 0 END) AS pending,
         SUM(CASE WHEN s.status = 'cancelled'    THEN 1 ELSE 0 END) AS cancelled,
         SUM(CASE WHEN s.status = 'refunded'     THEN 1 ELSE 0 END) AS refunded
       FROM sales s
       WHERE ${where.join(' AND ')}`,
      params
    );

    return res.json({
      success: true,
      data: rows,
      totals: {
        total_sales:     parseFloat(totals[0].total_sales),
        total_upfront:   parseFloat(totals[0].total_upfront),
        total_remaining: parseFloat(totals[0].total_remaining),
        count:           totals[0].count,
        completed:       totals[0].completed,
        in_progress:     totals[0].in_progress,
        pending:         totals[0].pending,
        cancelled:       totals[0].cancelled,
        refunded:        totals[0].refunded,
      }
    });
  } catch (err) {
    console.error('getSales error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /my-sales (employee's own sales via JWT)
exports.getMySales = async (req, res) => {
  try {
    const employeeId = req.user?.employeeId || req.user?.id;
    if (!employeeId) {
      return res.status(400).json({ success: false, message: 'Employee ID not found in token' });
    }

    const { from, to, status, category_id } = req.query;

    let where = ['s.employee_id = ?'];
    const params = [employeeId];

    if (from)         { where.push('s.sale_date >= ?');   params.push(from); }
    if (to)           { where.push('s.sale_date <= ?');   params.push(to); }
    if (status)       { where.push('s.status = ?');       params.push(status); }
    if (category_id)  { where.push('s.category_id = ?');  params.push(category_id); }

    const [rows] = await pool.query(
      `SELECT s.*,
              c.name  AS category_name,
              c.slug  AS cat_slug,
              c.icon  AS category_icon,
              c.color AS category_color
       FROM   sales s
       LEFT   JOIN sales_categories c ON c.id = s.category_id
       WHERE  ${where.join(' AND ')}
       ORDER  BY s.sale_date DESC, s.created_at DESC`,
      params
    );

    const [totals] = await pool.query(
      `SELECT
         COALESCE(SUM(s.total_amount), 0)    AS total_sales,
         COALESCE(SUM(s.upfront_payment), 0) AS total_upfront,
         COALESCE(SUM(s.total_amount - s.upfront_payment), 0) AS total_remaining,
         COUNT(*) AS count,
         SUM(CASE WHEN s.status = 'completed'   THEN 1 ELSE 0 END) AS completed,
         SUM(CASE WHEN s.status = 'in-progress'  THEN 1 ELSE 0 END) AS in_progress,
         SUM(CASE WHEN s.status = 'pending'      THEN 1 ELSE 0 END) AS pending,
         SUM(CASE WHEN s.status = 'cancelled'    THEN 1 ELSE 0 END) AS cancelled
       FROM sales s
       WHERE ${where.join(' AND ')}`,
      params
    );

    return res.json({
      success: true,
      data: rows,
      totals: {
        total_sales:     parseFloat(totals[0].total_sales),
        total_upfront:   parseFloat(totals[0].total_upfront),
        total_remaining: parseFloat(totals[0].total_remaining),
        count:           totals[0].count,
        completed:       totals[0].completed,
        in_progress:     totals[0].in_progress,
        pending:         totals[0].pending,
        cancelled:       totals[0].cancelled,
      }
    });
  } catch (err) {
    console.error('getMySales error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /summary – aggregated stats (admin / HR view)
exports.getSalesSummary = async (req, res) => {
  try {
    const { from, to, employee_id } = req.query;

    let where = ['1=1'];
    const params = [];
    if (from)        { where.push('s.sale_date >= ?');  params.push(from); }
    if (to)          { where.push('s.sale_date <= ?');  params.push(to); }
    if (employee_id) { where.push('s.employee_id = ?'); params.push(employee_id); }

    const whereStr = where.join(' AND ');

    // Overall totals
    const [overall] = await pool.query(
      `SELECT
         COALESCE(SUM(s.total_amount), 0)    AS total_sales,
         COALESCE(SUM(s.upfront_payment), 0) AS total_upfront,
         COALESCE(SUM(s.total_amount - s.upfront_payment), 0) AS total_remaining,
         COUNT(*) AS count
       FROM sales s WHERE ${whereStr}`, params
    );

    // By status
    const [byStatus] = await pool.query(
      `SELECT s.status, COUNT(*) AS count, COALESCE(SUM(s.total_amount),0) AS amount
       FROM sales s WHERE ${whereStr} GROUP BY s.status`, params
    );

    // By category
    const [byCategory] = await pool.query(
      `SELECT c.name AS category, c.color, COUNT(*) AS count, COALESCE(SUM(s.total_amount),0) AS amount
       FROM sales s LEFT JOIN sales_categories c ON c.id = s.category_id
       WHERE ${whereStr} GROUP BY s.category_id, c.name, c.color`, params
    );

    // By employee (top sellers)
    const [byEmployee] = await pool.query(
      `SELECT s.employee_id, s.employee_name, COUNT(*) AS count, COALESCE(SUM(s.total_amount),0) AS amount
       FROM sales s WHERE ${whereStr} GROUP BY s.employee_id, s.employee_name
       ORDER BY amount DESC LIMIT 10`, params
    );

    // Monthly trend (last 12 months)
    const [trend] = await pool.query(
      `SELECT DATE_FORMAT(s.sale_date, '%Y-%m') AS month,
              COUNT(*) AS count,
              COALESCE(SUM(s.total_amount), 0) AS amount
       FROM sales s WHERE ${whereStr}
       GROUP BY month ORDER BY month DESC LIMIT 12`, params
    );

    return res.json({
      success: true,
      data: {
        overall: {
          total_sales:     parseFloat(overall[0].total_sales),
          total_upfront:   parseFloat(overall[0].total_upfront),
          total_remaining: parseFloat(overall[0].total_remaining),
          count:           overall[0].count,
        },
        byStatus,
        byCategory,
        byEmployee,
        trend: trend.reverse(),
      }
    });
  } catch (err) {
    console.error('getSalesSummary error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /:id
exports.getSaleById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      `SELECT s.*,
              c.name AS category_name, c.slug AS cat_slug,
              c.icon AS category_icon, c.color AS category_color
       FROM sales s
       LEFT JOIN sales_categories c ON c.id = s.category_id
       WHERE s.id = ?`,
      [id]
    );
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Sale not found' });
    }
    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('getSaleById error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /
exports.createSale = async (req, res) => {
  try {
    const {
      employee_id,
      employee_name,
      employee_email,
      client_name,
      client_email,
      client_phone,
      category_id,
      category_slug,
      project_description,
      total_amount,
      upfront_payment,
      merchant,
      payment_method,
      account_name,
      sale_date,
      deadline,
      status = 'pending',
      notes,
    } = req.body;

    // Basic validation
    if (!client_name || !total_amount || !sale_date) {
      return res.status(400).json({
        success: false,
        message: 'client_name, total_amount, and sale_date are required'
      });
    }

    // Derive employee info from token if not provided
    const empId    = employee_id    || req.user?.employeeId || req.user?.id;
    const empName  = employee_name  || req.user?.name  || null;
    const empEmail = employee_email || req.user?.email || null;

    const [result] = await pool.query(
      `INSERT INTO sales
        (employee_id, employee_name, employee_email,
         client_name, client_email, client_phone,
         category_id, category_slug, project_description,
         total_amount, upfront_payment,
         merchant, payment_method, account_name,
         sale_date, deadline, status, notes, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        empId, empName, empEmail,
        client_name, client_email || null, client_phone || null,
        category_id || null, category_slug || null, project_description || null,
        parseFloat(total_amount), parseFloat(upfront_payment || 0),
        merchant || null, payment_method || null, account_name || null,
        sale_date, deadline || null, status, notes || null,
        req.user?.userId || req.user?.id || null
      ]
    );

    const [rows] = await pool.query(
      `SELECT s.*, c.name AS category_name, c.slug AS cat_slug, c.icon AS category_icon, c.color AS category_color
       FROM sales s LEFT JOIN sales_categories c ON c.id = s.category_id
       WHERE s.id = ?`,
      [result.insertId]
    );

    // Auto-upsert customer (skip if no email)
    try {
      await upsertCustomerFromSale({
        client_name:  client_name,
        client_email: client_email,
        client_phone: client_phone,
        total_amount: total_amount,
        sale_date:    sale_date,
      });
    } catch (custErr) {
      console.error('⚠️ Customer upsert warning (non-blocking):', custErr.message);
    }

    return res.status(201).json({ success: true, message: 'Sale created', data: rows[0] });
  } catch (err) {
    console.error('createSale error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /:id
exports.updateSale = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      client_name, client_email, client_phone,
      category_id, category_slug, project_description,
      total_amount, upfront_payment,
      merchant, payment_method, account_name,
      sale_date, deadline, status, notes,
    } = req.body;

    const fields = [];
    const values = [];

    if (client_name !== undefined)          { fields.push('client_name = ?');          values.push(client_name); }
    if (client_email !== undefined)         { fields.push('client_email = ?');         values.push(client_email); }
    if (client_phone !== undefined)         { fields.push('client_phone = ?');         values.push(client_phone); }
    if (category_id !== undefined)          { fields.push('category_id = ?');          values.push(category_id); }
    if (category_slug !== undefined)        { fields.push('category_slug = ?');        values.push(category_slug); }
    if (project_description !== undefined)  { fields.push('project_description = ?');  values.push(project_description); }
    if (total_amount !== undefined)         { fields.push('total_amount = ?');         values.push(parseFloat(total_amount)); }
    if (upfront_payment !== undefined)      { fields.push('upfront_payment = ?');      values.push(parseFloat(upfront_payment)); }
    if (merchant !== undefined)             { fields.push('merchant = ?');             values.push(merchant); }
    if (payment_method !== undefined)       { fields.push('payment_method = ?');       values.push(payment_method); }
    if (account_name !== undefined)         { fields.push('account_name = ?');         values.push(account_name); }
    if (sale_date !== undefined)            { fields.push('sale_date = ?');            values.push(sale_date); }
    if (deadline !== undefined)             { fields.push('deadline = ?');             values.push(deadline); }
    if (status !== undefined)               { fields.push('status = ?');               values.push(status); }
    if (notes !== undefined)                { fields.push('notes = ?');                values.push(notes); }

    if (!fields.length) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    values.push(id);
    await pool.query(`UPDATE sales SET ${fields.join(', ')} WHERE id = ?`, values);

    const [rows] = await pool.query(
      `SELECT s.*, c.name AS category_name, c.slug AS cat_slug, c.icon AS category_icon, c.color AS category_color
       FROM sales s LEFT JOIN sales_categories c ON c.id = s.category_id
       WHERE s.id = ?`, [id]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Sale not found' });
    }

    return res.json({ success: true, message: 'Sale updated', data: rows[0] });
  } catch (err) {
    console.error('updateSale error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// DELETE /:id
exports.deleteSale = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query(`DELETE FROM sales WHERE id = ?`, [id]);
    if (!result.affectedRows) {
      return res.status(404).json({ success: false, message: 'Sale not found' });
    }
    return res.json({ success: true, message: 'Sale deleted' });
  } catch (err) {
    console.error('deleteSale error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
