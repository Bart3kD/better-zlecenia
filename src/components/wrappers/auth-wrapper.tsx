'use client';
import { useOnboardingStatus } from '@/hooks/use-onboarding';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase/client';

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { data, isLoading } = useOnboardingStatus();
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      setAuthLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return;
        setSession(session);
        setAuthLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Redirect logic in useEffect
  useEffect(() => {
    if (authLoading || isLoading) return;

    if (pathname !== '/login' && !session) {
      router.push('/login');
    } else if (pathname !== '/login' && data?.needsOnboarding) {
      router.push('/onboarding');
    }
  }, [authLoading, isLoading, session, data, router, pathname]);

  // Don't block login page
  if (pathname === '/login') {
    return <>{children}</>;
  }

  // Show loading while checking auth or onboarding
  if (authLoading || isLoading || !session) {
    return <div>Loading...</div>;
  }

  return <>{children}</>;
}
