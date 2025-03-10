import { Link } from "wouter";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Menu, MapPin, Filter } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useLocation } from "@/hooks/use-location";
import LocationDialog from "@/components/location-dialog";
import BicycleFilters from "@/components/bicycle-filters";

export default function Navbar() {
  const { user, logoutMutation } = useAuth();
  const { requestLocation, hasPermission, loading, city } = useLocation();
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const logo = user?.organizationLogo ?? "/logo.svg";

  return (
    <div className="sticky top-0 z-50 bg-white shadow-sm">
      {/* Main Navigation */}
      <nav className="border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Mobile Menu Button */}
            <Sheet>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon" className="mr-2">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle>Menu & Filters</SheetTitle>
                </SheetHeader>
                <div className="py-4">
                  {/* Mobile Navigation Links */}
                  <div className="space-y-4">
                    <Link href="/blogs">
                      <a className="block px-4 py-2 text-sm hover:bg-gray-100">Blog</a>
                    </Link>
                    <Link href="/premium">
                      <a className="block px-4 py-2 text-sm hover:bg-gray-100">Premium Bicycles</a>
                    </Link>
                    <Link href="/adult">
                      <a className="block px-4 py-2 text-sm hover:bg-gray-100">Adult Bicycles</a>
                    </Link>
                    <Link href="/kids">
                      <a className="block px-4 py-2 text-sm hover:bg-gray-100">Kids Bicycles</a>
                    </Link>
                    <Link href="/certified">
                      <a className="block px-4 py-2 text-sm hover:bg-gray-100">Certified Sellers</a>
                    </Link>
                  </div>

                  {/* Mobile Filters Section */}
                  <div className="mt-6 border-t pt-6">
                    <h3 className="px-4 text-sm font-medium mb-4 flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      Filters
                    </h3>
                    <div className="px-4">
                      <BicycleFilters className="md:hidden" />
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {/* Logo */}
            <Link href="/">
              <a className="flex items-center">
                <img
                  src={logo}
                  alt="Pling!"
                  className="h-8 w-auto"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.src = "/logo.svg";
                  }}
                />
              </a>
            </Link>

            {/* Search with Location */}
            <div className="flex-1 max-w-md mx-4 relative">
              <div className="relative flex items-center">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search bicycles..."
                  className="w-full pl-10 pr-24"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 flex items-center gap-1.5 px-3"
                  onClick={() => setShowLocationDialog(true)}
                >
                  <MapPin
                    className={cn(
                      "h-4 w-4",
                      city ? "text-primary" : "text-gray-400",
                      loading && "animate-pulse",
                    )}
                  />
                  <span className="text-sm truncate max-w-[100px]">
                    {city || "Select Location"}
                  </span>
                </Button>
              </div>
            </div>

            {/* Auth buttons */}
            <div className="hidden md:flex items-center gap-4">
              {user ? (
                <>
                  <Link href="/profile">
                    <Button variant="ghost" className="flex items-center gap-2">
                      Profile
                    </Button>
                  </Link>
                  {user.isAdmin && (
                    <Link href="/admin">
                      <Button variant="ghost">Admin Dashboard</Button>
                    </Link>
                  )}
                  <Button variant="ghost" onClick={() => logoutMutation.mutate()}>
                    Logout
                  </Button>
                </>
              ) : (
                <Link href="/auth">
                  <Button variant="ghost">Login / Register</Button>
                </Link>
              )}
              {/* Always show Sell Bicycle button */}
              <Link href="/sell">
                <Button variant="default">Sell Bicycle</Button>
              </Link>
            </div>

            {/* Mobile Auth Button */}
            <div className="md:hidden">
              {user ? (
                <Link href="/profile">
                  <Button variant="ghost" size="sm">
                    Profile
                  </Button>
                </Link>
              ) : (
                <Link href="/sell">
                  <Button variant="ghost" size="sm">
                    Sell
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Categories Navigation - Hidden on Mobile */}
      <div className="border-b hidden md:block">
        <div className="container mx-auto px-4">
          <div className="flex items-center space-x-8 h-12">
            <Link href="/blogs">
              <a className="text-sm font-medium hover:text-primary">Blog</a>
            </Link>
            <Link href="/premium">
              <a className="text-sm font-medium hover:text-primary">Premium Bicycles</a>
            </Link>
            <Link href="/adult">
              <a className="text-sm font-medium hover:text-primary">Adult Bicycles</a>
            </Link>
            <Link href="/kids">
              <a className="text-sm font-medium hover:text-primary">Kids Bicycles</a>
            </Link>
            <Link href="/certified">
              <a className="text-sm font-medium hover:text-primary">Certified Sellers</a>
            </Link>
          </div>
        </div>
      </div>

      {/* Location Dialog */}
      <LocationDialog
        open={showLocationDialog}
        onOpenChange={setShowLocationDialog}
        onLocationSelect={(selectedCity) => {
          setShowLocationDialog(false);
        }}
      />
    </div>
  );
}