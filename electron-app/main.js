// main.js
const { app, BrowserWindow, ipcMain, session } = require("electron");
const path = require("path");
const fs = require("fs");

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      sandbox: true,
    },
  });

  win.loadURL("http://localhost:3000"); // Dev
  // win.loadFile("index.html"); // Production

  win.webContents.openDevTools({ mode: "detach" });
}

app.whenReady().then(() => {
  createWindow();

  // ✅ Allow localhost CORS (for backend API)
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Access-Control-Allow-Origin": ["*"],
      },
    });
  });
});

// 🧩 Scan OS apps
ipcMain.handle("scan-os", async () => {
  try {
    const programFiles = process.env["PROGRAMFILES"] || "C:\\Program Files";
    const apps = fs.readdirSync(programFiles);
    return apps.slice(0, 50); // limit results
  } catch (err) {
    return [`Error scanning OS: ${err.message}`];
  }
});

// 🧩 Scan Chromium extensions
ipcMain.handle("scan-browser-extensions", async () => {
  try {
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
  } catch (err) {
    return [`Error scanning browser extensions: ${err.message}`];
  }
});

// 🧹 Close app cleanly
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
