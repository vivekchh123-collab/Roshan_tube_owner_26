import { createClerkClient } from '@clerk/nextjs/server';

/**
 * Invites an employee to the PUBLIC website's Clerk app by email (uses that app's secret key).
 * The database "allowed" flag is the real gate; the invite just gets them a sign-up link.
 */
export async function inviteEmployee(email: string): Promise<string> {
  const key = process.env.EMPLOYEE_CLERK_SECRET_KEY;
  if (!key) return 'Invite email not sent (EMPLOYEE_CLERK_SECRET_KEY missing). Ask the employee to sign up on the website.';
  try {
    const clerk = createClerkClient({ secretKey: key });
    await clerk.invitations.createInvitation({
      emailAddress: email,
      redirectUrl: `${process.env.PUBLIC_SITE_URL || ''}/sign-up`,
      ignoreExisting: true,
    });
    return 'Invitation email sent.';
  } catch (e) {
    return 'Allowed, but invitation email failed: ' + String((e as Error).message || e);
  }
}
