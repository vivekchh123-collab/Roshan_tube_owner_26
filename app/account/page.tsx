import { UserProfile } from '@clerk/nextjs';
import { requireOwner } from '@/lib/auth';

// Change the owner password here. If the password is forgotten, use "Forgot password?" on the sign-in
// screen: Clerk emails a reset code to the owner's Gmail.
export default async function Account() {
  await requireOwner();
  return <div className="flex justify-center"><UserProfile routing="hash" /></div>;
}
