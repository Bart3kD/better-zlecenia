'use client';

import { Control } from 'react-hook-form';
import { format } from 'date-fns';
import { FormField, FormItem, FormControl, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CreateOfferData } from '@/schemas/offers.schemas';

interface DeadlinePickerProps {
  control: Control<CreateOfferData>;
}

export default function DeadlinePicker({ control }: DeadlinePickerProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Deadline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <FormField
          control={control}
          name="deadline"
          render={({ field }) => (
            <FormItem>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(new Date(field.value), "PPP")
                      ) : (
                        <span>Pick a deadline</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value ? new Date(field.value) : undefined}
                    onSelect={(date) => {
                      field.onChange(date ? date.toISOString() : null);
                    }}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <p className="text-xs text-gray-500 mt-1">
                Optional - when do you need this completed?
              </p>
              {field.value && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => field.onChange(null)}
                  className="mt-1 h-auto p-1 text-xs"
                >
                  Clear deadline
                </Button>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}