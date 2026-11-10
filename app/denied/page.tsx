import { SignOutButton } from '@clerk/nextjs';
import T from '@/components/T';

export default function Denied() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <h1 className="text-2xl font-extrabold"><T en="Access denied" hi="प्रवेश अस्वीकृत" /></h1>
      <p className="mt-2 text-slate-600 dark:text-slate-300">
        <T en="This area is only for the owner's email. Please log out and sign in with the owner email." hi="यह क्षेत्र केवल ओनर के ईमेल के लिए है। कृपया लॉग आउट करके ओनर ईमेल से लॉगिन करें।" />
      </p>
      <SignOutButton redirectUrl="/sign-in"><button className="btn mt-5">Logout</button></SignOutButton>
    </div>
  );
}
