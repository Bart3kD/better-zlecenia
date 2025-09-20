'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createOfferSchema, CreateOfferData } from '@/schemas/offers.schemas';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { offersService, CreateOfferWithPoster } from '@/services/offers-service';
import { Form } from '@/components/ui/form';
import { OFFER_TYPE } from '@/types/offers.types';
import { supabase } from '@/utils/supabase/client';

// Import our components
import OfferTypeSelection from '@/components/create-offer/type-select';
import BasicInformation from '@/components/create-offer/basic-information';
import AdditionalDetails from '@/components/create-offer/additional-details';
import PriceInput from '@/components/create-offer/price-input';
import DeadlinePicker from '@/components/create-offer/deadline-picker';
import SubmitButton from '@/components/create-offer/submit-button';

export default function CreateOfferPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const form = useForm<CreateOfferData>({
    resolver: zodResolver(createOfferSchema),
    defaultValues: {
      title: '',
      description: '',
      price: 0,
      category_id: '',
      type: OFFER_TYPE.HELP_WANTED,
      deadline: null,
      requirements: '',
      tags: [],
    }
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: CreateOfferWithPoster) => offersService.createOffer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offers'] });
      router.push('/dashboard');
    },
    onError: (err) => {
      console.error('Failed to create offer:', err);
    }
  });

  const onSubmit = async (data: CreateOfferData) => {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error || !session?.user) {
      console.error('User not logged in', error);
      return;
    }

    const cleanData: CreateOfferWithPoster = {
      ...data,
      poster_id: session.user.id,
      deadline: data.deadline || null,
      requirements: data.requirements || null,
      tags: data.tags && data.tags.length > 0 ? data.tags : null,
    };

    mutate(cleanData);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Offer</h1>
        <p className="text-gray-600">Fill out the details below to create your offer</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <OfferTypeSelection control={form.control} />
              <BasicInformation control={form.control} />
              <AdditionalDetails control={form.control} />
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <PriceInput control={form.control} />
              <DeadlinePicker control={form.control} />
              <SubmitButton isPending={isPending} />
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}