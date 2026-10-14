const pool = require("../config/database");

let tableReady;

const ensureCompanyCalendarTable = async () => {
  if (!tableReady) {
    tableReady = pool
      .query(`
        CREATE TABLE IF NOT EXISTS company_calendar (
          calendar_date DATE NOT NULL,
          title VARCHAR(150) NOT NULL,
          day_type ENUM('holiday', 'working') NOT NULL DEFAULT 'holiday',
          created_by INT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (calendar_date)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `)
      .catch((error) => {
        tableReady = null;
        throw error;
      });
  }

  await tableReady;
};

const formatCalendarDate = (date) => {
  if (date instanceof Date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  return String(date).split("T")[0];
};

const getCompanyCalendarEntries = async (startDate, endDate, connection = pool) => {
  await ensureCompanyCalendarTable();
  const [rows] = await connection.query(
    `SELECT calendar_date, title, day_type
     FROM company_calendar
     WHERE calendar_date BETWEEN ? AND ?
     ORDER BY calendar_date`,
    [startDate, endDate],
  );

  return rows.map((row) => ({
    date: formatCalendarDate(row.calendar_date),
    title: row.title,
    type: row.day_type,
  }));
};

const isWeekendDate = (date) => {
  const day = new Date(`${date}T00:00:00Z`).getUTCDay();
  return day === 0 || day === 6;
};

module.exports = {
  ensureCompanyCalendarTable,
  formatCalendarDate,
  getCompanyCalendarEntries,
  isWeekendDate,
};
