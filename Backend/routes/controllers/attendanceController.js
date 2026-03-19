const pool = require("../../config/database");
const {
  getPakistanDate,
  getPakistanDateString,
  getPakistanTimeString,
  getPakistanYesterday,
  getPakistanYesterdayString,
  getUTCTimeString,
} = require("../../utils/timezone");

// ============================================================
// HELPER FUNCTION: Get local date string (YYYY-MM-DD) from Date object
// Using Pakistan timezone (UTC+5)
// ============================================================
const getLocalDateString = (date) => {
  // Use UTC methods because getPakistanDate() returns a date with UTC offset
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// ============================================================
// HELPER FUNCTION: Calculate working hours for any check-in/out
// ============================================================
const calculateWorkingHours = (checkInTime, checkOutTime, breakMinutes = 0) => {
  try {
    if (!checkInTime || !checkOutTime) {
      return { gross: 0, net: 0, overtime: 0, overtimeHours: "0.00" };
    }

    const [checkInHour, checkInMin] = checkInTime.split(":").map(Number);
    const [checkOutHour, checkOutMin] = checkOutTime.split(":").map(Number);

    const checkInTotalMinutes = checkInHour * 60 + checkInMin;
    const checkOutTotalMinutes = checkOutHour * 60 + checkOutMin;

    let grossWorkingMinutes = 0;
    const isNightShift = checkInTotalMinutes >= 21 * 60;

    if (isNightShift) {
      const timeDifferenceMinutes = checkOutTotalMinutes - checkInTotalMinutes;

      if (timeDifferenceMinutes >= 0) {
        grossWorkingMinutes = timeDifferenceMinutes;
      } else if (checkOutTotalMinutes < 6 * 60) {
        // Checkout is BEFORE 6 AM (night shift ending)
        const minutesUntilMidnight = 24 * 60 - checkInTotalMinutes;
        const minutesAfterMidnight = checkOutTotalMinutes;
        grossWorkingMinutes = minutesUntilMidnight + minutesAfterMidnight;
      } else if (
        checkOutTotalMinutes >= 6 * 60 &&
        checkOutTotalMinutes <= 9 * 60
      ) {
        // Checkout is between 6 AM and 9 AM (early morning after night shift)
        const minutesUntilMidnight = 24 * 60 - checkInTotalMinutes;
        const minutesAfterMidnight = checkOutTotalMinutes;
        grossWorkingMinutes = minutesUntilMidnight + minutesAfterMidnight;
      } else {
        // Checkout is after 9 AM (afternoon after night shift)
        const minutesUntilMidnight = 24 * 60 - checkInTotalMinutes;
        const minutesAfterMidnight = checkOutTotalMinutes;
        grossWorkingMinutes = minutesUntilMidnight + minutesAfterMidnight;
      }
    } else {
      // Check-in is in daytime/evening (before 21:00)
      const timeDifferenceMinutes = checkOutTotalMinutes - checkInTotalMinutes;
      
      if (timeDifferenceMinutes >= 0) {
        // Checkout is same day (after check-in)
        grossWorkingMinutes = timeDifferenceMinutes;
      } else {
        // Checkout is next day (midnight crossed) - negative difference means next day
        // Examples: Check-in 19:22:27 → Check-out 08:23:56 (next day)
        const minutesUntilMidnight = 24 * 60 - checkInTotalMinutes;
        const minutesAfterMidnight = checkOutTotalMinutes;
        grossWorkingMinutes = minutesUntilMidnight + minutesAfterMidnight;
      }
    }

    const netWorkingMinutes = Math.max(0, grossWorkingMinutes - breakMinutes);
    const expectedWorkingMinutes = 540;
    let overtimeMinutes = 0;
    let overtimeHours = "0.00";

    if (netWorkingMinutes > expectedWorkingMinutes) {
      overtimeMinutes = netWorkingMinutes - expectedWorkingMinutes;
      overtimeHours = (overtimeMinutes / 60).toFixed(2);
    }

    return {
      gross: Math.max(0, grossWorkingMinutes),
      net: netWorkingMinutes,
      overtime: overtimeMinutes,
      overtimeHours: overtimeHours,
    };
  } catch (error) {
    console.error("Error in calculateWorkingHours:", error);
    return { gross: 0, net: 0, overtime: 0, overtimeHours: "0.00" };
  }
};

// ============================================================
// HELPER FUNCTION: Validate attendance record has working hours
// ============================================================
const validateAndFixWorkingHours = async (
  connection,
  attendanceId,
  checkInTime,
  checkOutTime,
  breakMinutes,
  status,
) => {
  try {
    const [record] = await connection.query(
      "SELECT gross_working_time_minutes FROM Employee_Attendance WHERE id = ?",
      [attendanceId],
    );

    if (record.length === 0) return;

    // If missing or zero working hours but has check-in/out, recalculate
    if (
      (record[0].gross_working_time_minutes === 0 ||
        record[0].gross_working_time_minutes === null) &&
      checkInTime &&
      checkOutTime &&
      (status === "Present" || status === "Late")
    ) {
      const workingHours = calculateWorkingHours(
        checkInTime,
        checkOutTime,
        breakMinutes,
      );

      await connection.query(
        `UPDATE Employee_Attendance 
         SET gross_working_time_minutes = ?,
             net_working_time_minutes = ?,
             overtime_minutes = ?,
             overtime_hours = ?
         WHERE id = ?`,
        [
          workingHours.gross,
          workingHours.net,
          workingHours.overtime,
          workingHours.overtimeHours,
          attendanceId,
        ],
      );

      console.log(
        `✅ Fixed missing working hours for attendance ID ${attendanceId}: ${workingHours.gross}min gross, ${workingHours.net}min net`,
      );
    }
  } catch (error) {
    console.error("Error validating working hours:", error);
  }
};

// Record Check In

exports.checkIn = async (req, res) => {
  let connection;
  try {
    // Extract from both JWT (auth) and request body for flexibility
    // But prefer JWT employeeId for consistency with employee_onboarding.id
    const jwtEmployeeId = req.user?.employeeId; // From JWT token (auth middleware)
    const jwtUserId = req.user?.userId; // From JWT token (user_as_employees.id)
    const reqEmployeeId = req.body.employee_id; // From request body
    const { email, name, device_info, ip_address } = req.body;

    // Determine which employee_id to use
    // IMPORTANT: Employee_Attendance.employee_id has FK to employee_onboarding.id (NOT user_as_employees.id)
    // Priority: JWT employeeId (employee_onboarding.id) > request employee_id > fallback to jwtUserId
    let employee_id = jwtEmployeeId || reqEmployeeId || jwtUserId;

    if (process.env.NODE_ENV === 'development') {
      console.log(`📥 Check-in request: endpoint=/check-in employee=${employee_id} jwtEmployeeId=${jwtEmployeeId || 'none'} jwtUserId=${jwtUserId || 'none'} emailPresent=${!!email} name=${name || 'N/A'}`);
    }

    if (!employee_id || !email || !name) {
      return res.status(400).json({
        success: false,
        message: "Employee ID, email, and name are required",
      });
    }

    const now = getPakistanDate(); // Use Pakistan timezone
    const checkInTime = getPakistanTimeString(); // HH:MM:SS in Pakistan timezone (for display)
    const checkInTimePKT = getPakistanTimeString(); // HH:MM:SS in Pakistan timezone (for database storage - should be Pakistan time, not UTC)

    // Calculate checkInTotalMinutes early (needed for auto-checkout logic)
    const [checkInHourVal, checkInMin, checkInSec] = checkInTime
      .split(":")
      .map(Number);
    const checkInHour = checkInHourVal; // Use the parsed hour value from the time string (not from Date.getHours())
    const checkInTotalMinutes = checkInHourVal * 60 + checkInMin;

    // Determine attendance date for night shift:
    // Night shift: 21:00 (9 PM) to 06:00 (6 AM) next day
    // If check-in is between 00:00-05:59, it belongs to the PREVIOUS day's shift
    // If check-in is between 21:00-23:59, it belongs to TODAY's shift
    let attendanceDate;
    if (checkInHour >= 0 && checkInHour < 6) {
      // Early morning (00:00-05:59) - belongs to yesterday's shift
      const yesterday = getPakistanYesterday();
      attendanceDate = getLocalDateString(yesterday);
      console.log(
        `📅 Early morning check-in: Using YESTERDAY's date (${attendanceDate}) for night shift`,
      );
    } else {
      // Evening/normal hours - use today
      attendanceDate = getPakistanDateString();
      console.log(
        `📅 Evening check-in: Using TODAY's date (${attendanceDate})`,
      );
    }

    connection = await pool.getConnection();

    try {
      // ============================================================
      // CRITICAL FIX: Check for PENDING checkout from CURRENT shift only
      // ============================================================
      // Shift window: 21:00 (Day N) → 09:00 (Day N+1)
      // - If time is 21:00-23:59 (evening): Look for pending from TODAY only
      // - If time is 00:00-09:00 (morning): Look for pending from YESTERDAY only
      // - Ignore old pending entries from days older than the current shift window
      // 
      // During 09:00 - 21:00: No active shift, old pending entries should be ignored
      // New check-in will auto-complete the old entry only if attempting to start new shift
      
      const currentHour = now.getUTCHours();
      const currentMin = now.getUTCMinutes();
      const currentTotalMinutes = currentHour * 60 + currentMin;
      const nineAM = 9 * 60; // 540 minutes = 09:00
      const ninePM = 21 * 60; // 1260 minutes = 21:00
      const todayStr = getPakistanDateString();
      
      let pendingFromCurrentShift = null;
      
      // Determine if we should look for pending from TODAY or YESTERDAY
      if (currentTotalMinutes >= ninePM) {
        // Evening (21:00-23:59): Current shift started TODAY
        const [pending] = await connection.query(
          `SELECT id, check_in_time, attendance_date FROM Employee_Attendance 
           WHERE employee_id = ? AND check_out_time IS NULL AND attendance_date = ?
           LIMIT 1`,
          [employee_id, todayStr],
        );
        if (pending.length > 0) {
          pendingFromCurrentShift = pending[0];
        }
      } else if (currentTotalMinutes < nineAM) {
        // Early morning (00:00-08:59): Current shift started YESTERDAY
        const yesterdayDate = getPakistanYesterday();
        const yesterdayStr = getLocalDateString(yesterdayDate);
        const [pending] = await connection.query(
          `SELECT id, check_in_time, attendance_date FROM Employee_Attendance 
           WHERE employee_id = ? AND check_out_time IS NULL AND attendance_date = ?
           LIMIT 1`,
          [employee_id, yesterdayStr],
        );
        if (pending.length > 0) {
          pendingFromCurrentShift = pending[0];
        }
      } else {
        // Daytime (09:00-20:59): No active shift window
        // Ignore any pending from old shifts - allow fresh check-in
        console.log(`⏰ Daytime hours (09:00-20:59): Not checking for pending checkout`);
      }
      
      // If there's a pending checkout from CURRENT shift and within overlap window, could block
      if (pendingFromCurrentShift) {
        console.log(
          `⚠️ PENDING CHECKOUT FROM CURRENT SHIFT - Employee has incomplete checkout`
        );
        console.log(`   Employee: ${employee_id}`);
        console.log(`   Pending Record: ID ${pendingFromCurrentShift.id}`);
        console.log(`   Check-in date: ${pendingFromCurrentShift.attendance_date}`);
        console.log(`   Check-in time: ${pendingFromCurrentShift.check_in_time}`);
        console.log(`   Current time: ${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`);
        
        // Check if within overlap window (9 AM - 9 PM)
        const isOverlapWindow = currentTotalMinutes >= nineAM && currentTotalMinutes < ninePM;
        if (isOverlapWindow) {
          console.log(`   ⚠️ BLOCKING: Overlap window detected (9 AM - 9 PM) - must checkout first`);
          connection.release();
          return res.status(409).json({
            success: false,
            message: 'You have an incomplete checkout from the current shift. Please checkout first before checking in again.',
            data: {
              pendingCheckoutId: pendingFromCurrentShift.id,
              checkInDate: pendingFromCurrentShift.attendance_date,
              checkInTime: pendingFromCurrentShift.check_in_time,
              reason: 'Pending checkout during overlap window (9 AM - 9 PM)'
            }
          });
        } else {
          console.log(`   ✅ Outside overlap window - allowing check-in with auto-complete of old entry`);
        }
      }
      
      // Check if attendance record already exists for the calculated attendance date
      const [existingAttendance] = await connection.query(
        `SELECT id, check_in_time, check_out_time FROM Employee_Attendance WHERE employee_id = ? AND attendance_date = ?`,
        [employee_id, attendanceDate],
      );

      if (existingAttendance.length > 0) {
        // If there's an existing record with NULL check_out_time, check if we should auto-complete it
        if (existingAttendance[0].check_out_time === null) {
          // IMPORTANT FIX: Only auto-checkout if it's after 9:00 AM (next day)
          // This prevents immediate auto-checkout on same-shift re-login

          // Get the check-in record with created_at timestamp
          const [fullRecord] = await connection.query(
            `SELECT id, check_in_time, created_at FROM Employee_Attendance WHERE id = ?`,
            [existingAttendance[0].id],
          );

          if (fullRecord.length > 0) {
            const createdAt = new Date(fullRecord[0].created_at);
            const pkNow = getPakistanDate();

            // Check if current time is after 9:00 AM
            const currentHour = pkNow.getHours();
            const currentMinute = pkNow.getMinutes();
            const isAfter9AM = currentHour >= 9; // 9:00 AM or later

            // Check if check-in was from a previous day (not today)
            const createdDate = new Date(createdAt);
            const currentDate = new Date(pkNow);
            const isPreviousDay =
              createdDate.toDateString() !== currentDate.toDateString();

            // Auto-checkout if it's after 9:00 AM AND check-in was from previous day
            // OR if it's a new shift attempt (employee trying to check in at shift hours 21:00+)
            // This allows employees to auto-complete their previous shift and start a new one
            const isNewShiftAttempt = checkInTotalMinutes >= 21 * 60; // Trying to check in during shift hours (21:00+)

            if (isAfter9AM || isNewShiftAttempt) {
              console.log(
                `🔧 AUTO-COMPLETING PREVIOUS CHECKOUT: Record ID ${existingAttendance[0].id}`,
              );
              console.log(
                `   Reason: ${isNewShiftAttempt ? "New shift check-in attempt (21:00+)" : `After 9:00 AM (current time: ${currentHour}:${String(currentMinute).padStart(2, "0")})`}`,
              );

              // Auto-complete the previous checkout at current time (Pakistan timezone)
              // This is only a fallback - if user manually checks out before 9 AM, that time is used instead
              const autoCheckOutTime = getPakistanTimeString(); // Use actual current time, not fixed 9:00 AM

              const [breakResult] = await connection.query(
                `SELECT total_break_duration_minutes FROM Employee_Attendance WHERE id = ?`,
                [existingAttendance[0].id],
              );

              const breakMinutes =
                breakResult[0]?.total_break_duration_minutes || 0;

              // Recalculate working hours for the auto-completed record
              const oldCheckInTime = fullRecord[0].check_in_time;
              const workingHours = calculateWorkingHours(
                oldCheckInTime,
                autoCheckOutTime,
                breakMinutes,
              );

              // Update the stale record with auto-completed checkout and working hours
              await connection.query(
                `UPDATE Employee_Attendance 
                 SET check_out_time = ?, 
                     gross_working_time_minutes = ?,
                     net_working_time_minutes = ?,
                     overtime_minutes = ?,
                     overtime_hours = ?
                 WHERE id = ?`,
                [
                  autoCheckOutTime,
                  workingHours.gross,
                  workingHours.net,
                  workingHours.overtime,
                  workingHours.overtimeHours,
                  existingAttendance[0].id,
                ],
              );

              console.log(
                `✅ PREVIOUS CHECKOUT AUTO-COMPLETED: ID ${existingAttendance[0].id}, checkout time: ${autoCheckOutTime}`,
              );
              console.log(
                `   Working hours calculated: ${workingHours.gross} minutes (${(workingHours.gross / 60).toFixed(2)} hours)`,
              );
              // After auto-completing previous record, proceed to create new check-in
            } else {
              // Record is from today and before 9:00 AM - prevent duplicate check-in
              console.log(
                `⚠️ DUPLICATE CHECK-IN ATTEMPT BLOCKED (record from today, current time: ${currentHour}:${String(currentMinute).padStart(2, "0")})`,
              );
              console.log(`   Record ID: ${existingAttendance[0].id}`);
              console.log(
                `   Check-in Time: ${existingAttendance[0].check_in_time}`,
              );
              console.log(
                `   Status: ALREADY CHECKED IN - Please checkout first before checking in again`,
              );

              connection.release();
              return res.status(409).json({
                success: false,
                message:
                  "You are still checked in from your previous session. Please check out first before checking in again.",
                data: {
                  recordId: existingAttendance[0].id,
                  checkInTime: existingAttendance[0].check_in_time,
                  attendanceDate: attendanceDate,
                  currentTime: `${currentHour}:${String(currentMinute).padStart(2, "0")}`,
                  autoCheckoutTime: "09:00 AM",
                  action:
                    "Please call POST /api/v1/attendance/check-out to complete your previous session",
                },
              });
            }
          }
        } else {
          // Record has proper checkout, prevent duplicate check-in
          connection.release();
          return res.status(409).json({
            success: false,
            message: "Already checked in today",
          });
        }
      }

      // ============================================================
      // CHECK-IN TIME VALIDATION - ALLOW ANYTIME FROM 9:00 AM
      // ============================================================
      // Business Rule: Employees can check in anytime from 09:00 AM onwards
      // Night shift: 21:00 (9 PM) - 06:00 (6 AM)
      // Check-in allowed: 09:00 AM onwards
      // Status determination:
      //   - 21:00-21:15: On Time
      //   - 21:16-23:59 or 00:00-06:00: Late
      //   - 09:00-20:59: Early Check-in (allowed, but marked as Late for scheduling)
      
      const sixAM = 6 * 60; // 360 minutes = 06:00
      const nineAMOffset = 21 * 60; // 1260 minutes for shift comparison
      
      // Allow check-in anytime from 09:00 AM onwards (no upper time limit)
      const isValidCheckInTime = checkInTotalMinutes >= nineAM;
      
      if (!isValidCheckInTime) {
        connection.release();
        console.log(
          `❌ INVALID CHECK IN TIME: ${name} attempted check-in at ${checkInTime} (before 09:00 AM)`,
        );
        return res.status(400).json({
          success: false,
          message: `Invalid check-in time. Check-in is allowed from 09:00 AM onwards. Your check-in at ${checkInTime} is too early.`,
          data: {
            checkInTime: checkInTime,
            validCheckInTime: "09:00 AM onwards",
            attemptedTime: checkInTime
          }
        });
      }

      // Determine attendance status based on check-in time
      // Time boundaries:
      // - Shift Start: 21:00 (1260 minutes) - Evening check-in
      // - Late After: 21:15 (1275 minutes) - Grace period ends, marked as Late if AFTER 21:15
      const lateAfterTime = 21 * 60 + 15; // 21:15 = 1275 minutes
      const shiftStart = 21 * 60; // 21:00 = 1260 minutes
      
      let isLate = false;
      let lateByMinutes = 0;
      let status = "Present";
      let onTime = 1; // Default to on time

      // Status determination logic:
      // 1. Early check-in (09:00 AM - 20:59 PM): Mark as Present (employee checking in early for their shift)
      // 2. Evening check-in (21:00 - 21:15): On Time (Present)
      // 3. Evening late (21:16 onwards): Late
      // 4. Early morning (00:00 - 06:00): Late
      
      if (checkInTotalMinutes >= nineAM && checkInTotalMinutes < shiftStart) {
        // Early check-in (09:00 AM - 20:59 PM) - allowed and marked as Present
        isLate = false;
        status = "Present";
        onTime = 1;
        lateByMinutes = 0;
        console.log(
          `✅ Early Check In: ${name} at ${checkInTime} (checked in before shift start at 21:00)`,
        );
      } else if (checkInTotalMinutes >= shiftStart && checkInTotalMinutes <= lateAfterTime) {
        // On time: between 21:00 and 21:15 (inclusive)
        isLate = false;
        status = "Present";
        onTime = 1;
        lateByMinutes = 0;
        console.log(
          `✅ On Time Check In: ${name} at ${checkInTime} (between 21:00-21:15)`,
        );
      } else if (checkInTotalMinutes > lateAfterTime && checkInTotalMinutes <= 23 * 60 + 59) {
        // Evening late: After 21:15 in evening
        isLate = true;
        lateByMinutes = checkInTotalMinutes - lateAfterTime;
        status = "Late";
        onTime = 0;
        console.log(
          `⏱️ Late Check In: ${name} at ${checkInTime} (${lateByMinutes} minutes late - after 21:15 PM)`,
        );
      } else if (checkInTotalMinutes >= 0 && checkInTotalMinutes <= sixAM) {
        // Early morning late (any check-in from 00:00-06:00 is considered late)
        isLate = true;
        status = "Late";
        onTime = 0;
        // Calculate minutes late: from 21:15 (1275) to early morning time
        // For early morning: add 24 hours (1440 minutes) to make comparison work
        const earlyMorningMinutesFrom21_15 =
          1440 - lateAfterTime + checkInTotalMinutes;
        lateByMinutes = earlyMorningMinutesFrom21_15;
        console.log(
          `⏱️ Late Check In (Early Morning): ${name} at ${checkInTime} (${lateByMinutes} minutes late - after 21:15 PM)`,
        );
      }

      // Create new attendance record
      const [result] = await connection.query(
        `INSERT INTO Employee_Attendance 
         (employee_id, email, name, attendance_date, check_in_time, status, on_time, late_by_minutes, device_info, ip_address)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          employee_id,
          email,
          name,
          attendanceDate,
          checkInTimePKT,
          status,
          onTime,
          lateByMinutes,
          device_info || null,
          ip_address || null,
        ],
      );

      // Check if employee has an absence record for this date and remove it
      try {
        const [absentRecord] = await connection.query(
          `SELECT id FROM Employee_Absent WHERE employee_id = ? AND absent_date = ?`,
          [employee_id, attendanceDate]
        );
        
        if (absentRecord.length > 0) {
          await connection.query(
            `DELETE FROM Employee_Absent WHERE employee_id = ? AND absent_date = ?`,
            [employee_id, attendanceDate]
          );
          console.log(`🗑️ REMOVED FROM ABSENCE: ${name} (${email}) was marked absent for ${attendanceDate}, now removed due to check-in`);
        }
      } catch (err) {
        console.error(`⚠️ Error removing absence record for ${employee_id}:`, err.message);
      }

      console.log(
        `✅ Check In: ${name} (${email}) at ${checkInTime} on ${attendanceDate}`,
      );

      res.status(201).json({
        success: true,
        message: "Check in successful",
        isCheckedIn: true,
        data: {
          id: result.insertId,
          employee_id,
          name,
          email,
          check_in_time: checkInTime,
          attendance_date: attendanceDate,
          status,
          isLate,
          lateByMinutes,
          onTime,
          isCheckedIn: true,
        },
      });
    } finally {
      if (connection) connection.release();
    }
  } catch (error) {
    console.error("❌ Check In error:", error);
    console.error("❌ Error details:", {
      message: error.message,
      code: error.code,
      sql: error.sql,
      sqlState: error.sqlState,
      errno: error.errno,
      stack: error.stack,
    });
    if (connection) connection.release();
    res.status(500).json({
      success: false,
      message: "Check in failed",
      error: error.message,
      details: {
        code: error.code,
        sqlState: error.sqlState,
      },
    });
  }
};

// Record Check Out
exports.checkOut = async (req, res) => {
  let connection;
  try {
    // Extract from both JWT (auth) and request body for flexibility
    const jwtEmployeeId = req.user?.employeeId; // From JWT token (employee_onboarding.id)
    const jwtUserId = req.user?.userId; // From JWT token (user_as_employees.id)
    const reqEmployeeId = req.body.employee_id; // From request body
    const checkOutTimeFromClient = req.body.check_out_time; // Time from frontend (in HH:MM:SS format)

    // Determine which employee_id to use - MUST use jwtEmployeeId (employee_onboarding.id) for FK consistency
    let employee_id = jwtEmployeeId || reqEmployeeId || jwtUserId;

    const now = getPakistanDate(); // Use Pakistan timezone

    console.log("[CHECKOUT] Check-out request received:");
    console.log("   - JWT employeeId:", jwtEmployeeId);
    console.log("   - Request employee_id:", reqEmployeeId);
    console.log("   - Using employee_id:", employee_id);
    console.log("   - Check-out time from client:", checkOutTimeFromClient);

    if (!employee_id) {
      return res.status(400).json({
        success: false,
        message: "Employee ID is required",
      });
    }

    connection = await pool.getConnection();

    try {
      // ============================================================
      // CHECKOUT POLICY - CRITICAL RULE
      // ============================================================
      // Users MUST checkout BEFORE 9:00 AM
      // - Can checkout ANYTIME before 9 AM (early morning, mid-morning, etc.)
      // - Manual checkout at 05:30 AM = ALLOWED (before 9 AM)
      // - Manual checkout at 06:15 AM = ALLOWED (before 9 AM)
      // - Manual checkout at 07:45 AM = ALLOWED (before 9 AM)
      // - Manual checkout at 08:59 AM = ALLOWED (before 9 AM)
      // - Manual checkout at 09:01 AM = BLOCKED (after 9 AM deadline)
      //
      // Auto-checkout FALLBACK:
      // - If user doesn't manually checkout before 9:00 AM
      // - System auto-completes at 9:00 AM with actual current time
      // - This is only a safety net, not a restriction
      // ============================================================

      // Work date logic for night shift:
      // The night shift runs from 21:00 (9 PM) to 06:00 (6 AM) next day
      // For morning checkouts (before 9 AM), the shift started YESTERDAY
      // Get today's date
      const todayStr = getPakistanDateString();
      const now = getPakistanDate();
      const currentHour = now.getUTCHours();

      let attendanceRecord, workDateStr;

      // For early morning hours (00:00 - 09:00), PRIORITIZE searching YESTERDAY first
      // This is because night shift employees check in on Day 1 evening and check out Day 2 morning
      if (currentHour < 9) {
        // Early morning - try YESTERDAY first
        const yesterdayDate = getPakistanYesterday();
        const yesterdayStr = getLocalDateString(yesterdayDate);

        const [attendanceRecordYesterday] = await connection.query(
          `SELECT id, check_in_time, total_break_duration_minutes FROM Employee_Attendance 
           WHERE employee_id = ? AND attendance_date = ? AND check_out_time IS NULL`,
          [employee_id, yesterdayStr],
        );

        if (attendanceRecordYesterday.length > 0) {
          // Found active check-in for YESTERDAY - this is the night shift
          attendanceRecord = attendanceRecordYesterday;
          workDateStr = yesterdayStr;
        } else {
          // Try TODAY as fallback (in case they checked in early morning)
          const [attendanceRecordToday] = await connection.query(
            `SELECT id, check_in_time, total_break_duration_minutes FROM Employee_Attendance 
             WHERE employee_id = ? AND attendance_date = ? AND check_out_time IS NULL`,
            [employee_id, todayStr],
          );

          if (attendanceRecordToday.length > 0) {
            attendanceRecord = attendanceRecordToday;
            workDateStr = todayStr;
          } else {
            connection.release();
            console.log(`❌ No active check-in found for employee ${employee_id} on ${todayStr} or ${yesterdayStr}`);
            return res.status(404).json({
              success: false,
              message: "No active check in found. Please check in first.",
              data: {
                employeeId: employee_id,
                searchedDates: [yesterdayStr, todayStr]
              }
            });
          }
        }
      } else {
        // Daytime hours (9 AM onwards) - try TODAY first
        const [attendanceRecordToday] = await connection.query(
          `SELECT id, check_in_time, total_break_duration_minutes FROM Employee_Attendance 
           WHERE employee_id = ? AND attendance_date = ? AND check_out_time IS NULL`,
          [employee_id, todayStr],
        );

        if (attendanceRecordToday.length > 0) {
          attendanceRecord = attendanceRecordToday;
          workDateStr = todayStr;
        } else {
          // Not found on today, search for MOST RECENT pending record (night shift case)
          console.log(`🔄 No record on ${todayStr}, searching for most recent pending checkout...`);

          const [recentPending] = await connection.query(
            `SELECT id, check_in_time, total_break_duration_minutes, attendance_date 
             FROM Employee_Attendance 
             WHERE employee_id = ? AND check_out_time IS NULL
             ORDER BY attendance_date DESC, check_in_time DESC
             LIMIT 1`,
            [employee_id],
          );

          if (recentPending.length > 0) {
            attendanceRecord = recentPending;
            workDateStr = recentPending[0].attendance_date;
            console.log(`✅ Found most recent pending record for checkout (date: ${workDateStr})`);
          } else {
            connection.release();
            console.log(`❌ No active check-in found for employee ${employee_id}`);
            return res.status(404).json({
              success: false,
              message: "No active check in found. Please check in first.",
              data: {
                employeeId: employee_id,
                searchedDates: [todayStr, yesterdayStr]
              }
            });
          }
        }
      }

      // Use check-out time from client if provided, otherwise use server time
      const checkOutTime = checkOutTimeFromClient || getPakistanTimeString();
      const attendanceId = attendanceRecord[0].id;
      const checkInTime = attendanceRecord[0].check_in_time;
      const existingCheckOutTime = attendanceRecord[0].check_out_time; // Get existing checkout time
      const totalBreakMinutes =
        attendanceRecord[0].total_break_duration_minutes || 0;

      // VALIDATE: Prevent double checkout (already checked out)
      // If they already have a check_out_time in database, they cannot checkout again
      if (existingCheckOutTime) {
        connection.release();
        console.log(`❌ ALREADY CHECKED OUT: Employee ${employee_id} already has checkout time: ${existingCheckOutTime}`);
        return res.status(400).json({
          success: false,
          message: 'You have already checked out. You cannot checkout twice.',
          data: {
            existingCheckoutTime: existingCheckOutTime,
            attemptedCheckOutTime: checkOutTime
          }
        });
      }

      // Calculate working times
      // For night shift: if check-in is after 21:00 and check-out is before 06:00 NEXT DAY,
      // OR if check-in is after 21:00 and checkout is later same day
      const [checkInHour, checkInMin] = checkInTime.split(":").map(Number);
      const [checkOutHour, checkOutMin] = checkOutTime.split(":").map(Number);

      const checkInTotalMinutes = checkInHour * 60 + checkInMin;
      const checkOutTotalMinutes = checkOutHour * 60 + checkOutMin;

      // Check if check-in was at a valid shift time
      const isValidShiftCheckIn = checkInTotalMinutes >= 21 * 60 || checkInTotalMinutes <= 6 * 60;

      // ============================================================
      // CHECKOUT DEADLINE VALIDATION (CRITICAL)
      // ============================================================
      // Night shift employees MUST checkout before 9:00 AM
      // If checkout time is 9:00 AM or later, REJECT the checkout
      // EXCEPTION: Allow late checkout if the check-in was INVALID (outside shift hours)
      // This allows employees to clear out bad check-in records
      if (checkOutTotalMinutes >= 9 * 60 && isValidShiftCheckIn) { // 09:00 = 540 minutes
        connection.release();
        console.log(
          `❌ CHECKOUT DEADLINE EXCEEDED: Employee ${employee_id} attempted checkout at ${checkOutTime} (after 9:00 AM deadline)`,
        );
        return res.status(400).json({
          success: false,
          message: `Checkout deadline exceeded. You must checkout before 9:00 AM. Your attempted checkout time: ${checkOutTime}`,
          data: {
            checkOutTime: checkOutTime,
            deadline: "09:00 (9:00 AM)",
            exceedsBy: `${checkOutTotalMinutes - (9 * 60)} minutes`
          }
        });
      }

      let grossWorkingMinutes = 0;

      // Determine if this is a night shift based on check-in time
      const isNightShift = checkInTotalMinutes >= 21 * 60; // 21:00 or later

      if (isNightShift) {
        // Night shift: check-in at 21:00+
        // The key insight: if we found an active check-in on workDateStr,
        // and we're checking out now on the same workDateStr,
        // then this is either a same-night quick checkout or continues to next day

        // Calculate time difference for same-work-date scenarios
        const timeDifferenceMinutes =
          checkOutTotalMinutes - checkInTotalMinutes;

        if (timeDifferenceMinutes >= 0) {
          // Positive time difference: checkout is after check-in on same work date
          // Examples:
          // - 21:56:49 → 21:56:58 (9 seconds, same night)
          // - 21:00:00 → 23:30:00 (2.5 hours, same night)
          grossWorkingMinutes = timeDifferenceMinutes;
          console.log(
            `📊 Same-Work-Date Night Shift: ${checkInTime} → ${checkOutTime} = ${grossWorkingMinutes}min (${(grossWorkingMinutes / 60).toFixed(2)}h)`,
          );
        } else if (checkOutTotalMinutes < 6 * 60) {
          // Negative time difference BUT checkout is BEFORE 6 AM = next day early morning
          // Examples:
          // - Check-in 21:00:00 → Check-out 05:30:00 (next day morning)
          // - Check-in 23:30:00 → Check-out 04:00:00 (next day morning)
          // - Check-in 22:07:50 → Check-out 05:59:00 (next day morning - BEFORE 6 AM)
          const minutesUntilMidnight = 24 * 60 - checkInTotalMinutes; // Remaining today
          const minutesAfterMidnight = checkOutTotalMinutes; // Tomorrow morning
          grossWorkingMinutes = minutesUntilMidnight + minutesAfterMidnight;

          console.log(
            `📊 Normal Night Shift: Check-in ${checkInTime} → Check-out next day ${checkOutTime} (BEFORE 6 AM)`,
          );
          console.log(
            `   Remaining today: ${minutesUntilMidnight}min, Tomorrow: ${minutesAfterMidnight}min, Total: ${grossWorkingMinutes}min (${(grossWorkingMinutes / 60).toFixed(2)}h)`,
          );
        } else if (
          checkOutTotalMinutes >= 6 * 60 &&
          checkOutTotalMinutes <= 9 * 60
        ) {
          // Checkout is between 6 AM and 9 AM = still early morning of next day (shift continuation/overtime)
          // Examples:
          // - Check-in 21:00 (Day 1) → Check-out 06:00 (Day 2 early morning at shift end)
          // - Check-in 21:00 (Day 1) → Check-out 06:30 (Day 2 early morning - slightly past shift end)
          // - Check-in 21:00 (Day 1) → Check-out 08:00 (Day 2 early morning)
          const minutesUntilMidnight = 24 * 60 - checkInTotalMinutes; // Remaining Day 1
          const minutesAfterMidnight = checkOutTotalMinutes; // Day 2 morning
          grossWorkingMinutes = minutesUntilMidnight + minutesAfterMidnight;

          console.log(
            `📊 Night Shift with Early Morning Checkout (6 AM - 9 AM):`,
          );
          console.log(
            `   Check-in: ${checkInTime} (Day 1) → Check-out: ${checkOutTime} (Day 2 early morning)`,
          );
          console.log(`   Minutes until midnight: ${minutesUntilMidnight}min`);
          console.log(`   Minutes after midnight: ${minutesAfterMidnight}min`);
          console.log(
            `   Total: ${grossWorkingMinutes}min = ${(grossWorkingMinutes / 60).toFixed(1)}h`,
          );
        } else {
          // Checkout is after 6 AM = next day afternoon checkout after night shift
          // Examples:
          // - Check-in 21:00 (Day 1) → Check-out 15:49 (Day 2 afternoon)
          const minutesUntilMidnight = 24 * 60 - checkInTotalMinutes;
          const minutesAfterMidnight = checkOutTotalMinutes;
          grossWorkingMinutes = minutesUntilMidnight + minutesAfterMidnight;

          console.log(`📊 Night Shift with Next-Day Afternoon Checkout:`);
          console.log(
            `   Check-in: ${checkInTime} (Day 1) → Check-out: ${checkOutTime} (Day 2 afternoon)`,
          );
          console.log(`   Minutes until midnight: ${minutesUntilMidnight}min`);
          console.log(`   Minutes after midnight: ${minutesAfterMidnight}min`);
          console.log(
            `   Total: ${grossWorkingMinutes}min = ${(grossWorkingMinutes / 60).toFixed(1)}h`,
          );
        }
      } else {
        // Check-in is in early morning (before 21:00)
        // Could be day shift (same day checkout) or crosses midnight
        const timeDifference = checkOutTotalMinutes - checkInTotalMinutes;
        
        if (timeDifference >= 0) {
          // Checkout is after check-in on same day
          grossWorkingMinutes = timeDifference;
          console.log(
            `📊 Day Shift: ${checkInTime} → ${checkOutTime} = ${grossWorkingMinutes}min`,
          );
        } else {
          // Negative difference = checkout is on next day (after midnight)
          // Examples: Check-in 19:22:27 → Check-out 08:23:56 (next day)
          const minutesUntilMidnight = 24 * 60 - checkInTotalMinutes;
          const minutesAfterMidnight = checkOutTotalMinutes;
          grossWorkingMinutes = minutesUntilMidnight + minutesAfterMidnight;
          console.log(
            `📊 Shift Crossing Midnight: ${checkInTime} → ${checkOutTime} (next day)`,
          );
          console.log(
            `   Minutes until midnight: ${minutesUntilMidnight}min, After midnight: ${minutesAfterMidnight}min, Total: ${grossWorkingMinutes}min`,
          );
        }
      }

      // Ensure no negative values
      grossWorkingMinutes = Math.max(0, grossWorkingMinutes);
      const netWorkingMinutes = Math.max(
        0,
        grossWorkingMinutes - totalBreakMinutes,
      );

      // Calculate overtime
      const expectedWorkingMinutes = 540; // 9 hours
      let overtimeMinutes = 0;
      let overtimeHours = 0;

      // Overtime is calculated when net working time exceeds expected time
      if (netWorkingMinutes > expectedWorkingMinutes) {
        overtimeMinutes = netWorkingMinutes - expectedWorkingMinutes;
        overtimeHours = (overtimeMinutes / 60).toFixed(2);
        console.log(
          `📊 Overtime calculated: ${overtimeMinutes} minutes (${overtimeHours}h)`,
        );
      } else {
        console.log(
          `⏱️ No overtime - worked ${(netWorkingMinutes / 60).toFixed(1)}h out of expected 9h`,
        );
      }

      // Update attendance record
      await connection.query(
        `UPDATE Employee_Attendance 
         SET check_out_time = ?,
             gross_working_time_minutes = ?,
             net_working_time_minutes = ?,
             overtime_minutes = ?,
             overtime_hours = ?,
             updated_at = NOW()
         WHERE id = ?`,
        [
          checkOutTime,
          grossWorkingMinutes,
          netWorkingMinutes,
          overtimeMinutes,
          overtimeHours,
          attendanceId,
        ],
      );

      // Validate working hours were saved correctly
      const [updatedRecord] = await connection.query(
        "SELECT gross_working_time_minutes, net_working_time_minutes FROM Employee_Attendance WHERE id = ?",
        [attendanceId],
      );

      if (
        updatedRecord.length > 0 &&
        (updatedRecord[0].gross_working_time_minutes === 0 ||
          updatedRecord[0].gross_working_time_minutes === null)
      ) {
        console.warn(
          `⚠️ WARNING: Working hours not saved for attendance ID ${attendanceId}, attempting to fix...`,
        );
        await validateAndFixWorkingHours(
          connection,
          attendanceId,
          checkInTime,
          checkOutTime,
          totalBreakMinutes,
          "Present",
        );
      }

      console.log(`[SUCCESS] Check Out: Employee ${employee_id} at ${checkOutTime}`);

      res.status(200).json({
        success: true,
        message: "Check out successful",
        isCheckedIn: false,
        data: {
          id: attendanceId,
          employee_id,
          check_out_time: checkOutTime,
          gross_working_time_minutes: grossWorkingMinutes,
          net_working_time_minutes: netWorkingMinutes,
          overtime_hours: parseFloat(overtimeHours),
          attendance_date: workDateStr,
          isCheckedIn: false,
        },
      });
    } finally {
      if (connection) connection.release();
    }
  } catch (error) {
    console.error("❌ Check Out error:", error);
    if (connection) connection.release();
    res.status(500).json({
      success: false,
      message: "Check out failed",
      error: error.message,
    });
  }
};

// Generate Absent Records for all employees from joining date to today
exports.generateAbsentRecords = async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();

    console.log("🔄 Starting absent record generation...");

    // Get all active employees with their joining dates
    const [employees] = await connection.query(
      `SELECT employee_id, name, email, created_at as joining_date 
       FROM user_as_employees 
       WHERE status = 'Active'`,
    );

    if (employees.length === 0) {
      connection.release();
      return res.status(200).json({
        success: true,
        message: "No active employees found",
        data: { processed: 0, created: 0 },
      });
    }

    let totalProcessed = 0;
    let totalCreated = 0;

    for (const employee of employees) {
      const { employee_id, name, email, joining_date } = employee;

      // Calculate date range from joining to today
      const startDate = new Date(joining_date);
      const today = getPakistanDate();
      today.setHours(0, 0, 0, 0); // Reset to start of day

      console.log(
        `👤 Processing ${name} (ID: ${employee_id}) from ${startDate.toDateString()}`,
      );

      // Get all existing attendance dates for this employee
      const [existingDates] = await connection.query(
        `SELECT DISTINCT DATE(attendance_date) as attendance_date FROM Employee_Attendance 
         WHERE employee_id = ? AND DATE(attendance_date) >= ? AND DATE(attendance_date) <= ?`,
        [
          employee_id,
          startDate.toISOString().split("T")[0],
          today.toISOString().split("T")[0],
        ],
      );

      const existingDateSet = new Set(
        existingDates.map((row) => {
          // Handle both DATE objects and string date values
          if (row.attendance_date instanceof Date) {
            return row.attendance_date.toISOString().split("T")[0];
          }
          return row.attendance_date;
        }),
      );

      // Generate all dates from joining to today
      const currentDate = new Date(startDate);
      let createdForEmployee = 0;

      while (currentDate <= today) {
        const dateString = currentDate.toISOString().split("T")[0];

        // Skip weekends (optional - remove if you want to track weekend absences)
        const dayOfWeek = currentDate.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday = 0, Saturday = 6

        // If no attendance record exists for this date and it's not weekend
        if (!existingDateSet.has(dateString) && !isWeekend) {
          // First check if record already exists
          const [existingRecord] = await connection.query(
            `SELECT id FROM Employee_Attendance WHERE employee_id = ? AND attendance_date = ?`,
            [employee_id, dateString],
          );

          if (existingRecord.length === 0) {
            // Record doesn't exist, create it
            await connection.query(
              `INSERT INTO Employee_Attendance 
               (employee_id, email, name, attendance_date, status, 
                total_breaks_taken, smoke_break_count, dinner_break_count, 
                washroom_break_count, prayer_break_count, smoke_break_duration_minutes, 
                dinner_break_duration_minutes, washroom_break_duration_minutes, 
                prayer_break_duration_minutes, total_break_duration_minutes, 
                gross_working_time_minutes, net_working_time_minutes, overtime_minutes, 
                overtime_hours, on_time, late_by_minutes, created_at, updated_at) 
               VALUES (?, ?, ?, ?, 'Absent', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.00, 0, 0, NOW(), NOW())`,
              [employee_id, email, name, dateString],
            );

            createdForEmployee++;
            totalCreated++;
          }
        }

        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
      }

      console.log(
        `   ✅ Created ${createdForEmployee} absent records for ${name}`,
      );
      totalProcessed++;
    }

    connection.release();

    console.log(`🎯 Absent record generation complete:`);
    console.log(`   📊 Processed ${totalProcessed} employees`);
    console.log(`   📝 Created ${totalCreated} absent records`);

    res.status(200).json({
      success: true,
      message: "Absent records generated successfully",
      data: {
        processed: totalProcessed,
        created: totalCreated,
        employees: employees.map((emp) => ({
          employee_id: emp.employee_id,
          name: emp.name,
          joining_date: emp.joining_date,
        })),
      },
    });
  } catch (error) {
    console.error("❌ Generate Absent Records error:", error);
    if (connection) connection.release();
    res.status(500).json({
      success: false,
      message: "Failed to generate absent records",
      error: error.message,
    });
  }
};

// Record Break Start (saves break immediately when employee starts break)
exports.recordBreakStart = async (req, res) => {
  let connection;
  try {
    const jwtEmployeeId = req.user?.employeeId; // From JWT (employee_onboarding.id)
    const jwtUserId = req.user?.userId; // From JWT (user_as_employees.id)
    const reqEmployeeId = req.body.employee_id;
    let employee_id = jwtEmployeeId || reqEmployeeId || jwtUserId;

    const { break_type, break_start_time, reason } = req.body;

    // Calculate attendance_date using same night shift logic
    const now = new Date();
    const checkInHour = now.getHours();
    let attendanceDate;
    if (checkInHour >= 0 && checkInHour < 6) {
      // Early morning (00:00-05:59) - belongs to yesterday's shift
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      attendanceDate = getLocalDateString(yesterday);
    } else {
      // Evening/normal hours - use today
      attendanceDate = getLocalDateString(now);
    }

    console.log("⏸️ Record break START request received:");
    console.log("   - JWT employeeId:", jwtEmployeeId);
    console.log("   - Request employee_id:", reqEmployeeId);
    console.log("   - Using employee_id:", employee_id);
    console.log("   - Break Type:", break_type);
    console.log("   - Start Time:", break_start_time);
    console.log("   - Calculated attendance_date:", attendanceDate);

    if (!employee_id || !break_type) {
      return res.status(400).json({
        success: false,
        message: "Employee ID and break type are required",
      });
    }

    const validBreakTypes = ["Smoke", "Dinner", "Washroom", "Prayer", "Other"];
    if (!validBreakTypes.includes(break_type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid break type",
      });
    }

    connection = await pool.getConnection();

    try {
      // Find any attendance record for this employee on that date
      const [attendanceRows] = await connection.query(
        `SELECT id, check_in_time, check_out_time, status FROM Employee_Attendance 
         WHERE employee_id = ? AND attendance_date = ? LIMIT 1`,
        [employee_id, attendanceDate],
      );

      const breakStart =
        break_start_time || new Date().toTimeString().split(" ")[0];

      let attendanceId;

      if (attendanceRows.length === 0) {
        // No attendance record exists -> create a Present record with check_in_time = breakStart
        const [createRes] = await connection.query(
          `INSERT INTO Employee_Attendance (employee_id, email, name, attendance_date, status, check_in_time, total_breaks_taken, total_break_duration_minutes, created_at, updated_at)
           VALUES (?, ?, ?, ?, 'Present', ?, 0, 0, NOW(), NOW())`,
          [employee_id, null, null, attendanceDate, breakStart],
        );
        attendanceId = createRes.insertId;
        console.log(
          `ℹ️ Created attendance record ${attendanceId} as Present because break was started without an attendance record`,
        );
      } else {
        const a = attendanceRows[0];
        attendanceId = a.id;

        // If the record exists but shows as Absent or has no check_in_time, convert to Present
        if (a.status === "Absent" || !a.check_in_time) {
          await connection.query(
            `UPDATE Employee_Attendance SET status = 'Present', check_in_time = COALESCE(check_in_time, ?), updated_at = NOW() WHERE id = ?`,
            [breakStart, attendanceId],
          );
          console.log(
            `ℹ️ Updated attendance ${attendanceId} to Present (set check_in_time to ${breakStart})`,
          );
        }

        // If the user has already checked out, refuse to start a break
        if (a.check_out_time) {
          if (connection) connection.release();
          return res.status(400).json({
            success: false,
            message: "Cannot start a break after check-out",
          });
        }
      }

      // Insert break record with only start time (end_time will be NULL initially)
      const [breakResult] = await connection.query(
        `INSERT INTO Employee_Breaks 
         (attendance_id, employee_id, break_type, break_start_time, break_end_time, reason)
         VALUES (?, ?, ?, ?, NULL, ?)`,
        [attendanceId, employee_id, break_type, breakStart, reason || null],
      );

      console.log(
        `✅ Break START recorded: ${break_type} for employee ${employee_id} at ${breakStart}`,
      );
      console.log(`   Break ID: ${breakResult.insertId}`);

      res.status(201).json({
        success: true,
        message: "Break start recorded successfully",
        data: {
          id: breakResult.insertId,
          employee_id,
          break_type,
          break_start_time: breakStart,
          break_end_time: null,
          status: "active",
        },
      });
    } finally {
      if (connection) connection.release();
    }
  } catch (error) {
    console.error("❌ Record Break START error:", error);
    if (connection) connection.release();
    res.status(500).json({
      success: false,
      message: "Failed to record break start",
      error: error.message,
    });
  }
};

// Record Break End (updates break with end time and duration)
exports.recordBreakEnd = async (req, res) => {
  let connection;
  try {
    const jwtEmployeeId = req.user?.employeeId; // From JWT (employee_onboarding.id)
    const jwtUserId = req.user?.userId; // From JWT (user_as_employees.id)
    const reqEmployeeId = req.body.employee_id;
    let employee_id = jwtEmployeeId || reqEmployeeId || jwtUserId;

    const { break_type, break_end_time, break_duration_minutes } = req.body;

    // Calculate attendance_date using Pakistan timezone night-shift logic
    const now = getPakistanDate();
    const checkInHour = now.getUTCHours();
    let attendanceDate;
    if (checkInHour >= 0 && checkInHour < 6) {
      // Early morning (00:00-05:59 PKT) - belongs to yesterday's shift
      attendanceDate = getPakistanYesterdayString();
    } else {
      // Evening/normal hours - use today (PKT)
      attendanceDate = getPakistanDateString();
    }

    console.log('⏸️ Record break END request received:');
    console.log('   - JWT employeeId:', jwtEmployeeId);
    console.log('   - Request employee_id:', reqEmployeeId);
    console.log('   - Using employee_id:', employee_id);
    console.log('   - Break Type:', break_type);
    console.log('   - End Time:', break_end_time);
    console.log('   - Duration:', break_duration_minutes);
    console.log('   - Calculated attendance_date:', attendanceDate);

    if (!employee_id || !break_type) {
      return res.status(400).json({
        success: false,
        message: "Employee ID and break type are required",
      });
    }

    const validBreakTypes = ["Smoke", "Dinner", "Washroom", "Prayer", "Other"];
    if (!validBreakTypes.includes(break_type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid break type",
      });
    }

    connection = await pool.getConnection();

    try {
      // Get today's attendance record using calculated attendance date
      console.log('🔍 Looking for attendance record:');
      console.log('   - employee_id:', employee_id, '(type:', typeof employee_id, ')');
      console.log('   - attendance_date:', attendanceDate);
      console.log('   - check_out_time IS NULL');
      
      const [attendanceRecord] = await connection.query(
        `SELECT id FROM Employee_Attendance 
         WHERE employee_id = ? AND attendance_date = ? AND check_out_time IS NULL`,
        [employee_id, attendanceDate],
      );

      let attendanceId;
      console.log('🔍 Attendance record query result:', attendanceRecord);

      if (attendanceRecord.length === 0) {
        if (connection) connection.release();
        return res.status(404).json({
          success: false,
          message: 'No active check in found for today'
        });
      }

if (!attendanceId && attendanceRecord && attendanceRecord.length > 0) {
        attendanceId = attendanceRecord[0].id;
      }

      const breakEnd = break_end_time || getPakistanTimeString();

      // Find the most recent break record for this type that doesn't have an end time
      console.log('🔍 Looking for active break record:');
      console.log('   - attendance_id:', attendanceId);
      console.log('   - employee_id:', employee_id);
      console.log('   - break_type:', break_type);
      console.log('   - break_end_time IS NULL');
      
      const [breakRecord] = await connection.query(
        `SELECT id FROM Employee_Breaks 
         WHERE attendance_id = ? AND employee_id = ? AND break_type = ? AND break_end_time IS NULL
         ORDER BY created_at DESC LIMIT 1`,
        [attendanceId, employee_id, break_type],
      );

      console.log('🔍 Break record query result:', breakRecord);

      if (breakRecord.length === 0) {
        if (connection) connection.release();
        return res.status(404).json({
          success: false,
          message: 'No active break found for this type'
        });
      }

      const breakId = breakRecord[0].id;
      const breakDurationMinutes = Math.floor(break_duration_minutes || 0);

      // Update break record with end time and duration
      const [updateBreakResult] = await connection.query(
        `UPDATE Employee_Breaks 
         SET break_end_time = ?, break_duration_minutes = ?, updated_at = NOW()
         WHERE id = ?`,
        [breakEnd, breakDurationMinutes, breakId],
      );
      console.log(`🔧 Employee_Breaks UPDATE affectedRows=${updateBreakResult.affectedRows}, breakId=${breakId}`);

      // Update attendance record with break statistics
      const fieldMap = {
        Smoke: "smoke_break_count",
        Dinner: "dinner_break_count",
        Washroom: "washroom_break_count",
        Prayer: "prayer_break_count",
        Other: "smoke_break_count",
      };

      const breakCountField = fieldMap[break_type];

      let updateQueryParts;
      let queryParams;

      if (["Smoke", "Dinner", "Washroom", "Prayer"].includes(break_type)) {
        const breakDurationField =
          break_type.toLowerCase() + "_break_duration_minutes";

        updateQueryParts = [
          "UPDATE Employee_Attendance",
          "SET total_breaks_taken = total_breaks_taken + 1,",
          `    ${breakCountField} = ${breakCountField} + 1,`,
          `    ${breakDurationField} = ${breakDurationField} + ?,`,
          "    total_break_duration_minutes = total_break_duration_minutes + ?,",
          "    updated_at = NOW()",
          "WHERE id = ?",
        ];
        queryParams = [
          breakDurationMinutes,
          breakDurationMinutes,
          attendanceId,
        ];
      } else {
        updateQueryParts = [
          "UPDATE Employee_Attendance",
          "SET total_breaks_taken = total_breaks_taken + 1,",
          "    total_break_duration_minutes = total_break_duration_minutes + ?,",
          "    updated_at = NOW()",
          "WHERE id = ?",
        ];
        queryParams = [breakDurationMinutes, attendanceId];
      }
      
      const updateQuery = updateQueryParts.join('\n');
      await connection.query(updateQuery, queryParams);

      console.log(
        `✅ Break END recorded: ${break_type} for employee ${employee_id} (${breakDurationMinutes} min)`,
      );

      res.status(200).json({
        success: true,
        message: "Break end recorded successfully",
        data: {
          id: breakId,
          employee_id,
          break_type,
          break_end_time: breakEnd,
          break_duration_minutes: breakDurationMinutes,
          status: "completed",
        },
      });
    } finally {
      if (connection) connection.release();
    }
  } catch (error) {
    console.error("❌ Record Break END error:", error);
    if (connection) connection.release();
    res.status(500).json({
      success: false,
      message: "Failed to record break end",
      error: error.message,
    });
  }
};

// Auto-save break progress (updates current duration every 30 seconds)
exports.recordBreakProgress = async (req, res) => {
  let connection;
  try {
    const jwtEmployeeId = req.user?.employeeId; // From JWT (employee_onboarding.id)
    const jwtUserId = req.user?.userId; // From JWT (user_as_employees.id)
    const reqEmployeeId = req.body.employee_id;
    let employee_id = jwtEmployeeId || reqEmployeeId || jwtUserId;

    const { break_type, current_time, current_duration_minutes } = req.body;

    // Calculate attendance_date using Pakistan timezone night-shift logic
    const now = getPakistanDate();
    const checkInHour = now.getUTCHours();
    let attendanceDate;
    if (checkInHour >= 0 && checkInHour < 6) {
      // Early morning (00:00-05:59 PKT) - belongs to yesterday's shift
      attendanceDate = getPakistanYesterdayString();
    } else {
      // Evening/normal hours - use today (PKT)
      attendanceDate = getPakistanDateString();
    }

    console.log("⏸️ Auto-save break progress request received:");
    console.log("   - Break Type:", break_type);
    console.log("   - Current Duration:", current_duration_minutes, "minutes");

    if (!employee_id || !break_type) {
      return res.status(400).json({
        success: false,
        message: "Employee ID and break type are required",
      });
    }

    const validBreakTypes = ["Smoke", "Dinner", "Washroom", "Prayer", "Other"];
    if (!validBreakTypes.includes(break_type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid break type",
      });
    }

    connection = await pool.getConnection();

    try {
      // Get today's attendance record using calculated attendance date
      const [attendanceRecord] = await connection.query(
        `SELECT id FROM Employee_Attendance 
         WHERE employee_id = ? AND attendance_date = ? AND check_out_time IS NULL`,
        [employee_id, attendanceDate],
      );

      if (attendanceRecord.length === 0) {
        if (connection) connection.release();
        return res.status(404).json({
          success: false,
          message: "No active check in found for today",
        });
      }

      const attendanceId = attendanceRecord[0].id;

      // Find the most recent break record for this type that doesn't have an end time
      const [breakRecord] = await connection.query(
        `SELECT id FROM Employee_Breaks 
         WHERE attendance_id = ? AND employee_id = ? AND break_type = ? AND break_end_time IS NULL
         ORDER BY created_at DESC LIMIT 1`,
        [attendanceId, employee_id, break_type],
      );

      if (breakRecord.length === 0) {
        if (connection) connection.release();
        return res.status(404).json({
          success: false,
          message: "No active break found for this type",
        });
      }

      const breakId = breakRecord[0].id;

      // Update break record with current duration (while still active)
      // This is an optional field to track progress in real-time
      // Note: This updates the record but doesn't set end_time yet
      await connection.query(
        `UPDATE Employee_Breaks 
         SET break_duration_minutes = ?, updated_at = NOW()
         WHERE id = ? AND break_end_time IS NULL`,
        [Math.floor(current_duration_minutes), breakId],
      );

      // Update only the per-type duration field so the UI reflects ongoing duration.
      // IMPORTANT: Do NOT increment total counts or add to total_break_duration_minutes here to avoid double-counting.
      const durationFieldMap = {
        'Smoke': 'smoke_break_duration_minutes',
        'Dinner': 'dinner_break_duration_minutes',
        'Washroom': 'washroom_break_duration_minutes',
        'Prayer': 'prayer_break_duration_minutes',
        'Other': 'smoke_break_duration_minutes'
      };

      if (['Smoke', 'Dinner', 'Washroom', 'Prayer', 'Other'].includes(break_type)) {
        const breakDurationField = durationFieldMap[break_type];
        try {
          await connection.query(
            `UPDATE Employee_Attendance
             SET ${breakDurationField} = ?,
                 updated_at = NOW()
             WHERE id = ?`,
            [Math.floor(current_duration_minutes), attendanceId]
          );
          console.log(`ℹ️ Attendance ${attendanceId} ${breakDurationField} updated to ${Math.floor(current_duration_minutes)} (autosave)`);
        } catch (e) {
          console.warn('⚠️ Failed to update attendance duration during autosave:', e);
        }
      }

      console.log(
        `✅ Break progress auto-saved: ${break_type} - Duration: ${current_duration_minutes}m`,
      );

      res.status(200).json({
        success: true,
        message: "Break progress saved successfully",
        data: {
          id: breakId,
          employee_id,
          break_type,
          current_duration_minutes: Math.floor(current_duration_minutes),
          status: "in_progress",
        },
      });
    } finally {
      if (connection) connection.release();
    }
  } catch (error) {
    console.error("❌ Record Break Progress error:", error);
    if (connection) connection.release();
    res.status(500).json({
      success: false,
      message: "Failed to record break progress",
      error: error.message,
    });
  }
};

// Get ongoing breaks for today (used to restore breaks on page reload)
exports.getOngoingBreaks = async (req, res) => {
  let connection;
  try {
    const jwtEmployeeId = req.user?.employeeId; // From JWT (employee_onboarding.id)
    const jwtUserId = req.user?.userId; // From JWT (user_as_employees.id)
    const reqEmployeeId = req.params.employee_id;
    let employee_id = jwtEmployeeId || reqEmployeeId || jwtUserId;

    const now = new Date();
    const checkInHour = now.getHours();

    // Calculate attendance_date using same night shift logic as check-in
    let attendanceDate;
    if (checkInHour >= 0 && checkInHour < 6) {
      // Early morning (00:00-05:59) - belongs to yesterday's shift
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      attendanceDate = getLocalDateString(yesterday);
    } else {
      // Evening/normal hours - use today
      attendanceDate = getLocalDateString(now);
    }

    console.log("📋 Get ongoing breaks request received:");
    console.log("   - JWT employeeId:", jwtEmployeeId);
    console.log("   - Params employee_id:", reqEmployeeId);
    console.log("   - Using employee_id:", employee_id);
    console.log("   - Calculated attendance_date:", attendanceDate);

    if (!employee_id) {
      return res.status(400).json({
        success: false,
        message: "Employee ID is required",
      });
    }

    connection = await pool.getConnection();

    try {
      // Get today's attendance record using calculated attendance date
      const [attendanceRecord] = await connection.query(
        `SELECT id FROM Employee_Attendance 
         WHERE employee_id = ? AND attendance_date = ? AND check_out_time IS NULL`,
        [employee_id, attendanceDate],
      );

      if (attendanceRecord.length === 0) {
        if (connection) connection.release();
        return res.status(200).json({
          success: true,
          message: "No active check in found",
          data: [],
        });
      }

      const attendanceId = attendanceRecord[0].id;

      // Find all ongoing breaks (break_end_time IS NULL) for today
      const [ongoingBreaks] = await connection.query(
        `SELECT id, break_type, break_start_time, break_duration_minutes, created_at
         FROM Employee_Breaks 
         WHERE attendance_id = ? AND employee_id = ? AND break_end_time IS NULL
         ORDER BY created_at DESC`,
        [attendanceId, employee_id],
      );

      console.log(
        `✅ Found ${ongoingBreaks.length} ongoing breaks for employee ${employee_id}`,
      );

      // Compute real-time duration for each ongoing break using the attendance date
      const now = new Date();
      const result = ongoingBreaks.map((brk) => {
        // Construct break start using the calculated attendanceDate.
        // Note: For early-morning times (00:00 - 05:59), the actual datetime is on the next calendar day
        // even though attendance_date represents the previous shift day. Handle that here.
        const hourPart =
          parseInt(
            String(brk.break_start_time || "00:00:00").split(":")[0],
            10,
          ) || 0;
        let breakDateObj = new Date(`${attendanceDate}T00:00:00`);
        if (hourPart >= 0 && hourPart < 6) {
          // move to next calendar day for the real timestamp
          breakDateObj.setDate(breakDateObj.getDate() + 1);
        }
        const pad = (n) => String(n).padStart(2, "0");
        const dateForBreak = `${breakDateObj.getFullYear()}-${pad(breakDateObj.getMonth() + 1)}-${pad(breakDateObj.getDate())}`;
        const breakStart = new Date(`${dateForBreak}T${brk.break_start_time}`);
        const durationNow = Math.floor((now - breakStart) / (1000 * 60));

        // Prefer the real-time calculated duration if it differs significantly from stored value
        const storedDuration = brk.break_duration_minutes || 0;
        const chosenDuration =
          Math.abs(storedDuration - durationNow) > 10
            ? durationNow
            : Math.max(storedDuration, durationNow);

        return {
          id: brk.id,
          break_type: brk.break_type,
          break_start_time: brk.break_start_time,
          break_duration_minutes: chosenDuration,
          created_at: brk.created_at,
          status: "ongoing",
          attendance_date: attendanceDate,
        };
      });

      res.status(200).json({
        success: true,
        message: "Ongoing breaks retrieved successfully",
        data: result,
      });
    } finally {
      if (connection) connection.release();
    }
  } catch (error) {
    console.error("❌ Get Ongoing Breaks error:", error);
    if (connection) connection.release();
    res.status(500).json({
      success: false,
      message: "Failed to retrieve ongoing breaks",
      error: error.message,
    });
  }
};

// Get today's completed breaks for an employee
exports.getTodayBreaks = async (req, res) => {
  let connection;
  try {
    const jwtEmployeeId = req.user?.employeeId; // From JWT (employee_onboarding.id)
    const jwtUserId = req.user?.userId; // From JWT (user_as_employees.id)
    const reqEmployeeId = req.params.employee_id;
    let employee_id = jwtEmployeeId || reqEmployeeId || jwtUserId;

    const now = new Date();
    const checkInHour = now.getHours();

    // Calculate attendance_date using same night shift logic as check-in
    let attendanceDate;
    if (checkInHour >= 0 && checkInHour < 6) {
      // Early morning (00:00-05:59) - belongs to yesterday's shift
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      attendanceDate = getLocalDateString(yesterday);
    } else {
      // Evening/normal hours - use today
      attendanceDate = getLocalDateString(now);
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`📋 GetToday'sBreaks: employee=${employee_id} attendance_date=${attendanceDate} sourceParam=${reqEmployeeId || 'none'} jwtEmployeeId=${jwtEmployeeId || 'none'}`);
    }

    if (!employee_id) {
      return res.status(400).json({
        success: false,
        message: "Employee ID is required",
      });
    }

    connection = await pool.getConnection();

    try {
      // Convert user_as_employees.id to employee_onboarding.id if needed
      let finalEmployeeId = employee_id;
      if (!jwtEmployeeId && reqEmployeeId) {
        // If employee_id came from params (could be user_as_employees.id), convert it
        // First check if it's already an onboarding.id
        const [directMatch] = await connection.query(
          `SELECT id FROM employee_onboarding WHERE id = ?`,
          [reqEmployeeId],
        );

        if (directMatch.length === 0) {
          // Not a direct match, try to find via user_as_employees
          const [userMapping] = await connection.query(
            `SELECT employee_id FROM user_as_employees WHERE id = ?`,
            [reqEmployeeId],
          );

          if (userMapping.length > 0) {
            finalEmployeeId = userMapping[0].employee_id;
            console.log(
              `🔄 Converted user_as_employees.id ${reqEmployeeId} to employee_onboarding.id ${finalEmployeeId}`,
            );
          }
        }
      }

      // Get today's attendance record using calculated attendance date
      const [attendanceRecord] = await connection.query(
        `SELECT id FROM Employee_Attendance 
         WHERE employee_id = ? AND attendance_date = ?`,
        [finalEmployeeId, attendanceDate],
      );

      if (attendanceRecord.length === 0) {
        return res.status(200).json({
          success: true,
          message: "No attendance record for today",
          data: [],
        });
      }

      const attendanceId = attendanceRecord[0].id;

      // Get all breaks for today (both completed and ongoing)
      const [todayBreaks] = await connection.query(
        `SELECT id, break_type, break_start_time, break_end_time, break_duration_minutes, created_at
         FROM Employee_Breaks 
         WHERE attendance_id = ? AND employee_id = ?
         ORDER BY created_at ASC`,
        [attendanceId, finalEmployeeId],
      );

      console.log(
        `✅ Found ${todayBreaks.length} breaks for employee ${finalEmployeeId} on ${attendanceDate}`,
      );

      res.status(200).json({
        success: true,
        message: "Today's breaks retrieved successfully",
        data: todayBreaks.map((brk) => ({
          id: brk.id,
          break_type: brk.break_type,
          break_start_time: brk.break_start_time,
          break_end_time: brk.break_end_time || null,
          break_duration_minutes: brk.break_duration_minutes || 0,
          created_at: brk.created_at,
          status: brk.break_end_time ? "completed" : "ongoing",
        })),
      });
    } finally {
      if (connection) connection.release();
    }
  } catch (error) {
    console.error("❌ Get Today's Breaks error:", error);
    if (connection) connection.release();
    res.status(500).json({
      success: false,
      message: "Failed to retrieve today's breaks",
      error: error.message,
    });
  }
};

// Record Break (Legacy - for backward compatibility)
exports.recordBreak = async (req, res) => {
  let connection;
  try {
    // Extract from both JWT (auth) and request body for flexibility
    const jwtEmployeeId = req.user?.employeeId; // From JWT (employee_onboarding.id)
    const jwtUserId = req.user?.userId; // From JWT token (user_as_employees.id)
    const reqEmployeeId = req.body.employee_id; // From request body

    // Determine which employee_id to use - MUST use jwtEmployeeId for FK consistency
    let employee_id = jwtEmployeeId || reqEmployeeId || jwtUserId;

    const {
      break_type,
      break_start_time,
      break_end_time,
      break_duration_minutes,
      reason,
    } = req.body;

    // Calculate attendance_date using same night shift logic
    const now = new Date();
    const checkInHour = now.getHours();
    let attendanceDate;
    if (checkInHour >= 0 && checkInHour < 6) {
      // Early morning (00:00-05:59) - belongs to yesterday's shift
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      attendanceDate = getLocalDateString(yesterday);
    } else {
      // Evening/normal hours - use today
      attendanceDate = getLocalDateString(now);
    }

    console.log("⏸️ Record break request received:");
    console.log("   - JWT employeeId:", jwtEmployeeId);
    console.log("   - Request employee_id:", reqEmployeeId);
    console.log("   - Using employee_id:", employee_id);

    if (!employee_id || !break_type) {
      return res.status(400).json({
        success: false,
        message: "Employee ID and break type are required",
      });
    }

    const validBreakTypes = ["Smoke", "Dinner", "Washroom", "Prayer", "Other"];
    if (!validBreakTypes.includes(break_type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid break type",
      });
    }

    connection = await pool.getConnection();

    try {
      // Get today's attendance record using calculated attendance date
      const [attendanceRecord] = await connection.query(
        `SELECT id, check_in_time FROM Employee_Attendance 
         WHERE employee_id = ? AND attendance_date = ? AND check_out_time IS NULL`,
        [employee_id, attendanceDate],
      );

      if (attendanceRecord.length === 0) {
        if (connection) connection.release();
        return res.status(404).json({
          success: false,
          message: "No active check in found for today",
        });
      }

      const attendanceId = attendanceRecord[0].id;
      const breakStart =
        break_start_time || new Date().toTimeString().split(" ")[0];
      const breakEnd =
        break_end_time || new Date().toTimeString().split(" ")[0];

      // Use provided duration or calculate it
      let breakDurationMinutes = break_duration_minutes;

      if (!breakDurationMinutes || breakDurationMinutes < 0) {
        // Calculate break duration as fallback
        const breakStartDate = new Date(`${today}T${breakStart}`);
        const breakEndDate = new Date(`${today}T${breakEnd}`);
        breakDurationMinutes = Math.floor(
          (breakEndDate - breakStartDate) / 60000,
        );
      }

      console.log(
        "💾 Recording break - Duration sent by frontend:",
        break_duration_minutes,
        "Calculated:",
        breakDurationMinutes,
      );

      // Insert break record
      const [breakResult] = await connection.query(
        `INSERT INTO Employee_Breaks 
         (attendance_id, employee_id, break_type, break_start_time, break_end_time, break_duration_minutes, reason)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          attendanceId,
          employee_id,
          break_type,
          breakStart,
          breakEnd,
          breakDurationMinutes,
          reason || null,
        ],
      );

      // Update attendance record with break count
      const fieldMap = {
        Smoke: "smoke_break_count",
        Dinner: "dinner_break_count",
        Washroom: "washroom_break_count",
        Prayer: "prayer_break_count",
        Other: "smoke_break_count", // Default to smoke for Other types
      };

      const breakCountField = fieldMap[break_type];

      // Only update specific break duration field if it exists for this type
      let updateQueryParts;
      let queryParams;

      if (["Smoke", "Dinner", "Washroom", "Prayer"].includes(break_type)) {
        const breakDurationField =
          break_type.toLowerCase() + "_break_duration_minutes";

        updateQueryParts = [
          "UPDATE Employee_Attendance",
          "SET total_breaks_taken = total_breaks_taken + 1,",
          `    ${breakCountField} = ${breakCountField} + 1,`,
          `    ${breakDurationField} = ${breakDurationField} + ?,`,
          "    total_break_duration_minutes = total_break_duration_minutes + ?,",
          "    updated_at = NOW()",
          "WHERE id = ?",
        ];
        queryParams = [
          breakDurationMinutes,
          breakDurationMinutes,
          attendanceId,
        ];
      } else {
        // For 'Other' type, only update total breaks and total duration
        updateQueryParts = [
          "UPDATE Employee_Attendance",
          "SET total_breaks_taken = total_breaks_taken + 1,",
          "    total_break_duration_minutes = total_break_duration_minutes + ?,",
          "    updated_at = NOW()",
          "WHERE id = ?",
        ];
        queryParams = [breakDurationMinutes, attendanceId];
      }

      const updateQuery = updateQueryParts.join("\n");

      console.log("🔍 Update Query:", updateQuery);
      console.log("📊 Parameters:", queryParams);

      await connection.query(updateQuery, queryParams);

      console.log(
        `✅ Break Recorded: ${break_type} for employee ${employee_id} (${breakDurationMinutes} min)`,
      );

      res.status(201).json({
        success: true,
        message: "Break recorded successfully",
        data: {
          id: breakResult.insertId,
          employee_id,
          break_type,
          break_start_time: breakStart,
          break_end_time: breakEnd,
          break_duration_minutes: breakDurationMinutes,
        },
      });
    } finally {
      if (connection) connection.release();
    }
  } catch (error) {
    console.error("❌ Record Break error:", error);
    if (connection) connection.release();
    res.status(500).json({
      success: false,
      message: "Failed to record break",
      error: error.message,
    });
  }
};

// Get Today's Attendance
exports.getTodayAttendance = async (req, res) => {
  try {
    const { employee_id } = req.params;
    const now = getPakistanDate(); // USE PAKISTAN TIMEZONE, NOT SERVER TIMEZONE!
    const currentHour = now.getUTCHours(); // Use UTC hours (which are PKT hours after offset)

    // For night shift: if current time is 00:00-05:59, check YESTERDAY's attendance
    // Because night shift runs from 21:00 Day1 to 06:00 Day2
    let searchDate;
    if (currentHour >= 0 && currentHour < 6) {
      // Early morning - look for yesterday's shift
      const yesterday = new Date(now);
      yesterday.setUTCDate(yesterday.getUTCDate() - 1); // Use UTC date methods
      searchDate = getLocalDateString(yesterday);
      console.log(
        `📅 getTodayAttendance [EARLY MORNING] - Searching YESTERDAY's date: ${searchDate}`,
      );
    } else {
      // Normal hours - look for today's shift
      searchDate = getPakistanDateString(); // Use Pakistan date function
      if (process.env.NODE_ENV === 'development') {
        console.log(`📅 getTodayAttendance: employee=${employee_id} searchDate=${searchDate}`);
      }
    }



    const connection = await pool.getConnection();

    try {
      // Convert user_as_employees.id to employee_onboarding.id if needed
      let finalEmployeeId = employee_id;
      const [employeeMapping] = await connection.query(
        `SELECT eo.id as onboarding_id FROM employee_onboarding eo
         WHERE eo.id = ?`,
        [employee_id],
      );

      // If we have a direct match, use it. Otherwise try to look up by user_as_employees
      if (employeeMapping.length === 0) {
        // Try to find via user_as_employees table (convert user_as_employees.id to onboarding id)
        const [userMapping] = await connection.query(
          `SELECT uae.employee_id FROM user_as_employees uae WHERE uae.id = ?`,
          [employee_id],
        );

        if (userMapping.length > 0) {
          finalEmployeeId = userMapping[0].employee_id;
          console.log(
            `🔄 Converted user_as_employees.id ${employee_id} to employee_onboarding.id ${finalEmployeeId}`,
          );
        }
      }

      const [attendance] = await connection.query(
        `SELECT * FROM Employee_Attendance WHERE employee_id = ? AND attendance_date = ?`,
        [finalEmployeeId, searchDate],
      );

      // If no record found for the primary search date, and the current time is before 09:00 AM,
      // attempt to find a pending (no check_out_time) record from the previous day (night shift continuation).
      let record;
      if (attendance.length === 0) {
        if (process.env.NODE_ENV === 'development') {
          console.debug(`No attendance for id=${finalEmployeeId} date=${searchDate}`);
        }

        // Try to find the MOST RECENT pending record (night shift case)
        // This handles multiple pending checkouts - finds the latest one
        // Only consider pending records from the last 2 days to avoid old unresolved checkouts
        const twoDaysAgo = new Date(now);
        twoDaysAgo.setUTCDate(twoDaysAgo.getUTCDate() - 2);
        const twoDaysAgoStr = getLocalDateString(twoDaysAgo);
        
        console.log(`🔎 No record on ${searchDate}, searching for most recent pending check-out from last 2 days (${twoDaysAgoStr} onwards)...`);

        const [recentPending] = await connection.query(
          `SELECT * FROM Employee_Attendance 
           WHERE employee_id = ? AND check_out_time IS NULL AND attendance_date >= ?
           ORDER BY attendance_date DESC, check_in_time DESC 
           LIMIT 1`,
          [finalEmployeeId, twoDaysAgoStr]
        );

        if (recentPending.length > 0) {
          record = recentPending[0];
          console.log(`✅ Found pending record: id=${record.id}, date=${record.attendance_date}, check_in=${record.check_in_time}`);
        }

        // Try to find if employee exists at all
        const [employeeCheck] = await connection.query(
          `SELECT id, employee_id, name, email FROM user_as_employees WHERE employee_id = ?`,
          [employee_id],
        );

        if (employeeCheck.length === 0) {
          console.log(
            `❌ Employee not found in user_as_employees with employee_id: ${employee_id}`,
          );
        } else {
          console.log(
            `ℹ️ Employee found in user_as_employees: ${employeeCheck[0].employee_id} (${employeeCheck[0].name})`,
          );
        }

        if (!record) {
          return res.status(404).json({
            success: false,
            message: 'No attendance record for today',
            employee_id: finalEmployeeId
          });
        }
      } else {
        record = attendance[0];
      }
      const [breaks] = await connection.query(
        `SELECT * FROM Employee_Breaks WHERE attendance_id = ? ORDER BY break_start_time ASC`,
        [record.id],
      );

      // Format attendance_date to preserve local date
      const d =
        record.attendance_date instanceof Date
          ? record.attendance_date
          : new Date(record.attendance_date);
      const localDateStr = getLocalDateString(d);

      // Determine if user is currently checked in (check_out_time is null)
      const isCheckedIn = record.check_out_time === null;

      // Calculate current session duration for active sessions
      let currentSessionMinutes = 0;
      if (isCheckedIn && record.check_in_time) {
        try {
          // Parse check-in time (HH:MM:SS format) - this is already in Pakistan time
          const [checkInHour, checkInMin, checkInSec] = record.check_in_time
            .split(":")
            .map(Number);
          const checkInTotalMinutes = checkInHour * 60 + checkInMin;

          // Get CURRENT TIME STRING in Pakistan timezone
          const currentTimeString = getPakistanTimeString(); // Returns HH:MM:SS in Pakistan time
          const [currentHour, currentMin, currentSec] = currentTimeString
            .split(":")
            .map(Number);
          const currentTotalMinutes = currentHour * 60 + currentMin;

          // Calculate elapsed time
          // Night shift logic: if check-in was in evening (21:00-23:59) and current time is early morning (0:00-6:00), 
          // then we've crossed midnight
          const checkInIsNight = checkInHour >= 21 && checkInHour <= 23;
          const currentIsEarlyMorning = currentHour >= 0 && currentHour < 6;
          
          if (checkInIsNight && currentIsEarlyMorning) {
            // Night shift spanning midnight (checked in 21:00+, now in 00:00-06:00)
            const minutesUntilMidnight = (24 * 60) - checkInTotalMinutes;
            const minutesAfterMidnight = currentTotalMinutes;
            currentSessionMinutes = minutesUntilMidnight + minutesAfterMidnight;
            console.log(`⏱️ Midnight-cross detected: checkIn=${checkInTotalMinutes}m, now=${currentTotalMinutes}m, elapsed=${currentSessionMinutes}m`);
          } else {
            // Same period (either both evening or both early morning) - simple subtraction
            currentSessionMinutes = Math.abs(currentTotalMinutes - checkInTotalMinutes);
          }

          // Subtract break time from current session
          const totalBreakMinutes = breaks.reduce((sum, brk) => sum + (brk.break_duration_minutes || 0), 0);
          currentSessionMinutes = Math.max(0, currentSessionMinutes - totalBreakMinutes);
          
          console.log(`⏱️ Current session calculation: check-in=${record.check_in_time} (night=${checkInIsNight}), now=${currentHour}:${String(currentMin).padStart(2, '0')} (early=${currentIsEarlyMorning}), elapsed=${currentSessionMinutes}m, breaks=${totalBreakMinutes}m`);
        } catch (err) {
          console.error("Error calculating current session:", err);
        }
      }

      // Convert UTC times stored in database to Pakistan times for display
      const displayRecord = {
        ...record,
        attendance_date: localDateStr,
        check_in_time: record.check_in_time,
        check_out_time: record.check_out_time || null,
        breaks: breaks.map((breakRecord) => ({
          ...breakRecord,
          break_start_time: breakRecord.break_start_time,
          break_end_time: breakRecord.break_end_time || null,
        })),
        isCheckedIn: isCheckedIn,
        current_session_minutes: currentSessionMinutes,
      };

      res.status(200).json({
        success: true,
        message: "Today attendance data",
        isCheckedIn: isCheckedIn,
        data: displayRecord,
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("❌ Get Today Attendance error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch attendance data",
      error: error.message,
    });
  }
};

// Get Monthly Attendance Summary
exports.getMonthlyAttendance = async (req, res) => {
  try {
    const { employee_id } = req.params;
    const { year, month } = req.query;

    const pkDate = getPakistanDate(); // USE PAKISTAN TIMEZONE
    const currentYear = year ? parseInt(year) : pkDate.getUTCFullYear();
    const currentMonth = month ? parseInt(month) : pkDate.getUTCMonth() + 1;

    const connection = await pool.getConnection();

    try {
      // Convert user_as_employees.id to employee_onboarding.id if needed
      let finalEmployeeId = employee_id;
      const [employeeMapping] = await connection.query(
        `SELECT eo.id as onboarding_id FROM employee_onboarding eo
         WHERE eo.id = ?`,
        [employee_id],
      );

      // If we have a direct match, use it. Otherwise try to look up by user_as_employees
      if (employeeMapping.length === 0) {
        // Try to find via user_as_employees table (convert user_as_employees.id to onboarding id)
        const [userMapping] = await connection.query(
          `SELECT uae.employee_id FROM user_as_employees uae WHERE uae.id = ?`,
          [employee_id],
        );

        if (userMapping.length > 0) {
          finalEmployeeId = userMapping[0].employee_id;
          console.log(
            `🔄 getMonthlyAttendance: Converted user_as_employees.id ${employee_id} to employee_onboarding.id ${finalEmployeeId}`,
          );
        }
      }

      const [monthlyData] = await connection.query(
        `SELECT * FROM Employee_Attendance 
         WHERE employee_id = ? AND YEAR(attendance_date) = ? AND MONTH(attendance_date) = ?
         ORDER BY attendance_date ASC`,
        [finalEmployeeId, currentYear, currentMonth],
      );

      // Format dates immediately after database retrieval to ensure consistency
      monthlyData.forEach(record => {
        if (record.attendance_date && !(typeof record.attendance_date === 'string')) {
          // Convert Date object to YYYY-MM-DD string using local date methods
          const d = record.attendance_date;
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          record.attendance_date = `${year}-${month}-${day}`;
        }
      });

      // Debug: Log query results
      console.log(`[DEBUG] getMonthlyAttendance Query:
        employee_id=${finalEmployeeId}, 
        year=${currentYear}, 
        month=${currentMonth},
        returned ${monthlyData.length} records`);
      
      if (monthlyData.length > 0) {
        console.log('[DEBUG] First record:', {
          id: monthlyData[0].id,
          employee_id: monthlyData[0].employee_id,
          attendance_date: monthlyData[0].attendance_date,
          check_in_time: monthlyData[0].check_in_time,
          status: monthlyData[0].status
        });
        console.log('[DEBUG] Last record:', {
          id: monthlyData[monthlyData.length - 1].id,
          employee_id: monthlyData[monthlyData.length - 1].employee_id,
          attendance_date: monthlyData[monthlyData.length - 1].attendance_date,
          check_in_time: monthlyData[monthlyData.length - 1].check_in_time,
          status: monthlyData[monthlyData.length - 1].status
        });
      }

      // Ensure working hours are calculated for each record
      for (let record of monthlyData) {
        // Mark DB records as not absent
        record.is_absent = false;
        
        // If working hours are missing but we have check-in and check-out, calculate them
        if (record.check_in_time && record.check_out_time && (!record.net_working_time_minutes || record.net_working_time_minutes === 0)) {
          const workingHours = calculateWorkingHours(
            record.check_in_time,
            record.check_out_time,
            record.total_break_duration_minutes || 0
          );
          
          // Update the record in memory for this response
          record.gross_working_time_minutes = workingHours.gross;
          record.net_working_time_minutes = workingHours.net;
          record.overtime_minutes = workingHours.overtime;
          record.overtime_hours = workingHours.overtimeHours;
          
          // Also update the database to persist these calculations
          await connection.query(
            `UPDATE Employee_Attendance 
             SET gross_working_time_minutes = ?,
                 net_working_time_minutes = ?,
                 overtime_minutes = ?,
                 overtime_hours = ?,
                 updated_at = NOW()
             WHERE id = ?`,
            [
              workingHours.gross,
              workingHours.net,
              workingHours.overtime,
              workingHours.overtimeHours,
              record.id
            ]
          );
        }
      }

      // Get all days in the month and identify missing days (absences)
      const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
      const existingDates = new Set(
        monthlyData.map(record => {
          const d = record.attendance_date instanceof Date 
            ? record.attendance_date 
            : new Date(record.attendance_date);
          return d.getUTCDate();
        })
      );

      // Get today's date in Pakistan timezone to only create absent records up to today
      const todayPK = getPakistanDate();
      const todayDate = todayPK.getUTCDate();
      const todayMonth = todayPK.getUTCMonth() + 1;
      const todayYear = todayPK.getUTCFullYear();

      // Create absent records for missing days (only up to today, not future days)
      for (let day = 1; day <= todayDate; day++) {
        if (!existingDates.has(day)) {
          // Create date string directly in YYYY-MM-DD format
          const month = String(currentMonth).padStart(2, '0');
          const dayStr = String(day).padStart(2, '0');
          const dateStr = `${currentYear}-${month}-${dayStr}`;
          
          const absentRecord = {
            id: null,
            employee_id: finalEmployeeId,
            email: monthlyData[0]?.email || null,
            name: monthlyData[0]?.name || null,
            attendance_date: dateStr, // Store as string, not Date object
            check_in_time: null,
            check_out_time: null,
            status: 'Absent',
            total_breaks_taken: 0,
            total_break_duration_minutes: 0,
            gross_working_time_minutes: 0,
            net_working_time_minutes: 0,
            overtime_minutes: 0,
            overtime_hours: '0.00',
            late_by_minutes: 0,
            is_absent: true
          };
          monthlyData.push(absentRecord);
        }
      }

      // Sort all data (actual records + absent records) by date
      monthlyData.sort((a, b) => {
        const dateA = a.attendance_date instanceof Date ? a.attendance_date : new Date(a.attendance_date);
        const dateB = b.attendance_date instanceof Date ? b.attendance_date : new Date(b.attendance_date);
        return dateA - dateB;
      });

      // Convert dates to proper format for frontend
      const formattedData = monthlyData.map((record) => ({
        ...record,
        id: record.id,
        employee_id: record.employee_id,
        email: record.email,
        name: record.name,
        attendance_date: record.attendance_date, // Already formatted as YYYY-MM-DD string above
        check_in_time: record.check_in_time,
        check_out_time: record.check_out_time || null,
        status: record.status,
        total_breaks_taken: record.total_breaks_taken,
        total_break_duration_minutes: record.total_break_duration_minutes || 0,
        gross_working_time_minutes: record.gross_working_time_minutes || 0,
        net_working_time_minutes: record.net_working_time_minutes || 0,
        overtime_minutes: record.overtime_minutes || 0,
        overtime_hours: record.overtime_hours || "0.00",
        late_by_minutes: record.late_by_minutes || 0,
        is_absent: record.is_absent || false
      }));

      // Debug: Log today's record if present
      const todayRecord = formattedData.find(r => {
        const recordDate = new Date(r.attendance_date);
        const today = new Date();
        return recordDate.toDateString() === today.toDateString();
      });
      
      if (todayRecord) {
        console.log('[DEBUG] Today\'s record (Feb 9):', {
          id: todayRecord.id,
          attendance_date: todayRecord.attendance_date,
          check_in_time: todayRecord.check_in_time,
          check_out_time: todayRecord.check_out_time,
          status: todayRecord.status,
          is_absent: todayRecord.is_absent
        });
      }

      res.status(200).json({
        success: true,
        message: "Monthly attendance data",
        data: formattedData,
        summary: {
          year: currentYear,
          month: currentMonth,
          total_days: formattedData.length,
          present_days: formattedData.filter((r) => r.status === "Present")
            .length,
          absent_days: formattedData.filter((r) => r.status === "Absent")
            .length,
          late_days: formattedData.filter((r) => r.status === "Late").length,
        },
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("❌ Get Monthly Attendance error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch monthly attendance",
      error: error.message,
    });
  }
};

// Get All Attendance Records (Admin)
exports.getAllAttendance = async (req, res) => {
  try {
    const { date, status, limit = 50, page = 1 } = req.query;

    const connection = await pool.getConnection();

    try {
      let query = `
        SELECT 
          ea.*,
          eo.employee_id,
          eo.name,
          eo.email,
          eo.department,
          eo.designation,
          eo.phone,
          eo.address,
          eo.join_date

        FROM Employee_Attendance ea
        LEFT JOIN employee_onboarding eo ON ea.employee_id = eo.id
        WHERE 1=1
      `;

      const params = [];

      if (date) {
        query += ` AND ea.attendance_date = ?`;
        params.push(date);
      }

      if (status) {
        query += ` AND ea.status = ?`;
        params.push(status);
      }

      query += ` ORDER BY ea.attendance_date DESC, ea.employee_id ASC LIMIT ? OFFSET ?`;
      params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

      const [attendance] = await connection.query(query, params);

      // Agar koi attendance record hai jo Employee_Onboarding se match nahi karta
      attendance.forEach((record) => {
        if (!record.name) {
          record.name = `Employee ${record.employee_id}`;
          record.email = `employee${record.employee_id}@company.com`;
          record.department = "Unknown";
        }
      });

      // OPTIMIZED: Batch-fetch all breaks for this page in ONE query instead of N+1
      const attendanceIds = attendance.map(r => r.id).filter(Boolean);
      let breaksMap = {};
      if (attendanceIds.length > 0) {
        const [allBreaks] = await connection.query(
          `SELECT id, attendance_id, break_type, break_start_time, break_end_time, break_duration_minutes, reason 
           FROM Employee_Breaks 
           WHERE attendance_id IN (?) 
           ORDER BY break_start_time ASC`,
          [attendanceIds]
        );
        // Group breaks by attendance_id
        allBreaks.forEach(b => {
          if (!breaksMap[b.attendance_id]) breaksMap[b.attendance_id] = [];
          breaksMap[b.attendance_id].push({
            id: b.id,
            break_type: b.break_type,
            break_start_time: b.break_start_time,
            break_end_time: b.break_end_time || null,
            break_duration_minutes: b.break_duration_minutes,
            reason: b.reason,
          });
        });
      }

      // Map attendance records with their breaks (no extra queries)
      const attendanceWithBreaks = attendance.map((record) => {
          const breaks = breaksMap[record.id] || [];

          // Format attendance_date as YYYY-MM-DD string (not ISO datetime)
          let attendanceDateStr = record.attendance_date;
          if (record.attendance_date instanceof Date) {
            const year = record.attendance_date.getFullYear();
            const month = String(
              record.attendance_date.getMonth() + 1,
            ).padStart(2, "0");
            const day = String(record.attendance_date.getDate()).padStart(
              2,
              "0",
            );
            attendanceDateStr = `${year}-${month}-${day}`;
          } else if (typeof record.attendance_date === "string") {
            attendanceDateStr = record.attendance_date.split("T")[0];
          }

          // CRITICAL FIX: Calculate working hours if missing or zero but check-in exists
          let grossWorkingMinutes = record.gross_working_time_minutes || 0;
          let netWorkingMinutes = record.net_working_time_minutes || 0;
          
          // Recalculate working hours if stored value is 0 but employee has both check-in and check-out
          // This handles cases where calculation was missed or SQL auto-fix didn't cover the scenario
          if (record.check_in_time && record.check_out_time && (grossWorkingMinutes === 0 || grossWorkingMinutes === null)) {
            try {
              const [checkInHour, checkInMin] = record.check_in_time.split(':').map(Number);
              const [checkOutHour, checkOutMin] = record.check_out_time.split(':').map(Number);
              
              const checkInTotalMinutes = checkInHour * 60 + checkInMin;
              const checkOutTotalMinutes = checkOutHour * 60 + checkOutMin;
              
              // Determine if this is a night shift (check-in after 21:00 = 9 PM)
              const isNightShift = checkInTotalMinutes >= 21 * 60;
              
              if (isNightShift) {
                // Night shift scenario: Check-in at 21:00+ (9 PM or later)
                if (checkOutTotalMinutes >= checkInTotalMinutes) {
                  // Same day checkout (rare for night shift, but handle it)
                  grossWorkingMinutes = checkOutTotalMinutes - checkInTotalMinutes;
                } else if (checkOutTotalMinutes < 6 * 60) {
                  // Checkout before 6 AM = next morning (normal night shift)
                  const minutesUntilMidnight = (24 * 60) - checkInTotalMinutes;
                  grossWorkingMinutes = minutesUntilMidnight + checkOutTotalMinutes;
                } else {
                  // Checkout after 6 AM = next day afternoon (extended shift)
                  const minutesUntilMidnight = (24 * 60) - checkInTotalMinutes;
                  grossWorkingMinutes = minutesUntilMidnight + checkOutTotalMinutes;
                }
              } else if (checkInTotalMinutes < 6 * 60) {
                // Early morning check-in (before 6 AM) - continuation of previous night shift
                const minutesUntilMidnight = (24 * 60) - checkInTotalMinutes;
                grossWorkingMinutes = minutesUntilMidnight + checkOutTotalMinutes;
              } else {
                // Regular day shift: check-in between 6 AM and 9 PM
                if (checkOutTotalMinutes >= checkInTotalMinutes) {
                  // Same day checkout (normal case)
                  grossWorkingMinutes = checkOutTotalMinutes - checkInTotalMinutes;
                } else if (checkOutTotalMinutes < 6 * 60) {
                  // Checkout before 6 AM next day (employee worked past midnight)
                  const minutesUntilMidnight = (24 * 60) - checkInTotalMinutes;
                  grossWorkingMinutes = minutesUntilMidnight + checkOutTotalMinutes;
                } else {
                  // Checkout after 6 AM next day (very late checkout)
                  const minutesUntilMidnight = (24 * 60) - checkInTotalMinutes;
                  grossWorkingMinutes = minutesUntilMidnight + checkOutTotalMinutes;
                }
              }
              
              // Ensure no negative values
              grossWorkingMinutes = Math.max(0, grossWorkingMinutes);
              
              // Subtract breaks to get net working time
              const breakMinutes = record.total_break_duration_minutes || 0;
              netWorkingMinutes = Math.max(0, grossWorkingMinutes - breakMinutes);
            } catch (e) {
              console.warn(`Warning: Could not recalculate working hours for attendance ID ${record.id}:`, e.message);
              // Keep the original values if calculation fails
              grossWorkingMinutes = record.gross_working_time_minutes || 0;
              netWorkingMinutes = record.net_working_time_minutes || 0;
            }
          } else if (record.check_in_time && !record.check_out_time && (grossWorkingMinutes === 0 || grossWorkingMinutes === null)) {
            // Employee is still checked in - calculate from check-in to current time
            try {
              const [checkInHour, checkInMin] = record.check_in_time.split(':').map(Number);
              const checkInTotalMinutes = checkInHour * 60 + checkInMin;
              
              // Use current Pakistan time for still-working employees
              const now = getPakistanDate();
              const checkOutTotalMinutes = now.getHours() * 60 + now.getMinutes();
              
              const isNightShift = checkInTotalMinutes >= 21 * 60;
              
              if (isNightShift) {
                // Night shift still in progress
                if (checkOutTotalMinutes >= checkInTotalMinutes) {
                  grossWorkingMinutes = checkOutTotalMinutes - checkInTotalMinutes;
                } else {
                  // Passed midnight
                  const minutesUntilMidnight = (24 * 60) - checkInTotalMinutes;
                  grossWorkingMinutes = minutesUntilMidnight + checkOutTotalMinutes;
                }
              } else {
                // Day shift still in progress
                grossWorkingMinutes = Math.max(0, checkOutTotalMinutes - checkInTotalMinutes);
              }
              
              // Subtract breaks
              const breakMinutes = record.total_break_duration_minutes || 0;
              netWorkingMinutes = Math.max(0, grossWorkingMinutes - breakMinutes);
            } catch (e) {
              console.warn(`Warning: Could not calculate ongoing working hours for attendance ID ${record.id}:`, e.message);
            }
          }

          return {
            ...record,
            attendance_date: attendanceDateStr,
            check_in_time: record.check_in_time,
            check_out_time: record.check_out_time || null,
            gross_working_time_minutes: grossWorkingMinutes,
            net_working_time_minutes: netWorkingMinutes,
            breaks: breaks
              ? breaks.map((b) => ({
                  ...b,
                  break_start_time: b.break_start_time,
                  break_end_time: b.break_end_time || null,
                }))
              : [],
            total_breaks_count: breaks ? breaks.length : 0,
          };
        });

      // Get total count for proper pagination
      let countQuery = `SELECT COUNT(*) as total FROM Employee_Attendance ea WHERE 1=1`;
      const countParams = [];
      if (date) { countQuery += ` AND ea.attendance_date = ?`; countParams.push(date); }
      if (status) { countQuery += ` AND ea.status = ?`; countParams.push(status); }
      const [countResult] = await connection.query(countQuery, countParams);
      const totalRecords = countResult[0].total;

      res.status(200).json({
        success: true,
        message: "All attendance records",
        data: attendanceWithBreaks,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalRecords,
        },
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("❌ Get All Attendance error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch attendance records",
      error: error.message,
    });
  }
};

// Get All Attendance with Absent Records (includes all employees)
exports.getAllAttendanceWithAbsent = async (req, res) => {
  try {
    const { date, status, limit = 100, page = 1 } = req.query;

    const connection = await pool.getConnection();

    try {
      // First get all active employees
      const [allEmployees] = await connection.query(
        `SELECT id, employee_id, name, email, department, status FROM employee_onboarding WHERE status = 'Active'`,
      );

      let attendanceQuery = `SELECT * FROM Employee_Attendance WHERE 1=1`;
      const attendanceParams = [];

      if (date) {
        attendanceQuery += ` AND attendance_date = ?`;
        attendanceParams.push(date);
      }

      if (status) {
        attendanceQuery += ` AND status = ?`;
        attendanceParams.push(status);
      }

      attendanceQuery += ` ORDER BY attendance_date DESC, employee_id ASC`;

      const [attendance] = await connection.query(
        attendanceQuery,
        attendanceParams,
      );

      // OPTIMIZED: Batch-fetch all breaks in ONE query instead of N+1
      const attIds = attendance.map(r => r.id).filter(Boolean);
      let breaksMapAbsent = {};
      if (attIds.length > 0) {
        const [allBreaks] = await connection.query(
          `SELECT id, attendance_id, break_type, break_start_time, break_end_time, break_duration_minutes, reason 
           FROM Employee_Breaks 
           WHERE attendance_id IN (?) 
           ORDER BY break_start_time ASC`,
          [attIds]
        );
        allBreaks.forEach(b => {
          if (!breaksMapAbsent[b.attendance_id]) breaksMapAbsent[b.attendance_id] = [];
          breaksMapAbsent[b.attendance_id].push({
            id: b.id,
            break_type: b.break_type,
            break_start_time: b.break_start_time,
            break_end_time: b.break_end_time || null,
            break_duration_minutes: b.break_duration_minutes,
            reason: b.reason,
          });
        });
      }

      // Map attendance with pre-fetched breaks (no N+1)
      const attendanceWithBreaks = attendance.map((record) => {
          const breaks = breaksMapAbsent[record.id] || [];

          // Format attendance_date as YYYY-MM-DD string (not ISO datetime)
          let attendanceDateStr = record.attendance_date;
          if (record.attendance_date instanceof Date) {
            const year = record.attendance_date.getFullYear();
            const month = String(
              record.attendance_date.getMonth() + 1,
            ).padStart(2, "0");
            const day = String(record.attendance_date.getDate()).padStart(
              2,
              "0",
            );
            attendanceDateStr = `${year}-${month}-${day}`;
          } else if (typeof record.attendance_date === "string") {
            attendanceDateStr = record.attendance_date.split("T")[0];
          }

          // CRITICAL FIX: Calculate working hours if missing or zero but check-in exists
          let grossWorkingMinutes = record.gross_working_time_minutes || 0;
          let netWorkingMinutes = record.net_working_time_minutes || 0;
          
          if ((grossWorkingMinutes === 0 || grossWorkingMinutes === null) && record.check_in_time) {
            // Employee has checked in but no check out or working hours not calculated
            const [checkInHour, checkInMin] = record.check_in_time.split(':').map(Number);
            const checkInTotalMinutes = checkInHour * 60 + checkInMin;
            
            let checkOutTotalMinutes = 0;
            if (record.check_out_time) {
              // Employee has checked out - use checkout time
              const [checkOutHour, checkOutMin] = record.check_out_time.split(':').map(Number);
              checkOutTotalMinutes = checkOutHour * 60 + checkOutMin;
            } else {
              // Employee still working - use current time in Pakistan timezone
              const now = getPakistanDate();
              checkOutTotalMinutes = now.getHours() * 60 + now.getMinutes();
            }
            
            // Calculate working minutes (handling night shifts)
            const isNightShift = checkInTotalMinutes >= 21 * 60; // After 9 PM
            
            if (isNightShift) {
              if (checkOutTotalMinutes >= checkInTotalMinutes) {
                // Same day checkout (shouldn't happen for night shift)
                grossWorkingMinutes = checkOutTotalMinutes - checkInTotalMinutes;
              } else {
                // Next day checkout (normal night shift) - crossed midnight
                const minutesUntilMidnight = (24 * 60) - checkInTotalMinutes;
                grossWorkingMinutes = minutesUntilMidnight + checkOutTotalMinutes;
              }
            } else {
              // Regular shift calculation
              grossWorkingMinutes = Math.max(0, checkOutTotalMinutes - checkInTotalMinutes);
            }
            
            // Subtract breaks
            const breakMinutes = record.total_break_duration_minutes || 0;
            netWorkingMinutes = Math.max(0, grossWorkingMinutes - breakMinutes);
          }

          return {
            ...record,
            attendance_date: attendanceDateStr,
            check_in_time: record.check_in_time,
            check_out_time: record.check_out_time || null,
            gross_working_time_minutes: grossWorkingMinutes,
            net_working_time_minutes: netWorkingMinutes,
            breaks: breaks
              ? breaks.map((b) => ({
                  ...b,
                  break_start_time: b.break_start_time,
                  break_end_time: b.break_end_time || null,
                }))
              : [],
            total_breaks_count: breaks ? breaks.length : 0,
          };
        });

      // If date filter is applied, create absent records for employees who haven't checked in
      let completeAttendanceData = attendanceWithBreaks;

      if (date) {
        // Check if the date is a weekend (Saturday = 6, Sunday = 0)
        const dateObj = new Date(date);
        const dayOfWeek = dateObj.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

        // Only create absent records for weekdays
        if (!isWeekend) {
          const attendanceEmployeeIds = new Set(
            attendance.map((a) => a.employee_id),
          );

          // Add absent records for employees who didn't check in
          const absentRecords = allEmployees
            .filter((emp) => !attendanceEmployeeIds.has(emp.id))
            .map((emp) => ({
              id: null,
              employee_id: emp.id,
              email: emp.email,
              name: emp.name,
              attendance_date: date,
              check_in_time: null,
              check_out_time: null,
              status: "Absent",
              total_breaks_taken: 0,
              smoke_break_count: 0,
              dinner_break_count: 0,
              washroom_break_count: 0,
              prayer_break_count: 0,
              smoke_break_duration_minutes: 0,
              dinner_break_duration_minutes: 0,
              washroom_break_duration_minutes: 0,
              prayer_break_duration_minutes: 0,
              total_break_duration_minutes: 0,
              gross_working_time_minutes: 0,
              net_working_time_minutes: 0,
              expected_working_time_minutes: 540,
              overtime_minutes: 0,
              overtime_hours: "0.00",
              on_time: 0,
              late_by_minutes: 0,
              remarks: "No check-in",
              device_info: null,
              ip_address: null,
              created_at: null,
              updated_at: null,
              breaks: [],
              total_breaks_count: 0,
            }));

          completeAttendanceData = [
            ...attendanceWithBreaks,
            ...absentRecords,
          ].sort((a, b) => {
            if (a.name !== b.name) return a.name.localeCompare(b.name);
            return (a.status || "Z").localeCompare(b.status || "Z");
          });
        }
      }

      // Apply pagination
      const startIdx = (parseInt(page) - 1) * parseInt(limit);
      const endIdx = startIdx + parseInt(limit);
      const paginatedData = completeAttendanceData.slice(startIdx, endIdx);

      res.status(200).json({
        success: true,
        message: "All attendance records with absent status",
        data: paginatedData,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: completeAttendanceData.length,
          total_active_employees: allEmployees.length,
        },
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("❌ Get All Attendance With Absent error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch attendance records",
      error: error.message,
    });
  }
};

// Get Attendance Summary View
exports.getAttendanceSummary = async (req, res) => {
  try {
    const { employee_id, start_date, end_date } = req.query;

    const connection = await pool.getConnection();

    try {
      let query = `SELECT * FROM Attendance_Summary_View WHERE 1=1`;
      const params = [];

      if (employee_id) {
        query += ` AND employee_id = ?`;
        params.push(employee_id);
      }

      if (start_date) {
        query += ` AND attendance_date >= ?`;
        params.push(start_date);
      }

      if (end_date) {
        query += ` AND attendance_date <= ?`;
        params.push(end_date);
      }

      const [summary] = await connection.query(query, params);

      res.status(200).json({
        success: true,
        message: "Attendance summary",
        data: summary,
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("❌ Get Attendance Summary error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch attendance summary",
      error: error.message,
    });
  }
};

// Get Overtime Report
exports.getOvertimeReport = async (req, res) => {
  try {
    const { employee_id, start_date, end_date } = req.query;

    const connection = await pool.getConnection();

    try {
      let query = `SELECT * FROM Overtime_Report_View WHERE 1=1`;
      const params = [];

      if (employee_id) {
        query += ` AND employee_id = ?`;
        params.push(employee_id);
      }

      if (start_date) {
        query += ` AND attendance_date >= ?`;
        params.push(start_date);
      }

      if (end_date) {
        query += ` AND attendance_date <= ?`;
        params.push(end_date);
      }

      const [overtimeData] = await connection.query(query, params);

      // Calculate totals
      const totalOvertimeMinutes = overtimeData.reduce(
        (sum, row) => sum + (row.overtime_minutes || 0),
        0,
      );
      const totalOvertimeHours = (totalOvertimeMinutes / 60).toFixed(2);

      res.status(200).json({
        success: true,
        message: "Overtime report",
        data: overtimeData,
        summary: {
          total_overtime_hours: parseFloat(totalOvertimeHours),
          total_overtime_days: overtimeData.length,
          average_overtime_per_day: (
            totalOvertimeHours / overtimeData.length
          ).toFixed(2),
        },
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("❌ Get Overtime Report error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch overtime report",
      error: error.message,
    });
  }
};

// Get all breaks
exports.getAllBreaks = async (req, res) => {
  try {
    const connection = await pool.getConnection();

    try {
      const [breaks] = await connection.query(
        `SELECT eb.id, eb.attendance_id, eb.employee_id, eb.break_type, 
                eb.break_start_time, eb.break_end_time, eb.break_duration_minutes,
                eb.reason, eb.created_at, eb.updated_at,
                eo.name as employee_name 
         FROM Employee_Breaks eb
         LEFT JOIN employee_onboarding eo ON eb.employee_id = eo.id
         ORDER BY eb.created_at DESC`,
      );

      console.log(`📊 Retrieved ${breaks.length} break records from database`);

      // Convert UTC times to Pakistan times for display
      const convertedBreaks = breaks.map((brk) => ({
        ...brk,
        break_start_time: brk.break_start_time,
        break_end_time: brk.break_end_time || null,
      }));

      res.status(200).json({
        success: true,
        message: "All breaks retrieved successfully",
        data: convertedBreaks,
        count: convertedBreaks.length,
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("❌ Get All Breaks error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch breaks",
      error: error.message,
    });
  }
};

// Auto-fix missing working hours for all records
exports.autoFixMissingWorkingHours = async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();

    // SQL query to recalculate missing working hours for all records
    const query = `
      UPDATE Employee_Attendance
      SET 
          gross_working_time_minutes = CASE
              WHEN check_in_time IS NOT NULL AND check_out_time IS NOT NULL 
                  AND status IN ('Present', 'Late')
                  AND (gross_working_time_minutes = 0 OR gross_working_time_minutes IS NULL) THEN
                  CASE
                      WHEN (HOUR(check_in_time) * 60 + MINUTE(check_in_time)) >= 21 * 60 THEN
                          CASE
                              WHEN (HOUR(check_out_time) * 60 + MINUTE(check_out_time)) > (HOUR(check_in_time) * 60 + MINUTE(check_in_time)) THEN
                                  (HOUR(check_out_time) * 60 + MINUTE(check_out_time)) - (HOUR(check_in_time) * 60 + MINUTE(check_in_time))
                              WHEN (HOUR(check_out_time) * 60 + MINUTE(check_out_time)) <= 6 * 60 THEN
                                  ((24 * 60) - (HOUR(check_in_time) * 60 + MINUTE(check_in_time))) + (HOUR(check_out_time) * 60 + MINUTE(check_out_time))
                              ELSE
                                  ((24 * 60) - (HOUR(check_in_time) * 60 + MINUTE(check_in_time))) + (HOUR(check_out_time) * 60 + MINUTE(check_out_time))
                          END
                      ELSE
                          GREATEST(0, (HOUR(check_out_time) * 60 + MINUTE(check_out_time)) - (HOUR(check_in_time) * 60 + MINUTE(check_in_time)))
                  END
              ELSE gross_working_time_minutes
          END,
          net_working_time_minutes = CASE
              WHEN check_in_time IS NOT NULL AND check_out_time IS NOT NULL 
                  AND status IN ('Present', 'Late')
                  AND (net_working_time_minutes = 0 OR net_working_time_minutes IS NULL) THEN
                  GREATEST(0,
                      CASE
                          WHEN (HOUR(check_in_time) * 60 + MINUTE(check_in_time)) >= 21 * 60 THEN
                              CASE
                                  WHEN (HOUR(check_out_time) * 60 + MINUTE(check_out_time)) > (HOUR(check_in_time) * 60 + MINUTE(check_in_time)) THEN
                                      (HOUR(check_out_time) * 60 + MINUTE(check_out_time)) - (HOUR(check_in_time) * 60 + MINUTE(check_in_time))
                                  WHEN (HOUR(check_out_time) * 60 + MINUTE(check_out_time)) <= 6 * 60 THEN
                                      ((24 * 60) - (HOUR(check_in_time) * 60 + MINUTE(check_in_time))) + (HOUR(check_out_time) * 60 + MINUTE(check_out_time))
                                  ELSE
                                      ((24 * 60) - (HOUR(check_in_time) * 60 + MINUTE(check_in_time))) + (HOUR(check_out_time) * 60 + MINUTE(check_out_time))
                              END
                          ELSE
                              GREATEST(0, (HOUR(check_out_time) * 60 + MINUTE(check_out_time)) - (HOUR(check_in_time) * 60 + MINUTE(check_in_time)))
                      END - COALESCE(total_break_duration_minutes, 0)
                  )
              ELSE net_working_time_minutes
          END,
          overtime_minutes = CASE
              WHEN (CASE
                  WHEN check_in_time IS NOT NULL AND check_out_time IS NOT NULL THEN
                      GREATEST(0,
                          CASE
                              WHEN (HOUR(check_in_time) * 60 + MINUTE(check_in_time)) >= 21 * 60 THEN
                                  CASE
                                      WHEN (HOUR(check_out_time) * 60 + MINUTE(check_out_time)) > (HOUR(check_in_time) * 60 + MINUTE(check_in_time)) THEN
                                          (HOUR(check_out_time) * 60 + MINUTE(check_out_time)) - (HOUR(check_in_time) * 60 + MINUTE(check_in_time))
                                      WHEN (HOUR(check_out_time) * 60 + MINUTE(check_out_time)) <= 6 * 60 THEN
                                          ((24 * 60) - (HOUR(check_in_time) * 60 + MINUTE(check_in_time))) + (HOUR(check_out_time) * 60 + MINUTE(check_out_time))
                                      ELSE
                                          ((24 * 60) - (HOUR(check_in_time) * 60 + MINUTE(check_in_time))) + (HOUR(check_out_time) * 60 + MINUTE(check_out_time))
                                  END
                              ELSE
                                  GREATEST(0, (HOUR(check_out_time) * 60 + MINUTE(check_out_time)) - (HOUR(check_in_time) * 60 + MINUTE(check_in_time)))
                          END - COALESCE(total_break_duration_minutes, 0)
                      )
                  ELSE 0
              END) > 540 THEN
                  (CASE
                      WHEN check_in_time IS NOT NULL AND check_out_time IS NOT NULL THEN
                          GREATEST(0,
                              CASE
                                  WHEN (HOUR(check_in_time) * 60 + MINUTE(check_in_time)) >= 21 * 60 THEN
                                      CASE
                                          WHEN (HOUR(check_out_time) * 60 + MINUTE(check_out_time)) > (HOUR(check_in_time) * 60 + MINUTE(check_in_time)) THEN
                                              (HOUR(check_out_time) * 60 + MINUTE(check_out_time)) - (HOUR(check_in_time) * 60 + MINUTE(check_in_time))
                                          WHEN (HOUR(check_out_time) * 60 + MINUTE(check_out_time)) <= 6 * 60 THEN
                                              ((24 * 60) - (HOUR(check_in_time) * 60 + MINUTE(check_in_time))) + (HOUR(check_out_time) * 60 + MINUTE(check_out_time))
                                          ELSE
                                              ((24 * 60) - (HOUR(check_in_time) * 60 + MINUTE(check_in_time))) + (HOUR(check_out_time) * 60 + MINUTE(check_out_time))
                                      END
                                  ELSE
                                      GREATEST(0, (HOUR(check_out_time) * 60 + MINUTE(check_out_time)) - (HOUR(check_in_time) * 60 + MINUTE(check_in_time)))
                              END - COALESCE(total_break_duration_minutes, 0)
                          )
                      ELSE 0
                  END) - 540
              ELSE 0
          END,
          overtime_hours = CASE
              WHEN (CASE
                  WHEN check_in_time IS NOT NULL AND check_out_time IS NOT NULL THEN
                      GREATEST(0,
                          CASE
                              WHEN (HOUR(check_in_time) * 60 + MINUTE(check_in_time)) >= 21 * 60 THEN
                                  CASE
                                      WHEN (HOUR(check_out_time) * 60 + MINUTE(check_out_time)) > (HOUR(check_in_time) * 60 + MINUTE(check_in_time)) THEN
                                          (HOUR(check_out_time) * 60 + MINUTE(check_out_time)) - (HOUR(check_in_time) * 60 + MINUTE(check_in_time))
                                      WHEN (HOUR(check_out_time) * 60 + MINUTE(check_out_time)) <= 6 * 60 THEN
                                          ((24 * 60) - (HOUR(check_in_time) * 60 + MINUTE(check_in_time))) + (HOUR(check_out_time) * 60 + MINUTE(check_out_time))
                                      ELSE
                                          ((24 * 60) - (HOUR(check_in_time) * 60 + MINUTE(check_in_time))) + (HOUR(check_out_time) * 60 + MINUTE(check_out_time))
                                  END
                              ELSE
                                  GREATEST(0, (HOUR(check_out_time) * 60 + MINUTE(check_out_time)) - (HOUR(check_in_time) * 60 + MINUTE(check_in_time)))
                          END - COALESCE(total_break_duration_minutes, 0)
                      )
                  ELSE 0
              END) > 540 THEN
                  ROUND((CASE
                      WHEN check_in_time IS NOT NULL AND check_out_time IS NOT NULL THEN
                          GREATEST(0,
                              CASE
                                  WHEN (HOUR(check_in_time) * 60 + MINUTE(check_in_time)) >= 21 * 60 THEN
                                      CASE
                                          WHEN (HOUR(check_out_time) * 60 + MINUTE(check_out_time)) > (HOUR(check_in_time) * 60 + MINUTE(check_in_time)) THEN
                                              (HOUR(check_out_time) * 60 + MINUTE(check_out_time)) - (HOUR(check_in_time) * 60 + MINUTE(check_in_time))
                                          WHEN (HOUR(check_out_time) * 60 + MINUTE(check_out_time)) <= 6 * 60 THEN
                                              ((24 * 60) - (HOUR(check_in_time) * 60 + MINUTE(check_in_time))) + (HOUR(check_out_time) * 60 + MINUTE(check_out_time))
                                          ELSE
                                              ((24 * 60) - (HOUR(check_in_time) * 60 + MINUTE(check_in_time))) + (HOUR(check_out_time) * 60 + MINUTE(check_out_time))
                                      END
                                  ELSE
                                      GREATEST(0, (HOUR(check_out_time) * 60 + MINUTE(check_out_time)) - (HOUR(check_in_time) * 60 + MINUTE(check_in_time)))
                              END - COALESCE(total_break_duration_minutes, 0)
                          )
                      ELSE 0
                  END - 540) / 60, 2)
              ELSE '0.00'
          END,
          updated_at = NOW()
      WHERE (gross_working_time_minutes = 0 OR gross_working_time_minutes IS NULL)
          AND check_in_time IS NOT NULL
          AND check_out_time IS NOT NULL
          AND status IN ('Present', 'Late');
    `;

    const [result] = await connection.query(query);

    connection.release();

    console.log(
      `✅ Auto-fixed ${result.affectedRows} records with missing working hours`,
    );

    res.status(200).json({
      success: true,
      message: `Successfully auto-fixed working hours`,
      records_updated: result.affectedRows,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Auto-fix missing working hours error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to auto-fix working hours",
      error: error.message,
    });
  }
};

// Get Break Summary for a specific employee on a specific date
exports.getBreakSummary = async (req, res) => {
  let connection;
  try {
    const { employee_id, date } = req.query;

    if (!employee_id || !date) {
      return res.status(400).json({
        success: false,
        message: "Employee ID and date are required",
      });
    }

    connection = await pool.getConnection();

    try {
      // Convert user_as_employees.id to employee_onboarding.id if needed
      let finalEmployeeId = employee_id;
      const [employeeMapping] = await connection.query(
        `SELECT eo.id as onboarding_id FROM employee_onboarding eo
         WHERE eo.id = ?`,
        [employee_id],
      );

      if (employeeMapping.length === 0) {
        // Try to find via user_as_employees table
        const [userMapping] = await connection.query(
          `SELECT uae.employee_id FROM user_as_employees uae WHERE uae.id = ?`,
          [employee_id],
        );

        if (userMapping.length > 0) {
          finalEmployeeId = userMapping[0].employee_id;
        }
      }

      // Get attendance record for this date
      const [attendanceRecord] = await connection.query(
        `SELECT 
           ea.id,
           ea.employee_id,
           ea.name,
           ea.email,
           ea.attendance_date,
           ea.status,
           ea.total_breaks_taken,
           ea.total_break_duration_minutes,
           ea.smoke_break_count,
           ea.smoke_break_duration_minutes,
           ea.dinner_break_count,
           ea.dinner_break_duration_minutes,
           ea.washroom_break_count,
           ea.washroom_break_duration_minutes,
           ea.prayer_break_count,
           ea.prayer_break_duration_minutes,
           ea.check_in_time,
           ea.check_out_time
         FROM Employee_Attendance ea
         WHERE ea.employee_id = ? AND ea.attendance_date = ?`,
        [finalEmployeeId, date],
      );

      if (attendanceRecord.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No attendance record found for the specified date",
        });
      }

      const attendance = attendanceRecord[0];
      const attendanceId = attendance.id;

      // Get all individual break records for this attendance
      const [breakRecords] = await connection.query(
        `SELECT 
           id,
           break_type,
           break_start_time,
           break_end_time,
           break_duration_minutes,
           reason,
           created_at
         FROM Employee_Breaks
         WHERE attendance_id = ?
         ORDER BY created_at ASC`,
        [attendanceId],
      );

      // Calculate break statistics
      const breakStats = {
        totalBreaks: attendance.total_breaks_taken || 0,
        totalDurationMinutes: attendance.total_break_duration_minutes || 0,
        averageDurationMinutes: attendance.total_breaks_taken > 0 
          ? Math.round((attendance.total_break_duration_minutes || 0) / attendance.total_breaks_taken)
          : 0,
        breakdownByType: {
          smoke: {
            count: attendance.smoke_break_count || 0,
            durationMinutes: attendance.smoke_break_duration_minutes || 0,
            label: 'Smoke Break'
          },
          dinner: {
            count: attendance.dinner_break_count || 0,
            durationMinutes: attendance.dinner_break_duration_minutes || 0,
            label: 'Dinner Break'
          },
          washroom: {
            count: attendance.washroom_break_count || 0,
            durationMinutes: attendance.washroom_break_duration_minutes || 0,
            label: 'Washroom Break'
          },
          prayer: {
            count: attendance.prayer_break_count || 0,
            durationMinutes: attendance.prayer_break_duration_minutes || 0,
            label: 'Prayer Break'
          }
        },
        allBreaks: breakRecords.map(brk => ({
          id: brk.id,
          type: brk.break_type,
          startTime: brk.break_start_time,
          endTime: brk.break_end_time,
          durationMinutes: brk.break_duration_minutes || computeBreakDuration(brk),
          reason: brk.reason,
          createdAt: brk.created_at,
        })),
      };

      // Add formatted total duration as hours and minutes
      const totalHours = Math.floor(breakStats.totalDurationMinutes / 60);
      const totalMinutes = breakStats.totalDurationMinutes % 60;
      breakStats.totalDurationFormatted = `${totalHours}h ${totalMinutes}m`;

      // Add percentage breakdown by type
      if (breakStats.totalBreaks > 0) {
        breakStats.breakdownByType.smoke.percentage = Math.round(
          (breakStats.breakdownByType.smoke.count / breakStats.totalBreaks) *
            100,
        );
        breakStats.breakdownByType.dinner.percentage = Math.round(
          (breakStats.breakdownByType.dinner.count / breakStats.totalBreaks) *
            100,
        );
        breakStats.breakdownByType.washroom.percentage = Math.round(
          (breakStats.breakdownByType.washroom.count / breakStats.totalBreaks) *
            100,
        );
        breakStats.breakdownByType.prayer.percentage = Math.round(
          (breakStats.breakdownByType.prayer.count / breakStats.totalBreaks) *
            100,
        );
      }

      console.log(
        `✅ Break summary retrieved for employee ${finalEmployeeId} on ${date}`,
      );

      res.status(200).json({
        success: true,
        message: "Break summary retrieved successfully",
        data: {
          employee: {
            id: attendance.employee_id,
            name: attendance.name,
            email: attendance.email,
          },
          date: attendance.attendance_date,
          attendanceStatus: attendance.status,
          checkInTime: attendance.check_in_time,
          checkOutTime: attendance.check_out_time,
          breakStats: breakStats,
        },
      });
    } finally {
      if (connection) connection.release();
    }
  } catch (error) {
    console.error("❌ Get Break Summary error:", error);
    if (connection) connection.release();
    res.status(500).json({
      success: false,
      message: "Failed to retrieve break summary",
      error: error.message,
    });
  }
};

// ============================================================
// AUTO-CHECKOUT: Force checkout for any pending sessions at 9 AM
// ============================================================
// This function automatically completes check-out for employees who:
// - Have checked in but NOT checked out
// - Have no check-out time
// - Current time is AFTER 9:00 AM (shift deadline has passed)
// Uses 09:00:00 as the auto-checkout time (Pakistan timezone)
// ============================================================
exports.autoCheckoutExpiredSessions = async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    const autoCheckoutTime = '09:00:00'; // Pakistan timezone
    const expectedWorkingMinutes = 540; // 9 hours
    
    // ============================================================
    // CRITICAL FIX: Only allow auto-checkout if CURRENT TIME is AFTER 9 AM
    // ============================================================
    const now = getPakistanDate();
    const currentHour = now.getUTCHours();
    const currentMin = now.getUTCMinutes();
    const currentTotalMinutes = currentHour * 60 + currentMin;
    const nineAM = 9 * 60; // 540 minutes
    
    console.log('\n🔄 ========== AUTO-CHECKOUT PROCESS STARTED ==========');
    console.log(`⏰ Current time: ${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`);
    console.log(`⏰ Auto-checkout deadline: 09:00:00`);
    
    // Prevent auto-checkout if current time is before 9 AM
    if (currentTotalMinutes < nineAM) {
      const minutesUntil = nineAM - currentTotalMinutes;
      const hoursUntil = Math.floor(minutesUntil / 60);
      const minsUntil = minutesUntil % 60;
      
      console.log(`\n⏳ Auto-checkout NOT ALLOWED - Current time is BEFORE 9:00 AM`);
      console.log(`⏳ Time until deadline: ${hoursUntil}h ${minsUntil}m`);
      
      if (res) {
        res.status(400).json({
          success: false,
          message: `Auto-checkout can only run AFTER 9:00 AM. Current time: ${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`,
          data: {
            currentTime: `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`,
            deadline: '09:00:00',
            hoursUntilDeadline: hoursUntil,
            minutesUntilDeadline: minsUntil,
            status: 'DEADLINE_NOT_REACHED'
          }
        });
      }
      return { success: false, reason: 'DEADLINE_NOT_REACHED', processedCount: 0 };
    }
    
    console.log(`✅ Current time is AFTER 9:00 AM - Auto-checkout ALLOWED\n`);
    
    // Find all active check-ins (without check-out) for today and yesterday
    const todayStr = getPakistanDateString();
    const yesterdayDate = getPakistanYesterday();
    const yesterdayStr = getLocalDateString(yesterdayDate);
    
    // Query for pending check-outs from today and yesterday
    const [pendingCheckOuts] = await connection.query(
      `SELECT 
        id, 
        employee_id, 
        name, 
        email, 
        attendance_date, 
        check_in_time,
        total_break_duration_minutes,
        status
       FROM Employee_Attendance 
       WHERE check_out_time IS NULL 
       AND (attendance_date = ? OR attendance_date = ?)
       AND status IN ('Present', 'Late')`,
      [todayStr, yesterdayStr]
    );
    
    console.log(`📋 Found ${pendingCheckOuts.length} pending check-outs`);
    
    if (pendingCheckOuts.length === 0) {
      console.log('✅ No pending check-outs found');
      if (res) {
        res.status(200).json({
          success: true,
          message: 'No pending check-outs found',
          data: { processedCount: 0, details: [] }
        });
      }
      return { success: true, processedCount: 0, details: [] };
    }
    
    const processedDetails = [];
    
    // Process each pending check-out
    for (const record of pendingCheckOuts) {
      try {
        const {
          id: attendanceId,
          employee_id,
          name,
          email,
          attendance_date,
          check_in_time: checkInTime,
          total_break_duration_minutes: totalBreakMinutes,
          status
        } = record;
        
        console.log(`\n👤 Processing: ${name} (ID: ${employee_id})`);
        console.log(`   - Attendance Date: ${attendance_date}`);
        console.log(`   - Check-in: ${checkInTime}`);
        console.log(`   - Breaks taken: ${totalBreakMinutes || 0} minutes`);
        
        // Calculate working hours from check-in to 9 AM
        const [checkInHour, checkInMin] = checkInTime.split(':').map(Number);
        const checkInTotalMinutes = checkInHour * 60 + checkInMin;
        const checkOutTotalMinutes = 9 * 60; // 9:00 AM = 540 minutes
        
        let grossWorkingMinutes = 0;
        const isNightShift = checkInTotalMinutes >= 21 * 60; // 21:00 or later
        
        if (isNightShift) {
          // Night shift calculation
          const timeDifferenceMinutes = checkOutTotalMinutes - checkInTotalMinutes;
          
          if (timeDifferenceMinutes >= 0) {
            // Same night checkout
            grossWorkingMinutes = timeDifferenceMinutes;
            console.log(`   📊 Same-night: ${checkInTime} → ${autoCheckoutTime} = ${grossWorkingMinutes}min`);
          } else if (checkOutTotalMinutes < 6 * 60) {
            // Next day early morning (shouldn't happen at 9 AM)
            const minutesUntilMidnight = (24 * 60) - checkInTotalMinutes;
            const minutesAfterMidnight = checkOutTotalMinutes;
            grossWorkingMinutes = minutesUntilMidnight + minutesAfterMidnight;
            console.log(`   📊 Night shift: ${minutesUntilMidnight}min (until midnight) + ${minutesAfterMidnight}min (after midnight) = ${grossWorkingMinutes}min`);
          } else {
            // Normal night shift ending at 9 AM
            const minutesUntilMidnight = (24 * 60) - checkInTotalMinutes;
            const minutesAfterMidnight = checkOutTotalMinutes;
            grossWorkingMinutes = minutesUntilMidnight + minutesAfterMidnight;
            console.log(`   📊 Normal night shift: ${minutesUntilMidnight}min (until midnight) + ${minutesAfterMidnight}min (after midnight) = ${grossWorkingMinutes}min`);
          }
        } else {
          // Day shift
          grossWorkingMinutes = Math.max(0, checkOutTotalMinutes - checkInTotalMinutes);
          console.log(`   📊 Day shift: ${checkInTime} → ${autoCheckoutTime} = ${grossWorkingMinutes}min`);
        }
        
        grossWorkingMinutes = Math.max(0, grossWorkingMinutes);
        const netWorkingMinutes = Math.max(0, grossWorkingMinutes - (totalBreakMinutes || 0));
        
        // Calculate overtime
        let overtimeMinutes = 0;
        let overtimeHours = '0.00';
        
        if (netWorkingMinutes > expectedWorkingMinutes) {
          overtimeMinutes = netWorkingMinutes - expectedWorkingMinutes;
          overtimeHours = (overtimeMinutes / 60).toFixed(2);
        }
        
        console.log(`   ⏱️ Gross: ${grossWorkingMinutes}min, Net: ${netWorkingMinutes}min, Overtime: ${overtimeMinutes}min (${overtimeHours}h)`);
        
        // Update the attendance record with auto-checkout
        await connection.query(
          `UPDATE Employee_Attendance 
           SET check_out_time = ?,
               gross_working_time_minutes = ?,
               net_working_time_minutes = ?,
               overtime_minutes = ?,
               overtime_hours = ?,
               updated_at = NOW()
           WHERE id = ?`,
          [autoCheckoutTime, grossWorkingMinutes, netWorkingMinutes, overtimeMinutes, overtimeHours, attendanceId]
        );
        
        console.log(`✅ Auto-checkout completed for ${name}`);
        
        processedDetails.push({
          employee_id,
          name,
          email,
          attendance_date,
          check_in_time: checkInTime,
          check_out_time: autoCheckoutTime,
          gross_working_time_minutes: grossWorkingMinutes,
          net_working_time_minutes: netWorkingMinutes,
          overtime_hours: parseFloat(overtimeHours),
          status: 'auto-completed'
        });
        
      } catch (error) {
        console.error(`❌ Failed to auto-checkout for employee ${record.employee_id}:`, error.message);
        processedDetails.push({
          employee_id: record.employee_id,
          name: record.name,
          status: 'failed',
          error: error.message
        });
      }
    }
    
    connection.release();
    
    console.log(`\n✅ AUTO-CHECKOUT PROCESS COMPLETED`);
    console.log(`📊 Processed: ${processedDetails.length} records`);
    console.log('🔄 ========== AUTO-CHECKOUT FINISHED ==========\n');
    
    if (res) {
      res.status(200).json({
        success: true,
        message: `Auto-checkout process completed for ${processedDetails.length} records`,
        data: {
          processedCount: processedDetails.length,
          details: processedDetails
        }
      });
    }
    
    return { success: true, processedCount: processedDetails.length, details: processedDetails };
    
  } catch (error) {
    console.error('❌ Auto-checkout process error:', error);
    if (connection) connection.release();
    
    if (res) {
      res.status(500).json({
        success: false,
        message: 'Auto-checkout process failed',
        error: error.message
      });
    }
    
    return { success: false, error: error.message };
  }
};

// ============================================================
// ADMIN: Fix status and late_by_minutes for early check-ins
// Usage: POST /api/v1/attendance/fix-status/:id
// Corrects records where early check-in (09:00 AM - 20:59 PM) was wrongly marked as "Late"
// ============================================================
exports.fixStatusById = async (req, res) => {
  let connection;
  try {
    const attendanceId = req.params.id;

    if (!attendanceId) {
      return res.status(400).json({ success: false, message: 'Attendance ID is required' });
    }

    connection = await pool.getConnection();

    const [rows] = await connection.query(
      'SELECT id, check_in_time FROM Employee_Attendance WHERE id = ? LIMIT 1',
      [attendanceId]
    );

    if (rows.length === 0) {
      connection.release();
      return res.status(404).json({ success: false, message: 'Attendance record not found' });
    }

    const record = rows[0];
    const checkInTime = record.check_in_time;

    // Parse check-in time
    const [hour, min, sec] = checkInTime.split(':').map(Number);
    const checkInTotalMinutes = hour * 60 + min;
    const nineAM = 9 * 60; // 540 minutes
    const shiftStart = 21 * 60; // 1260 minutes
    const lateAfterTime = 21 * 60 + 15; // 1275 minutes

    let newStatus = 'Present';
    let newLateByMinutes = 0;
    let newOnTime = 1;

    // Determine correct status
    if (checkInTotalMinutes >= nineAM && checkInTotalMinutes < shiftStart) {
      // Early check-in - should be Present, not Late
      newStatus = 'Present';
      newLateByMinutes = 0;
      newOnTime = 1;
    } else if (checkInTotalMinutes >= shiftStart && checkInTotalMinutes <= lateAfterTime) {
      // On time check-in
      newStatus = 'Present';
      newLateByMinutes = 0;
      newOnTime = 1;
    } else if (checkInTotalMinutes > lateAfterTime && checkInTotalMinutes <= 23 * 60 + 59) {
      // Evening late
      newStatus = 'Late';
      newLateByMinutes = checkInTotalMinutes - lateAfterTime;
      newOnTime = 0;
    } else if (checkInTotalMinutes >= 0 && checkInTotalMinutes <= 6 * 60) {
      // Early morning - late
      newStatus = 'Late';
      newLateByMinutes = 1440 - lateAfterTime + checkInTotalMinutes;
      newOnTime = 0;
    }

    // Update the record
    await connection.query(
      `UPDATE Employee_Attendance SET status = ?, late_by_minutes = ?, on_time = ?, updated_at = NOW() WHERE id = ?`,
      [newStatus, newLateByMinutes, newOnTime, attendanceId]
    );

    connection.release();

    return res.status(200).json({
      success: true,
      message: 'Attendance status fixed successfully',
      data: {
        id: attendanceId,
        check_in_time: checkInTime,
        status: newStatus,
        late_by_minutes: newLateByMinutes,
        on_time: newOnTime
      }
    });

  } catch (error) {
    console.error('❌ Fix status error:', error);
    if (connection) connection.release();
    res.status(500).json({ success: false, message: 'Failed to fix status', error: error.message });
  }
};

// ============================================================
// ADMIN: Fix a single attendance record by ID (set checkout + recalc)
// Usage: POST /api/v1/attendance/fix-checkout/:id  { check_out_time: 'HH:MM:SS' (optional) }
// If no check_out_time provided, uses '09:00:00' (auto-checkout default)
// CRITICAL: Only allows setting checkout if current time is AFTER 9:00 AM
// ============================================================
exports.fixCheckoutById = async (req, res) => {
  let connection;
  try {
    const attendanceId = req.params.id;
    const requestedCheckOutTime = req.body.check_out_time; // optional

    if (!attendanceId) {
      return res.status(400).json({ success: false, message: 'Attendance ID is required' });
    }

    // ============================================================
    // DEADLINE VALIDATION: Current time must be AFTER 9:00 AM
    // ============================================================
    const now = getPakistanDate();
    const currentHour = now.getUTCHours();
    const currentMin = now.getUTCMinutes();
    const currentTotalMinutes = currentHour * 60 + currentMin;
    const nineAM = 9 * 60; // 540 minutes

    if (currentTotalMinutes < nineAM) {
      // Current time is BEFORE 9:00 AM - cannot fix/auto-checkout
      const minutesUntil = nineAM - currentTotalMinutes;
      const hoursUntil = Math.floor(minutesUntil / 60);
      const minsUntil = minutesUntil % 60;

      console.log(`\n⏳ [FIX-CHECKOUT] Attempted fix BEFORE 9:00 AM deadline (ID: ${attendanceId})`);
      console.log(`⏳ Current time: ${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`);
      console.log(`⏳ Time until deadline: ${hoursUntil}h ${minsUntil}m\n`);

      return res.status(400).json({
        success: false,
        message: `Cannot fix checkout before 9:00 AM deadline. Current time: ${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`,
        data: {
          currentTime: `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`,
          deadline: '09:00:00',
          hoursUntilDeadline: hoursUntil,
          minutesUntilDeadline: minsUntil,
          status: 'DEADLINE_NOT_REACHED'
        }
      });
    }

    connection = await pool.getConnection();

    const [rows] = await connection.query(
      'SELECT id, employee_id, attendance_date, check_in_time, total_break_duration_minutes, status FROM Employee_Attendance WHERE id = ? LIMIT 1',
      [attendanceId]
    );

    if (rows.length === 0) {
      connection.release();
      return res.status(404).json({ success: false, message: 'Attendance record not found' });
    }

    const record = rows[0];

    if (record.check_in_time == null) {
      connection.release();
      return res.status(400).json({ success: false, message: 'Cannot fix record without check-in time' });
    }

    // If already has checkout, return
    const [existing] = await connection.query(
      'SELECT check_out_time FROM Employee_Attendance WHERE id = ?',
      [attendanceId]
    );

    if (existing.length > 0 && existing[0].check_out_time) {
      connection.release();
      return res.status(200).json({ success: true, message: 'Record already has check-out', data: { id: attendanceId, check_out_time: existing[0].check_out_time } });
    }

    const autoCheckoutTime = requestedCheckOutTime || '09:00:00';
    const totalBreakMinutes = record.total_break_duration_minutes || 0;

    // ============================================================
    // CHECKOUT TIME VALIDATION: Ensure checkout is not after 9 AM
    // (unless it's an invalid shift check-in that we're clearing)
    // ============================================================
    const [checkOutHour, checkOutMin] = autoCheckoutTime.split(':').map(Number);
    const checkOutTotalMinutes = checkOutHour * 60 + checkOutMin;
    const [checkInHour, checkInMin] = record.check_in_time.split(':').map(Number);
    const checkInTotalMinutes = checkInHour * 60 + checkInMin;
    const isValidShiftCheckIn = checkInTotalMinutes >= 21 * 60 || checkInTotalMinutes <= 6 * 60;

    if (checkOutTotalMinutes >= 9 * 60 && isValidShiftCheckIn) {
      // Trying to set a checkout time at or after 9 AM for a valid shift
      connection.release();
      console.log(`\n❌ [FIX-CHECKOUT] Attempted to set invalid checkout time (${autoCheckoutTime}) for valid shift check-in (${record.check_in_time})`);
      
      return res.status(400).json({
        success: false,
        message: `Invalid checkout time. Checkout must be BEFORE 9:00 AM. Requested time: ${autoCheckoutTime}`,
        data: {
          checkInTime: record.check_in_time,
          requestedCheckOutTime: autoCheckoutTime,
          deadline: '09:00:00',
          reason: 'Night shift employees must checkout before 9 AM'
        }
      });
    }

    // Calculate working hours using helper
    const working = calculateWorkingHours(record.check_in_time, autoCheckoutTime, totalBreakMinutes);

    await connection.query(
      `UPDATE Employee_Attendance SET check_out_time = ?, gross_working_time_minutes = ?, net_working_time_minutes = ?, overtime_minutes = ?, overtime_hours = ?, updated_at = NOW() WHERE id = ?`,
      [autoCheckoutTime, working.gross, working.net, working.overtime, working.overtimeHours, attendanceId]
    );

    connection.release();

    return res.status(200).json({
      success: true,
      message: 'Attendance fixed successfully',
      data: {
        id: attendanceId,
        check_out_time: autoCheckoutTime,
        gross_working_time_minutes: working.gross,
        net_working_time_minutes: working.net,
        overtime_minutes: working.overtime,
        overtime_hours: working.overtimeHours
      }
    });

  } catch (error) {
    console.error('❌ Fix checkout error:', error);
    if (connection) connection.release();
    res.status(500).json({ success: false, message: 'Failed to fix attendance', error: error.message });
  }
};

// ============================================================
// GET TODAY'S ABSENT EMPLOYEES - Auto mark as absent who haven't checked in
// ============================================================
exports.getTodayAbsentEmployees = async (req, res) => {
  let connection;
  try {
    const today = getLocalDateString(getPakistanDate());
    connection = await pool.getConnection();

    // Get all active employees
    const [allEmployees] = await connection.query(
      `SELECT id, email, name, department, status 
       FROM employee_onboarding 
       WHERE status = 'Active'`
    );

    // Get employees who checked in today
    const [checkedInToday] = await connection.query(
      `SELECT DISTINCT employee_id FROM Employee_Attendance WHERE attendance_date = ?`,
      [today]
    );

    const checkedInIds = new Set(checkedInToday.map(e => e.employee_id));

    // Find employees who haven't checked in
    const absentEmployees = allEmployees.filter(emp => !checkedInIds.has(emp.id));

    // Auto-generate absent records for those who haven't checked in
    for (const emp of absentEmployees) {
      // Check if absent record already exists
      const [existingAbsent] = await connection.query(
        `SELECT id FROM Employee_Absent WHERE employee_id = ? AND absent_date = ?`,
        [emp.id, today]
      );

      if (existingAbsent.length === 0) {
        // Create absence record
        await connection.query(
          `INSERT INTO Employee_Absent 
           (employee_id, email, name, absent_date, reason_type, reason, is_approved, remarks, created_at, updated_at) 
           VALUES (?, ?, ?, ?, 'No Check-in', 'Auto-generated: Employee did not check in', 0, 'System auto-marked', NOW(), NOW())`,
          [emp.id, emp.email, emp.name, today]
        );
      }
    }

    // Get all absent records for today with details
    const [absenceRecords] = await connection.query(
      `SELECT 
        ea.id,
        ea.employee_id,
        ea.email,
        ea.name,
        ea.absent_date,
        ea.reason_type,
        ea.reason,
        ea.is_approved,
        ea.approved_by,
        ea.remarks,
        ea.created_at,
        ea.updated_at,
        eo.department,
        eo.designation
       FROM Employee_Absent ea
       LEFT JOIN employee_onboarding eo ON ea.employee_id = eo.id
       WHERE ea.absent_date = ?
       ORDER BY ea.name ASC`,
      [today]
    );

    connection.release();

    return res.status(200).json({
      success: true,
      message: `Found ${absenceRecords.length} absent employee(s) for ${today}`,
      date: today,
      total_active_employees: allEmployees.length,
      absent_count: absenceRecords.length,
      present_count: allEmployees.length - absenceRecords.length,
      absent_employees: absenceRecords,
      summary: {
        not_checked_in: absentEmployees.length,
        no_check_in_records: absenceRecords.filter(a => a.reason_type === 'No Check-in').length,
        on_leave: absenceRecords.filter(a => a.reason_type === 'Leave').length,
        medical_leave: absenceRecords.filter(a => a.reason_type === 'Medical').length
      }
    });

  } catch (error) {
    console.error('❌ Get Today Absent Employees error:', error);
    if (connection) connection.release();
    res.status(500).json({
      success: false,
      message: 'Failed to fetch absent employees',
      error: error.message
    });
  }
};

// ============================================================
// GET ABSENT EMPLOYEES FOR A SPECIFIC DATE
// ============================================================
exports.getAbsentEmployeesByDate = async (req, res) => {
  let connection;
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date parameter is required (YYYY-MM-DD format)'
      });
    }

    connection = await pool.getConnection();

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD'
      });
    }

    // Get all absent records for the specified date
    const [absenceRecords] = await connection.query(
      `SELECT 
        ea.id,
        ea.employee_id,
        ea.email,
        ea.name,
        ea.absent_date,
        ea.reason_type,
        ea.reason,
        ea.supporting_document_url,
        ea.is_approved,
        ea.approved_by,
        ea.remarks,
        ea.created_at,
        ea.updated_at,
        eo.department,
        eo.designation,
        eo.phone
       FROM Employee_Absent ea
       LEFT JOIN employee_onboarding eo ON ea.employee_id = eo.id
       WHERE ea.absent_date = ?
       ORDER BY ea.name ASC`,
      [date]
    );

    // Get statistics
    const stats = {
      total_absent: absenceRecords.length,
      approved: absenceRecords.filter(a => a.is_approved === 1).length,
      pending: absenceRecords.filter(a => a.is_approved === 0).length,
      by_reason: {
        no_check_in: absenceRecords.filter(a => a.reason_type === 'No Check-in').length,
        leave: absenceRecords.filter(a => a.reason_type === 'Leave').length,
        medical: absenceRecords.filter(a => a.reason_type === 'Medical').length,
        sick: absenceRecords.filter(a => a.reason_type === 'Sick').length,
        other: absenceRecords.filter(a => a.reason_type === 'Other').length
      }
    };

    connection.release();

    return res.status(200).json({
      success: true,
      message: `Absent records for ${date}`,
      date: date,
      statistics: stats,
      absent_employees: absenceRecords
    });

  } catch (error) {
    console.error('❌ Get Absent Employees by Date error:', error);
    if (connection) connection.release();
    res.status(500).json({
      success: false,
      message: 'Failed to fetch absent employees',
      error: error.message
    });
  }
};

