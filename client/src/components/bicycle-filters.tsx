import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface BicycleFiltersProps {
  className?: string;
  onFilterChange?: (filters: FilterValues) => void;
  onSortChange?: (sortBy: string) => void;
  category?: 'Adult' | 'Kids';
}

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
  sortBy?: string;
  sellerType?: string;
}

const BRANDS = [
  "Hero",
  "Firefox",
  "Hercules",
  "Atlas",
  "Giant",
  "Trek",
  "Schwinn",
  "Other"
];

const WHEEL_SIZES_KIDS = [
  "12 inch",
  "14 inch",
  "16 inch",
  "20 inch",
  "24 inch"
];

const WHEEL_SIZES_ADULT = [
  "26 inch",
  "27.5 inch",
  "29 inch",
  "700c"
];

export default function BicycleFilters({
  className,
  onFilterChange = () => {},
  onSortChange = () => {},
  category = 'Adult'
}: BicycleFiltersProps) {
  const [filters, setFilters] = useState<FilterValues>({});
  const [priceRange, setPriceRange] = useState([0, 50000]);

  const handleFilterChange = (key: keyof FilterValues, value: string | number | undefined) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const wheelSizes = category === 'Kids' ? WHEEL_SIZES_KIDS : WHEEL_SIZES_ADULT;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Brand Filter */}
      <div className="space-y-2">
        <Label htmlFor="brand-select">Brand</Label>
        <Select
          onValueChange={(value) => handleFilterChange("brand", value)}
          value={filters.brand}
        >
          <SelectTrigger id="brand-select">
            <SelectValue placeholder="Select brand" />
          </SelectTrigger>
          <SelectContent>
            {BRANDS.map((brand) => (
              <SelectItem key={brand} value={brand}>
                {brand}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Price Range Section */}
      <div className="space-y-4" role="group" aria-labelledby="price-range-label">
        <h3 id="price-range-label" className="text-sm font-medium">Price Range (₹)</h3>
        <div className="pt-2">
          <Slider
            min={0}
            max={50000}
            step={1000}
            value={priceRange}
            onValueChange={(value) => {
              setPriceRange(value);
              handleFilterChange("minPrice", value[0]);
              handleFilterChange("maxPrice", value[1]);
            }}
            className="w-full"
            aria-label="Price range"
          />
        </div>
        <div className="flex gap-4">
          <div className="space-y-2 flex-1">
            <Label htmlFor="min-price">Min</Label>
            <Input
              id="min-price"
              type="number"
              value={priceRange[0]}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                setPriceRange([value, priceRange[1]]);
                handleFilterChange("minPrice", value);
              }}
            />
          </div>
          <div className="space-y-2 flex-1">
            <Label htmlFor="max-price">Max</Label>
            <Input
              id="max-price"
              type="number"
              value={priceRange[1]}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                setPriceRange([priceRange[0], value]);
                handleFilterChange("maxPrice", value);
              }}
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Year of Purchase */}
      <div className="space-y-2">
        <Label htmlFor="year-select">Year of Purchase</Label>
        <Select
          onValueChange={(value) => handleFilterChange("yearOfPurchase", value)}
          value={filters.yearOfPurchase}
        >
          <SelectTrigger id="year-select">
            <SelectValue placeholder="Select year" />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i).map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Condition */}
      <div className="space-y-2">
        <Label htmlFor="condition-select">Condition</Label>
        <Select
          onValueChange={(value) => handleFilterChange("condition", value)}
          value={filters.condition}
        >
          <SelectTrigger id="condition-select">
            <SelectValue placeholder="Select condition" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Like New">Like New</SelectItem>
            <SelectItem value="Good">Good</SelectItem>
            <SelectItem value="Fair">Fair</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Transmission */}
      <div className="space-y-2">
        <Label htmlFor="transmission-select">Transmission</Label>
        <Select
          onValueChange={(value) => handleFilterChange("gearTransmission", value)}
          value={filters.gearTransmission}
        >
          <SelectTrigger id="transmission-select">
            <SelectValue placeholder="Select transmission" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Non-Geared">Non-Geared</SelectItem>
            <SelectItem value="Multi-Speed">Multi-Speed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Frame Material */}
      <div className="space-y-2">
        <Label htmlFor="frame-select">Frame Material</Label>
        <Select
          onValueChange={(value) => handleFilterChange("frameMaterial", value)}
          value={filters.frameMaterial}
        >
          <SelectTrigger id="frame-select">
            <SelectValue placeholder="Select material" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Steel">Steel</SelectItem>
            <SelectItem value="Aluminum">Aluminum</SelectItem>
            <SelectItem value="Carbon Fiber">Carbon Fiber</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Wheel Size */}
      <div className="space-y-2">
        <Label htmlFor="wheel-size-select">Wheel Size</Label>
        <Select
          onValueChange={(value) => handleFilterChange("wheelSize", value)}
          value={filters.wheelSize}
        >
          <SelectTrigger id="wheel-size-select">
            <SelectValue placeholder="Select wheel size" />
          </SelectTrigger>
          <SelectContent>
            {wheelSizes.map((size) => (
              <SelectItem key={size} value={size}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Suspension */}
      <div className="space-y-2">
        <Label htmlFor="suspension-select">Suspension</Label>
        <Select
          onValueChange={(value) => handleFilterChange("suspension", value)}
          value={filters.suspension}
        >
          <SelectTrigger id="suspension-select">
            <SelectValue placeholder="Select suspension" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="No Suspension">No Suspension</SelectItem>
            <SelectItem value="Front Suspension">Front Suspension</SelectItem>
            <SelectItem value="Full Suspension">Full Suspension</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Seller Type */}
      <div className="space-y-2">
        <Label htmlFor="seller-type-select">Seller Type</Label>
        <Select
          onValueChange={(value) => handleFilterChange("sellerType", value)}
          value={filters.sellerType}
        >
          <SelectTrigger id="seller-type-select">
            <SelectValue placeholder="Select seller type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sellers</SelectItem>
            <SelectItem value="certified">Certified Sellers Only</SelectItem>
            <SelectItem value="individual">Individual Sellers Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button
        variant="outline"
        className="w-full"
        onClick={() => {
          setFilters({});
          setPriceRange([0, 50000]);
          onFilterChange({});
        }}
      >
        Clear Filters
      </Button>
    </div>
  );
}