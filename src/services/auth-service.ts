import { supabase } from '@/utils/supabase/client';
import { OnboardingData } from '@/schemas/onboarding.schemas';

export const authService = {
  checkOnboardingStatus: async () => {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('Not authenticated');

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, grade_level, bio')
      .eq('id', user.id)
      .single();

    if (profileError) throw profileError;

    const needsOnboarding = !profile.full_name || !profile.grade_level;
    
    return {
      user,
      profile,
      needsOnboarding
    };
  },

  completeOnboarding: async (data: OnboardingData) => {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('Not authenticated');

    // Update password
    const { error: passwordError } = await supabase.auth.updateUser({
      password: data.password
    });
    if (passwordError) throw passwordError;

    // Update profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: data.full_name,
        bio: data.bio || null,
        avatar_url: data.avatar_url || null,
        grade_level: parseInt(data.grade_level),
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select()
      .single();

    if (profileError) throw profileError;

    return profile;
  }
};