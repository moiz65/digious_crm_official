jest.mock('../middleware/auth', () => (req, res, next) => {
  req.user = global.__desktopMonitorUser || { employeeId: 42, role: 'employee' };
  next();
});

jest.mock('../config/database', () => ({
  query: jest.fn(),
}));

const express = require('express');
const pool = require('../config/database');
const desktopMonitorRoutes = require('../routes/desktopMonitor');

const app = express();
app.use(express.json());
app.use('/monitor', desktopMonitorRoutes);
app.use((error, req, res, next) => {
  res.status(error.status || 500).json({ message: error.message });
});

let server;
let baseUrl;

beforeAll((done) => {
  server = app.listen(0, () => {
    baseUrl = `http://127.0.0.1:${server.address().port}/monitor`;
    done();
  });
});

afterAll((done) => {
  server.close(done);
});
beforeEach(() => {
  pool.query.mockReset();
  global.__desktopMonitorUser = { employeeId: 42, role: 'employee' };
});

afterAll(() => {
  delete global.__desktopMonitorUser;
});

describe('desktop monitor API', () => {
  test('requires explicit consent before starting a session', async () => {
    const response = await fetch(`${baseUrl}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ consentVersion: 'desktop-monitor-v1' }),
    });

    expect(response.status).toBe(400);
    expect(pool.query).not.toHaveBeenCalled();
  });

  test('creates an authenticated employee session after consent', async () => {
    pool.query.mockResolvedValueOnce([{ affectedRows: 1 }, []]);
    const response = await fetch(`${baseUrl}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ consentVersion: 'desktop-monitor-v2' }),
    });
    const result = await response.json();

    expect(response.status).toBe(201);
    expect(result.data.sessionId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO desktop_monitor_sessions'),
      [result.data.sessionId, '42', 'desktop-monitor-v2'],
    );
  });

  test('rejects unknown event types without writing to the database', async () => {
    const response = await fetch(`${baseUrl}/sessions/session-id/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventType: 'key_pressed' }),
    });

    expect(response.status).toBe(400);
    expect(pool.query).not.toHaveBeenCalled();
  });

  test('does not accept image data that is not a JPEG', async () => {
    pool.query.mockResolvedValueOnce([[{ id: 'session-id' }], []]);
    const formData = new FormData();
    formData.append('screenshot', new Blob(['not a jpeg'], { type: 'image/jpeg' }), 'screen.jpg');

    const response = await fetch(`${baseUrl}/sessions/session-id/screenshots`, {
      method: 'POST',
      body: formData,
    });

    expect(response.status).toBe(400);
    expect(pool.query).not.toHaveBeenCalled();
  });

  test('returns a clear error for screenshots over the size limit', async () => {
    const formData = new FormData();
    formData.append(
      'screenshot',
      new Blob([Buffer.alloc(2 * 1024 * 1024 + 1)], { type: 'image/jpeg' }),
      'screen.jpg',
    );

    const response = await fetch(`${baseUrl}/sessions/session-id/screenshots`, {
      method: 'POST',
      body: formData,
    });

    expect(response.status).toBe(413);
    expect(pool.query).not.toHaveBeenCalled();
  });

  test('does not expose another employee activity to a regular employee', async () => {
    const response = await fetch(`${baseUrl}/employees/EMP-7/activity`);

    expect(response.status).toBe(403);
    expect(pool.query).not.toHaveBeenCalled();
  });

  test('does not expose the employee picker to a regular employee', async () => {
    const response = await fetch(`${baseUrl}/employees`);

    expect(response.status).toBe(403);
    expect(pool.query).not.toHaveBeenCalled();
  });

  test('returns active employee database IDs and working status to an HR user', async () => {
    global.__desktopMonitorUser = { employeeId: 7, role: 'hr' };
    const employees = [{
      employeeId: 7,
      employeeCode: 'EMP-7',
      name: 'Employee Name',
      department: 'Sales',
      profilePhoto: 'https://example.com/employee.jpg',
      status: 'Active',
      isWorking: 1,
    }];
    pool.query.mockResolvedValueOnce([employees, []]);

    const response = await fetch(`${baseUrl}/employees`);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.data).toEqual(employees);
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('id AS employeeId'),
    );
    expect(pool.query.mock.calls[0][0]).toContain('employee.profile_photo AS profilePhoto');
    expect(pool.query.mock.calls[0][0]).toContain("LOWER(TRIM(employee.status)) = 'active'");
    expect(pool.query.mock.calls[0][0]).toContain('monitoring_session.ended_at IS NULL');
  });

  test('allows a super admin without an employee ID to load the employee picker', async () => {
    global.__desktopMonitorUser = { role: 'superadmin' };
    pool.query.mockResolvedValueOnce([[
      { employeeId: 7, employeeCode: 'EMP-7', name: 'Employee Name', status: 'Active', isWorking: 0 },
    ], []]);

    const response = await fetch(`${baseUrl}/employees`);

    expect(response.status).toBe(200);
  });

  test('returns selected employee screenshots and idle totals to an operations manager', async () => {
    global.__desktopMonitorUser = {
      employeeId: 42,
      role: 'employee',
      designation: 'Operations Manager',
    };
    const screenshotRows = [{ id: 8, capturedAt: '2026-11-09 09:00:00', fileSize: 1024 }];
    const idleRows = [{ id: 11, idleSeconds: 240, occurredAt: '2026-11-09 09:10:00' }];
    pool.query
      .mockResolvedValueOnce([screenshotRows, []])
      .mockResolvedValueOnce([idleRows, []])
      .mockResolvedValueOnce([[{ totalIdleSeconds: '240' }], []]);

    const response = await fetch(`${baseUrl}/employees/7/activity`);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.data).toEqual({
      screenshots: screenshotRows,
      idleEvents: idleRows,
      totalIdleSeconds: 240,
    });
    expect(pool.query).toHaveBeenCalledTimes(3);
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('FROM desktop_monitor_screenshots'),
      ['7'],
    );
  });
});
