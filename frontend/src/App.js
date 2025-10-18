import React, { useEffect, useState } from "react";
import axios from "axios";

function App() {
  const [osApps, setOsApps] = useState([]);
  const [browserExtensions, setBrowserExtensions] = useState([]);
  const [auditResults, setAuditResults] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log("🔍 App mounted. Starting system checks...");

    // --- Electron detection
    if (window.electronAPI && typeof window.electronAPI.scanOS === "function") {
      console.log("🖥️ Running in Electron — scanning OS...");
      window.electronAPI
        .scanOS()
        .then((apps) => {
          console.log("✅ OS apps scan result:", apps);
          setOsApps(apps);
        })
        .catch((err) => {
          console.error("❌ Error scanning OS:", err);
          setError("Error scanning OS: " + err.message);
        });
    } else {
      console.log("🌐 Running in Web — skipping OS scan.");
    }

    // --- Browser extension scan (Electron only)
    if (window.electronAPI && typeof window.electronAPI.scanBrowserExtensions === "function") {
      console.log("🔍 Scanning browser extensions...");
      window.electronAPI
        .scanBrowserExtensions()
        .then((exts) => {
          console.log("✅ Browser extensions scan result:", exts);
          setBrowserExtensions(exts);
        })
        .catch((err) => {
          console.error("❌ Error scanning extensions:", err);
          setError("Error scanning extensions: " + err.message);
        });
    } else {
      console.log("🌐 Skipping browser extension scan (web mode).");
    }

    // --- Backend connectivity test
    console.log("🌐 Attempting to contact backend at https://ilawdun.us/audit ...");
    axios
      .get("https://ilawdun.us/audit", {
        timeout: 5000, // 5s timeout
      })
      .then((res) => {
        console.log("✅ Backend /audit response:", res.data);
        setAuditResults(res.data);
      })
      .catch((err) => {
        console.error("❌ Backend fetch failed:");
        if (err.response) {
          console.error("📦 Response error:", err.response.status, err.response.data);
        } else if (err.request) {
          console.error("🌐 No response from backend:", err.request);
        } else {
          console.error("⚙️ Request setup error:", err.message);
        }
        setError("Failed to fetch audit data from backend.");
      });
  }, []);

  // --- Google login
  const loginGoogle = () => {
    console.log("🔗 Opening Google login popup...");
    window.open("http://localhost:8000/login/google", "_blank");
  };

  // --- AI analysis
  const analyzeRisks = async () => {
    console.log("🤖 Sending data for AI risk analysis...");
    try {
      const res = await axios.post("https://ilawdun.us/analyze", {
        os_apps: osApps,
        browser_extensions: browserExtensions,
        account_apps: auditResults?.connected_apps || [],
      });
      console.log("✅ AI analysis response:", res.data);
      setAuditResults((prev) => ({
        ...prev,
        ai_explanation: res.data.plain_language,
      }));
    } catch (err) {
      console.error("❌ AI analysis failed:", err);
      setError("Failed to generate AI risk explanation.");
    }
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial, sans-serif" }}>
      <h1>Privacy Audit Dashboard</h1>
      <p>Mode: {window.electronAPI ? "Electron" : "Web"}</p>

      {error && (
        <div style={{ color: "red", marginBottom: "1rem" }}>
          ⚠️ {error}
        </div>
      )}

      <h2>Installed Apps (OS Scan)</h2>
      {osApps.length > 0 ? (
        <ul>
          {osApps.map((app, idx) => (
            <li key={idx}>{app}</li>
          ))}
        </ul>
      ) : (
        <p>No OS data (web mode or scan incomplete).</p>
      )}

      <h2>Browser Extensions</h2>
      {browserExtensions.length > 0 ? (
        <ul>
          {browserExtensions.map((ext, idx) => (
            <li key={idx}>
              {ext.name} v{ext.version} — Permissions:{" "}
              {ext.permissions?.join(", ") || "None"}
            </li>
          ))}
        </ul>
      ) : (
        <p>No browser extension data (web mode).</p>
      )}

      <h2>Account/Browser Audit</h2>
      {auditResults ? (
        <pre>{JSON.stringify(auditResults, null, 2)}</pre>
      ) : (
        <p>Loading audit data...</p>
      )}

      <div style={{ marginTop: "1rem" }}>
        <button onClick={loginGoogle} style={{ marginRight: "1rem" }}>
          Connect Google Account
        </button>
        <button onClick={analyzeRisks}>Generate AI Risk Explanation</button>
      </div>

      {auditResults?.ai_explanation && (
        <div style={{ marginTop: "2rem" }}>
          <h2>AI Risk Explanation</h2>
          <p>{auditResults.ai_explanation}</p>
        </div>
      )}
    </div>
  );
}

export default App;
