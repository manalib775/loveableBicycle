import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bicycle } from "@shared/schema";
import Navbar from "@/components/navbar";
import BicycleGrid from "@/components/bicycle-grid";
import LocationDialog from "@/components/location-dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import Footer from "@/components/footer";
import { useLocation } from "@/hooks/use-location";
import { useLocation as useWouterLocation } from "wouter";
import BicycleFilters from "@/components/bicycle-filters";

const BANNER_IMAGES = [
  {
    url: "https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?q=80&w=1920&h=500&fit=crop",
    title: "Find Your Perfect Ride",
    subtitle: "Explore our curated collection of premium bicycles",
    width: 1920,
    height: 500
  },
  {
    url: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=1920&h=500&fit=crop",
    title: "Quality Assured",
    subtitle: "Every bicycle is verified by our experts",
    width: 1920,
    height: 500
  },
  {
    url: "https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?q=80&w=1920&h=500&fit=crop",
    title: "Sell With Confidence",
    subtitle: "Join our trusted community of sellers",
    width: 1920,
    height: 500
  }
];

export default function HomePage() {
  const [showLocationDialog, setShowLocationDialog] = useState(() => {
    return !localStorage.getItem('userCity');
  });

  const { city, setCity } = useLocation();
  const [currentBanner, setCurrentBanner] = useState(0);
  const nextBanner = (currentBanner + 1) % BANNER_IMAGES.length;
  const [location, setLocation] = useWouterLocation();

  const { data: bicycles, isLoading } = useQuery<Bicycle[]>({
    queryKey: ["/api/bicycles", city],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (city) params.append("city", city);
      const res = await fetch(`/api/bicycles?${params}`);
      return res.json();
    },
  });

  // Auto-rotate banner
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBanner((current) =>
        current === BANNER_IMAGES.length - 1 ? 0 : current + 1
      );
    }, 5000); // Change every 5 seconds

    return () => clearInterval(timer);
  }, []);

  // Preload next banner image
  useEffect(() => {
    const img = new Image();
    img.src = BANNER_IMAGES[nextBanner].url;
  }, [currentBanner, nextBanner]);


  return (
    <div className="min-h-screen bg-background">
      <header>
        <Navbar />
      </header>

      {/* Hero Section with Moving Banner */}
      <section 
        className="relative h-[500px] overflow-hidden"
        aria-label="Featured bicycle collections"
      >
        {BANNER_IMAGES.map((banner, index) => (
          <div
            key={index}
            role="img"
            aria-label={banner.title}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              currentBanner === index ? "opacity-100" : "opacity-0"
            }`}
          >
            <img 
              src={banner.url}
              alt={banner.title}
              width={banner.width}
              height={banner.height}
              loading={index === 0 ? "eager" : "lazy"}
              className="absolute inset-0 w-full h-full object-cover"
              style={{
                opacity: 0.7,
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-black/30" />
            <div className="container mx-auto px-4 h-full flex flex-col justify-center text-white relative z-10">
              <h1 className="text-4xl md:text-6xl font-bold mb-4">
                {banner.title}
              </h1>
              <p className="text-lg md:text-xl mb-8">{banner.subtitle}</p>
              <div className="flex gap-4">
                <Button 
                  size="lg" 
                  variant="default"
                  aria-label="Browse available bicycles"
                  onClick={() => window.scrollTo({ top: document.getElementById('featured-bicycles')?.offsetTop || 0, behavior: 'smooth' })}
                >
                  Browse Bicycles
                </Button>
                <Button 
                  size="lg" 
                  variant="secondary"
                  aria-label="List your bicycle for sale"
                  onClick={() => setLocation('/sell')}
                >
                  Sell Your Bicycle
                </Button>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Location Badge */}
      {city && (
        <div className="bg-muted py-2" role="region" aria-label="Current location">
          <div className="container mx-auto px-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Location:</span>
              <span className="text-sm font-medium">{city}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowLocationDialog(true)}
              aria-label="Change location"
            >
              Change
            </Button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <section className="mb-12" aria-labelledby="featured-bicycles">
          <h2 id="featured-bicycles" className="text-2xl font-bold mb-6">Featured Bicycles</h2>
          {isLoading ? (
            <div className="flex justify-center py-12" role="status" aria-label="Loading bicycles">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="sr-only">Loading bicycles...</span>
            </div>
          ) : (
            <BicycleGrid bicycles={bicycles || []} />
          )}
        </section>

        {/* Features Section */}
        <section className="mb-12 py-12 bg-muted rounded-lg" aria-labelledby="why-choose">
          <div className="container mx-auto px-4">
            <h2 id="why-choose" className="text-2xl font-bold mb-8 text-center">
              Why Choose Pling?
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <article>
                <h3 className="font-semibold mb-2">Verified Sellers</h3>
                <p className="text-muted-foreground">
                  Every seller is verified to ensure a safe buying experience
                </p>
              </article>
              <article>
                <h3 className="font-semibold mb-2">Quality Assurance</h3>
                <p className="text-muted-foreground">
                  Each bicycle undergoes a thorough quality check
                </p>
              </article>
              <article>
                <h3 className="font-semibold mb-2">Secure Transactions</h3>
                <p className="text-muted-foreground">
                  Safe and secure payment options for peace of mind
                </p>
              </article>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />

      {/* Location Dialog */}
      <LocationDialog
        open={showLocationDialog}
        onOpenChange={setShowLocationDialog}
        onLocationSelect={(selectedCity) => {
          setCity(selectedCity);
          setShowLocationDialog(false);
        }}
      />
    </div>
  );
}