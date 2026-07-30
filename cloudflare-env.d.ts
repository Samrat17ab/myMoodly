declare namespace Cloudflare {
  interface Env {
    DB: D1Database;
    SMTP_USERNAME?: string;
    GMAIL_APP_PASSWORD?: string;
    PUBLIC_APP_URL?: string;
    GOOGLE_CLIENT_ID?: string;
    GOOGLE_CLIENT_SECRET?: string;
  }
}
