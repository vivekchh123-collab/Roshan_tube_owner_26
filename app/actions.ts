'use server';
import { revalidatePath } from 'next/cache';
import { randomUUID } from 'crypto';
import { assertOwner } from '@/lib/auth';
import { db } from '@/lib/supabase';
import { progress, Checklist, Product } from '@/lib/progress';
import { inviteEmployee } from '@/lib/clerkEmployee';
import { pushToAll } from '@/lib/push';

const digits = (s: string) => s.replace(/\D/g, '');

// ---------- Customers ----------
export async function addCustomer(name: string, mobile: string) {
  await assertOwner();
  const m = digits(mobile);
  if (!name.trim() || m.length !== 10) return { ok: false, error: 'Enter a name and a 10-digit mobile number.' };
  const { error } = await db().from('customers').insert({ name: name.trim().slice(0, 100), mobile: m, status: 'pending' });
  if (error) return { ok: false, error: error.message };
  revalidatePath('/');
  return { ok: true };
}

/** Saves checklist + products. 100% moves the customer to "completed"; unticking moves them back to pending. */
export async function saveCustomer(id: string, checklist: Checklist, products: Product[]) {
  await assertOwner();
  const clean = products
    .map((p) => ({ id: p.id || randomUUID(), name: p.name.trim().slice(0, 120), serial: p.serial.trim().slice(0, 120) }))
    .filter((p) => p.name || p.serial);
  const { pct } = progress(checklist, clean);
  const status = pct === 100 ? 'completed' : 'pending';
  const { error } = await db()
    .from('customers')
    .update({ checklist, products: clean, status, completed_at: status === 'completed' ? new Date().toISOString() : null })
    .eq('id', id)
    .neq('status', 'not_interested');
  if (error) return { ok: false, error: error.message, status: 'pending', pct, products: clean };
  revalidatePath('/'); revalidatePath('/completed');
  return { ok: true, status, pct, products: clean };
}

export async function deleteCustomer(id: string) {
  await assertOwner();
  await db().from('customers').delete().eq('id', id);
  revalidatePath('/'); revalidatePath('/completed'); revalidatePath('/not-interested');
}

// ---------- Employees ----------
export async function addEmployee(name: string, mobile: string, email: string) {
  await assertOwner();
  const m = digits(mobile), e = email.trim().toLowerCase();
  if (!name.trim() || m.length !== 10 || !/^\S+@\S+\.\S+$/.test(e)) return { ok: false, error: 'Enter name, 10-digit mobile and a valid email.' };
  const { error } = await db().from('employees').upsert(
    { name: name.trim().slice(0, 100), mobile: m, email: e, status: 'active', allowed: true },
    { onConflict: 'email' }
  );
  if (error) return { ok: false, error: error.message };
  const note = await inviteEmployee(e);
  revalidatePath('/employees');
  return { ok: true, note };
}

export async function approveEmployee(id: string) {
  await assertOwner();
  const sb = db();
  const { data } = await sb.from('employees').update({ status: 'active', allowed: true }).eq('id', id).select('email').single();
  const note = data?.email ? await inviteEmployee(data.email) : '';
  revalidatePath('/employees');
  return { ok: true, note };
}

export async function updateEmployee(id: string, name: string, mobile: string) {
  await assertOwner();
  const m = digits(mobile);
  if (!name.trim() || m.length !== 10) return { ok: false, error: 'Enter name and 10-digit mobile.' };
  await db().from('employees').update({ name: name.trim(), mobile: m }).eq('id', id);
  revalidatePath('/employees');
  return { ok: true };
}

/** Deleting removes the employee row => they can no longer open the Customer Detail page. */
export async function removeEmployee(id: string) {
  await assertOwner();
  await db().from('employees').delete().eq('id', id);
  revalidatePath('/employees');
}

// ---------- Verification issues ----------
export async function resolveIssue(id: string) {
  await assertOwner();
  await db().from('verification_issues').delete().eq('id', id);
  revalidatePath('/verify');
}

// ---------- Website 1 content ----------
export async function saveAnnouncement(en: string, hi: string) {
  await assertOwner();
  await db().from('settings').upsert({ key: 'announcement', value: { en: en.trim().slice(0, 300), hi: hi.trim().slice(0, 300) } });
  revalidatePath('/edit');
  return { ok: true };
}

