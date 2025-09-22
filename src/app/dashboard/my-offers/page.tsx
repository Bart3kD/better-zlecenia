'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { offersService   } from '@/services/offers-service';
import { supabase } from '@/utils/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Calendar, 
  TrendingUp, 
  CheckCircle, 
  XCircle, 
  Clock,
  DollarSign,
  FileText,
  HandHeart
} from 'lucide-react';
import OfferCard from '@/components/dashboard/offer-card';
import { useRouter } from 'next/navigation';

export default function MyOffersPage() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('posted');

  const router = useRouter();

  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getCurrentUser();
  }, []);

  // Fetch user's offers
  const { data: userOffers, isLoading, error } = useQuery({
    queryKey: ['userOffers', currentUserId],
    queryFn: () => currentUserId ? offersService.getUserOffers(currentUserId) : Promise.resolve([]),
    enabled: !!currentUserId
  });

  // Separate posted and taken offers
  const postedOffers = userOffers?.filter(offer => offer.poster_id === currentUserId) || [];
  const takenOffers = userOffers?.filter(offer => offer.taker_id === currentUserId) || [];

  // Calculate stats for posted offers
  const postedStats = {
    total: postedOffers.length,
    open: postedOffers.filter(o => o.status === 'open').length,
    inProgress: postedOffers.filter(o => o.status === 'in_progress').length,
    completed: postedOffers.filter(o => o.status === 'completed').length,
    cancelled: postedOffers.filter(o => o.status === 'cancelled').length,
    totalEarnings: postedOffers
      .filter(o => o.status === 'completed')
      .reduce((sum, offer) => sum + offer.price, 0)
  };

  // Calculate stats for taken offers
  const takenStats = {
    total: takenOffers.length,
    inProgress: takenOffers.filter(o => o.status === 'in_progress').length,
    completed: takenOffers.filter(o => o.status === 'completed').length,
    totalEarned: takenOffers
      .filter(o => o.status === 'completed')
      .reduce((sum, offer) => sum + offer.price, 0)
  };

  const handleViewDetails = (offerId: string) => {
    router.push(`/dashboard/my-offers/${offerId}`)
  };

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Card className="p-8 text-center border-red-200 bg-red-50">
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-red-800">Failed to load your offers</h2>
            <p className="text-red-600">There was an error loading your offers. Please try again.</p>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline"
              className="border-red-200 text-red-700 hover:bg-red-100"
            >
              Retry
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Offers</h1>
          <p className="text-gray-600 mt-1">
            Manage your posted offers and track the ones you're working on
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="posted" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Posted Offers ({postedStats.total})
          </TabsTrigger>
          <TabsTrigger value="taken" className="flex items-center gap-2">
            <HandHeart className="h-4 w-4" />
            Taken Offers ({takenStats.total})
          </TabsTrigger>
        </TabsList>

        {/* Posted Offers Tab */}
        <TabsContent value="posted" className="space-y-6">
          {/* Posted Offers Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{postedStats.total}</p>
                    <p className="text-sm text-gray-500">Total Posted</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Clock className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{postedStats.open}</p>
                    <p className="text-sm text-gray-500">Open</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{postedStats.inProgress}</p>
                    <p className="text-sm text-gray-500">In Progress</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{postedStats.completed}</p>
                    <p className="text-sm text-gray-500">Completed</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <XCircle className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{postedStats.cancelled}</p>
                    <p className="text-sm text-gray-500">Cancelled</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <DollarSign className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      ${postedStats.totalEarnings.toFixed(0)}
                    </p>
                    <p className="text-sm text-gray-500">Total Paid</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Posted Offers Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : postedOffers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {postedOffers.map((offer) => (
                <OfferCard
                  key={offer.id}
                  offer={offer}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No offers posted yet</h3>
              <p className="text-gray-500 mb-4">
                You haven't posted any offers yet. Create your first offer to get started.
              </p>
              <Button onClick={() => window.location.href = '/dashboard/create-offer'}>
                Create Your First Offer
              </Button>
            </Card>
          )}
        </TabsContent>

        {/* Taken Offers Tab */}
        <TabsContent value="taken" className="space-y-6">
          {/* Taken Offers Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <HandHeart className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{takenStats.total}</p>
                    <p className="text-sm text-gray-500">Total Taken</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Clock className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{takenStats.inProgress}</p>
                    <p className="text-sm text-gray-500">In Progress</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{takenStats.completed}</p>
                    <p className="text-sm text-gray-500">Completed</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <DollarSign className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      ${takenStats.totalEarned.toFixed(0)}
                    </p>
                    <p className="text-sm text-gray-500">Total Earned</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Taken Offers Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : takenOffers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {takenOffers.map((offer) => (
                <OfferCard
                  key={offer.id}
                  offer={offer}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <HandHeart className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No offers taken yet</h3>
              <p className="text-gray-500 mb-4">
                You haven't accepted any offers yet. Browse available offers to get started.
              </p>
              <Button onClick={() => window.location.href = '/dashboard'}>
                Browse Available Offers
              </Button>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}