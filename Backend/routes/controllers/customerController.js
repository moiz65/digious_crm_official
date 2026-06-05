/**
 * Customer Controller
 *
 * Manages the `customers` table – a deduplicated registry of all clients
 * extracted from sales records. Customers are uniquely identified by email.
 *
 * The table is auto-created/migrated at module load (idempotent).
 */

const pool = require('../../config/database');

// ──────────────────────────────────
// Auto-create customers table
// ──────────────────────────────────
const ensureCustomersTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS customers (
      id              INT(11)       NOT NULL AUTO_INCREMENT,
      client_name     VARCHAR(200)  NOT NULL,
      client_email    VARCHAR(200)  NOT NULL,
      client_phone    VARCHAR(50)   DEFAULT NULL,
      client_address  TEXT          DEFAULT NULL,
      total_spent     DECIMAL(14,2) NOT NULL DEFAULT 0.00,
      total_projects  INT(11)       NOT NULL DEFAULT 0,
      first_sale_date DATE          DEFAULT NULL,
      last_sale_date  DATE          DEFAULT NULL,
      created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_customer_email (client_email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  try {
    await pool.query(`
      ALTER TABLE customers
      ADD COLUMN client_address TEXT DEFAULT NULL COMMENT 'Customer billing/mailing address'
    `);
  } catch (err) {
    if (err.code !== 'ER_DUP_FIELDNAME') throw err;
  }

  // Back-fill from existing sales if customers table is empty
  const [countRows] = await pool.query('SELECT COUNT(*) AS cnt FROM customers');
  if (countRows[0].cnt === 0) {
    console.log('📦 Back-filling customers table from existing sales...');
    await pool.query(`
      INSERT INTO customers (client_name, client_email, client_phone, total_spent, total_projects, first_sale_date, last_sale_date)
      SELECT
        SUBSTRING_INDEX(GROUP_CONCAT(s.client_name ORDER BY s.sale_date DESC), ',', 1) AS client_name,
        s.client_email,
        SUBSTRING_INDEX(GROUP_CONCAT(s.client_phone ORDER BY s.sale_date DESC), ',', 1) AS client_phone,
        COALESCE(SUM(s.total_amount), 0) AS total_spent,
        COUNT(*) AS total_projects,
        MIN(s.sale_date) AS first_sale_date,
        MAX(s.sale_date) AS last_sale_date
      FROM sales s
      WHERE s.client_email IS NOT NULL AND s.client_email != ''
      GROUP BY s.client_email
      ON DUPLICATE KEY UPDATE id = id
    `);
    const [filled] = await pool.query('SELECT COUNT(*) AS cnt FROM customers');
    console.log(`✅ Back-filled ${filled[0].cnt} customers from sales data`);
  }
};

ensureCustomersTable().catch(err => console.error('❌ Customers table init error:', err.message));

// ──────────────────────────────────
// Helper: upsert a customer from a sale
// (called by salesController.createSale)
// ──────────────────────────────────
exports.upsertCustomerFromSale = async ({ client_name, client_email, client_phone, total_amount, sale_date }) => {
  if (!client_email || !client_email.trim()) return null;

  try {
    // Check if customer already exists
    const [existing] = await pool.query(
      'SELECT id FROM customers WHERE client_email = ?',
      [client_email.trim().toLowerCase()]
    );

    if (existing.length > 0) {
      // Customer exists – update aggregate fields
      await pool.query(`
        UPDATE customers SET
          client_name    = COALESCE(?, client_name),
          client_phone   = COALESCE(?, client_phone),
          total_spent    = total_spent + ?,
          total_projects = total_projects + 1,
          last_sale_date = GREATEST(COALESCE(last_sale_date, ?), ?),
          updated_at     = CURRENT_TIMESTAMP
        WHERE client_email = ?
      `, [
        client_name || null,
        client_phone || null,
        parseFloat(total_amount) || 0,
        sale_date, sale_date,
        client_email.trim().toLowerCase()
      ]);
      return { id: existing[0].id, isNew: false };
    } else {
      // New customer – insert
      const [result] = await pool.query(`
        INSERT INTO customers (client_name, client_email, client_phone, total_spent, total_projects, first_sale_date, last_sale_date)
        VALUES (?, ?, ?, ?, 1, ?, ?)
      `, [
        client_name,
        client_email.trim().toLowerCase(),
        client_phone || null,
        parseFloat(total_amount) || 0,
        sale_date, sale_date
      ]);
      return { id: result.insertId, isNew: true };
    }
  } catch (err) {
    console.error('upsertCustomerFromSale error:', err.message);
    return null;
  }
};

// ═══════════════════════════════════════════════════════════
// REST ENDPOINTS
// ═══════════════════════════════════════════════════════════

// GET /customers – list all customers with aggregated stats
exports.getCustomers = async (req, res) => {
  try {
    const { search, sort_by, sort_order } = req.query;

    let where = ['1=1'];
    const params = [];

    if (search) {
      where.push('(c.client_name LIKE ? OR c.client_email LIKE ? OR c.client_phone LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    // Allowed sort columns
    const allowedSort = ['client_name', 'client_email', 'total_spent', 'total_projects', 'first_sale_date', 'last_sale_date', 'created_at'];
    const sortCol = allowedSort.includes(sort_by) ? sort_by : 'created_at';
    const sortDir = sort_order?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const [rows] = await pool.query(`
      SELECT
        c.id,
        c.client_name,
        c.client_email,
        c.client_phone,
        c.total_spent,
        c.total_projects,
        c.first_sale_date,
        c.last_sale_date,
        c.created_at
      FROM customers c
      WHERE ${where.join(' AND ')}
      ORDER BY c.${sortCol} ${sortDir}
    `, params);

    // Enrich each customer with categories and payment methods from sales
    if (rows.length > 0) {
      const emails = rows.map(r => r.client_email);
      const placeholders = emails.map(() => '?').join(',');

      // Fetch categories per email
      const [catRows] = await pool.query(`
        SELECT LOWER(s.client_email) AS email, sc.name AS category_name
        FROM sales s
        LEFT JOIN sales_categories sc ON sc.id = s.category_id
        WHERE LOWER(s.client_email) IN (${placeholders})
          AND sc.name IS NOT NULL
        GROUP BY LOWER(s.client_email), sc.name
      `, emails);

      // Fetch payment methods per email (use merchant if payment_method is empty)
      const [pmRows] = await pool.query(`
        SELECT LOWER(s.client_email) AS email,
               COALESCE(NULLIF(s.payment_method, ''), s.merchant) AS pay_method
        FROM sales s
        WHERE LOWER(s.client_email) IN (${placeholders})
          AND (
            (s.payment_method IS NOT NULL AND s.payment_method != '')
            OR (s.merchant IS NOT NULL AND s.merchant != '')
          )
        GROUP BY LOWER(s.client_email), pay_method
      `, emails);

      // Build lookup maps
      const catMap = {};
      catRows.forEach(r => {
        const key = r.email;
        if (!catMap[key]) catMap[key] = [];
        if (!catMap[key].includes(r.category_name)) catMap[key].push(r.category_name);
      });

      const pmMap = {};
      pmRows.forEach(r => {
        const key = r.email;
        if (!pmMap[key]) pmMap[key] = [];
        if (r.pay_method && !pmMap[key].includes(r.pay_method)) pmMap[key].push(r.pay_method);
      });

      // Attach to each customer row
      rows.forEach(row => {
        const email = row.client_email?.toLowerCase();
        row.categories = catMap[email] || [];
        row.payment_methods = pmMap[email] || [];
      });
    }

    // Summary stats
    const [stats] = await pool.query(`
      SELECT
        COUNT(*) AS total_customers,
        COALESCE(SUM(c.total_spent), 0) AS total_revenue,
        COALESCE(SUM(c.total_projects), 0) AS total_projects,
        COUNT(CASE WHEN c.total_projects > 1 THEN 1 END) AS repeat_customers
      FROM customers c
      WHERE ${where.join(' AND ')}
    `, params);

    return res.json({
      success: true,
      data: rows,
      stats: {
        total_customers: stats[0].total_customers,
        total_revenue:   parseFloat(stats[0].total_revenue),
        total_projects:  stats[0].total_projects,
        repeat_customers: stats[0].repeat_customers,
      }
    });
  } catch (err) {
    console.error('getCustomers error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /customers – create a new customer
exports.createCustomer = async (req, res) => {
  try {
    const {
      client_name, name,
      client_email, email,
      client_phone, phone,
      client_address, address,
    } = req.body;

    const cName = (client_name || name || '').trim();
    const cEmail = (client_email || email || '').trim().toLowerCase();
    const cPhone = client_phone || phone || null;
    const cAddress = client_address || address || null;

    if (!cName) {
      return res.status(400).json({ success: false, message: 'Customer name is required' });
    }
    if (!cEmail) {
      return res.status(400).json({ success: false, message: 'Customer email is required' });
    }

    const [existing] = await pool.query(
      'SELECT id FROM customers WHERE client_email = ?',
      [cEmail]
    );
    if (existing.length) {
      return res.status(409).json({ success: false, message: 'A customer with this email already exists' });
    }

    const [result] = await pool.query(
      `INSERT INTO customers (client_name, client_email, client_phone, client_address)
       VALUES (?, ?, ?, ?)`,
      [cName, cEmail, cPhone, cAddress]
    );

    const [rows] = await pool.query('SELECT * FROM customers WHERE id = ?', [result.insertId]);
    const row = rows[0];

    return res.status(201).json({
      success: true,
      message: 'Customer created',
      data: row,
      // Invoice UI client shape
      client: {
        id: row.id,
        name: row.client_name,
        email: row.client_email,
        phone: row.client_phone,
        address: row.client_address,
      },
    });
  } catch (err) {
    console.error('createCustomer error:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'A customer with this email already exists' });
    }
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /customers/:id – single customer detail
exports.getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM customers WHERE id = ?', [id]);

    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('getCustomerById error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /customers/:id/history – full sales history for a customer
exports.getCustomerHistory = async (req, res) => {
  try {
    const { id } = req.params;

    // Get the customer record first
    const [customer] = await pool.query('SELECT * FROM customers WHERE id = ?', [id]);
    if (!customer.length) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const email = customer[0].client_email;

    // Get all sales for this customer by email
    const [sales] = await pool.query(`
      SELECT
        s.id,
        s.employee_name,
        s.employee_email,
        s.client_name,
        s.client_email,
        s.client_phone,
        s.project_description,
        s.total_amount,
        s.upfront_payment,
        s.remaining_balance,
        s.merchant,
        s.payment_method,
        s.account_name,
        s.sale_date,
        s.deadline,
        s.status,
        s.notes,
        s.created_at,
        c.name  AS category_name,
        c.slug  AS category_slug,
        c.icon  AS category_icon,
        c.color AS category_color
      FROM sales s
      LEFT JOIN sales_categories c ON c.id = s.category_id
      WHERE LOWER(s.client_email) = LOWER(?)
      ORDER BY s.sale_date DESC, s.created_at DESC
    `, [email]);

    // Aggregate summary
    const totalSpent    = sales.reduce((sum, s) => sum + parseFloat(s.total_amount || 0), 0);
    const totalUpfront  = sales.reduce((sum, s) => sum + parseFloat(s.upfront_payment || 0), 0);
    const totalRemaining = sales.reduce((sum, s) => sum + parseFloat(s.remaining_balance || 0), 0);

    // Status breakdown
    const statusBreakdown = {};
    sales.forEach(s => {
      statusBreakdown[s.status] = (statusBreakdown[s.status] || 0) + 1;
    });

    // Categories used
    const categories = [...new Set(sales.map(s => s.category_name).filter(Boolean))];

    // Merchants used
    const merchants = [...new Set(sales.map(s => s.merchant).filter(Boolean))];

    // Agents worked with
    const agents = [...new Set(sales.map(s => s.employee_name).filter(Boolean))];

    return res.json({
      success: true,
      customer: customer[0],
      sales,
      summary: {
        total_sales: sales.length,
        total_spent:     totalSpent,
        total_upfront:   totalUpfront,
        total_remaining: totalRemaining,
        status_breakdown: statusBreakdown,
        categories,
        merchants,
        agents,
      }
    });
  } catch (err) {
    console.error('getCustomerHistory error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /customers/:id – update customer info
exports.updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { client_name, client_phone, client_address, address } = req.body;

    const fields = [];
    const values = [];

    if (client_name !== undefined) { fields.push('client_name = ?'); values.push(client_name); }
    if (client_phone !== undefined) { fields.push('client_phone = ?'); values.push(client_phone); }
    if (client_address !== undefined || address !== undefined) {
      fields.push('client_address = ?');
      values.push(client_address ?? address);
    }

    if (!fields.length) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    values.push(id);
    await pool.query(`UPDATE customers SET ${fields.join(', ')} WHERE id = ?`, values);

    const [rows] = await pool.query('SELECT * FROM customers WHERE id = ?', [id]);
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    return res.json({ success: true, message: 'Customer updated', data: rows[0] });
  } catch (err) {
    console.error('updateCustomer error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// DELETE /customers/:id
exports.deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM customers WHERE id = ?', [id]);
    if (!result.affectedRows) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    return res.json({ success: true, message: 'Customer deleted' });
  } catch (err) {
    console.error('deleteCustomer error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /customers/sync – re-sync customers from sales table (admin utility)
exports.syncCustomers = async (req, res) => {
  try {
    const [result] = await pool.query(`
      INSERT INTO customers (client_name, client_email, client_phone, total_spent, total_projects, first_sale_date, last_sale_date)
      SELECT
        SUBSTRING_INDEX(GROUP_CONCAT(s.client_name ORDER BY s.sale_date DESC), ',', 1),
        LOWER(TRIM(s.client_email)),
        SUBSTRING_INDEX(GROUP_CONCAT(s.client_phone ORDER BY s.sale_date DESC), ',', 1),
        COALESCE(SUM(s.total_amount), 0),
        COUNT(*),
        MIN(s.sale_date),
        MAX(s.sale_date)
      FROM sales s
      WHERE s.client_email IS NOT NULL AND TRIM(s.client_email) != ''
      GROUP BY LOWER(TRIM(s.client_email))
      ON DUPLICATE KEY UPDATE
        client_name    = VALUES(client_name),
        client_phone   = VALUES(client_phone),
        total_spent    = VALUES(total_spent),
        total_projects = VALUES(total_projects),
        first_sale_date = VALUES(first_sale_date),
        last_sale_date  = VALUES(last_sale_date)
    `);

    const [count] = await pool.query('SELECT COUNT(*) AS cnt FROM customers');
    return res.json({
      success: true,
      message: `Sync complete. ${count[0].cnt} customers in database.`,
      total: count[0].cnt
    });
  } catch (err) {
    console.error('syncCustomers error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
