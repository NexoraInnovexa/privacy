import axios from "axios";

export default async function handler(req, res) {
  try {
    if (req.method === "POST") {
      const { os_apps = [], browser_extensions = [], account_apps = [] } = req.body;

      const findings = `Detected ${os_apps.length} apps, ${browser_extensions.length} browser extensions, and ${account_apps.length} connected account apps.`;
      const { data } = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          model: "mistralai/mistral-7b-instruct:free",
          messages: [{ role: "user", content: findings }],
          temperature: 0.6,
          max_tokens: 250,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      const text = data.choices?.[0]?.message?.content?.trim() || "No response.";
      res.status(200).json({
        findings,
        plain_language: text,
        risk_level: "Medium",
      });
    } else {
      const findings = "App X has camera access, App Y has location access, Chrome has 5 extensions";
      const { data } = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          model: "mistralai/mistral-7b-instruct:free",
          messages: [{ role: "user", content: findings }],
          temperature: 0.6,
          max_tokens: 250,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      const text = data.choices?.[0]?.message?.content?.trim() || "No response.";
      res.status(200).json({
        findings,
        plain_language: text,
        risk_level: "Medium",
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