// ============================================================
// GET ABSENT EMPLOYEES FOR A DATE RANGE
// ============================================================
exports.getAbsentEmployeesByDateRange = async (req, res) => {
  let connection;
  try {
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'Both start_date and end_date parameters are required (YYYY-MM-DD format)'
      });
    }

    connection = await pool.getConnection();

    // Get all absent records in the date range
    const [absenceRecords] = await connection.query(
      `SELECT 
        ea.id,
        ea.employee_id,
        ea.email,
        ea.name,
        ea.absent_date,
        ea.reason_type,
        ea.reason,
        ea.is_approved,
        ea.approved_by,
        ea.remarks,
        ea.created_at,
        ea.updated_at,
        eo.department,
        eo.designation
       FROM Employee_Absent ea
       LEFT JOIN employee_onboarding eo ON ea.employee_id = eo.id
       WHERE ea.absent_date BETWEEN ? AND ?
       ORDER BY ea.absent_date DESC, ea.name ASC`,
      [start_date, end_date]
    );

    // Group by date
    const groupedByDate = {};
    absenceRecords.forEach(record => {
      const date = record.absent_date;
      if (!groupedByDate[date]) {
        groupedByDate[date] = [];
      }
      groupedByDate[date].push(record);
    });

    // Calculate overall statistics
    const stats = {
      total_absent: absenceRecords.length,
      approved: absenceRecords.filter(a => a.is_approved === 1).length,
      pending: absenceRecords.filter(a => a.is_approved === 0).length,
      by_reason: {
        no_check_in: absenceRecords.filter(a => a.reason_type === 'No Check-in').length,
        leave: absenceRecords.filter(a => a.reason_type === 'Leave').length,
        medical: absenceRecords.filter(a => a.reason_type === 'Medical').length,
        sick: absenceRecords.filter(a => a.reason_type === 'Sick').length,
        other: absenceRecords.filter(a => a.reason_type === 'Other').length
      }
    };

    connection.release();

    return res.status(200).json({
      success: true,
      message: `Absent records from ${start_date} to ${end_date}`,
      date_range: { start_date, end_date },
      statistics: stats,
      records_by_date: groupedByDate,
      absent_employees: absenceRecords
    });

  } catch (error) {
    console.error('❌ Get Absent Employees by Date Range error:', error);
    if (connection) connection.release();
    res.status(500).json({
      success: false,
      message: 'Failed to fetch absent employees',
      error: error.message
    });
  }
};

