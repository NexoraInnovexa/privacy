// preload.js
const { contextBridge } = require("electron");
const { exec } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

// 🧠 Helper function to detect Chrome extension directory
function getChromeExtensionDir() {
  const platform = os.platform();

  if (platform === "win32") {
    return path.join(
      process.env.LOCALAPPDATA || "",
      "Google",
      "Chrome",
      "User Data",
      "Default",
      "Extensions"
    );
  } else if (platform === "darwin") {
    return path.join(
      os.homedir(),
      "Library",
      "Application Support",
      "Google",
      "Chrome",
      "Default",
      "Extensions"
    );
  } else if (platform === "linux") {
    return path.join(os.homedir(), ".config", "google-chrome", "Default", "Extensions");
  }

  return null;
}

// 🧩 Expose safe APIs to frontend
contextBridge.exposeInMainWorld("electronAPI", {
  // --- 🖥️ Scan Installed OS Apps
  scanOS: () => {
    return new Promise((resolve, reject) => {
      const platform = os.platform();

      if (platform === "win32") {
        exec("wmic product get name", { maxBuffer: 1024 * 1024 * 10 }, (err, stdout) => {
          if (err) return reject(err);
          const apps = stdout
            .split("\n")
            .slice(1)
            .map((line) => line.trim())
            .filter((line) => line.length > 0);
          resolve(apps);
        });
      } else if (platform === "darwin") {
        exec("ls /Applications", (err, stdout) => {
          if (err) return reject(err);
          resolve(stdout.split("\n").filter(Boolean));
        });
      } else if (platform === "linux") {
        exec("ls /usr/share/applications", (err, stdout) => {
          if (err) return reject(err);
          resolve(stdout.split("\n").filter(Boolean));
        });
      } else {
        reject(new Error("Unsupported OS for scanning"));
      }
    });
  },

  // --- 🌐 Scan Installed Chrome Extensions
  scanBrowserExtensions: () => {
    return new Promise((resolve) => {
      const extensions = [];
      const chromeExtDir = getChromeExtensionDir();

      if (!chromeExtDir || !fs.existsSync(chromeExtDir)) {
        console.warn("Chrome extensions folder not found.");
        return resolve([]);
      }

      try {
        const dirs = fs.readdirSync(chromeExtDir);
        dirs.forEach((extId) => {
          const versionDirs = fs.readdirSync(path.join(chromeExtDir, extId));
          const latestVersionDir = versionDirs.sort().pop();
          const manifestPath = path.join(chromeExtDir, extId, latestVersionDir, "manifest.json");

          if (fs.existsSync(manifestPath)) {
            const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
            extensions.push({
              name: manifest.name || extId,
              version: manifest.version || "",
              permissions: manifest.permissions || [],
            });
          }
        });
        resolve(extensions);
      } catch (err) {
        console.error("Error reading Chrome extensions:", err);
        resolve([]);
      }
    });
  },
});

console.log("✅ preload.js: electronAPI exposed successfully.");
