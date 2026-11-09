const {
  app,
  BrowserWindow,
  desktopCapturer,
  dialog,
  ipcMain,
  screen,
  shell,
} = require('electron');
const fs = require('fs/promises');
const path = require('path');
const { pathToFileURL } = require('url');

const settingsPath = () => path.join(app.getPath('userData'), 'settings.json');
let settings = null;
let crmWindow = null;

function isAllowedCrmUrl(value) {
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol)
      && (url.protocol === 'https:' || ['localhost', '127.0.0.1'].includes(url.hostname));
  } catch {
    return false;
  }
}

async function loadSettings() {
  try {
    const savedSettings = JSON.parse(await fs.readFile(settingsPath(), 'utf8'));
    if (!isAllowedCrmUrl(savedSettings.crmUrl)) {
      throw new Error('Saved CRM URL is invalid. Remove the desktop settings file and configure the app again.');
    }
    return savedSettings;
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  if (process.env.CRM_DESKTOP_URL) {
    if (!isAllowedCrmUrl(process.env.CRM_DESKTOP_URL)) {
      throw new Error('CRM_DESKTOP_URL must be an HTTPS URL (HTTP is allowed only for localhost)');
    }
    return { crmUrl: process.env.CRM_DESKTOP_URL };
  }
  return null;
}

function isCrmSender(event) {
  if (!crmWindow || event.sender !== crmWindow.webContents || !settings) return false;
  try {
    return new URL(event.senderFrame.url).origin === new URL(settings.crmUrl).origin;
  } catch {
    return false;
  }
}

async function saveSettings(event, crmUrl) {
  if (event.senderFrame.url !== pathToFileURL(path.join(__dirname, 'setup.html')).href) {
    throw new Error('Settings can only be changed from the setup screen');
  }
  if (!isAllowedCrmUrl(crmUrl)) {
    throw new Error('Enter a valid HTTPS CRM URL (HTTP is allowed only for localhost)');
  }
  settings = { crmUrl: new URL(crmUrl).toString() };
  await fs.mkdir(app.getPath('userData'), { recursive: true });
  await fs.writeFile(settingsPath(), JSON.stringify(settings, null, 2), { mode: 0o600 });
  await openCrmWindow();
  return true;
}

function openSetupWindow() {
  const setupWindow = new BrowserWindow({
    width: 520,
    height: 360,
    resizable: false,
    title: 'Digious CRM Desktop setup',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  setupWindow.loadFile(path.join(__dirname, 'setup.html'));
}

async function openCrmWindow() {
  if (crmWindow && !crmWindow.isDestroyed()) {
    crmWindow.focus();
    return;
  }

  crmWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 900,
    minHeight: 640,
    show: true,
    title: 'Digious CRM Desktop',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  crmWindow.webContents.setWindowOpenHandler(({ url }) => {
    try {
      const target = new URL(url);
      if (['https:', 'http:'].includes(target.protocol)) {
        shell.openExternal(target.toString());
      }
    } catch (error) {
      console.error('Blocked invalid external link:', error.message);
    }
    return { action: 'deny' };
  });

  crmWindow.on('closed', () => {
    crmWindow = null;
  });

  try {
    await crmWindow.loadURL(settings.crmUrl);
  } catch (error) {
    console.error('Could not open CRM URL:', error);
    dialog.showErrorBox('Could not open Digious CRM', `Check the configured CRM URL.\n\n${error.message}`);
    crmWindow.webContents.loadURL('about:blank');
  }
}

ipcMain.handle('desktop-monitor:state', (event) => {
  if (!isCrmSender(event)) throw new Error('Monitoring is available only in the CRM window');
  const { powerMonitor } = require('electron');
  return {
    idleSeconds: powerMonitor.getSystemIdleTime(),
    isFocused: crmWindow.isFocused() && crmWindow.isVisible() && !crmWindow.isMinimized(),
  };
});

ipcMain.handle('desktop-monitor:capture', async (event) => {
  if (!isCrmSender(event)) throw new Error('Screenshot capture is available only in the CRM window');
  if (!crmWindow.isFocused() || !crmWindow.isVisible() || crmWindow.isMinimized()) return null;

  const primaryDisplayId = String(screen.getPrimaryDisplay().id);
  const sources = await desktopCapturer.getSources({
    types: ['screen'],
    thumbnailSize: { width: 1280, height: 720 },
  });
  const primaryDisplay = sources.find((source) => source.display_id === primaryDisplayId);
  if (!primaryDisplay) {
    throw new Error('Could not access the primary display for screenshot capture.');
  }

  const image = primaryDisplay.thumbnail;
  if (image.isEmpty()) return null;
  const size = image.getSize();
  const resized = size.width > 1280
    ? image.resize({ width: 1280, quality: 'good' })
    : image;
  return resized.toJPEG(55).toString('base64');
});

ipcMain.handle('desktop-monitor:save-settings', saveSettings);

app.whenReady().then(async () => {
  try {
    settings = await loadSettings();
    if (settings) await openCrmWindow();
    else openSetupWindow();
  } catch (error) {
    console.error('Desktop monitor setup failed:', error);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  app.quit();
});