export async function setCareers(key: 'careers_technical' | 'careers_field', on: boolean) {
  await assertOwner();
  await db().from('settings').upsert({ key, value: on });
  revalidatePath('/edit');
  return { ok: true };
}

async function uploadSiteImage(fd: FormData, folder: string) {
  const f = fd.get('file');
  if (!(f instanceof File) || f.size === 0 || !f.type.startsWith('image/')) throw new Error('Choose an image');
  if (f.size > 3.5 * 1024 * 1024) throw new Error('Image too large (max 3.5 MB)');
  const path = `${folder}/${randomUUID()}.jpg`;
  const sb = db();
  const { error } = await sb.storage.from('site').upload(path, Buffer.from(await f.arrayBuffer()), { contentType: f.type });
  if (error) throw new Error(error.message);
  return sb.storage.from('site').getPublicUrl(path).data.publicUrl;
}

export async function addAd(fd: FormData) {
  await assertOwner();
  try {
    const url = await uploadSiteImage(fd, 'ads');
    await db().from('ads').insert({ image_url: url, sort: Date.now() % 1000000 });
    revalidatePath('/edit');
    return { ok: true };
  } catch (e) { return { ok: false, error: (e as Error).message }; }
}

export async function deleteAd(id: string) {
  await assertOwner();
  await db().from('ads').delete().eq('id', id);
  revalidatePath('/edit');
}

export async function addBrand(name: string, tag: string) {
  await assertOwner();
  if (!name.trim()) return { ok: false, error: 'Enter brand name' };
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Math.random().toString(36).slice(2, 5);
  await db().from('plan_brands').insert({ slug, name: name.trim(), tag: tag.trim() || null, sort: 99 });
  revalidatePath('/edit');
  return { ok: true };
}

export async function saveBrand(b: { id: string; name: string; tag: string; note: string; coming_soon: boolean }) {
  await assertOwner();
  await db().from('plan_brands').update({ name: b.name.trim(), tag: b.tag.trim() || null, note: b.note.trim() || null, coming_soon: b.coming_soon }).eq('id', b.id);
  revalidatePath('/edit');
  return { ok: true };
}

export async function setBrandImage(id: string, fd: FormData) {
  await assertOwner();
  try {
    const url = await uploadSiteImage(fd, 'brands');
    await db().from('plan_brands').update({ image_url: url }).eq('id', id);
    revalidatePath('/edit');
    return { ok: true };
  } catch (e) { return { ok: false, error: (e as Error).message }; }
}

export async function deleteBrand(id: string) {
  await assertOwner();
  await db().from('plan_brands').delete().eq('id', id);
  revalidatePath('/edit');
}

type PlanInput = {
  id?: string; brand_id: string; category: 'on-grid' | 'hybrid'; title: string; details: string;
  total_cost: number | null; subsidy: number; net_cost: number | null; per_kw_price: number | null; sort: number;
};
export async function savePlan(p: PlanInput) {
  await assertOwner();
  if (!p.title.trim()) return { ok: false, error: 'Enter a title' };
  const num = (n: number | null) => (n == null || Number.isNaN(n) ? null : Math.max(0, Math.round(n)));
  const total = num(p.total_cost), subsidy = num(p.subsidy) ?? 0;
  const net = num(p.net_cost) ?? (total != null ? Math.max(0, total - subsidy) : null);
  const row = { brand_id: p.brand_id, category: p.category, title: p.title.trim(), details: p.details.trim(), total_cost: total, subsidy, net_cost: net, per_kw_price: num(p.per_kw_price), sort: p.sort || 0 };
  const sb = db();
  const { error } = p.id ? await sb.from('plans').update(row).eq('id', p.id) : await sb.from('plans').insert(row);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/edit');
  return { ok: true };
}

export async function deletePlan(id: string) {
  await assertOwner();
  await db().from('plans').delete().eq('id', id);
  revalidatePath('/edit');
}

// ---------- Notifications (bell on website 1 + phone push) ----------
export async function sendNotification(title: string, body: string) {
  await assertOwner();
  if (!title.trim() || !body.trim()) return { ok: false, error: 'Enter title and message.' };
  await db().from('notifications').insert({ title: title.trim().slice(0, 100), body: body.trim().slice(0, 500) });
  const r = await pushToAll(title.trim(), body.trim());
  return { ok: true, ...r };
}
