'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Bookmark } from 'lucide-react';
import { savedOffersService } from '@/services/saved-offers-service';

// You can use any toast library you prefer
// import { toast } from 'sonner'; // for sonner
// import { useToast } from '@/components/ui/use-toast'; // for shadcn toast
// For now, we'll use a simple console.log, replace with your preferred toast

interface SaveOfferButtonProps {
  offerId: string;
  className?: string;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export function SaveOfferButton({ 
  offerId, 
  className = '',
  variant = 'ghost',
  size = 'sm',
  showText = false
}: SaveOfferButtonProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const queryClient = useQueryClient();

  // Check if offer is already saved on component mount
  useEffect(() => {
    const checkSavedStatus = async () => {
      try {
        const saved = await savedOffersService.isOfferSaved(offerId);
        setIsSaved(saved);
      } catch (error) {
        console.error('Error checking save status:', error);
      } finally {
        setIsChecking(false);
      }
    };

    checkSavedStatus();
  }, [offerId]);

  const toggleSaveMutation = useMutation({
    mutationFn: () => savedOffersService.toggleSave(offerId),
    onSuccess: (result) => {
      setIsSaved(result.isSaved);
      
      // Show toast notification - replace with your preferred toast library
      console.log(result.message);
      // toast.success(result.message); // uncomment when you have toast setup
      
      //
    }},)}