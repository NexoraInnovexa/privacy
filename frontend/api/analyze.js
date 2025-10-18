import axios from "axios";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { os_apps = [], browser_extensions = [], account_apps = [] } = req.body;

  const summaryText = `
OS Apps: ${os_apps.slice(0, 10).join(", ")}
Browser Extensions: ${browser_extensions.slice(0, 5).join(", ")}
Connected Apps: ${account_apps.join(", ")}
Explain privacy and security risks in simple terms.
  `;

  try {
    const { data } = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "mistralai/mistral-7b-instruct:free",
        messages: [{ role: "user", content: summaryText }],
        temperature: 0.6,
        max_tokens: 300,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const text = data.choices?.[0]?.message?.content?.trim() || "No response.";
    res.status(200).json({ plain_language: text });
  } catch (err) {
    res.status(500).json({
      error: err.response?.data || err.message,
    });
  }
}
