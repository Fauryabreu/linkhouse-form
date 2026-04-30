import { createHash, randomUUID } from 'crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';

function sha256(value: string): string {
  return createHash('sha256').update(value.toLowerCase().trim()).digest('hex');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, phone, score, objetivo, nombre, nacionalidad, fbc, fbp } = req.body as {
    email: string;
    phone: string;
    score: number;
    objetivo: string;
    nombre: string;
    nacionalidad: string;
    fbc?: string;
    fbp?: string;
  };

  const pixelId = process.env.META_PIXEL_ID;
  const token = process.env.META_CAPI_TOKEN;

  if (!pixelId || !token) {
    return res.status(500).json({ error: 'Missing META_PIXEL_ID or META_CAPI_TOKEN env vars' });
  }

  const clientIp =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ??
    req.socket.remoteAddress ??
    '';

  const clientUserAgent = (req.headers['user-agent'] as string) ?? '';

  const eventId = randomUUID();

  const userData: Record<string, unknown> = {
    em: [sha256(email ?? '')],
    ph: [sha256((phone ?? '').replace(/\D/g, ''))],
    client_ip_address: clientIp,
    client_user_agent: clientUserAgent,
  };

  if (fbc) userData['fbc'] = fbc;
  if (fbp) userData['fbp'] = fbp;

  const payload = {
    data: [
      {
        event_name: 'RegistroDeFormulario',
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        action_source: 'website',
        user_data: userData,
        custom_data: {
          lead_status: 'qualified',
          lead_score: score,
          service_interest: objetivo,
          form_name: 'linkhouse-offshore-prueba',
          nombre,
          nacionalidad,
        },
      },
    ],
  };

  try {
    const fbRes = await fetch(
      `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${token}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
    );

    const data = (await fbRes.json()) as Record<string, unknown>;
    return res.status(200).json({ success: true, event_id: eventId, fb_response: data });
  } catch (error) {
    return res.status(500).json({ success: false, error: String(error) });
  }
}
