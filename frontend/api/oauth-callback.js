import axios from "axios";

export default async function handler(req, res) {
  const code = req.query.code;
  if (!code) return res.status(400).json({ error: "Missing code" });

  try {
    const tokenRes = await axios.post("https://oauth2.googleapis.com/token", {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.REDIRECT_URI,
      grant_type: "authorization_code",
    });

    const access_token = tokenRes.data.access_token;
    const userRes = await axios.get("https://www.googleapis.com/oauth2/v1/userinfo", {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const user_info = userRes.data;
    const connected_apps = { "Drive Files Accessible": access_token ? "Yes" : "No" };

    res.status(200).json({ user_info, connected_apps });
  } catch (err) {
    console.error("OAuth Error:", err.response?.data || err.message);
    res.status(500).json({ error: err.message });
  }
}
