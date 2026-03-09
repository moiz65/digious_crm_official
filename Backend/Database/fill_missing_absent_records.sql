-- ============================================================
--  fill_missing_absent_records.sql
--  Purpose : Find every active employee × working day (Mon–Sat)
--            where NEITHER an attendance nor an absent record
--            exists, and insert them into Employee_Absent as
--            'No Check-in' so the data is fully consistent.
--
--  Date range : first attendance record (2026-01-16) → yesterday
--               (today is excluded, employees may still check in)
--  Working days: Monday – Saturday  (Sunday = day off)
--
--  Safe to re-run: uses INSERT IGNORE, so existing rows are
--  silently skipped and the unique constraint is never violated.
-- ============================================================

-- ── 0. Quick sanity check before we touch anything ──────────
SELECT
  'Before' AS phase,
  (SELECT COUNT(*) FROM Employee_Absent)   AS absent_rows,
  (SELECT COUNT(*) FROM Employee_Attendance) AS attendance_rows;

-- ── 1. DRY RUN – preview what will be inserted ──────────────
--    Review this output carefully before proceeding.
SELECT
  d.dt                      AS missing_date,
  DAYNAME(d.dt)             AS weekday,
  e.id                      AS employee_id,
  e.name,
  e.email
FROM (
  -- Generate every calendar date from 2026-01-16 to yesterday
  SELECT DATE_ADD('2026-01-16', INTERVAL seq DAY) AS dt
  FROM (
    SELECT (@row := @row + 1) AS seq
    FROM information_schema.columns,
         (SELECT @row := -1) init
    LIMIT 500          -- covers ~1.5 years, adjust if needed
  ) nums
  WHERE DATE_ADD('2026-01-16', INTERVAL seq DAY) <= DATE_SUB(CURDATE(), INTERVAL 1 DAY)
    AND DAYOFWEEK(DATE_ADD('2026-01-16', INTERVAL seq DAY)) != 1  -- exclude Sunday
) d
CROSS JOIN employee_onboarding e
  ON e.status = 'Active'
 AND e.join_date <= d.dt

-- Must NOT already appear in attendance
WHERE NOT EXISTS (
  SELECT 1 FROM Employee_Attendance ea
  WHERE ea.employee_id = e.id
    AND ea.attendance_date = d.dt
)
-- Must NOT already appear in absent
AND NOT EXISTS (
  SELECT 1 FROM Employee_Absent ab
  WHERE ab.employee_id = e.id
    AND ab.absent_date = d.dt
)
ORDER BY d.dt, e.name;


-- ── 2. ACTUAL INSERT ─────────────────────────────────────────
--    INSERT IGNORE silently skips any row that would violate
--    the UNIQUE KEY (employee_id, absent_date).
INSERT IGNORE INTO Employee_Absent
  (employee_id, email, name, absent_date, reason_type, reason, is_approved, remarks)
SELECT
  e.id,
  e.email,
  e.name,
  d.dt                           AS absent_date,
  'No Check-in'                  AS reason_type,
  'Auto-filled: no attendance or absence record found for this working day.' AS reason,
  0                              AS is_approved,
  'Backfilled by fill_missing_absent_records.sql' AS remarks
FROM (
  SELECT DATE_ADD('2026-01-16', INTERVAL seq DAY) AS dt
  FROM (
    SELECT (@row2 := @row2 + 1) AS seq
    FROM information_schema.columns,
         (SELECT @row2 := -1) init
    LIMIT 500
  ) nums
  WHERE DATE_ADD('2026-01-16', INTERVAL seq DAY) <= DATE_SUB(CURDATE(), INTERVAL 1 DAY)
    AND DAYOFWEEK(DATE_ADD('2026-01-16', INTERVAL seq DAY)) != 1
) d
CROSS JOIN employee_onboarding e
  ON e.status = 'Active'
 AND e.join_date <= d.dt
WHERE NOT EXISTS (
  SELECT 1 FROM Employee_Attendance ea
  WHERE ea.employee_id = e.id
    AND ea.attendance_date = d.dt
)
AND NOT EXISTS (
  SELECT 1 FROM Employee_Absent ab
  WHERE ab.employee_id = e.id
    AND ab.absent_date = d.dt
);

-- ── 3. Summary ───────────────────────────────────────────────
SELECT
  ROW_COUNT()                   AS rows_inserted,
  'After'                       AS phase,
  (SELECT COUNT(*) FROM Employee_Absent) AS new_absent_total;

-- ── 4. Verification – should return 0 rows after the insert ──
--    Any rows returned here = missed / unexpected gaps.
SELECT
  d.dt          AS still_missing_date,
  e.name,
  e.email
FROM (
  SELECT DATE_ADD('2026-01-16', INTERVAL seq DAY) AS dt
  FROM (
    SELECT (@row3 := @row3 + 1) AS seq
    FROM information_schema.columns,
         (SELECT @row3 := -1) init
    LIMIT 500
  ) nums
  WHERE DATE_ADD('2026-01-16', INTERVAL seq DAY) <= DATE_SUB(CURDATE(), INTERVAL 1 DAY)
    AND DAYOFWEEK(DATE_ADD('2026-01-16', INTERVAL seq DAY)) != 1
) d
CROSS JOIN employee_onboarding e
  ON e.status = 'Active'
 AND e.join_date <= d.dt
WHERE NOT EXISTS (
  SELECT 1 FROM Employee_Attendance ea
  WHERE ea.employee_id = e.id AND ea.attendance_date = d.dt
)
AND NOT EXISTS (
  SELECT 1 FROM Employee_Absent ab
  WHERE ab.employee_id = e.id AND ab.absent_date = d.dt
)
ORDER BY d.dt, e.name
LIMIT 10;

-- If the above returns no rows → database is now fully consistent.
