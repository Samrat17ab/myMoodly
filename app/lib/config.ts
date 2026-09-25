// Google-only at launch: this Gmail account can't reliably deliver OTP
// codes at any real signup volume. The email/OTP flow itself is untouched
// (still fully wired on the client and server) -- flip this back to true to
// bring it back once delivery is on real infrastructure.
export const EMAIL_SIGNIN_ENABLED = false;
