const express = require("express");
const pool = require("../config/database");
const authMiddleware = require("../middleware/auth");
const {
  ensureCompanyCalendarTable,
  formatCalendarDate,
} = require("../utils/companyCalendar");

const router = express.Router();
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const isValidCalendarDate = (date) => {
  if (!datePattern.test(date)) return false;
  const parsed = new Date(`${date}T00:00:00.000Z`);
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === date
  );
};

const requireHrOrAdmin = (req, res, next) => {
  const role = String(req.user?.role || "").trim().toLowerCase();
  const canManageCalendar =
    role === "admin" ||
    role === "hr" ||
    role.startsWith("hr ") ||
    role.includes("human resource") ||
    role.includes("super admin") ||
    ["super_admin", "superadmin"].includes(role);

  if (canManageCalendar) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: "Only HR or admin can manage the company calendar",
  });
};

router.get("/", async (req, res) => {
  try {
    await ensureCompanyCalendarTable();

    const { year, month } = req.query;
    let query = `SELECT calendar_date, title, day_type FROM company_calendar`;
    const params = [];

    if (year !== undefined || month !== undefined) {
      const yearNumber = Number(year);
      const monthNumber = Number(month);
      if (
        !Number.isInteger(yearNumber) ||
        yearNumber < 2000 ||
        yearNumber > 2200 ||
        !Number.isInteger(monthNumber) ||
        monthNumber < 1 ||
        monthNumber > 12
      ) {
        return res.status(400).json({
          success: false,
          message: "Provide a valid year and month",
        });
      }

      query += " WHERE YEAR(calendar_date) = ? AND MONTH(calendar_date) = ?";
      params.push(yearNumber, monthNumber);
    }

    query += " ORDER BY calendar_date";
    const [rows] = await pool.query(query, params);
    return res.json({
      success: true,
      data: rows.map((row) => ({
        date: formatCalendarDate(row.calendar_date),
        name: row.title,
        type: row.day_type,
      })),
    });
  } catch (error) {
    console.error("Failed to fetch company calendar:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch company calendar",
    });
  }
});

router.put("/:date", authMiddleware, requireHrOrAdmin, async (req, res) => {
  try {
    const { date } = req.params;
    const { title, type = "holiday" } = req.body;

    if (!isValidCalendarDate(date)) {
      return res.status(400).json({
        success: false,
        message: "Date must be a valid YYYY-MM-DD date",
      });
    }
    if (typeof title !== "string" || !title.trim() || title.trim().length > 150) {
      return res.status(400).json({
        success: false,
        message: "Title is required and must be 150 characters or fewer",
      });
    }
    if (!["holiday", "working"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Type must be holiday or working",
      });
    }

    await ensureCompanyCalendarTable();
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [existingEntries] = await connection.query(
        "SELECT title, day_type FROM company_calendar WHERE calendar_date = ?",
        [date],
      );
      const previousEntry = existingEntries[0];

      if (previousEntry?.day_type === "holiday" && type !== "holiday") {
        await connection.query(
          `UPDATE Employee_Attendance
           SET status = 'Absent', remarks = 'No check-in', updated_at = NOW()
           WHERE attendance_date = ?
             AND status = 'Paid Leave'
             AND remarks = ?
             AND check_in_time IS NULL
             AND check_out_time IS NULL`,
          [date, `Company holiday: ${previousEntry.title}`],
        );
      }

      await connection.query(
        `INSERT INTO company_calendar (calendar_date, title, day_type, created_by)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           title = VALUES(title),
           day_type = VALUES(day_type),
           created_by = VALUES(created_by)`,
        [date, title.trim(), type, req.user.userId || null],
      );

      if (type === "holiday") {
        await connection.query(
          `UPDATE Employee_Attendance
           SET status = 'Paid Leave',
               remarks = ?,
               updated_at = NOW()
           WHERE attendance_date = ?
             AND (
               status IN ('Absent', 'Uninformed Absent')
               OR (status = 'Paid Leave' AND remarks LIKE 'Company holiday: %')
             )
             AND check_in_time IS NULL
             AND check_out_time IS NULL`,
          [`Company holiday: ${title.trim()}`, date],
        );
        await connection.query(
          `DELETE FROM Employee_Absent
           WHERE absent_date = ?
             AND reason_type = 'No Check-in'
             AND is_approved = 0`,
          [date],
        );
      }
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    return res.json({
      success: true,
      data: { date, name: title.trim(), type },
    });
  } catch (error) {
    console.error("Failed to save company calendar date:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to save company calendar date",
    });
  }
});

router.delete("/:date", authMiddleware, requireHrOrAdmin, async (req, res) => {
  try {
    const { date } = req.params;
    if (!isValidCalendarDate(date)) {
      return res.status(400).json({
        success: false,
        message: "Date must be a valid YYYY-MM-DD date",
      });
    }

    await ensureCompanyCalendarTable();
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [existingEntries] = await connection.query(
        "SELECT title, day_type FROM company_calendar WHERE calendar_date = ?",
        [date],
      );
      const existingEntry = existingEntries[0];
      await connection.query(
        "DELETE FROM company_calendar WHERE calendar_date = ?",
        [date],
      );
      if (existingEntry?.day_type === "holiday") {
        await connection.query(
          `UPDATE Employee_Attendance
           SET status = 'Absent', remarks = 'No check-in', updated_at = NOW()
           WHERE attendance_date = ?
             AND status = 'Paid Leave'
             AND remarks = ?
             AND check_in_time IS NULL
             AND check_out_time IS NULL`,
          [date, `Company holiday: ${existingEntry.title}`],
        );
      }
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
    return res.json({ success: true, data: { date } });
  } catch (error) {
    console.error("Failed to delete company calendar date:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete company calendar date",
    });
  }
});

module.exports = router;
