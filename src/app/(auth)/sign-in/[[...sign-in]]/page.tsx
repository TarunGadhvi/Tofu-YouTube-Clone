import { SignIn } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function Page({ searchParams }: PageProps) {
  const { userId } = await auth();
  const params = await searchParams;
  const redirectUrl = typeof params.redirect_url === 'string' ? params.redirect_url : '/studio';

  if (userId) {
    if (redirectUrl && !redirectUrl.includes('/sign-in')) {
      redirect(redirectUrl);
    }
    redirect('/studio');
  }

  return (
    <SignIn
      fallbackRedirectUrl={redirectUrl}
      forceRedirectUrl={redirectUrl}
    />
  );
}
