import webpush from 'web-push';
import { db } from './supabase';

/** Sends a phone notification to everyone who enabled alerts on the public website. */
export async function pushToAll(title: string, body: string) {
  const pub = process.env.VAPID_PUBLIC_KEY, priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return { sent: 0, failed: 0, skipped: true };
  webpush.setVapidDetails(`mailto:${process.env.OWNER_EMAIL || 'roshantubessolar@gmail.com'}`, pub, priv);
  const sb = db();
  const { data: subs } = await sb.from('push_subscriptions').select('*');
  let sent = 0, failed = 0;
  const payload = JSON.stringify({ title, body, url: '/' });
  await Promise.all(
    (subs ?? []).map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload);
        sent++;
      } catch (e) {
        failed++;
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) await sb.from('push_subscriptions').delete().eq('id', s.id);
      }
    })
  );
  return { sent, failed, skipped: false };
}
