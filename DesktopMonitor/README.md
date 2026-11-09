# Digious CRM Desktop

The Windows desktop companion opens the CRM in a dedicated, visible Electron window. With fresh, explicit consent, it captures the primary display; other visible applications or windows may appear in those screenshots.

## Monitoring behavior

- Monitoring is off by default and requires an explicit in-app consent checkbox. The full-display consent is separate from the earlier CRM-window-only consent.
- A persistent in-window status panel lets the signed-in user pause or withdraw consent.
- System-wide keyboard/mouse inactivity is checked every 15 seconds; 3 minutes without input is recorded as idle.
- One JPEG of the primary display is uploaded every 15 minutes only while the user is active and the CRM window is focused and visible.
- Screenshots may include any other applications or windows visible on the primary display. The employee must accept the updated consent before capture starts.
- The employee picker and screenshot/activity viewer are available to Admin/Super Admin, HR, and Operations Managers through authenticated routes.
- Screenshots are uploaded separately from normal CRM API calls, with bounded retries.
- The backend keeps screenshots outside its public `/uploads` directory. Access requires an authenticated API request.
- Screenshots, idle events, and session records are automatically deleted after 30 days by default; set `DESKTOP_MONITOR_RETENTION_DAYS` to a value from 1 to 3650 to change this.
- The installer does not run hidden, start at login, or continue monitoring after its window is closed.

## Setup and packaging

1. Apply `Backend/migrations/create_desktop_monitor_tables.sql` to the CRM database.
2. Deploy the backend and CRM frontend with the desktop-monitor API route enabled.
3. From this directory run `npm install`, then `npm start` for local development.
4. Run `npm run dist` on Windows to create an NSIS installer under `dist/`.
5. On first launch enter the CRM HTTPS URL. The user signs in normally inside the CRM window.

The frontend's `REACT_APP_API_URL` must point to the deployed backend. For local development, set `CRM_DESKTOP_URL=http://localhost:3000` before starting Electron.
