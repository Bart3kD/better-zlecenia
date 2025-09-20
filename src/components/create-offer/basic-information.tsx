'use client';

import { Control } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/utils/supabase/client';
import { CreateOfferData } from '@/schemas/offers.schemas';
import { renderIcon } from '@/utils/icon-mapping';

interface BasicInformationProps {
  control: Control<CreateOfferData>;
}

interface Category {
  id: string;
  name: string;
  icon: string;
}

export default function BasicInformation({ control }: BasicInformationProps) {
  // Fetch categories
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Category[];
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Basic Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title *</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Enter a clear, descriptive title..." 
                  {...field}
                  className="text-lg"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="category_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category">
                      {field.value && categories && (() => {
                        const selectedCategory = categories.find(cat => cat.id === field.value);
                        if (selectedCategory) {
                          return (
                            <div className="flex items-center gap-2">
                              {renderIcon(selectedCategory.icon, "h-4 w-4 text-gray-500")}
                              <span>{selectedCategory.name}</span>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </SelectValue>
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="max-h-[300px] overflow-y-auto">
                  {categoriesLoading ? (
                    <SelectItem value="loading" disabled>
                      Loading categories...
                    </SelectItem>
                  ) : (
                    categories?.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center gap-2">
                          {renderIcon(category.icon, "h-4 w-4 text-gray-500")}
                          <span>{category.name}</span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description *</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Provide detailed information about your offer. Include what's involved, any specific requirements, and what you expect..."
                  className="min-h-[120px]"
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <div className="text-xs text-gray-500 mt-1">
                {field.value?.length || 0}/2000 characters
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}