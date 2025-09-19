// components/OnboardingForm.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCompleteOnboarding } from '@/hooks/use-onboarding';
import { onboardingSchema, OnboardingData } from '@/schemas/onboarding.schemas';

// Shadcn/UI imports
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

// Icons
import { Eye, EyeOff, Lock, User, GraduationCap, ImageIcon, FileText, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';

export default function OnboardingForm() {
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const completeOnboarding = useCompleteOnboarding();

  const form = useForm<OnboardingData>({
    resolver: zodResolver(onboardingSchema),
    mode: 'onChange',
    defaultValues: {
      password: '',
      confirmPassword: '',
      full_name: '',
      bio: '',
      avatar_url: '',
      grade_level: undefined
    }
  });

  const { watch, trigger } = form;
  const watchedFields = watch();

  const totalSteps = 3;
  const progressValue = (step / totalSteps) * 100;

  const nextStep = async () => {
    let fieldsToValidate: (keyof OnboardingData)[] = [];
    
    if (step === 1) {
      fieldsToValidate = ['password', 'confirmPassword'];
    } else if (step === 2) {
      fieldsToValidate = ['full_name', 'grade_level'];
    }
    
    const isStepValid = await trigger(fieldsToValidate);
    if (isStepValid && step < totalSteps) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const onSubmit = (data: OnboardingData) => {
    completeOnboarding.mutate(data);
  };

  const steps = [
    { number: 1, title: 'Security', icon: Lock, description: 'Set your password' },
    { number: 2, title: 'Profile', icon: User, description: 'Basic information' },
    { number: 3, title: 'Personalize', icon: ImageIcon, description: 'Make it yours' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
              <GraduationCap className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Welcome to the Platform!</CardTitle>
          <CardDescription className="text-base">
            Let's set up your account to get you started
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">
                Step {step} of {totalSteps}
              </span>
              <Badge variant="secondary" className="text-xs">
                {Math.round(progressValue)}% Complete
              </Badge>
            </div>
            <Progress value={progressValue} className="h-2" />
          </div>

          {/* Step Indicators */}
          <div className="flex justify-between items-center">
            {steps.map((stepInfo, index) => {
              const StepIcon = stepInfo.icon;
              const isActive = step === stepInfo.number;
              const isCompleted = step > stepInfo.number;
              
              return (
                <div key={stepInfo.number} className="flex items-center">
                  <div className="flex flex-col items-center space-y-2">
                    <div className={`
                      flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all
                      ${isActive ? 'border-blue-500 bg-blue-50' : 
                        isCompleted ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-gray-50'}
                    `}>
                      {isCompleted ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <StepIcon className={`h-5 w-5 ${
                          isActive ? 'text-blue-600' : 'text-gray-400'
                        }`} />
                      )}
                    </div>
                    <div className="text-center">
                      <p className={`text-xs font-medium ${
                        isActive ? 'text-blue-600' : 
                        isCompleted ? 'text-green-600' : 'text-gray-400'
                      }`}>
                        {stepInfo.title}
                      </p>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-12 h-0.5 mx-2 ${
                      step > stepInfo.number ? 'bg-green-200' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>

          <Separator />

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Step 1: Password Setup */}
              {step === 1 && (
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <h3 className="text-lg font-semibold text-gray-900">Secure Your Account</h3>
                    <p className="text-sm text-gray-600">
                      Create a strong password to protect your account
                    </p>
                  </div>

                  <div className="grid gap-4">
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Enter your new password"
                                {...field}
                                className="pr-10"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormDescription>
                            Must contain uppercase, lowercase, and number
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type={showConfirmPassword ? 'text' : 'password'}
                                placeholder="Confirm your password"
                                {...field}
                                className="pr-10"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              >
                                {showConfirmPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Basic Information */}
              {step === 2 && (
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <h3 className="text-lg font-semibold text-gray-900">Tell Us About Yourself</h3>
                    <p className="text-sm text-gray-600">
                      Help us personalize your experience
                    </p>
                  </div>

                  <div className="grid gap-4">
                    <FormField
                      control={form.control}
                      name="full_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your full name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="grade_level"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Grade Level</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select your grade level" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="1">Grade 1</SelectItem>
                              <SelectItem value="2">Grade 2</SelectItem>
                              <SelectItem value="3">Grade 3</SelectItem>
                              <SelectItem value="4">Grade 4</SelectItem>
                              <SelectItem value="5">Grade 5</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Personalization */}
              {step === 3 && (
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <h3 className="text-lg font-semibold text-gray-900">Make It Yours</h3>
                    <p className="text-sm text-gray-600">
                      Add a personal touch to your profile (optional)
                    </p>
                  </div>

                  <div className="grid gap-4">
                    <FormField
                      control={form.control}
                      name="avatar_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Avatar URL (Optional)</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="https://example.com/your-avatar.jpg" 
                              {...field}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormDescription>
                            Add a link to your profile picture
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bio (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Tell us a bit about yourself, your interests, or what you're studying..."
                              rows={4}
                              {...field}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormDescription>
                            Share something interesting about yourself
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Error Alert */}
              {completeOnboarding.error && (
                <Alert variant="destructive">
                  <AlertDescription>
                    {completeOnboarding.error.message}
                  </AlertDescription>
                </Alert>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={step === 1}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>

                {step < totalSteps ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    className="flex items-center gap-2"
                  >
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={completeOnboarding.isPending}
                    className="flex items-center gap-2 min-w-[120px]"
                  >
                    {completeOnboarding.isPending ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Completing...
                      </>
                    ) : (
                      <>
                        Complete Setup
                        <CheckCircle className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}