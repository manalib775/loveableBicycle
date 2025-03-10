import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Bicycle } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Heart, Share2, Phone, ArrowLeft, Mail } from "lucide-react";
import { useWishlist } from "@/hooks/use-wishlist";
import { formatDistanceToNow } from "date-fns";
import BicycleImageCarousel from "@/components/bicycle-image-carousel";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/navbar";
import SEO from "@/components/seo";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useLocation } from 'wouter';

const DEFAULT_IMAGES = [
  "https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?q=80&w=800",
  "https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=800",
  "https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?q=80&w=800"
];

export default function BicycleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { user } = useAuth();
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [showSellerDetails, setShowSellerDetails] = useState(false);
  const [location, setLocation] = useLocation();

  const { data: bicycle, isLoading, error } = useQuery<Bicycle>({
    queryKey: ["/api/bicycles", parseInt(id)],
    enabled: !!id && !isNaN(parseInt(id)),
  });

  // Similar bicycles query
  const { data: similarBicycles } = useQuery<Bicycle[]>({
    queryKey: ["/api/bicycles", { category: bicycle?.category }],
    enabled: !!bicycle?.category,
  });

  const contactSellerMutation = useMutation({
    mutationFn: async () => {
      if (!user || !bicycle) return;

      const res = await fetch('/api/contact-seller', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bicycleId: bicycle.id,
          buyerId: user.id
        })
      });

      if (!res.ok) {
        throw new Error('Failed to send contact request');
      }

      return res.json();
    },
    onSuccess: () => {
      setShowSellerDetails(true);
      toast({
        title: "Contact Details Available",
        description: "Seller's contact information has been sent to your email.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleContact = () => {
    if (!user) {
      setShowContactDialog(true);
      return;
    }
    contactSellerMutation.mutate();
  };

  const handleShare = async () => {
    if (!bicycle) return;
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !bicycle) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Link href="/" className="inline-flex items-center text-sm mb-6 hover:text-primary">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to listings
          </Link>
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">Error Loading Bicycle</h1>
            <p className="text-muted-foreground">
              Unable to load bicycle details. Please try again later.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const filteredSimilarBicycles = similarBicycles
    ?.filter((b) => b.id !== bicycle.id)
    .slice(0, 4);

  const getListedTime = (createdAt: Date | null) => {
    if (!createdAt) return 'Recently';
    try {
      return formatDistanceToNow(new Date(createdAt), { addSuffix: true });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Recently';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={`${bicycle.brand} ${bicycle.model} - ${bicycle.condition} ${bicycle.cycleType} Bicycle | Pling`}
        description={`${bicycle.condition} ${bicycle.cycleType} bicycle. ${bicycle.brand} ${bicycle.model}, ${bicycle.purchaseYear}. ${bicycle.additionalDetails || ""}`}
        canonicalUrl={`/bicycles/${bicycle.id}`}
        imageUrl={bicycle.images?.[0]}
        type="product"
      />
      <Navbar />
      <main className="container mx-auto px-4 py-6 md:py-8">
        <Link
          href="/"
          className="inline-flex items-center text-sm mb-6 hover:text-primary"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to listings
        </Link>

        <div className="grid md:grid-cols-2 gap-6 md:gap-8">
          {/* Left Column - Images */}
          <div>
            <BicycleImageCarousel
              images={bicycle.images?.length ? bicycle.images : DEFAULT_IMAGES}
              thumbnailSize={false}
            />
          </div>

          {/* Right Column - Details */}
          <div className="space-y-6">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold">
                    {bicycle.brand} {bicycle.model}
                  </h1>
                  <p className="text-xl md:text-2xl font-semibold mt-2">
                    ₹{bicycle.price?.toLocaleString() ?? "Price not available"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Listed {getListedTime(bicycle.createdAt)}
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" size="icon" onClick={handleShare}>
                    <Share2 className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      if (isInWishlist(bicycle.id)) {
                        removeFromWishlist(bicycle.id);
                      } else {
                        addToWishlist(bicycle.id);
                      }
                    }}
                  >
                    <Heart
                      className={`h-5 w-5 ${
                        isInWishlist(bicycle.id)
                          ? "fill-red-500 text-red-500"
                          : ""
                      }`}
                    />
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Category</p>
                <p className="font-medium">{bicycle.category}</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Year</p>
                <p className="font-medium">{bicycle.purchaseYear}</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Transmission</p>
                <p className="font-medium">{bicycle.gearTransmission}</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Frame</p>
                <p className="font-medium">{bicycle.frameMaterial}</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Suspension</p>
                <p className="font-medium">{bicycle.suspension}</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Condition</p>
                <Badge
                  variant={
                    bicycle.condition === "Like New"
                      ? "default"
                      : bicycle.condition === "Good"
                        ? "secondary"
                        : "outline"
                  }
                >
                  {bicycle.condition}
                </Badge>
              </div>
            </div>

            {bicycle.additionalDetails && (
              <Card className="p-4">
                <h2 className="font-semibold mb-2">Additional Details</h2>
                <p className="text-sm text-muted-foreground">
                  {bicycle.additionalDetails}
                </p>
              </Card>
            )}

            {showSellerDetails ? (
              <Card className="p-4">
                <h2 className="font-semibold mb-4">Seller Details</h2>
                <div className="space-y-2">
                  <p className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {bicycle.seller.mobile}
                  </p>
                  <p className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {bicycle.seller.email}
                  </p>
                  {bicycle.seller.businessName && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Business: {bicycle.seller.businessName}
                    </p>
                  )}
                </div>
              </Card>
            ) : (
              <Button
                size="lg"
                className="w-full"
                onClick={handleContact}
                disabled={contactSellerMutation.isPending}
              >
                {contactSellerMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Phone className="mr-2 h-5 w-5" />
                    Contact Seller
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {filteredSimilarBicycles && filteredSimilarBicycles.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">Similar Bicycles</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredSimilarBicycles.map((similarBicycle) => (
                <Link
                  key={similarBicycle.id}
                  href={`/bicycles/${similarBicycle.id}`}
                >
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <div className="p-4">
                      <BicycleImageCarousel 
                        images={similarBicycle.images?.length ? similarBicycle.images : DEFAULT_IMAGES} 
                      />
                      <h3 className="mt-4 font-semibold">
                        {similarBicycle.brand} {similarBicycle.model}
                      </h3>
                      <p className="text-lg font-semibold mt-2">
                        ₹{similarBicycle.price.toLocaleString()}
                      </p>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

      <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign in to Contact Seller</DialogTitle>
            <DialogDescription>
              Please sign in or create an account to view seller's contact information.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <Button
              onClick={() => {
                setLocation(`/auth?redirect=/bicycles/${id}`);
              }}
              className="w-full"
            >
              Continue to Sign In
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowContactDialog(false)}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}