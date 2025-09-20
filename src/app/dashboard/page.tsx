'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { offersService } from '@/services/offers-service';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, TrendingUp, Users, Clock, DollarSign } from 'lucide-react';
import OffersGrid from '@/components/dashboard/offers-grid';

export default function DashboardPage() {
  const router = useRouter();
  const { data: offers, isLoading, error } = useQuery({
    queryKey: ['offers'],
    queryFn: offersService.getOffers
  });

  // Calculate stats
  const stats = offers ? {
    total: offers.length,
    helpWanted: offers.filter(o => o.type === 'help_wanted').length,
    offeringHelp: offers.filter(o => o.type === 'offering_help').length,
    openOffers: offers.filter(o => o.status === 'open').length,
    avgPrice: offers.length > 0 
      ? offers.reduce((sum, offer) => sum + offer.price, 0) / offers.length 
      : 0,
    recentOffers: offers.filter(o => {
      const dayAgo = new Date();
      dayAgo.setDate(dayAgo.getDate() - 1);
      return new Date(o.created_at) > dayAgo;
    }).length
  } : null;

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Card className="p-8 text-center border-red-200 bg-red-50">
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-red-800">Failed to load offers</h2>
            <p className="text-red-600">There was an error loading the offers. Please try again.</p>
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
          <h1 className="text-3xl font-bold text-gray-900">Browse Offers</h1>
          <p className="text-gray-600 mt-1">
            Discover opportunities to help others or get the help you need
          </p>
        </div>
        <Button 
          onClick={() => router.push('/dashboard/create-offer')}
          size="lg"
          className="bg-green-600 hover:bg-green-700"
        >
          <Plus className="mr-2 h-5 w-5" /> 
          Create Offer
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && !isLoading && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  <p className="text-sm text-gray-500">Total Offers</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.openOffers}</p>
                  <p className="text-sm text-gray-500">Open</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Clock className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.recentOffers}</p>
                  <p className="text-sm text-gray-500">Today</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <DollarSign className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    ${stats.avgPrice.toFixed(0)}
                  </p>
                  <p className="text-sm text-gray-500">Avg Price</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.helpWanted}</p>
                  <p className="text-sm text-gray-500">Help Wanted</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.offeringHelp}</p>
                  <p className="text-sm text-gray-500">Offering Help</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Offers Grid */}
      <OffersGrid offers={offers || []} isLoading={isLoading} />
    </div>
  );
}