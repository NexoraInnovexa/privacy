const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { session } = require('electron');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  win.loadURL('http://localhost:3000'); // React dev server
}



// Function to list installed Chromium extensions in Electron
ipcMain.handle('scan-browser-extensions', async () => {
  const extensions = [];
  const extInfo = session.defaultSession.getAllExtensions();
  extInfo.forEach((ext) => {
    extensions.push({
      name: ext.name,
      version: ext.version,
      permissions: ext.manifest.permissions || [],
    });
  });
  return extensions;
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// IPC handler for scanning OS (example: list apps in Program Files)
ipcMain.handle('scan-os', async () => {
  const fs = require('fs');
  const programFiles = process.env['PROGRAMFILES'] || 'C:\\Program Files';
  const apps = fs.readdirSync(programFiles);
  return apps.slice(0, 50); // limit for MVP
});
