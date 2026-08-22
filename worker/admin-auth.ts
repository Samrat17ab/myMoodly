// Hardcoded on purpose, not a DB-editable role -- admin access should
// require a code change (and redeploy) to extend, not a row update.
const ADMIN_EMAILS = new Set([
  "lamsalsamrat831@gmail.com",
  "mymoodly.space@gmail.com",
]);

export function isAdminEmail(email: string) {
  return ADMIN_EMAILS.has(email.trim().toLowerCase());
}
