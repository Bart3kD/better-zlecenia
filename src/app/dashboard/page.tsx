'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { offersService } from '@/services/offers-service';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { data: offers, isLoading } = useQuery({
    queryKey: ['offers'],
    queryFn: offersService.getOffers
  });

  if (isLoading) return <p>Loading offers...</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Browse Offers</h1>
        <Button onClick={() => router.push('/dashboard/create-offer')}>
          <Plus className="mr-2 h-4 w-4" /> Create Offer
        </Button>
      </div>

      {(!offers || offers.length === 0) && (
        <p className="text-muted-foreground">No offers yet.</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {offers?.map((offer) => (
          <Card key={offer.id}>
            <CardContent className="p-4">
              <h2 className="text-lg font-semibold">{offer.title}</h2>
              <p className="text-sm text-muted-foreground">{offer.description}</p>
              <p className="text-sm font-bold mt-2">${offer.price}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
