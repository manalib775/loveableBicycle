import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Bicycle } from "@shared/schema";
import Navbar from "@/components/navbar";
import BicycleGrid from "@/components/bicycle-grid";
import BicycleFilters from "@/components/bicycle-filters";
import { Loader2 } from "lucide-react";
import SEO from "@/components/seo";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FilterValues {
  brand?: string;
  yearOfPurchase?: string;
  condition?: string;
  gearTransmission?: string;
  frameMaterial?: string;
  suspension?: string;
  wheelSize?: string;
  minPrice?: number;
  maxPrice?: number;
  sellerType?: string;
}

export default function PremiumBicycles() {
  const [filters, setFilters] = useState<FilterValues>({});
  const [sortBy, setSortBy] = useState("newest");

  const { data: bicycles, isLoading } = useQuery<Bicycle[]>({
    queryKey: ["/api/bicycles", { isPremium: true }, filters, sortBy],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("isPremium", "true");
      if (filters.brand) params.append("brand", filters.brand);
      if (filters.yearOfPurchase) params.append("yearOfPurchase", filters.yearOfPurchase);
      if (filters.condition) params.append("condition", filters.condition);
      if (filters.gearTransmission) params.append("gearTransmission", filters.gearTransmission);
      if (filters.frameMaterial) params.append("frameMaterial", filters.frameMaterial);
      if (filters.suspension) params.append("suspension", filters.suspension);
      if (filters.wheelSize) params.append("wheelSize", filters.wheelSize);
      if (filters.minPrice) params.append("minPrice", filters.minPrice.toString());
      if (filters.maxPrice) params.append("maxPrice", filters.maxPrice.toString());
      if (filters.sellerType) params.append("sellerType", filters.sellerType);
      params.append("sortBy", sortBy);

      const res = await fetch(`/api/bicycles?${params}`);
      if (!res.ok) {
        const data = await res.json();
        // Add default images if none exist
        if (data && Array.isArray(data)) {
          data.forEach((bicycle: Bicycle) => {
            if (!bicycle.images || !bicycle.images.length) {
              bicycle.images = [
                "https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?q=80&w=800",
                "https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=800",
                "https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?q=80&w=800"
              ];
            }
          });
        }
        return data;
      }
      throw new Error("Failed to fetch premium bicycles");
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Premium Bicycles | High-End & Luxury Bikes for Sale | Pling"
        description="Explore our collection of premium bicycles. Find top-quality, high-performance bikes from renowned brands. Discover luxury cycling at its finest."
        canonicalUrl="/premium-bicycles"
        type="website"
      />
      <Navbar />

      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-primary to-primary/80 text-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Premium Bicycles
          </h1>
          <p className="text-lg md:text-xl opacity-90">
            Discover high-end bicycles for the passionate cyclist
          </p>
        </div>
      </div>

      {/* Breadcrumbs */}
      <div className="container mx-auto px-4 py-4">
        <nav className="text-sm text-muted-foreground" aria-label="Breadcrumb">
          <ol className="list-none p-0 inline-flex">
            <li className="flex items-center">
              <a href="/" className="hover:text-primary">Home</a>
              <span className="mx-2">/</span>
            </li>
            <li className="text-foreground">Premium Bicycles</li>
          </ol>
        </nav>
      </div>

      {/* Main Content with Sidebar Layout */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar Filters */}
          <aside className="md:w-64 flex-shrink-0">
            <h2 className="text-lg font-semibold mb-4">Filter Options</h2>
            <BicycleFilters
              onFilterChange={setFilters}
              onSortChange={setSortBy}
              category="Adult"
            />
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            <div className="mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-semibold">
                    Available Premium Bicycles
                  </h2>
                  <p className="text-muted-foreground">
                    High-quality bicycles priced above ₹15,000
                  </p>
                </div>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : bicycles?.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-xl font-semibold mb-2">No Premium Bicycles Found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your filters or check back later for new listings
                </p>
              </div>
            ) : (
              <BicycleGrid bicycles={bicycles || []} />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}