// ============================================================
// GET ABSENT SUMMARY BY EMPLOYEE (How many times absent)
// ============================================================
exports.getAbsentSummaryByEmployee = async (req, res) => {
  let connection;
  try {
    const { start_date, end_date } = req.query;

    connection = await pool.getConnection();

    let query = `
      SELECT 
        ea.employee_id,
        ea.name,
        ea.email,
        eo.department,
        eo.designation,
        COUNT(*) as total_absent_days,
        SUM(CASE WHEN ea.reason_type = 'No Check-in' THEN 1 ELSE 0 END) as no_check_in_count,
        SUM(CASE WHEN ea.reason_type = 'Leave' THEN 1 ELSE 0 END) as leave_count,
        SUM(CASE WHEN ea.reason_type = 'Medical' THEN 1 ELSE 0 END) as medical_count,
        SUM(CASE WHEN ea.reason_type = 'Sick' THEN 1 ELSE 0 END) as sick_count,
        SUM(CASE WHEN ea.is_approved = 1 THEN 1 ELSE 0 END) as approved_count,
        SUM(CASE WHEN ea.is_approved = 0 THEN 1 ELSE 0 END) as pending_count,
        MIN(ea.absent_date) as first_absent_date,
        MAX(ea.absent_date) as last_absent_date
      FROM Employee_Absent ea
      LEFT JOIN employee_onboarding eo ON ea.employee_id = eo.id
      WHERE 1=1
    `;

    const params = [];

    if (start_date && end_date) {
      query += ` AND ea.absent_date BETWEEN ? AND ?`;
      params.push(start_date, end_date);
    }

    query += ` GROUP BY ea.employee_id, ea.name, ea.email
      ORDER BY total_absent_days DESC`;

    const [summary] = await connection.query(query, params);

    connection.release();

    return res.status(200).json({
      success: true,
      message: 'Absence summary by employee',
      date_range: start_date && end_date ? { start_date, end_date } : 'All time',
      total_employees_with_absences: summary.length,
      summary: summary
    });

  } catch (error) {
    console.error('❌ Get Absent Summary error:', error);
    if (connection) connection.release();
    res.status(500).json({
      success: false,
      message: 'Failed to fetch absence summary',
      error: error.message
    });
  }
};

