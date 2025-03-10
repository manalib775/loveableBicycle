import { Bicycle } from "@shared/schema";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, Share2, Clock, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { useWishlist } from "@/hooks/use-wishlist";
import { useToast } from "@/hooks/use-toast";
import BicycleImageCarousel from './bicycle-image-carousel';
import { formatDistanceToNow } from 'date-fns';

interface BicycleGridProps {
  bicycles?: Bicycle[] | null;
  isLoading?: boolean;
  error?: Error | null;
}

export default function BicycleGrid({ bicycles, isLoading, error }: BicycleGridProps) {
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { toast } = useToast();

  const handleShare = async (bicycle: Bicycle) => {
    try {
      await navigator.share({
        title: `${bicycle.brand} ${bicycle.model}`,
        text: `Check out this ${bicycle.brand} ${bicycle.model} on Pling!`,
        url: window.location.href,
      });
    } catch (error) {
      console.error('Share failed:', error);
      toast({
        title: "Share failed",
        description: "Could not share this bicycle",
        variant: "destructive",
      });
    }
  };

  const getListedTime = (createdAt: Date | null) => {
    if (!createdAt) return 'Recently';
    try {
      return formatDistanceToNow(new Date(createdAt), { addSuffix: true });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Recently';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-semibold mb-2">Error Loading Bicycles</h3>
        <p className="text-muted-foreground">
          {error.message || "There was an error loading the bicycle listings. Please try again later."}
        </p>
      </div>
    );
  }

  if (!bicycles || !Array.isArray(bicycles)) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-semibold mb-2">No Bicycles Available</h3>
        <p className="text-muted-foreground">
          There are no bicycle listings to display at the moment.
        </p>
      </div>
    );
  }

  if (bicycles.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-semibold mb-2">No Bicycles Found</h3>
        <p className="text-muted-foreground">
          Try adjusting your filters or check back later for new listings
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {bicycles.map((bicycle) => (
        <Card key={bicycle.id} className="h-full hover:shadow-lg transition-shadow">
          <Link href={`/bicycles/${bicycle.id}`}>
            <CardHeader className="relative p-0">
              {bicycle.isPremium && (
                <Badge 
                  className="absolute top-3 right-3 z-10" 
                  variant="secondary"
                >
                  Premium
                </Badge>
              )}
              <BicycleImageCarousel 
                images={bicycle.images || [
                  "/default-bicycle-image.jpg"
                ]} 
              />
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <CardTitle className="text-xl truncate">
                  {bicycle.brand} {bicycle.model}
                </CardTitle>
              </div>
              <div className="flex items-center text-sm text-muted-foreground mb-4">
                <Clock className="w-4 h-4 mr-1" />
                <span>Listed {getListedTime(bicycle.createdAt)}</span>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Year</span>
                  <span>{bicycle.purchaseYear}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Type</span>
                  <span>{bicycle.cycleType}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Transmission</span>
                  <span>{bicycle.gearTransmission}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Frame</span>
                  <span>{bicycle.frameMaterial}</span>
                </div>
              </div>
            </CardContent>
          </Link>
          <CardFooter className="flex justify-between items-center p-6 border-t">
            <div className="flex items-center gap-3">
              <Badge variant={
                bicycle.condition === "Like New" ? "default" :
                bicycle.condition === "Good" ? "secondary" :
                "outline"
              }>
                {bicycle.condition}
              </Badge>
              <span className="text-xl font-semibold">
                ₹{bicycle.price?.toLocaleString() ?? 0}
              </span>
            </div>
            <div className="flex gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleShare(bicycle);
                }}
              >
                <Share2 className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (isInWishlist(bicycle.id)) {
                    removeFromWishlist(bicycle.id);
                    toast({
                      title: "Removed from wishlist",
                      description: "Bicycle removed from your wishlist"
                    });
                  } else {
                    addToWishlist(bicycle.id);
                    toast({
                      title: "Added to wishlist",
                      description: "Bicycle added to your wishlist"
                    });
                  }
                }}
              >
                <Heart
                  className={`h-5 w-5 ${
                    isInWishlist(bicycle.id) ? "fill-red-500 text-red-500" : ""
                  }`}
                />
              </Button>
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}