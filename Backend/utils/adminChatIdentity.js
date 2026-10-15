/**
 * Super Admin chat identity
 * ------------------------
 * chat_messages / chat_conversations FK to employee_onboarding.id.
 * admin_users.id is a different namespace, so Super Admin must chat
 * using a stable onboarding row (matched by admin email).
 */
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const pool = require('../config/database');

const ADMIN_DEPT = 'Administration';
const ADMIN_DESIGNATION = 'Super Admin';

function isAdminRole(role) {
  const r = String(role || '').toLowerCase();
  return r === 'admin' || r === 'super_admin';
}

/**
 * Resolve or create the employee_onboarding row used as this admin's chat id.
 * @param {{ id: number, email: string, full_name?: string, name?: string, phone?: string|null }} admin
 * @param {import('mysql2/promise').PoolConnection} [conn]
 * @returns {Promise<number>} employee_onboarding.id
 */
async function ensureAdminChatEmployeeId(admin, conn = null) {
  if (!admin?.email) {
    throw new Error('Admin email is required to resolve chat identity');
  }

  const db = conn || pool;
  const email = String(admin.email).trim();
  const name = (admin.full_name || admin.name || 'Administrator').trim();
  const phone = (admin.phone && String(admin.phone).trim()) || '0000000000';
  const adminId = Number(admin.id) || 0;

  const [existing] = await db.query(
    `SELECT id, status, department, designation
     FROM employee_onboarding
     WHERE email = ?
     LIMIT 1`,
    [email],
  );

  if (existing.length > 0) {
    const row = existing[0];
    const needsUpdate =
      row.status !== 'Active' ||
      row.department !== ADMIN_DEPT ||
      row.designation !== ADMIN_DESIGNATION;

    if (needsUpdate) {
      await db.query(
        `UPDATE employee_onboarding
         SET status = 'Active',
             department = ?,
             designation = ?,
             updated_at = NOW()
         WHERE id = ?`,
        [ADMIN_DEPT, ADMIN_DESIGNATION, row.id],
      );
    }
    return row.id;
  }

  const employeeCode = `SYS-ADMIN-${adminId || 'X'}`;
  const unusablePassword = await bcrypt.hash(
    crypto.randomBytes(32).toString('hex'),
    10,
  );

  try {
    const [result] = await db.query(
      `INSERT INTO employee_onboarding (
         employee_id, name, email, password_temp, phone,
         department, sub_department, employment_status, join_date,
         designation, status, request_password_change
       ) VALUES (?, ?, ?, ?, ?, ?, ?, 'Permanent', CURDATE(), ?, 'Active', 0)`,
      [
        employeeCode,
        name,
        email,
        unusablePassword,
        phone,
        ADMIN_DEPT,
        'System',
        ADMIN_DESIGNATION,
      ],
    );
    console.log(
      `✅ Created Super Admin chat identity employee_onboarding.id=${result.insertId} for ${email}`,
    );
    return result.insertId;
  } catch (err) {
    // Race: another request created the row (email or employee_id unique)
    if (err.code === 'ER_DUP_ENTRY') {
      const [again] = await db.query(
        `SELECT id FROM employee_onboarding WHERE email = ? OR employee_id = ? LIMIT 1`,
        [email, employeeCode],
      );
      if (again[0]?.id) return again[0].id;
    }
    throw err;
  }
}

/**
 * Ensure every active admin_users row has a chat-capable onboarding id.
 * @returns {Promise<Map<number, number>>} admin_users.id → employee_onboarding.id
 */
async function ensureAllAdminChatIdentities() {
  const [admins] = await pool.query(
    `SELECT id, email, full_name, phone FROM admin_users WHERE status = 'Active'`,
  );
  const map = new Map();
  for (const admin of admins) {
    const chatId = await ensureAdminChatEmployeeId(admin);
    map.set(admin.id, chatId);
  }
  return map;
}

/**
 * Look up admin_users by email (handles JWTs missing role / employeeId).
 * @returns {Promise<{id:number,email:string,full_name:string,phone?:string}|null>}
 */
async function findActiveAdminByEmail(email) {
  if (!email) return null;
  const [rows] = await pool.query(
    `SELECT id, email, full_name, phone
     FROM admin_users
     WHERE email = ? AND status = 'Active'
     LIMIT 1`,
    [String(email).trim()],
  );
  return rows[0] || null;
}

/**
 * True when employeeId is a real employee_onboarding.id (not admin_users.id).
 */
async function isValidOnboardingId(id) {
  if (id == null || id === '') return false;
  const num = Number(id);
  if (!Number.isFinite(num) || num <= 0) return false;
  const [rows] = await pool.query(
    `SELECT id FROM employee_onboarding WHERE id = ? LIMIT 1`,
    [num],
  );
  return rows.length > 0;
}

/**
 * Chat participant id: employees use employeeId; admins use onboarding chat id.
 * Never returns admin_users.id — that breaks chat_messages FKs.
 */
async function resolveChatUserId(user) {
  if (!user) return null;

  const email = user.email || null;
  const roleAdmin = isAdminRole(user.role);
  const adminRow = roleAdmin ? null : await findActiveAdminByEmail(email);
  const isAdmin = roleAdmin || !!adminRow;

  // Prefer JWT employeeId only if it actually exists in employee_onboarding
  if (user.employeeId != null && user.employeeId !== '') {
    const candidate = Number(user.employeeId);
    if (await isValidOnboardingId(candidate)) {
      return candidate;
    }
    // Stale/wrong employeeId (e.g. admin_users.id mistakenly stored) — fall through
    console.warn(
      `⚠️ resolveChatUserId: ignoring invalid employeeId=${user.employeeId} for ${email || user.userId}`,
    );
  }

  if (isAdmin && email) {
    const admin = adminRow || {
      id: user.userId ?? user.id,
      email,
      full_name: user.name || user.full_name,
      phone: user.phone,
    };
    // If role said admin but we didn't fetch the row yet, prefer DB row for id/name
    if (!adminRow && roleAdmin) {
      const fromDb = await findActiveAdminByEmail(email);
      if (fromDb) {
        return ensureAdminChatEmployeeId(fromDb);
      }
    }
    return ensureAdminChatEmployeeId(admin);
  }

  // Employees only: never use bare userId for known admins
  if (user.userId != null && user.userId !== '' && !isAdmin) {
    return Number(user.userId);
  }
  if (user.id != null && user.id !== '' && !isAdmin) {
    return Number(user.id);
  }

  return null;
}

module.exports = {
  ensureAdminChatEmployeeId,
  ensureAllAdminChatIdentities,
  resolveChatUserId,
  findActiveAdminByEmail,
  isAdminRole,
  ADMIN_DEPT,
  ADMIN_DESIGNATION,
};
