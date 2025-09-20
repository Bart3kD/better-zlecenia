'use client';

import { Control } from 'react-hook-form';
import { useState } from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, X, Tag } from 'lucide-react';
import { CreateOfferData } from '@/schemas/offers.schemas';

interface AdditionalDetailsProps {
  control: Control<CreateOfferData>;
}

export default function AdditionalDetails({ control }: AdditionalDetailsProps) {
  const [tagInput, setTagInput] = useState('');

  const addTag = (setValue: (value: string[]) => void, currentTags: string[]) => {
    const trimmedTag = tagInput.trim().toLowerCase();
    
    if (trimmedTag && !currentTags.includes(trimmedTag) && currentTags.length < 10) {
      setValue([...currentTags, trimmedTag]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string, setValue: (value: string[]) => void, currentTags: string[]) => {
    setValue(currentTags.filter(tag => tag !== tagToRemove));
  };

  const handleTagKeyPress = (e: React.KeyboardEvent, setValue: (value: string[]) => void, currentTags: string[]) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(setValue, currentTags);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Additional Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={control}
          name="requirements"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Requirements (Optional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Any specific skills, tools, or qualifications needed..."
                  className="min-h-[80px]"
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <div className="text-xs text-gray-500 mt-1">
                {field.value?.length || 0}/1000 characters
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Tags */}
        <FormField
          control={control}
          name="tags"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Tags (Optional)
              </FormLabel>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add tags to help others find your offer..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => handleTagKeyPress(e, field.onChange, field.value || [])}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={() => addTag(field.onChange, field.value || [])}
                    variant="outline"
                    size="icon"
                    disabled={!tagInput.trim() || (field.value?.length || 0) >= 10}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {field.value && field.value.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {field.value.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        {tag}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 ml-1 hover:bg-transparent"
                          onClick={() => removeTag(tag, field.onChange, field.value || [])}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-500">
                  {(field.value?.length || 0)}/10 tags
                </p>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}