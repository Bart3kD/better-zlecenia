'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Mail,
  Calendar,
  Star,
  BookOpen,
  Edit3,
  Camera,
  Users,
  MessageCircle,
  ExternalLink,
  Clock,
  CheckCircle,
  Bookmark
} from 'lucide-react';
import { Profile } from '@/types/profiles.types';
import { Offer, OFFER_TYPE, OFFER_STATUS} from '@/types/offers.types';
import { Rating } from '@/types/ratings.types';

const GRADE_LEVELS = [1, 2, 3, 4, 5];

interface UserStats {
  offersCreated: number;
  helpWantedOffers: number;
  offeringHelpOffers: number;
  completedOffers: number;
  activeOffers: number;
  savedOffers: number;
}

interface SavedOffer {
  id: string;
  title: string;
  price: number;
  created_at: string;
  type: OFFER_TYPE;
  status: OFFER_STATUS;
}

interface UserRatingWithDetails extends Rating {
  rater_name?: string;
  offer_title?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);

  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profile) {
        setCurrentUser(profile);
      }
    };

    getCurrentUser();
  }, [router]);

  // Get user's offer statistics
  const { data: userStats } = useQuery({
    queryKey: ['user-stats', currentUser?.id],
    queryFn: async (): Promise<UserStats | null> => {
      if (!currentUser?.id) return null;

      const { data: offers, error } = await supabase
        .from('offers')
        .select('id, status, type, poster_id, taker_id')
        .or(`poster_id.eq.${currentUser.id},taker_id.eq.${currentUser.id}`);

      if (error || !offers) {
        console.error('Error fetching user stats:', error);
        return null;
      }

      const createdOffers = offers.filter((o) => o.poster_id === currentUser.id);
      const takenOffers = offers.filter((o) => o.taker_id === currentUser.id);
      const allUserOffers = [...createdOffers, ...takenOffers];

      return {
        offersCreated: createdOffers.length,
        helpWantedOffers: createdOffers.filter((o) => o.type === OFFER_TYPE.HELP_WANTED).length,
        offeringHelpOffers: createdOffers.filter((o) => o.type === OFFER_TYPE.OFFERING_HELP).length,
        completedOffers: allUserOffers.filter((o) => o.status === OFFER_STATUS.COMPLETED).length,
        activeOffers: createdOffers.filter((o) => o.status === OFFER_STATUS.OPEN).length,
        savedOffers: 0, // Will be updated below
      };
    },
    enabled: !!currentUser?.id
  });

  // Get user's ratings
  const { data: userRatings } = useQuery({
    queryKey: ['user-ratings', currentUser?.id],
    queryFn: async (): Promise<UserRatingWithDetails[]> => {
      if (!currentUser?.id) return [];

      const { data, error } = await supabase
        .from('ratings')
        .select(`
          id,
          rating,
          review,
          created_at,
          rater_id,
          offer_id,
          profiles!ratings_rater_id_fkey(full_name, username),
          offers(title)
        `)
        .eq('rated_id', currentUser.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error || !data) {
        console.error('Error fetching ratings:', error);
        return [];
      }

      return data.map((rating: any): UserRatingWithDetails => ({
        id: rating.id,
        offer_id: rating.offer_id,
        rater_id: rating.rater_id,
        rated_id: currentUser.id,
        rating: rating.rating,
        review: rating.review,
        created_at: rating.created_at,
        rater_name: rating.profiles?.full_name || rating.profiles?.username || 'Anonimowy użytkownik',
        offer_title: rating.offers?.title
      }));
    },
    enabled: !!currentUser?.id
  });

  // Get user's saved offers
  const { data: savedOffers } = useQuery({
    queryKey: ['saved-offers', currentUser?.id],
    queryFn: async (): Promise<SavedOffer[]> => {
      if (!currentUser?.id) return [];

      const { data, error } = await supabase
        .from('saved_offers')
        .select(`
          id,
          offers (
            id,
            title,
            price,
            type,
            status,
            created_at
          )
        `)
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (error || !data) {
        console.error('Error fetching saved offers:', error);
        return [];
      }

      return data.map((saved: any): SavedOffer => ({
        id: saved.offers.id,
        title: saved.offers.title,
        price: saved.offers.price,
        created_at: saved.offers.created_at,
        type: saved.offers.type,
        status: saved.offers.status,
      }));
    },
    enabled: !!currentUser?.id
  });

  // Update stats with saved offers count
  const updatedStats = userStats && savedOffers ? {
    ...userStats,
    savedOffers: savedOffers.length
  } : userStats;

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  if (!currentUser) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-24 w-24 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          </Card>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="p-4">
                <div className="h-16 bg-gray-200 rounded"></div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Profil użytkownika</h1>
          <p className="text-gray-600 mt-1">
            Zarządzaj swoim profilem i ustawieniami
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {currentUser.telegram_user_id && (
            <Badge className="bg-blue-100 text-blue-800">
              <MessageCircle className="h-3 w-3 mr-1" />
              Telegram połączony
            </Badge>
          )}
        </div>
      </div>

      {/* Main Profile Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-start gap-6">
            <div className="relative flex-shrink-0">
              <Avatar className="h-24 w-24">
                <AvatarImage 
                  src={currentUser.avatar_url ?? undefined} 
                  alt={currentUser.full_name || currentUser.username || 'User'} 
                />
                <AvatarFallback className="text-2xl">
                  {getInitials(currentUser.full_name || currentUser.username)}
                </AvatarFallback>
              </Avatar>
              <Button
                size="sm"
                variant="outline"
                className="absolute -bottom-2 -right-2 h-8 w-8 p-0"
                onClick={() => {/* TODO: Add avatar upload functionality */}}
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-2xl font-bold truncate">
                      {currentUser.full_name || 'Nie podano imienia'}
                    </h2>
                    {currentUser.username && (
                      <Badge variant="secondary">@{currentUser.username}</Badge>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-1">
                      <Mail className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{currentUser.school_email}</span>
                    </div>
                    {currentUser.grade_level && (
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4 flex-shrink-0" />
                        <span>Klasa {currentUser.grade_level}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 flex-shrink-0" />
                      <span>Dołączył {formatDate(currentUser.created_at)}</span>
                    </div>
                  </div>

                  {currentUser.bio && (
                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                      <p className="text-gray-700 text-sm leading-relaxed">{currentUser.bio}</p>
                    </div>
                  )}
                </div>
                
                <Button onClick={() => router.push('/settings')} className="self-start">
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edytuj profil
                </Button>
              </div>

              {/* User Rating */}
              <div className="flex items-center gap-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {renderStars(Math.round(currentUser.average_rating))}
                  </div>
                  <span className="font-medium">
                    {currentUser.average_rating.toFixed(1)}
                  </span>
                  <span className="text-gray-500 text-sm">
                    ({userRatings?.length || 0} opinii)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MessageCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {updatedStats?.offersCreated || 0}
                </p>
                <p className="text-sm text-gray-500">Utworzonych ofert</p>
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
                <p className="text-2xl font-bold text-gray-900">
                  {updatedStats?.completedOffers || 0}
                </p>
                <p className="text-sm text-gray-500">Ukończonych</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {updatedStats?.activeOffers || 0}
                </p>
                <p className="text-sm text-gray-500">Aktywnych</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {updatedStats?.helpWantedOffers || 0}
                </p>
                <p className="text-sm text-gray-500">Prośby o pomoc</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Bookmark className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {updatedStats?.savedOffers || 0}
                </p>
                <p className="text-sm text-gray-500">Zapisanych</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Reviews */}
      {userRatings && userRatings.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Ostatnie opinie</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/dashboard/reviews')}
              >
                Zobacz wszystkie
                <ExternalLink className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {userRatings.slice(0, 3).map((rating) => (
                <div key={rating.id} className="border-l-4 border-blue-200 pl-4 bg-gray-50 rounded-r-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {renderStars(rating.rating)}
                      </div>
                      <span className="text-sm font-medium">{rating.rater_name}</span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {formatDate(rating.created_at)}
                    </span>
                  </div>
                  {rating.offer_title && (
                    <p className="text-sm text-blue-600 mb-1">
                      Za ofertę: {rating.offer_title}
                    </p>
                  )}
                  {rating.review && (
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {rating.review}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Saved Offers */}
      {savedOffers && savedOffers.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Bookmark className="h-5 w-5" />
                Zapisane oferty
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/dashboard/saved-offers')}
              >
                Zobacz wszystkie
                <ExternalLink className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {savedOffers.slice(0, 5).map((offer) => (
                <div 
                  key={offer.id} 
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => router.push(`/dashboard/offers/${offer.id}`)}
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 truncate">{offer.title}</h4>
                    <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                      <Badge 
                        variant={offer.type === OFFER_TYPE.HELP_WANTED ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {offer.type === OFFER_TYPE.HELP_WANTED ? "Pomoc potrzebna" : "Oferuję pomoc"}
                      </Badge>
                      <Badge 
                        variant={offer.status === OFFER_STATUS.OPEN ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {offer.status === OFFER_STATUS.OPEN ? "Otwarta" : offer.status}
                      </Badge>
                      <span>{formatDate(offer.created_at)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">${offer.price}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state for saved offers */}
      {savedOffers && savedOffers.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <Bookmark className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Brak zapisanych ofert</h3>
            <p className="text-gray-500 mb-4">
              Nie masz jeszcze żadnych zapisanych ofert. Przeglądaj oferty i zapisuj te, które Cię interesują.
            </p>
            <Button onClick={() => router.push('/dashboard')}>
              Przeglądaj oferty
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Telegram Integration */}
      {!currentUser.telegram_user_id && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <MessageCircle className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900">Połącz z Telegram</h3>
                <p className="text-blue-700 text-sm mt-1">
                  Otrzymuj powiadomienia o wiadomościach i ofertach bezpośrednio w Telegramie
                </p>
              </div>
              <Button className="bg-blue-600 hover:bg-blue-700">
                Połącz teraz
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}