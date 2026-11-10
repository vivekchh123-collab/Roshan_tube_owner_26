import { requireOwner } from '@/lib/auth';
import { db } from '@/lib/supabase';
import { AdsEditor, AnnouncementEditor, CareersToggles, NotifySender, PlansEditor, Ad, Brand, Plan } from '@/components/EditSections';
import T from '@/components/T';

export const dynamic = 'force-dynamic';

export default async function Edit() {
  await requireOwner();
  const sb = db();
  const [{ data: settings }, { data: ads }, { data: brands }, { data: plans }] = await Promise.all([
    sb.from('settings').select('key,value'),
    sb.from('ads').select('id,image_url').order('sort').order('created_at'),
    sb.from('plan_brands').select('id,name,tag,note,image_url,coming_soon').order('sort'),
    sb.from('plans').select('*').order('sort'),
  ]);
  const get = (k: string) => settings?.find((s) => s.key === k)?.value;
  const ann = (get('announcement') as { en: string; hi: string }) ?? { en: '', hi: '' };
  return (
    <>
      <h1 className="text-2xl font-extrabold text-brand-navy dark:text-white"><T en="First website edit access" hi="पहली वेबसाइट एडिट एक्सेस" /></h1>
      <p className="text-sm text-slate-500"><T en="Everything you change here appears on the public website within about 30 seconds." hi="यहाँ किया गया हर बदलाव लगभग 30 सेकंड में पब्लिक वेबसाइट पर दिखेगा।" /></p>
      <NotifySender />
      <AnnouncementEditor en={ann.en} hi={ann.hi} />
      <AdsEditor ads={(ads ?? []) as Ad[]} />
      <CareersToggles technical={get('careers_technical') !== false} field={get('careers_field') !== false} />
      <PlansEditor brands={(brands ?? []) as Brand[]} plans={(plans ?? []) as Plan[]} />
    </>
  );
}
