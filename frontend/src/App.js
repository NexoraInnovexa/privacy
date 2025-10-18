import React, { useEffect, useState } from "react";
import axios from "axios";

const BACKEND_BASE_URL = "https://ilawdun.us/"; // ← replace this with your actual Vercel URL

function App() {
  const [osApps, setOsApps] = useState([]);
  const [browserExtensions, setBrowserExtensions] = useState([]);
  const [auditResults, setAuditResults] = useState(null);
  const [error, setError] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);

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

    // --- Browser extension scan
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
    console.log(`🌐 Attempting to contact backend at ${BACKEND_BASE_URL}/audit ...`);
    axios
      .get(`${BACKEND_BASE_URL}/audit`, { timeout: 5000 })
      .then((res) => {
        console.log("✅ Backend /audit response:", res.data);
        setAuditResults(res.data);
      })
      .catch((err) => {
        console.error("❌ Backend fetch failed:", err);
        setError("Failed to fetch audit data from backend.");
      });
  }, []);

  // --- Google login
  const loginGoogle = () => {
    console.log("🔗 Opening Google login popup...");
    window.open(`${BACKEND_BASE_URL}/login/google`, "_blank");
  };

  // --- AI analysis
  const analyzeRisks = async () => {
    console.log("🤖 Sending data for AI risk analysis...");
    setLoadingAI(true);
    setError(null);

    try {
      const res = await axios.post(`${BACKEND_BASE_URL}/analyze`, {
        os_apps: osApps,
        browser_extensions: browserExtensions,
        account_apps: auditResults?.connected_apps || [],
      });

      if (res.data && res.data.plain_language) {
        console.log("✅ AI analysis response:", res.data);
        setAuditResults((prev) => ({
          ...prev,
          ai_explanation: res.data.plain_language,
        }));
      } else {
        console.warn("⚠️ No AI explanation received:", res.data);
        setError("AI response was empty or malformed.");
      }
    } catch (err) {
      console.error("❌ AI analysis failed:", err);
      setError("Failed to generate AI risk explanation.");
    } finally {
      setLoadingAI(false);
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
        <button onClick={analyzeRisks} disabled={loadingAI}>
          {loadingAI ? "Analyzing..." : "Generate AI Risk Explanation"}
        </button>
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
