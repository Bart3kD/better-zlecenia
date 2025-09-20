'use client';

import { Control } from 'react-hook-form';
import { FormField, FormItem, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign } from 'lucide-react';
import { CreateOfferData } from '@/schemas/offers.schemas';

interface PriceInputProps {
  control: Control<CreateOfferData>;
}

export default function PriceInput({ control }: PriceInputProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Price
        </CardTitle>
      </CardHeader>
      <CardContent>
        <FormField
          control={control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="99999.99"
                    placeholder="0.00"
                    className="pl-10 text-lg font-semibold"
                    {...field}
                    value={field.value || ''}
                    onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                  />
                </div>
              </FormControl>
              <p className="text-xs text-gray-500 mt-1">
                Set to $0 for free help
              </p>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}