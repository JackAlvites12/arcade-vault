import { Resend } from "resend";

interface ContactPayload {
  name: string;
  email: string;
  message: string;
  honeypot: string;
}

interface ContactResponse {
  ok: boolean;
  error?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FROM = "Arcade Vault <onboarding@resend.dev>";

function json(body: ContactResponse, status: number) {
  return Response.json(body, { status });
}

export async function POST(request: Request) {
  let payload: Partial<ContactPayload>;
  try {
    payload = await request.json();
  } catch {
    return json({ ok: false, error: "Payload inválido." }, 400);
  }

  const name = (payload.name ?? "").trim();
  const email = (payload.email ?? "").trim();
  const message = (payload.message ?? "").trim();
  const honeypot = payload.honeypot ?? "";

  if (honeypot) {
    return json({ ok: true }, 200);
  }

  if (!name || !email || !message || !EMAIL_RE.test(email)) {
    return json({ ok: false, error: "Datos inválidos." }, 400);
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const toTeam = process.env.CONTACT_TO_EMAIL;

  if (!toTeam) {
    return json({ ok: false, error: "Falta configuración del servidor." }, 500);
  }

  const emails = [
    {
      from: FROM,
      to: toTeam,
      replyTo: email,
      subject: `Nuevo mensaje de contacto — ${name}`,
      text: `Nombre: ${name}\nCorreo: ${email}\n\n${message}`,
    },
    {
      from: FROM,
      to: email,
      subject: "Recibimos tu mensaje — Arcade Vault",
      text: `Hola ${name},\n\nGracias por escribirnos. Recibimos tu mensaje y te responderemos en 24-48 horas.\n\nTu mensaje:\n${message}\n\n— Arcade Vault`,
    },
  ];

  try {
    for (const mail of emails) {
      const { error } = await resend.emails.send(mail);
      if (error) {
        return json({ ok: false, error: "Fallo al enviar el mensaje." }, 500);
      }
    }
  } catch {
    return json({ ok: false, error: "Fallo al enviar el mensaje." }, 500);
  }

  return json({ ok: true }, 200);
}
