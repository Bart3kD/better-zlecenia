'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface SubmitButtonProps {
  isPending: boolean;
}

export default function SubmitButton({ isPending }: SubmitButtonProps) {
  return (
    <Card className="border-green-200 bg-green-50">
      <CardContent className="pt-6">
        <Button 
          type="submit" 
          disabled={isPending} 
          className="w-full bg-green-600 hover:bg-green-700"
          size="lg"
        >
          {isPending ? 'Creating Offer...' : 'Create Offer'}
        </Button>
        <p className="text-xs text-center text-gray-500 mt-2">
          Your offer will be visible to all users
        </p>
      </CardContent>
    </Card>
  );
}