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

export default function KidsBicycles() {
  const [filters, setFilters] = useState<FilterValues>({});
  const [sortBy, setSortBy] = useState("newest");

  const { data: bicycles, isLoading } = useQuery<Bicycle[]>({
    queryKey: ["/api/bicycles", { category: "Kids" }, filters, sortBy],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("category", "Kids");

      // Add all filters to params
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });

      // Add sorting parameter
      params.append("sortBy", sortBy);

      const res = await fetch(`/api/bicycles?${params}`);
      if (!res.ok) {
        console.error("Failed to fetch kids bicycles:", await res.text());
        throw new Error("Failed to fetch kids bicycles");
      }
      return res.json();
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Kids Bicycles for Sale | Safe and Fun Bicycles for Young Riders | Pling"
        description="Browse our selection of high-quality kids bicycles. Safe, durable, and fun bikes perfect for young riders. Find the perfect bicycle for your child."
        canonicalUrl="/kids-bicycles"
        type="website"
      />
      <Navbar />

      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-primary to-primary/80 text-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Kids Bicycles
          </h1>
          <p className="text-lg md:text-xl opacity-90">
            Safe and fun bicycles for young riders
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
            <li className="text-foreground">Kids Bicycles</li>
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
              category="Kids"
            />
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            <div className="mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-semibold">
                    Available Kids Bicycles
                  </h2>
                  <p className="text-muted-foreground">
                    Quality bicycles for children of all ages
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
                <h3 className="text-xl font-semibold mb-2">No Kids Bicycles Found</h3>
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