export default async function handler(req, res) {
  const auth_url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  auth_url.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID);
  auth_url.searchParams.set("response_type", "code");
  auth_url.searchParams.set("redirect_uri", process.env.REDIRECT_URI);
  auth_url.searchParams.set(
    "scope",
    "https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/drive.metadata.readonly"
  );

  res.redirect(auth_url.toString());
}
