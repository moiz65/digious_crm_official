/**
 * Invoice Controller
 *
 * Full CRUD for invoices + line items.
 * Clients are sourced from the existing `customers` table.
 */

const pool = require('../../config/database');

// ──────────────────────────────────
// Auto-create tables (idempotent)
// ──────────────────────────────────
const ensureInvoiceTables = async () => {
  // Add address to customers if missing
  try {
    await pool.query(`
      ALTER TABLE customers
      ADD COLUMN client_address TEXT DEFAULT NULL COMMENT 'Customer billing/mailing address'
    `);
  } catch (err) {
    if (err.code !== 'ER_DUP_FIELDNAME') throw err;
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS invoices (
      id                    INT(11)        NOT NULL AUTO_INCREMENT,
      invoice_number        VARCHAR(30)    NOT NULL,
      customer_id           INT(11)        DEFAULT NULL,
      client_name           VARCHAR(200)   NOT NULL,
      client_email          VARCHAR(200)   NOT NULL,
      client_phone          VARCHAR(50)    DEFAULT NULL,
      client_address        TEXT           DEFAULT NULL,
      project_title         VARCHAR(255)   NOT NULL,
      issue_date            DATE           NOT NULL,
      due_date              DATE           NOT NULL,
      subtotal              DECIMAL(14,2)  NOT NULL DEFAULT 0.00,
      tax_amount            DECIMAL(14,2)  NOT NULL DEFAULT 0.00,
      discount_amount       DECIMAL(14,2)  NOT NULL DEFAULT 0.00,
      total_amount          DECIMAL(14,2)  NOT NULL DEFAULT 0.00,
      paid_amount           DECIMAL(14,2)  NOT NULL DEFAULT 0.00,
      status                ENUM('Paid','Unpaid','Overdue','Partially Paid','Cancelled','Draft','Sent') NOT NULL DEFAULT 'Sent',
      priority              ENUM('High','Medium','Low') NOT NULL DEFAULT 'Medium',
      notes                 TEXT           DEFAULT NULL,
      terms                 TEXT           DEFAULT NULL,
      created_by_employee_id VARCHAR(50)   DEFAULT NULL,
      created_by_name       VARCHAR(150)   DEFAULT NULL,
      created_at            TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at            TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_invoice_number (invoice_number),
      KEY idx_customer_id (customer_id),
      KEY idx_status (status),
      KEY idx_issue_date (issue_date),
      KEY idx_due_date (due_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS invoice_items (
      id            INT(11)        NOT NULL AUTO_INCREMENT,
      invoice_id    INT(11)        NOT NULL,
      description   VARCHAR(500)   NOT NULL DEFAULT '',
      quantity      DECIMAL(10,2)  NOT NULL DEFAULT 1.00,
      unit_price    DECIMAL(14,2)  NOT NULL DEFAULT 0.00,
      amount        DECIMAL(14,2)  NOT NULL DEFAULT 0.00,
      sort_order    INT(11)        NOT NULL DEFAULT 0,
      PRIMARY KEY (id),
      KEY idx_invoice_id (invoice_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
};

ensureInvoiceTables().catch(err => console.error('❌ Invoice tables init error:', err.message));

// ──────────────────────────────────
// Helpers
// ──────────────────────────────────
const generateInvoiceNumber = async (connection) => {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const prefix = `INV-${year}${month}`;

  const [rows] = await connection.query(
    `SELECT invoice_number FROM invoices WHERE invoice_number LIKE ? ORDER BY id DESC LIMIT 1`,
    [`${prefix}%`]
  );

  let seq = 1;
  if (rows.length) {
    const last = rows[0].invoice_number;
    const match = last.match(/(\d{3})$/);
    if (match) seq = parseInt(match[1], 10) + 1;
  }

  return `${prefix}${String(seq).padStart(3, '0')}`;
};

const markOverdueInvoices = async () => {
  await pool.query(`
    UPDATE invoices
    SET status = 'Overdue', updated_at = CURRENT_TIMESTAMP
    WHERE due_date < CURDATE()
      AND status IN ('Sent', 'Unpaid')
  `);
};

const fetchInvoiceItems = async (invoiceIds) => {
  if (!invoiceIds.length) return {};
  const placeholders = invoiceIds.map(() => '?').join(',');
  const [rows] = await pool.query(
    `SELECT * FROM invoice_items WHERE invoice_id IN (${placeholders}) ORDER BY sort_order ASC, id ASC`,
    invoiceIds
  );
  const map = {};
  rows.forEach(item => {
    if (!map[item.invoice_id]) map[item.invoice_id] = [];
    map[item.invoice_id].push({
      id: item.id,
      description: item.description,
      quantity: parseFloat(item.quantity),
      unit_price: parseFloat(item.unit_price),
      amount: parseFloat(item.amount),
    });
  });
  return map;
};

// MySQL DATE columns must stay calendar dates — never use toISOString() (UTC shift).
const formatDateField = (value) => {
  if (!value) return null;
  if (typeof value === 'string') {
    return value.split('T')[0].split(' ')[0];
  }
  if (value instanceof Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return String(value).split('T')[0].split(' ')[0];
};

const formatInvoice = (row, items = []) => ({
  id: row.id,
  invoice_number: row.invoice_number,
  customer_id: row.customer_id,
  client_id: row.customer_id,
  client_name: row.client_name,
  client_email: row.client_email,
  client_phone: row.client_phone,
  client_address: row.client_address,
  project_title: row.project_title,
  issue_date: formatDateField(row.issue_date),
  due_date: formatDateField(row.due_date),
  subtotal: parseFloat(row.subtotal),
  tax_amount: parseFloat(row.tax_amount),
  discount_amount: parseFloat(row.discount_amount),
  total_amount: parseFloat(row.total_amount),
  paid_amount: parseFloat(row.paid_amount),
  status: row.status,
  priority: row.priority,
  notes: row.notes,
  terms: row.terms,
  items,
  created_by_employee_id: row.created_by_employee_id,
  created_by_name: row.created_by_name,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

const calcTotals = (items, taxAmount = 0, discountAmount = 0) => {
  const subtotal = items.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unit_price) || 0;
    const amount = item.amount != null ? parseFloat(item.amount) : qty * price;
    return sum + amount;
  }, 0);
  const tax = parseFloat(taxAmount) || 0;
  const discount = parseFloat(discountAmount) || 0;
  const total = Math.max(0, subtotal + tax - discount);
  return { subtotal, tax_amount: tax, discount_amount: discount, total_amount: total };
};

const insertInvoiceItems = async (connection, invoiceId, items) => {
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unit_price) || 0;
    const amount = item.amount != null ? parseFloat(item.amount) : qty * price;
    await connection.query(
      `INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, amount, sort_order)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [invoiceId, item.description || '', qty, price, amount, i]
    );
  }
};

// ═══════════════════════════════════════════════════════════
// REST ENDPOINTS
// ═══════════════════════════════════════════════════════════

// GET /invoices/clients – customers mapped for invoice UI
exports.getClients = async (req, res) => {
  try {
    const { search, limit } = req.query;
    let where = ['1=1'];
    const params = [];

    let orderClause = 'ORDER BY client_name ASC';
    if (search) {
      const term = search.trim();
      const likeAny = `%${term}%`;
      const likeStart = `${term}%`;
      where.push('(client_name LIKE ? OR client_email LIKE ? OR client_phone LIKE ?)');
      params.push(likeAny, likeAny, likeAny);
      orderClause = `
        ORDER BY
          CASE
            WHEN LOWER(client_name) = LOWER(?) THEN 0
            WHEN LOWER(client_email) = LOWER(?) THEN 1
            WHEN client_name LIKE ? THEN 2
            WHEN client_email LIKE ? THEN 3
            WHEN client_phone LIKE ? THEN 4
            ELSE 5
          END,
          client_name ASC
      `;
      params.push(term, term, likeStart, likeStart, likeStart);
    }

    let sql = `
      SELECT id, client_name AS name, client_email AS email,
             client_phone AS phone, client_address AS address
      FROM customers
      WHERE ${where.join(' AND ')}
      ${orderClause}
    `;

    if (limit) {
      sql += ' LIMIT ?';
      params.push(parseInt(limit, 10));
    }

    const [rows] = await pool.query(sql, params);
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('getClients error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /invoices/stats
exports.getInvoiceStats = async (req, res) => {
  try {
    await markOverdueInvoices();
    const [rows] = await pool.query(`
      SELECT
        COUNT(*) AS total_invoices,
        COALESCE(SUM(total_amount), 0) AS total_revenue,
        COUNT(CASE WHEN status = 'Paid' THEN 1 END) AS paid_invoices,
        COALESCE(SUM(CASE WHEN status = 'Paid' THEN total_amount ELSE 0 END), 0) AS paid_amount,
        COUNT(CASE WHEN status IN ('Unpaid','Overdue') THEN 1 END) AS pending_invoices,
        COALESCE(SUM(CASE WHEN status IN ('Unpaid','Overdue') THEN total_amount ELSE 0 END), 0) AS pending_amount
      FROM invoices
    `);
    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('getInvoiceStats error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /invoices
exports.getInvoices = async (req, res) => {
  try {
    await markOverdueInvoices();

    const { search, status, priority, month, year, start_date, end_date, limit, offset } = req.query;

    let where = ['1=1'];
    const params = [];

    if (search) {
      where.push(`(
        invoice_number LIKE ? OR client_name LIKE ? OR
        client_email LIKE ? OR project_title LIKE ?
      )`);
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }
    if (status && status !== 'All') {
      where.push('status = ?');
      params.push(status);
    }
    if (priority && priority !== 'All') {
      where.push('priority = ?');
      params.push(priority);
    }
    if (month && year) {
      where.push('MONTH(issue_date) = ? AND YEAR(issue_date) = ?');
      params.push(parseInt(month, 10), parseInt(year, 10));
    }
    if (start_date && end_date) {
      where.push('issue_date BETWEEN ? AND ?');
      params.push(start_date, end_date);
    }

    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM invoices WHERE ${where.join(' AND ')}`,
      params
    );

    let sql = `SELECT * FROM invoices WHERE ${where.join(' AND ')} ORDER BY issue_date DESC, id DESC`;
    const queryParams = [...params];

    if (limit) {
      sql += ' LIMIT ?';
      queryParams.push(parseInt(limit, 10));
      if (offset) {
        sql += ' OFFSET ?';
        queryParams.push(parseInt(offset, 10));
      }
    }

    const [rows] = await pool.query(sql, queryParams);
    const itemsMap = await fetchInvoiceItems(rows.map(r => r.id));
    const data = rows.map(row => formatInvoice(row, itemsMap[row.id] || []));

    const [stats] = await pool.query(`
      SELECT
        COUNT(*) AS total_invoices,
        COALESCE(SUM(total_amount), 0) AS total_revenue,
        COUNT(CASE WHEN status = 'Paid' THEN 1 END) AS paid_invoices,
        COALESCE(SUM(CASE WHEN status = 'Paid' THEN total_amount ELSE 0 END), 0) AS paid_amount,
        COUNT(CASE WHEN status IN ('Unpaid','Overdue') THEN 1 END) AS pending_invoices,
        COALESCE(SUM(CASE WHEN status IN ('Unpaid','Overdue') THEN total_amount ELSE 0 END), 0) AS pending_amount
      FROM invoices
    `);

    return res.json({
      success: true,
      data,
      total: countRows[0].total,
      stats: {
        total_invoices: stats[0].total_invoices,
        total_revenue: parseFloat(stats[0].total_revenue),
        paid_invoices: stats[0].paid_invoices,
        paid_amount: parseFloat(stats[0].paid_amount),
        pending_invoices: stats[0].pending_invoices,
        pending_amount: parseFloat(stats[0].pending_amount),
      },
    });
  } catch (err) {
    console.error('getInvoices error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /invoices/:id
exports.getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM invoices WHERE id = ?', [id]);
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }
    const itemsMap = await fetchInvoiceItems([rows[0].id]);
    return res.json({ success: true, data: formatInvoice(rows[0], itemsMap[rows[0].id] || []) });
  } catch (err) {
    console.error('getInvoiceById error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /invoices
exports.createInvoice = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const {
      customer_id, client_id,
      project_title, issue_date, due_date,
      items = [],
      notes, terms, priority,
      tax_amount, discount_amount,
      status, paid_amount,
    } = req.body;

    const custId = customer_id || client_id;
    if (!custId) {
      return res.status(400).json({ success: false, message: 'Client is required' });
    }
    if (!project_title) {
      return res.status(400).json({ success: false, message: 'Project title is required' });
    }
    if (!issue_date || !due_date) {
      return res.status(400).json({ success: false, message: 'Issue date and due date are required' });
    }
    if (!items.length) {
      return res.status(400).json({ success: false, message: 'At least one invoice item is required' });
    }

    const [customer] = await connection.query('SELECT * FROM customers WHERE id = ?', [custId]);
    if (!customer.length) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const c = customer[0];
    const totals = calcTotals(items, tax_amount, discount_amount);
    const user = req.user || {};

    await connection.beginTransaction();

    const invoiceNumber = await generateInvoiceNumber(connection);
    const invoiceStatus = status || 'Sent';
    const paidAmt = parseFloat(paid_amount) || 0;

    const [result] = await connection.query(
      `INSERT INTO invoices (
        invoice_number, customer_id, client_name, client_email, client_phone, client_address,
        project_title, issue_date, due_date,
        subtotal, tax_amount, discount_amount, total_amount, paid_amount,
        status, priority, notes, terms,
        created_by_employee_id, created_by_name
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        invoiceNumber,
        c.id,
        c.client_name,
        c.client_email,
        c.client_phone,
        c.client_address || null,
        project_title,
        issue_date,
        due_date,
        totals.subtotal,
        totals.tax_amount,
        totals.discount_amount,
        totals.total_amount,
        paidAmt,
        invoiceStatus,
        priority || 'Medium',
        notes || null,
        terms || null,
        user.employeeId || user.id || null,
        user.name || 'Admin',
      ]
    );

    await insertInvoiceItems(connection, result.insertId, items);
    await connection.commit();

    const [created] = await pool.query('SELECT * FROM invoices WHERE id = ?', [result.insertId]);
    const itemsMap = await fetchInvoiceItems([result.insertId]);

    return res.status(201).json({
      success: true,
      message: 'Invoice created',
      data: formatInvoice(created[0], itemsMap[result.insertId] || []),
    });
  } catch (err) {
    await connection.rollback();
    console.error('createInvoice error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    connection.release();
  }
};

// PUT /invoices/:id
exports.updateInvoice = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    const {
      customer_id, client_id,
      project_title, issue_date, due_date,
      items, notes, terms, priority,
      tax_amount, discount_amount,
      status, paid_amount,
    } = req.body;

    const [existing] = await connection.query('SELECT * FROM invoices WHERE id = ?', [id]);
    if (!existing.length) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    await connection.beginTransaction();

    const fields = [];
    const values = [];

    const custId = customer_id || client_id;
    if (custId) {
      const [customer] = await connection.query('SELECT * FROM customers WHERE id = ?', [custId]);
      if (!customer.length) {
        await connection.rollback();
        return res.status(404).json({ success: false, message: 'Customer not found' });
      }
      const c = customer[0];
      fields.push('customer_id = ?', 'client_name = ?', 'client_email = ?', 'client_phone = ?', 'client_address = ?');
      values.push(c.id, c.client_name, c.client_email, c.client_phone, c.client_address || null);
    }

    if (project_title !== undefined) { fields.push('project_title = ?'); values.push(project_title); }
    if (issue_date !== undefined) { fields.push('issue_date = ?'); values.push(issue_date); }
    if (due_date !== undefined) { fields.push('due_date = ?'); values.push(due_date); }
    if (notes !== undefined) { fields.push('notes = ?'); values.push(notes); }
    if (terms !== undefined) { fields.push('terms = ?'); values.push(terms); }
    if (priority !== undefined) { fields.push('priority = ?'); values.push(priority); }
    if (status !== undefined) { fields.push('status = ?'); values.push(status); }
    if (paid_amount !== undefined) { fields.push('paid_amount = ?'); values.push(parseFloat(paid_amount) || 0); }

    if (items && items.length) {
      const totals = calcTotals(items, tax_amount, discount_amount);
      fields.push('subtotal = ?', 'tax_amount = ?', 'discount_amount = ?', 'total_amount = ?');
      values.push(totals.subtotal, totals.tax_amount, totals.discount_amount, totals.total_amount);

      await connection.query('DELETE FROM invoice_items WHERE invoice_id = ?', [id]);
      await insertInvoiceItems(connection, id, items);
    } else if (tax_amount !== undefined || discount_amount !== undefined) {
      const inv = existing[0];
      const totals = calcTotals(
        [],
        tax_amount ?? inv.tax_amount,
        discount_amount ?? inv.discount_amount
      );
      const subtotal = parseFloat(inv.subtotal);
      const tax = tax_amount !== undefined ? parseFloat(tax_amount) : parseFloat(inv.tax_amount);
      const discount = discount_amount !== undefined ? parseFloat(discount_amount) : parseFloat(inv.discount_amount);
      const total = Math.max(0, subtotal + tax - discount);
      fields.push('tax_amount = ?', 'discount_amount = ?', 'total_amount = ?');
      values.push(tax, discount, total);
    }

    if (fields.length) {
      values.push(id);
      await connection.query(`UPDATE invoices SET ${fields.join(', ')} WHERE id = ?`, values);
    }

    await connection.commit();

    const [updated] = await pool.query('SELECT * FROM invoices WHERE id = ?', [id]);
    const itemsMap = await fetchInvoiceItems([parseInt(id, 10)]);

    return res.json({
      success: true,
      message: 'Invoice updated',
      data: formatInvoice(updated[0], itemsMap[parseInt(id, 10)] || []),
    });
  } catch (err) {
    await connection.rollback();
    console.error('updateInvoice error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    connection.release();
  }
};

// PATCH /invoices/:id/status
exports.updateInvoiceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paid_amount } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }

    const fields = ['status = ?'];
    const values = [status];

    if (paid_amount !== undefined) {
      fields.push('paid_amount = ?');
      values.push(parseFloat(paid_amount) || 0);
    }

    values.push(id);
    const [result] = await pool.query(
      `UPDATE invoices SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    if (!result.affectedRows) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    const [updated] = await pool.query('SELECT * FROM invoices WHERE id = ?', [id]);
    const itemsMap = await fetchInvoiceItems([parseInt(id, 10)]);

    return res.json({
      success: true,
      message: 'Invoice status updated',
      data: formatInvoice(updated[0], itemsMap[parseInt(id, 10)] || []),
    });
  } catch (err) {
    console.error('updateInvoiceStatus error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// DELETE /invoices/:id
exports.deleteInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM invoices WHERE id = ?', [id]);
    if (!result.affectedRows) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }
    return res.json({ success: true, message: 'Invoice deleted' });
  } catch (err) {
    console.error('deleteInvoice error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
