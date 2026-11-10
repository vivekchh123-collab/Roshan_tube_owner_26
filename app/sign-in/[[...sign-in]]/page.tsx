import { SignIn } from '@clerk/nextjs';

// Owner sign-in only. Sign-up is disabled in the Clerk dashboard; the owner account is created once.
export default function Page() {
  return <div className="flex justify-center py-6"><SignIn /></div>;
}
