import { sendWhatsApp } from './whatsapp';

// Free owner alert via Telegram bot. The paid WhatsApp Cloud API is used only if WHATSAPP_TOKEN is set.
export async function notifyOwner(subject: string, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN, chat = process.env.TELEGRAM_CHAT_ID;
  let tg = false;
  if (token && chat) {
    try {
      const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ chat_id: chat, text: `${subject}\n\n${text}`.slice(0, 4000), disable_web_page_preview: true }),
      });
      tg = r.ok;
    } catch {}
  }
  let wa = false;
  if (process.env.WHATSAPP_TOKEN) wa = (await sendWhatsApp(process.env.OWNER_WHATSAPP || '917376721717', text)).ok;
  return { ok: tg || wa, telegram: tg, whatsapp: wa };
}
