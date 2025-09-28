'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { offersService } from '@/services/offers-service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Calendar, 
  DollarSign, 
  User, 
  Clock,
  AlertCircle,
  FileText,
  Download,
  Image,
  Code,
  File,
  CheckCircle,
  XCircle,
  UserCheck
} from 'lucide-react';
import { OFFER_TYPE, OFFER_STATUS } from '@/types/offers.types';
import { OfferWithRelations } from '@/services/offers-service';
import StartConversation from '@/components/conversations/start-conversation';
import { supabase } from '@/utils/supabase/client';

interface OfferDetailsPageProps {
  params: {
    id: string;
  };
}

export default function OfferDetailsPage({ params }: OfferDetailsPageProps) {
  const router = useRouter();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getCurrentUser();
  }, []);
  
  const { data: offer, isLoading, error } = useQuery<OfferWithRelations>({
    queryKey: ['offer', params.id],
    queryFn: async () => {
      const result = await offersService.getOfferById(params.id);
      if (!result) throw new Error('Offer not found');
      return result;
    }
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !offer) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="p-8 text-center border-red-200 bg-red-50">
          <div className="space-y-3">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
            <h2 className="text-lg font-semibold text-red-800">Oferta nie została znaleziona</h2>
            <p className="text-red-600">
              Nie można załadować szczegółów oferty. Oferta może zostać usunięta lub nie istnieć.
            </p>
            <Button 
              onClick={() => router.push('/dashboard')} 
              variant="outline"
              className="border-red-200 text-red-700 hover:bg-red-100"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Wróć do dashboardu
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Check if current user is the poster
  const isPoster = currentUserId === offer?.poster_id;

  const getStatusColor = (status: OFFER_STATUS) => {
    switch (status) {
      case OFFER_STATUS.OPEN: return 'bg-green-100 text-green-800';
      case OFFER_STATUS.IN_PROGRESS: return 'bg-blue-100 text-blue-800';
      case OFFER_STATUS.COMPLETED: return 'bg-gray-100 text-gray-800';
      case OFFER_STATUS.CANCELLED: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: OFFER_STATUS) => {
    switch (status) {
      case OFFER_STATUS.OPEN: return 'Otwarte';
      case OFFER_STATUS.IN_PROGRESS: return 'W trakcie';
      case OFFER_STATUS.COMPLETED: return 'Zakończone';
      case OFFER_STATUS.CANCELLED: return 'Anulowane';
      default: return status;
    }
  };

  const getTypeColor = (type: OFFER_TYPE) => {
    return type === OFFER_TYPE.HELP_WANTED 
      ? 'bg-blue-100 text-blue-800' 
      : 'bg-green-100 text-green-800';
  };

  const getTypeText = (type: OFFER_TYPE) => {
    return type === OFFER_TYPE.HELP_WANTED ? 'Szukam pomocy' : 'Oferuję pomoc';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAttachmentIcon = (type: string) => {
    switch (type) {
      case 'image': return <Image className="h-4 w-4" />;
      case 'code': return <Code className="h-4 w-4" />;
      case 'document': return <FileText className="h-4 w-4" />;
      default: return <File className="h-4 w-4" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
    return Math.round(bytes / (1024 * 1024)) + ' MB';
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header z przyciskiem powrotu */}
      <div className="flex items-center gap-4">
        <Button 
          onClick={() => router.back()}
          variant="ghost"
          size="sm"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Wróć
        </Button>
        <div className="flex items-center gap-3">
          <Badge className={getTypeColor(offer.type)}>
            {getTypeText(offer.type)}
          </Badge>
          <Badge className={getStatusColor(offer.status)}>
            {getStatusText(offer.status)}
          </Badge>
        </div>
      </div>

      {/* Główne informacje o ofercie */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{offer.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Podstawowe informacje */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="font-semibold">${offer.price}</p>
                  <p className="text-sm text-gray-500">Cena</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="font-semibold">{formatDate(offer.created_at)}</p>
                  <p className="text-sm text-gray-500">Data utworzenia</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {offer.deadline && (
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="font-semibold">{formatDate(offer.deadline)}</p>
                    <p className="text-sm text-gray-500">Termin wykonania</p>
                  </div>
                </div>
              )}

              {offer.completed_at && (
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-semibold">{formatDate(offer.completed_at)}</p>
                    <p className="text-sm text-gray-500">Data zakończenia</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Opis */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Opis</h3>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {offer.description}
            </p>
          </div>

          {/* Wymagania */}
          {offer.requirements && (
            <div>
              <h3 className="font-semibold text-lg mb-3">Wymagania</h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {offer.requirements}
              </p>
            </div>
          )}

          {/* Tagi */}
          {offer.tags && offer.tags.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg mb-3">Tagi</h3>
              <div className="flex flex-wrap gap-2">
                {offer.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Załączniki */}
          {offer.attachments && offer.attachments.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg mb-3">Załączniki</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {offer.attachments.map((attachment) => (
                  <Card key={attachment.id} className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {getAttachmentIcon(attachment.type)}
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{attachment.filename}</p>
                          <p className="text-sm text-gray-500">
                            {formatFileSize(attachment.size)} • {attachment.type}
                          </p>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" asChild>
                        <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Informacje o autorze oferty */}
      {offer.poster && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Autor oferty</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-gray-100 rounded-full">
                {offer.poster.avatar_url ? (
                  <img 
                    src={offer.poster.avatar_url} 
                    alt={offer.poster.full_name || offer.poster.username || 'Avatar'}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <User className="h-6 w-6 text-gray-600" />
                )}
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">
                  {offer.poster.full_name || offer.poster.username}
                </h4>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Ocena:</span>
                  <span className="font-semibold">{offer.poster.average_rating.toFixed(1)}/5</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informacje o wykonawcy (jeśli jest) */}
      {offer.taker && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Wykonawca
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-100 rounded-full">
                {offer.taker.avatar_url ? (
                  <img 
                    src={offer.taker.avatar_url} 
                    alt={offer.taker.full_name || offer.taker.username || 'Avatar'}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <User className="h-6 w-6 text-green-600" />
                )}
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">
                  {offer.taker.full_name || offer.taker.username}
                </h4>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Ocena:</span>
                  <span className="font-semibold">{offer.taker.average_rating.toFixed(1)}/5</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informacje o anulowaniu */}
      {offer.status === OFFER_STATUS.CANCELLED && offer.cancellation_reason && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-red-800">
              <XCircle className="h-5 w-5" />
              Oferta anulowana
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-red-700">{offer.cancellation_reason}</p>
              {offer.cancellation_requested_at && (
                <p className="text-sm text-red-600">
                  Anulowano: {formatDate(offer.cancellation_requested_at)}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Przyciski akcji */}
      {offer.status === OFFER_STATUS.OPEN && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button className="flex-1 bg-green-600 hover:bg-green-700">
                {offer.type === OFFER_TYPE.HELP_WANTED ? 'Oferuję pomoc' : 'Jestem zainteresowany'}
              </Button>
              
              {!isPoster && (
                <StartConversation
                  offerId={offer.id}
                  posterName={offer.poster?.full_name || offer.poster?.username}
                  offerTitle={offer.title}
                  buttonText="Wyślij wiadomość"
                  buttonVariant="outline"
                />
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}