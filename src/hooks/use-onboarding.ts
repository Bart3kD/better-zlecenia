import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authService } from '@/services/auth-service';
import { useRouter } from 'next/navigation';

export const useOnboardingStatus = () => {
  return useQuery({
    queryKey: ['onboarding-status'],
    queryFn: authService.checkOnboardingStatus,
    staleTime: 0,
    retry: false
  });
};

export const useCompleteOnboarding = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: authService.completeOnboarding,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-status'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      router.push('/dashboard');
    },
    onError: (error) => {
      console.error('Onboarding failed:', error);
    }
  });
};