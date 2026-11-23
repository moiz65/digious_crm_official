jest.mock("../config/database", () => ({
  getConnection: jest.fn(),
}));

jest.mock("../utils/timezone", () => ({
  getPakistanDate: jest.fn(() => new Date(2026, 10, 23, 10, 0, 0)),
  getPakistanDateString: jest.fn(() => "2026-11-23"),
  getPakistanTimeString: jest.fn(() => "10:00:00"),
  getPakistanYesterday: jest.fn(() => new Date(2026, 10, 22)),
  getPakistanYesterdayString: jest.fn(() => "2026-11-22"),
  getUTCTimeString: jest.fn(),
}));

jest.mock("../utils/companyCalendar", () => ({
  ensureCompanyCalendarTable: jest.fn(),
  formatCalendarDate: jest.fn(),
  getCompanyCalendarEntries: jest.fn(),
  isWeekendDate: jest.fn(),
}));

const pool = require("../config/database");
const attendanceController = require("../routes/controllers/attendanceController");

describe("attendance check-in", () => {
  it("does not check out an open attendance when check-in is attempted after 9 AM", async () => {
    const query = jest.fn(async (sql) => {
      if (sql.includes("SELECT id, check_in_time, check_out_time")) {
        return [
          [
            {
              id: 42,
              check_in_time: "09:15:00",
              check_out_time: null,
            },
          ],
        ];
      }

      return [[]];
    });

    pool.getConnection.mockResolvedValue({
      query,
      release: jest.fn(),
    });

    const response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await attendanceController.checkIn(
      {
        body: {
          employee_id: 7,
          email: "employee@example.com",
          name: "Test Employee",
        },
      },
      response,
    );

    expect(response.status).toHaveBeenCalledWith(409);
    expect(response.json).toHaveBeenCalledWith({
      success: false,
      message: "You are still checked in. Please checkout first.",
    });
    expect(
      query.mock.calls.some(([sql]) => /^\s*(UPDATE|INSERT)/i.test(sql)),
    ).toBe(false);
  });
});
