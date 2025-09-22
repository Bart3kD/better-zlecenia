'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { offersService, OfferWithRelations } from '@/services/offers-service';
import { messagesService } from '@/services/messages-service';
import { conversationsService } from '@/services/conversations-service';
import { supabase } from '@/utils/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ArrowLeft,
  Edit3,
  Trash2,
  XCircle,
  RotateCcw,
  Copy,
  MoreVertical,
  DollarSign,
  Calendar,
  Clock,
  User,
  MessageCircle,
  Star,
  MapPin,
  FileText,
  Tag,
  AlertTriangle,
  CheckCircle,
  X
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { renderIcon } from '@/utils/icon-mapping';
import StartConversation from '@/components/conversations/start-conversation';
import { OFFER_STATUS, OFFER_TYPE } from '@/types/offers.types';

export default function OfferDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [hasConversations, setHasConversations] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [cancellationMessage, setCancellationMessage] = useState('');
  const [responseMessage, setResponseMessage] = useState('');
  const [showCancellationDialog, setShowCancellationDialog] = useState(false);
  const [showResponseDialog, setShowResponseDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<'approve' | 'deny' | null>(null);

  const offerId = params.id as string;

  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getCurrentUser();
  }, []);

  // Fetch offer details
  const { data: offer, isLoading, error } = useQuery({
    queryKey: ['offer', offerId],
    queryFn: () => offersService.getOfferById(offerId),
    enabled: !!offerId
  });

  // Check if offer has conversations (for delete permission)
  useEffect(() => {
    const checkConversations = async () => {
      if (!offer?.id) return;
      
      try {
        const conversations = await conversationsService.getConversations({
          offer_id: offer.id
        });
        setHasConversations(conversations.length > 0);
      } catch (error) {
        console.error('Error checking conversations:', error);
      }
    };

    checkConversations();
  }, [offer?.id]);

  // Update offer status mutation
  const updateOfferStatusMutation = useMutation({
    mutationFn: (status: OFFER_STATUS.OPEN | OFFER_STATUS.CANCELLED) => 
      offersService.updateOfferStatus({
        offer_id: offerId,
        status
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offer', offerId] });
      queryClient.invalidateQueries({ queryKey: ['offers'] });
      queryClient.invalidateQueries({ queryKey: ['userOffers'] });
    }
  });

  // Delete offer mutation
  const deleteOfferMutation = useMutation({
    mutationFn: async () => {
      console.log('Attempting to delete offer:', offerId);
      await offersService.deleteOffer(offerId);
      console.log('Delete successful');
    },
    onSuccess: () => {
      console.log('Delete mutation onSuccess triggered');
      queryClient.invalidateQueries({ queryKey: ['offers'] });
      queryClient.invalidateQueries({ queryKey: ['userOffers'] });
      queryClient.invalidateQueries({ queryKey: ['offer', offerId] });
      
      // Force navigation
      setTimeout(() => {
        router.push('/dashboard/my-offers');
      }, 100);
    },
    onError: (error) => {
      console.error('Delete mutation failed:', error);
    }
  });

  // Request cancellation mutation (for takers)
  const requestCancellationMutation = useMutation({
    mutationFn: async ({ conversationId, reason, message }: { 
      conversationId: string; 
      reason: string; 
      message?: string; 
    }) => {
      return messagesService.requestOfferCancellation(
        conversationId,
        offerId,
        reason,
        message
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offer', offerId] });
      queryClient.invalidateQueries({ queryKey: ['offers'] });
      setShowCancellationDialog(false);
      setCancellationReason('');
      setCancellationMessage('');
    }
  });

  // Respond to cancellation mutation (for posters)
  const respondToCancellationMutation = useMutation({
    mutationFn: async ({ conversationId, approved, message }: { 
      conversationId: string; 
      approved: boolean; 
      message?: string; 
    }) => {
      return messagesService.respondToOfferCancellation(
        conversationId,
        offerId,
        approved,
        message
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offer', offerId] });
      queryClient.invalidateQueries({ queryKey: ['offers'] });
      setShowResponseDialog(false);
      setResponseMessage('');
      setPendingAction(null);
    }
  });

  // Withdraw cancellation mutation (for takers)
  const withdrawCancellationMutation = useMutation({
    mutationFn: async ({ conversationId, message }: { 
      conversationId: string; 
      message?: string; 
    }) => {
      return messagesService.withdrawCancellationRequest(
        conversationId,
        offerId,
        message
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offer', offerId] });
      queryClient.invalidateQueries({ queryKey: ['offers'] });
    }
  });

  const isOwner = currentUserId === offer?.poster_id;
  const isTaker = currentUserId === offer?.taker_id;
  const hasCancellationRequest = offer?.cancellation_requested_by !== null;
  const isRequester = currentUserId === offer?.cancellation_requested_by;

  const canEdit = () => {
    return isOwner && offer?.status === 'open' && !offer?.taker_id;
  };

  const canDelete = () => {
    return isOwner && offer?.status === 'open' && !hasConversations;
  };

  const canCancel = () => {
    return isOwner && (offer?.status === 'open' || offer?.status === 'in_progress');
  };

  const canReopen = () => {
    return isOwner && offer?.status === 'cancelled';
  };

  const canRequestCancellation = () => {
    return isTaker && offer?.status === 'in_progress' && !hasCancellationRequest;
  };

  const canWithdrawCancellation = () => {
    return isTaker && hasCancellationRequest && isRequester;
  };

  const canRespondToCancellation = () => {
    return isOwner && hasCancellationRequest && !isRequester;
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleEdit = () => {
    router.push(`/dashboard/offers/${offerId}/edit`);
  };

  const handleDuplicate = () => {
    if (offer) {
      const duplicateData = {
        category_id: offer.category_id,
        type: offer.type,
        title: `${offer.title} (Copy)`,
        description: offer.description,
        price: offer.price,
        deadline: offer.deadline,
        requirements: offer.requirements,
        tags: offer.tags,
        _isDuplicate: true,
        _originalTitle: offer.title
      };
      sessionStorage.setItem('duplicateOfferData', JSON.stringify(duplicateData));
      router.push('/dashboard/create-offer?duplicate=true');
    }
  };

  const handleCancel = () => {
    updateOfferStatusMutation.mutate(OFFER_STATUS.CANCELLED);
  };

  const handleReopen = () => {
    updateOfferStatusMutation.mutate(OFFER_STATUS.OPEN);
  };

  const handleDelete = () => {
    deleteOfferMutation.mutate();
  };

  const handleRequestCancellation = async () => {
    if (!offer || !cancellationReason.trim()) return;

    // Find conversation between taker and poster
    try {
      const conversations = await conversationsService.getConversations({
        offer_id: offer.id
      });
      
      const conversation = conversations.find(c => 
        c.interested_user_id === currentUserId || c.poster_id === currentUserId
      );

      if (conversation) {
        requestCancellationMutation.mutate({
          conversationId: conversation.id,
          reason: cancellationReason.trim(),
          message: cancellationMessage.trim() || undefined
        });
      }
    } catch (error) {
      console.error('Error requesting cancellation:', error);
    }
  };

  const handleRespondToCancellation = async (approved: boolean) => {
    if (!offer) return;

    try {
      const conversations = await conversationsService.getConversations({
        offer_id: offer.id
      });
      
      const conversation = conversations.find(c => 
        c.interested_user_id === offer.cancellation_requested_by
      );

      if (conversation) {
        respondToCancellationMutation.mutate({
          conversationId: conversation.id,
          approved,
          message: responseMessage.trim() || undefined
        });
      }
    } catch (error) {
      console.error('Error responding to cancellation:', error);
    }
  };

  const handleWithdrawCancellation = async () => {
    if (!offer) return;

    try {
      const conversations = await conversationsService.getConversations({
        offer_id: offer.id
      });
      
      const conversation = conversations.find(c => 
        c.interested_user_id === currentUserId || c.poster_id === currentUserId
      );

      if (conversation) {
        withdrawCancellationMutation.mutate({
          conversationId: conversation.id,
          message: 'Cancellation request withdrawn'
        });
      }
    } catch (error) {
      console.error('Error withdrawing cancellation:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="animate-pulse">
          <CardContent className="p-8 space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !offer) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="p-8 text-center border-red-200 bg-red-50">
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-red-800">Offer not found</h2>
            <p className="text-red-600">The offer you're looking for doesn't exist or has been removed.</p>
            <Button onClick={() => router.push('/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {/* Actions for both owners and takers */}
        {(isOwner || isTaker) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {/* Owner Actions */}
              {isOwner && (
                <>
                  {canEdit() && (
                    <DropdownMenuItem onClick={handleEdit}>
                      <Edit3 className="mr-2 h-4 w-4" />
                      Edit Offer
                    </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuItem onClick={handleDuplicate}>
                    <Copy className="mr-2 h-4 w-4" />
                    Duplicate Offer
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  {canReopen() && (
                    <DropdownMenuItem onClick={handleReopen}>
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Reopen Offer
                    </DropdownMenuItem>
                  )}

                  {canCancel() && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                          <XCircle className="mr-2 h-4 w-4" />
                          Cancel Offer
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Cancel Offer</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will deactivate your offer. You can reopen it later if needed.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Keep Open</AlertDialogCancel>
                          <AlertDialogAction onClick={handleCancel}>
                            Cancel Offer
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}

                  {canDelete() && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Offer
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Offer</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete your offer. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Keep Offer</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={handleDelete} 
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete Permanently
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}

                  {/* Response to cancellation request */}
                  {canRespondToCancellation() && (
                    <>
                      <DropdownMenuSeparator />
                      <Dialog open={showResponseDialog} onOpenChange={setShowResponseDialog}>
                        <DialogTrigger asChild>
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            <AlertTriangle className="mr-2 h-4 w-4 text-orange-500" />
                            Respond to Cancellation
                          </DropdownMenuItem>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Respond to Cancellation Request</DialogTitle>
                            <DialogDescription>
                              {offer.taker?.full_name || offer.taker?.username} has requested to cancel this offer.
                              Reason: "{offer.cancellation_reason}"
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="response-message">Response Message (Optional)</Label>
                              <Textarea
                                id="response-message"
                                placeholder="Add a message with your response..."
                                value={responseMessage}
                                onChange={(e) => setResponseMessage(e.target.value)}
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="destructive"
                                onClick={() => handleRespondToCancellation(true)}
                                disabled={respondToCancellationMutation.isPending}
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Approve Cancellation
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => handleRespondToCancellation(false)}
                                disabled={respondToCancellationMutation.isPending}
                              >
                                <X className="mr-2 h-4 w-4" />
                                Deny Request
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </>
                  )}
                </>
              )}

              {/* Taker Actions */}
              {isTaker && (
                <>
                  {canRequestCancellation() && (
                    <Dialog open={showCancellationDialog} onOpenChange={setShowCancellationDialog}>
                      <DialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                          <AlertTriangle className="mr-2 h-4 w-4 text-orange-500" />
                          Request Cancellation
                        </DropdownMenuItem>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Request Cancellation</DialogTitle>
                          <DialogDescription>
                            Request to cancel this offer. The poster will need to approve your request.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="cancellation-reason">Reason for Cancellation *</Label>
                            <Input
                              id="cancellation-reason"
                              placeholder="Why do you want to cancel this offer?"
                              value={cancellationReason}
                              onChange={(e) => setCancellationReason(e.target.value)}
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="cancellation-message">Additional Message (Optional)</Label>
                            <Textarea
                              id="cancellation-message"
                              placeholder="Add any additional details..."
                              value={cancellationMessage}
                              onChange={(e) => setCancellationMessage(e.target.value)}
                            />
                          </div>
                          <Button
                            onClick={handleRequestCancellation}
                            disabled={!cancellationReason.trim() || requestCancellationMutation.isPending}
                            className="w-full"
                          >
                            {requestCancellationMutation.isPending ? 'Sending...' : 'Send Cancellation Request'}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}

                  {canWithdrawCancellation() && (
                    <DropdownMenuItem onClick={handleWithdrawCancellation}>
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Withdraw Cancellation
                    </DropdownMenuItem>
                  )}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Cancellation Request Alert */}
      {hasCancellationRequest && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-orange-800">Cancellation Request Pending</h3>
                <p className="text-sm text-orange-700 mt-1">
                  {isOwner ? 
                    `${offer.taker?.full_name || offer.taker?.username} has requested to cancel this offer.` :
                    'Your cancellation request is pending approval from the poster.'
                  }
                </p>
                {offer.cancellation_reason && (
                  <p className="text-sm text-orange-600 mt-2">
                    <strong>Reason:</strong> {offer.cancellation_reason}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Offer Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-2xl mb-2">{offer.title}</CardTitle>
                  <div className="flex items-center gap-2 mb-4">
                    <Badge 
                      variant="outline" 
                      className={offer.type === OFFER_TYPE.HELP_WANTED ? 
                        'border-blue-200 text-blue-700' : 
                        'border-green-200 text-green-700'
                      }
                    >
                      {offer.type === OFFER_TYPE.HELP_WANTED ? 'Help Wanted' : 'Offering Help'}
                    </Badge>
                    <Badge variant="outline" className={getStatusColor(offer.status)}>
                      {offer.status.replace('_', ' ')}
                    </Badge>
                    {offer.category && (
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        {offer.category.icon && renderIcon(offer.category.icon, 'h-4 w-4')}
                        <span>{offer.category.name}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-green-600">
                    {offer.price === 0 ? 'Free' : `$${offer.price.toFixed(2)}`}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Description
                </h3>
                <p className="text-gray-700 whitespace-pre-wrap">{offer.description}</p>
              </div>

              {offer.requirements && (
                <div>
                  <h3 className="font-semibold mb-2">Requirements</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{offer.requirements}</p>
                </div>
              )}

              {offer.tags && offer.tags.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {offer.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Poster Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Posted by</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={offer.poster?.avatar_url} />
                  <AvatarFallback>
                    {getInitials(offer.poster?.full_name || offer.poster?.username)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {offer.poster?.full_name || offer.poster?.username || 'Anonymous'}
                  </p>
                  {offer.poster?.average_rating && offer.poster.average_rating > 0 && (
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm text-gray-600">
                        {offer.poster.average_rating.toFixed(1)} rating
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Button */}
              {!isOwner && !isTaker && offer.status === 'open' && (
                <StartConversation
                  offerId={offer.id}
                  posterName={offer.poster?.full_name || offer.poster?.username}
                  offerTitle={offer.title}
                  buttonText="Send Message"
                  buttonVariant="default"
                />
              )}
            </CardContent>
          </Card>

          {/* Offer Meta */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-gray-500" />
                <span>Posted {formatDistanceToNow(new Date(offer.created_at))} ago</span>
              </div>

              {offer.deadline && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span>Due {format(new Date(offer.deadline), 'MMM dd, yyyy')}</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span>Status: {offer.status.replace('_', ' ')}</span>
              </div>

              {offer.taker && (
                <div>
                  <Separator className="my-3" />
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">
                      Taken by {offer.taker.full_name || offer.taker.username}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}