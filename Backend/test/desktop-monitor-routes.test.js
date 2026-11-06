jest.mock('../middleware/auth', () => (req, res, next) => {
  req.user = { employeeId: 42, role: 'employee' };
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
beforeEach(() => pool.query.mockReset());

describe('desktop monitor API', () => {
  test('requires explicit consent before starting a session', async () => {
    const response = await fetch(`${baseUrl}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ consentVersion: 'wrong-version' }),
    });

    expect(response.status).toBe(400);
    expect(pool.query).not.toHaveBeenCalled();
  });

  test('creates an authenticated employee session after consent', async () => {
    pool.query.mockResolvedValueOnce([{ affectedRows: 1 }, []]);
    const response = await fetch(`${baseUrl}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ consentVersion: 'desktop-monitor-v1' }),
    });
    const result = await response.json();

    expect(response.status).toBe(201);
    expect(result.data.sessionId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO desktop_monitor_sessions'),
      [result.data.sessionId, '42', 'desktop-monitor-v1'],
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
});
