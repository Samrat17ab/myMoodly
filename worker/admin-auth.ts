// Hardcoded on purpose, not a DB-editable role -- admin access should
// require a code change (and redeploy) to extend, not a row update.
export const ADMIN_EMAILS = [
  "lamsalsamrat831@gmail.com",
  "mymoodly.space@gmail.com",
];
const ADMIN_SET = new Set(ADMIN_EMAILS);

export function isAdminEmail(email: string) {
  return ADMIN_SET.has(email.trim().toLowerCase());
}
