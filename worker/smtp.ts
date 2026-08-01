import { connect } from "cloudflare:sockets";

export interface SmtpEnv {
  SMTP_USERNAME?: string;
  GMAIL_APP_PASSWORD?: string;
}

type SmtpReply = {
  code: number;
  lines: string[];
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function dotStuff(value: string) {
  return value
    .replace(/\r?\n/g, "\r\n")
    .split("\r\n")
    .map((line) => (line.startsWith(".") ? `.${line}` : line))
    .join("\r\n");
}

function base64Ascii(value: string) {
  return btoa(value);
}

export async function sendOtpEmail(
  env: SmtpEnv,
  recipient: string,
  code: string,
) {
  const username = env.SMTP_USERNAME?.trim().toLowerCase();
  const password = env.GMAIL_APP_PASSWORD?.replace(/[^a-zA-Z0-9]/g, "");
  if (!username || !password) {
    throw new Error("Email sign-in is not configured.");
  }
  if (password.length !== 16) {
    throw new Error("The Gmail app password is not a valid 16-character credential.");
  }

  const socket = connect(
    { hostname: "smtp.gmail.com", port: 465 },
    { secureTransport: "on", allowHalfOpen: false },
  );
  await socket.opened;

  const reader = socket.readable.getReader();
  const writer = socket.writable.getWriter();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffered = "";

  const readReply = async (): Promise<SmtpReply> => {
    const lines: string[] = [];
    while (true) {
      const newline = buffered.indexOf("\n");
      if (newline >= 0) {
        const line = buffered.slice(0, newline + 1).replace(/\r?\n$/, "");
        buffered = buffered.slice(newline + 1);
        lines.push(line);
        if (/^\d{3} /.test(line)) {
          return { code: Number(line.slice(0, 3)), lines };
        }
        continue;
      }

      const chunk = await reader.read();
      if (chunk.done) throw new Error("SMTP connection closed unexpectedly.");
      buffered += decoder.decode(chunk.value, { stream: true });
    }
  };

  const expect = async (allowed: number[]) => {
    const reply = await readReply();
    if (!allowed.includes(reply.code)) {
      throw new Error(`SMTP rejected the request (${reply.code}).`);
    }
    return reply;
  };

  const command = async (value: string, allowed: number[]) => {
    await writer.write(encoder.encode(`${value}\r\n`));
    return expect(allowed);
  };

  const safeRecipient = escapeHtml(recipient);
  const safeCode = escapeHtml(code);
  const messageId = crypto.randomUUID();
  const html = [
    "<!doctype html><html><body style=\"font-family:Arial,sans-serif;color:#18251f;line-height:1.6\">",
    "<div style=\"max-width:560px;margin:32px auto;padding:32px;border:1px solid #dbe8e0;border-radius:18px\">",
    "<h1 style=\"margin:0 0 16px;color:#214f3b\">Sign in to Moodly</h1>",
    `<p>Use the code below to sign in as ${safeRecipient}.</p>`,
    `<p style=\"margin:28px 0;font-size:32px;font-weight:700;letter-spacing:8px;color:#214f3b\">${safeCode}</p>`,
    `<p style=\"font-size:13px;color:#5d7067\">This code expires in 10 minutes and can be used once. If you did not request it, you can ignore this email.</p>`,
    "</div></body></html>",
  ].join("\r\n");
  const headersAndBody = [
    `From: Moodly <${username}>`,
    `To: ${recipient}`,
    "Subject: Your Moodly sign-in code",
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: <${messageId}@moodly>`,
    "MIME-Version: 1.0",
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    html,
  ].join("\r\n");

  try {
    await expect([220]);
    await command("EHLO moodly", [250]);
    await command("AUTH LOGIN", [334]);
    await command(base64Ascii(username), [334]);
    await command(base64Ascii(password), [235]);
    await command(`MAIL FROM:<${username}>`, [250]);
    await command(`RCPT TO:<${recipient}>`, [250, 251]);
    await command("DATA", [354]);
    await writer.write(
      encoder.encode(`${dotStuff(headersAndBody)}\r\n.\r\n`),
    );
    await expect([250]);
    await command("QUIT", [221]);
  } finally {
    reader.releaseLock();
    writer.releaseLock();
    await socket.close().catch(() => undefined);
  }
}
