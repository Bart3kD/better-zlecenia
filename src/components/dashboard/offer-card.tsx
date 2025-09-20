"use client";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Clock,
  Calendar,
  Star,
  MessageCircle,
  Bookmark,
  MapPin,
} from "lucide-react";
import { renderIcon } from "@/utils/icon-mapping";
import { Offer } from "@/services/offers-service";
import { formatDistanceToNow } from "date-fns";

interface OfferCardProps {
  offer: Offer;
  onViewDetails?: (offerId: string) => void;
  onContact?: (offerId: string) => void;
  onSave?: (offerId: string) => void;
}

export default function OfferCard({
  offer,
  onViewDetails,
  onContact,
  onSave,
}: OfferCardProps) {
  const isPoster = false; // TODO: Get from auth context
  const isHelpWanted = offer.type === "help_wanted";

  const getOfferTypeStyle = () => {
    if (isHelpWanted) {
      return {
        badge: "bg-blue-100 text-blue-800 border-blue-200",
        card: "border-blue-200 hover:border-blue-300",
        accent: "text-blue-600",
      };
    }
    return {
      badge: "bg-green-100 text-green-800 border-green-200",
      card: "border-green-200 hover:border-green-300",
      accent: "text-green-600",
    };
  };

  const styles = getOfferTypeStyle();

  const formatPrice = (price: number) => {
    return price === 0 ? "Free" : `$${price.toFixed(2)}`;
  };

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card
      className={`transition-all duration-200 hover:shadow-lg gap-2 h-100 ${styles.card}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold truncate mb-1">
              {offer.title.length > 33
                ? offer.title.slice(0, 30) + "..."
                : offer.title}
            </h3>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className={styles.badge}>
                {isHelpWanted ? "Help Wanted" : "Offering Help"}
              </Badge>
              {offer.category && (
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  {renderIcon(offer.category.icon, "h-3 w-3")}
                  <span className="truncate">{offer.category.name}</span>
                </div>
              )}
            </div>
          </div>
          <div className={`text-xl font-bold ${styles.accent}`}>
            {formatPrice(offer.price)}
          </div>
        </div>

        {/* Poster Info */}
        <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
          <Avatar className="h-6 w-6">
            <AvatarImage src={offer.poster?.avatar_url} />
            <AvatarFallback className="text-xs">
              {getInitials(offer.poster?.full_name || offer.poster?.username)}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm text-gray-600 truncate">
            {offer.poster?.full_name || offer.poster?.username || "Anonymous"}
          </span>
          {offer.poster?.average_rating && offer.poster.average_rating > 0 && (
            <div className="flex items-center gap-1 ml-auto">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs text-gray-600">
                {offer.poster.average_rating.toFixed(1)}
              </span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="h-full flex flex-col">
        {/* Description */}
        <p className="text-sm text-gray-700 line-clamp-2 mb-3">
          {offer.description}
        </p>

        {/* Requirements */}
        {offer.requirements && (
          <div className="mb">
            <p className="text-xs text-gray-500 mb-1">Requirements:</p>
            <p className="text-xs text-gray-700 line-clamp-2">
              {offer.requirements}
            </p>
          </div>
        )}

        {/* Meta Information */}
        <div className="space-y-1 text-xs text-gray-500 mt-auto">
          {/* Tags */}
          {offer.tags && offer.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {offer.tags.slice(0, 4).map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="text-xs px-2 py-0.5"
                >
                  {tag}
                </Badge>
              ))}
              {offer.tags.length > 3 && (
                <Badge variant="outline" className="text-xs px-2 py-0.5">
                  +{offer.tags.length - 4}
                </Badge>
              )}
            </div>
          )}
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>
              Posted {formatDistanceToNow(new Date(offer.created_at))} ago
            </span>
          </div>

          {offer.deadline && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>Due {formatDistanceToNow(new Date(offer.deadline))}</span>
            </div>
          )}

          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            <span>Status:</span>
            <Badge
              variant="outline"
              className={`text-xs px-1 py-0 ${
                offer.status === "open"
                  ? "text-green-600 border-green-200"
                  : offer.status === "in_progress"
                  ? "text-blue-600 border-blue-200"
                  : offer.status === "completed"
                  ? "text-gray-600 border-gray-200"
                  : "text-red-600 border-red-200"
              }`}
            >
              {offer.status.replace("_", " ")}
            </Badge>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-3 gap-2">
        <Button
          variant="default"
          size="sm"
          className="flex-1"
          onClick={() => onViewDetails?.(offer.id)}
        >
          View Details
        </Button>

        {!isPoster && offer.status === "open" && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onContact?.(offer.id)}
            className="flex items-center gap-1"
          >
            <MessageCircle className="h-3 w-3" />
            Contact
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onSave?.(offer.id)}
          className="px-2"
        >
          <Bookmark className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
