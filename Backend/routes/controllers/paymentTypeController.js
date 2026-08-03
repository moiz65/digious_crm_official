// Backend/controllers/paymentTypeController.js
const pool = require('../../config/database');

// ─────────────────────────────────────────────────────────
// Ensure expense_payment_types table exists
// ─────────────────────────────────────────────────────────
const ensureTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS expense_payment_types (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(50) NOT NULL UNIQUE,
      description VARCHAR(255),
      icon VARCHAR(50),
      color VARCHAR(20) DEFAULT '#3B82F6',
      is_active TINYINT(1) DEFAULT 1,
      sort_order INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // Insert default payment types if empty
  const [rows] = await pool.query(`SELECT COUNT(*) as count FROM expense_payment_types`);
  if (rows[0].count === 0) {
    await pool.query(`
      INSERT INTO expense_payment_types (name, description, icon, color, sort_order) VALUES
      ('Bank Account', 'Bank transfer or account payment', '🏦', '#3B82F6', 1),
      ('PayPal', 'PayPal payment gateway', '💰', '#0070BA', 2),
      ('Cash', 'Cash payment', '💵', '#10B981', 3),
      ('Credit Card', 'Credit card payment', '💳', '#8B5CF6', 4)
    `);
  }
};

// Run once at module load
ensureTable().catch(err => console.error('❌ Payment types table init error:', err.message));

// ─────────────────────────────────────────────────────────
// GET /api/v1/payment-types
// ─────────────────────────────────────────────────────────
exports.getPaymentTypes = async (req, res) => {
  try {
    const { include_inactive } = req.query;
    let query = `SELECT * FROM expense_payment_types`;
    if (!include_inactive) {
      query += ` WHERE is_active = 1`;
    }
    query += ` ORDER BY sort_order ASC, name ASC`;
    
    const [rows] = await pool.query(query);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('getPaymentTypes error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────
// POST /api/v1/payment-types
// ─────────────────────────────────────────────────────────
exports.createPaymentType = async (req, res) => {
  try {
    const { name, description, icon, color } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }

    const [result] = await pool.query(
      `INSERT INTO expense_payment_types (name, description, icon, color) VALUES (?, ?, ?, ?)`,
      [name.trim(), description || '', icon || '🏷️', color || '#3B82F6']
    );

    const [rows] = await pool.query(
      `SELECT * FROM expense_payment_types WHERE id = ?`,
      [result.insertId]
    );

    res.status(201).json({ success: true, message: 'Payment type created', data: rows[0] });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'Payment type already exists' });
    }
    console.error('createPaymentType error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────
// PUT /api/v1/payment-types/:id
// ─────────────────────────────────────────────────────────
exports.updatePaymentType = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, icon, color, is_active, sort_order } = req.body;

    const fields = [];
    const values = [];

    if (name !== undefined) { fields.push('name = ?'); values.push(name.trim()); }
    if (description !== undefined) { fields.push('description = ?'); values.push(description); }
    if (icon !== undefined) { fields.push('icon = ?'); values.push(icon); }
    if (color !== undefined) { fields.push('color = ?'); values.push(color); }
    if (is_active !== undefined) { fields.push('is_active = ?'); values.push(is_active ? 1 : 0); }
    if (sort_order !== undefined) { fields.push('sort_order = ?'); values.push(sort_order); }

    if (fields.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    values.push(id);
    await pool.query(`UPDATE expense_payment_types SET ${fields.join(', ')} WHERE id = ?`, values);

    const [rows] = await pool.query(`SELECT * FROM expense_payment_types WHERE id = ?`, [id]);
    res.json({ success: true, message: 'Payment type updated', data: rows[0] });
  } catch (err) {
    console.error('updatePaymentType error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────
// DELETE /api/v1/payment-types/:id
// ─────────────────────────────────────────────────────────
exports.deletePaymentType = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if any expense is using this payment type
    const [expenses] = await pool.query(
      `SELECT COUNT(*) as count FROM expenses WHERE payment_type = (SELECT name FROM expense_payment_types WHERE id = ?)`,
      [id]
    );
    
    if (expenses[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete payment type used in ${expenses[0].count} expense(s)`
      });
    }

    const [result] = await pool.query(`DELETE FROM expense_payment_types WHERE id = ?`, [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Payment type not found' });
    }
    res.json({ success: true, message: 'Payment type deleted' });
  } catch (err) {
    console.error('deletePaymentType error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};