'use client';

import { Control } from 'react-hook-form';
import { FormField, FormItem, FormControl, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, HandHeart, HelpCircle } from 'lucide-react';
import { CreateOfferData } from '@/schemas/offers.schemas';
import { OFFER_TYPE } from '@/types/offers.types';

interface OfferTypeSelectionProps {
  control: Control<CreateOfferData>;
}

export default function OfferTypeSelection({ control }: OfferTypeSelectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Offer Type
        </CardTitle>
      </CardHeader>
      <CardContent>
        <FormField
          control={control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <div className={`flex items-center space-x-2 border-2 rounded-lg p-4 transition-colors cursor-pointer hover:border-blue-300 ${
                    field.value === OFFER_TYPE.HELP_WANTED ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}>
                    <RadioGroupItem value={OFFER_TYPE.HELP_WANTED} id="help_wanted" />
                    <div className="flex-1">
                      <Label htmlFor="help_wanted" className="font-medium cursor-pointer flex items-center gap-2">
                        <HelpCircle className="h-4 w-4 text-blue-500" />
                        I need help
                      </Label>
                      <p className="text-sm text-gray-500 mt-1">Post a task you need help with</p>
                    </div>
                  </div>
                  <div className={`flex items-center space-x-2 border-2 rounded-lg p-4 transition-colors cursor-pointer hover:border-green-300 ${
                    field.value === OFFER_TYPE.OFFERING_HELP ? 'border-green-500 bg-green-50' : 'border-gray-200'
                  }`}>
                    <RadioGroupItem value={OFFER_TYPE.OFFERING_HELP} id="offering_help" />
                    <div className="flex-1">
                      <Label htmlFor="offering_help" className="font-medium cursor-pointer flex items-center gap-2">
                        <HandHeart className="h-4 w-4 text-green-500" />
                        I'm offering help
                      </Label>
                      <p className="text-sm text-gray-500 mt-1">Offer your services to others</p>
                    </div>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}