// ============================================================
// AUTO-MARK ABSENT EMPLOYEES FOR DATE RANGE
// Marks all employees who haven't checked in as absent
// ============================================================
exports.autoMarkAbsentByDateRange = async (req, res) => {
  let connection;
  try {
    const { start_date, end_date } = req.body;

    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'Both start_date and end_date are required (YYYY-MM-DD format)'
      });
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(start_date) || !dateRegex.test(end_date)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD'
      });
    }

    connection = await pool.getConnection();

    console.log(`\n📅 AUTO-MARKING ABSENCES FROM ${start_date} TO ${end_date}`);

    // Get all active employees
    const [allEmployees] = await connection.query(
      `SELECT id, employee_id, name, email, department FROM employee_onboarding WHERE status = 'Active'`
    );

    console.log(`👥 Found ${allEmployees.length} active employees`);

    let totalCreated = 0;
    let totalSkipped = 0;

    // Process each day in the date range
    const startDateObj = new Date(start_date);
    const endDateObj = new Date(end_date);
    
    const currentDate = new Date(startDateObj);
    const dateList = [];

    while (currentDate <= endDateObj) {
      dateList.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log(`📆 Processing ${dateList.length} dates`);

    // For each date
    for (const checkDate of dateList) {
      console.log(`\n📊 Processing date: ${checkDate}`);

      // Get employees who checked in on this date
      const [checkedInToday] = await connection.query(
        `SELECT DISTINCT employee_id FROM Employee_Attendance WHERE attendance_date = ?`,
        [checkDate]
      );

      const checkedInIds = new Set(checkedInToday.map(e => e.employee_id));

      // Find employees who haven't checked in
      const absentEmployees = allEmployees.filter(emp => !checkedInIds.has(emp.id));

      console.log(`   ✅ Checked in: ${checkedInIds.size}, ❌ Absent: ${absentEmployees.length}`);

      // Create absence records for employees who haven't checked in
      for (const emp of absentEmployees) {
        try {
          // Check if record already exists
          const [existingAbsent] = await connection.query(
            `SELECT id FROM Employee_Absent WHERE employee_id = ? AND absent_date = ?`,
            [emp.id, checkDate]
          );

          if (existingAbsent.length === 0) {
            // Create absence record
            await connection.query(
              `INSERT INTO Employee_Absent 
               (employee_id, email, name, absent_date, reason_type, reason, is_approved, remarks, created_at, updated_at) 
               VALUES (?, ?, ?, ?, 'No Check-in', 'Auto-generated: Employee did not check in', 0, 'System auto-marked', NOW(), NOW())`,
              [emp.id, emp.email, emp.name, checkDate]
            );
            totalCreated++;
          } else {
            totalSkipped++;
          }
        } catch (err) {
          console.error(`   ⚠️ Error creating absence record for employee ${emp.id}:`, err.message);
        }
      }
    }

    connection.release();

    console.log(`\n✅ AUTO-MARKING COMPLETE:`);
    console.log(`   📝 Created: ${totalCreated} new absence records`);
    console.log(`   ⏭️  Skipped: ${totalSkipped} existing records`);

    return res.status(200).json({
      success: true,
      message: `Auto-marked absent employees from ${start_date} to ${end_date}`,
      data: {
        start_date,
        end_date,
        total_employees: allEmployees.length,
        total_created: totalCreated,
        total_skipped: totalSkipped,
        dates_processed: dateList.length
      }
    });

  } catch (error) {
    console.error('❌ Auto-mark absent by date range error:', error);
    if (connection) connection.release();
    res.status(500).json({
      success: false,
      message: 'Failed to auto-mark absences',
      error: error.message
    });
  }
};

// ============================================================
// GET PENDING CHECKOUT - Check for CURRENT SHIFT pending checkout only
// ============================================================
// IMPORTANT: Only returns pending checkout from CURRENT shift window
// SHIFT WINDOW: 21:00 (Day N) → 09:00 (Day N+1)
// - If time is 21:00-23:59 (evening): Look for pending from TODAY only
// - If time is 00:00-09:00 (morning): Look for pending from YESTERDAY only
// - Ignore old pending entries from days older than the current shift window
// ============================================================
exports.getPendingCheckout = async (req, res) => {
  let connection;
  try {
    const jwtEmployeeId = req.user?.employeeId;
    const jwtUserId = req.user?.userId;
    const reqEmployeeId = req.query.employee_id;
    let employee_id = jwtEmployeeId || reqEmployeeId || jwtUserId;

    console.log('[PENDING-CHECKOUT] Request received:');
    console.log('   - JWT employeeId:', jwtEmployeeId);
    console.log('   - Request employee_id:', reqEmployeeId);
    console.log('   - Using employee_id:', employee_id);

    if (!employee_id) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID is required'
      });
    }

    connection = await pool.getConnection();

    try {
      // ============================================================
      // CURRENT SHIFT WINDOW DETECTION
      // ============================================================
      const now = getPakistanDate();
      const currentHour = now.getUTCHours();
      const currentMin = now.getUTCMinutes();
      const currentTotalMinutes = currentHour * 60 + currentMin;
      const todayStr = getPakistanDateString();
      const nineAM = 9 * 60;      // 540 minutes
      const ninePM = 21 * 60;     // 1260 minutes

      let searchDate; // The shift date to search for

      if (currentTotalMinutes >= ninePM) {
        // Evening (21:00 - 23:59): Current shift started TODAY
        // Look for pending entries from TODAY
        searchDate = todayStr;
        console.log(`⏰ Time window: EVENING (${currentHour}:${String(currentMin).padStart(2, '0')}) - Shift started TODAY`);
        console.log(`🔍 Searching for pending checkout from: ${searchDate}`);
      } else if (currentTotalMinutes < nineAM) {
        // Early morning (00:00 - 08:59): Current shift started YESTERDAY
        // Look for pending entries from YESTERDAY
        const yesterdayDate = getPakistanYesterday();
        searchDate = getLocalDateString(yesterdayDate);
        console.log(`⏰ Time window: EARLY MORNING (${currentHour}:${String(currentMin).padStart(2, '0')}) - Shift started YESTERDAY`);
        console.log(`🔍 Searching for pending checkout from: ${searchDate}`);
      } else {
        // Daytime (09:00 - 20:59): No active shift window
        // No pending checkout should exist for new shift check-in
        console.log(`⏰ Time window: DAYTIME (${currentHour}:${String(currentMin).padStart(2, '0')}) - No active shift window`);
        console.log(`✅ No pending checkout can exist during daytime hours`);
        return res.status(200).json({
          success: true,
          message: 'No pending checkout (daytime hours - no active shift)',
          data: null,
          hasPending: false,
          isOverlapWindow: false,
          blocking: false,
          reason: 'Outside shift hours (09:00 - 21:00)'
        });
      }

      // Query for pending checkout from ONLY the relevant shift date
      const [pendingRecords] = await connection.query(
        `SELECT 
           id,
           employee_id,
           attendance_date,
           check_in_time,
           check_out_time,
           status,
           created_at,
           updated_at
         FROM Employee_Attendance
         WHERE employee_id = ? AND check_out_time IS NULL AND attendance_date = ?
         LIMIT 1`,
        [employee_id, searchDate]
      );

      if (pendingRecords.length === 0) {
        // No pending checkout from current shift window - employee can check in for new shift
        console.log(`✅ No pending checkout found for employee ${employee_id} on ${searchDate}`);
        return res.status(200).json({
          success: true,
          message: 'No pending checkout',
          data: null,
          hasPending: false,
          isOverlapWindow: false,
          blocking: false,
          searchedDate: searchDate
        });
      }

      // Found a pending checkout from CURRENT shift window
      const pendingRecord = pendingRecords[0];
      console.log(`⚠️  Pending checkout found for employee ${employee_id}:`, {
        attendance_date: pendingRecord.attendance_date,
        check_in_time: pendingRecord.check_in_time,
        created_at: pendingRecord.created_at
      });

      // Check if current time is within overlap window (9 AM - 9 PM)
      // During 9 AM - 9 PM: block new check-in until old shift is completed
      const isOverlapWindow = currentTotalMinutes >= nineAM && currentTotalMinutes < ninePM;

      console.log(`⏰ Current time check: ${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`);
      console.log(`⏰ Overlap window (9 AM - 9 PM): ${isOverlapWindow ? 'YES (BLOCKING)' : 'NO (NOT BLOCKING)'}`);

      res.status(200).json({
        success: true,
        message: 'Pending checkout found from current shift',
        data: {
          id: pendingRecord.id,
          employee_id: pendingRecord.employee_id,
          attendance_date: pendingRecord.attendance_date,
          check_in_time: pendingRecord.check_in_time,
          status: pendingRecord.status,
          created_at: pendingRecord.created_at
        },
        hasPending: true,
        isOverlapWindow: isOverlapWindow,
        blocking: isOverlapWindow, // Will block check-in only during overlap window (9 AM - 9 PM)
        reason: isOverlapWindow ? 'Overlap window (9 AM - 9 PM) - must complete checkout first' : 'Pending from current shift but outside overlap window'
      });

    } finally {
      if (connection) connection.release();
    }

  } catch (error) {
    console.error('❌ Get Pending Checkout error:', error);
    if (connection) connection.release();
    res.status(500).json({
      success: false,
      message: 'Failed to check pending checkout',
      error: error.message
    });
  }
};
