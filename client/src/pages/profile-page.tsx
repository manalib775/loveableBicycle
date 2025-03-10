import { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useWishlist } from "@/hooks/use-wishlist";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Bicycle } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  UserCircle,
  Bike,
  Heart,
  Map,
  Star,
  Clock,
  MessageCircle,
  Store,
  Upload,
  Camera,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import Navbar from "@/components/navbar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import React from 'react';

// Form validation schemas
const profileFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  mobile: z.string().min(10, "Invalid mobile number"),
  cityId: z.number().min(1, "Please select a city"),
  subCityId: z.number().optional(),
  businessName: z.string().optional(),
  businessDescription: z.string().optional(),
  businessPhone: z.string().optional(),
  businessAddress: z.string().optional(),
});

const passwordFormSchema = z.object({
  currentPassword: z.string().min(8, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type PasswordFormValues = z.infer<typeof passwordFormSchema>;

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  resetErrorBoundary = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error || new Error("Unknown error")}
          resetErrorBoundary={this.resetErrorBoundary}
        />
      );
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Something went wrong</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">{error.message}</p>
          <Button onClick={resetErrorBoundary}>Try again</Button>
        </CardContent>
      </Card>
    </div>
  );
}

interface CyclingProficiencyUpdate {
  cyclingProficiency: string;
}

export default function ProfilePage(): JSX.Element | null {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const { wishlist, removeFromWishlist } = useWishlist();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [, setLocation] = useLocation();

  // Form handling
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      mobile: user?.mobile || "",
      cityId: user?.cityId || 0,
      subCityId: user?.subCityId || 0,
      businessName: user?.businessName || "",
      businessDescription: user?.businessDescription || "",
      businessPhone: user?.businessPhone || "",
      businessAddress: user?.businessAddress || "",
    },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
    },
  });

  // Cities and sub-cities queries
  const { data: cities } = useQuery({
    queryKey: ["/api/admin/cities"],
    queryFn: async () => {
      const res = await fetch("/api/admin/cities");
      if (!res.ok) throw new Error("Failed to fetch cities");
      return res.json();
    },
  });

  const { data: subCities } = useQuery({
    queryKey: ["/api/admin/sub-cities", profileForm.watch("cityId")],
    enabled: !!profileForm.watch("cityId"),
    queryFn: async () => {
      const res = await fetch(
        `/api/admin/sub-cities?cityId=${profileForm.watch("cityId")}`
      );
      if (!res.ok) throw new Error("Failed to fetch sub-cities");
      return res.json();
    },
  });

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/auth");
      toast({
        title: "Authentication Required",
        description: "Please log in to view your profile",
        variant: "destructive",
      });
    }
  }, [user, authLoading, setLocation, toast]);

  // Reset form when user data is loaded
  useEffect(() => {
    if (user) {
      profileForm.reset({
        firstName: user.firstName,
        lastName: user.lastName,
        mobile: user.mobile,
        cityId: user.cityId || 0,
        subCityId: user.subCityId || 0,
        businessName: user.businessName,
        businessDescription: user.businessDescription,
        businessPhone: user.businessPhone,
        businessAddress: user.businessAddress,
      });
    }
  }, [user, profileForm]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const { data: wishlistBicycles, isLoading: isLoadingWishlist } = useQuery<
    Bicycle[]
  >({
    queryKey: ["/api/bicycles", { ids: Array.from(wishlist) }],
    enabled: wishlist.size > 0,
    queryFn: async () => {
      const ids = Array.from(wishlist).join(",");
      const res = await fetch(`/api/bicycles?ids=${ids}`);
      if (!res.ok) throw new Error("Failed to fetch wishlist");
      return res.json();
    },
  });

  const { data: userListings, isLoading: isLoadingListings } = useQuery<
    Bicycle[]
  >({
    queryKey: ["/api/bicycles", { sellerId: user?.id }],
    enabled: !!user,
    queryFn: async () => {
      const res = await fetch(`/api/bicycles?sellerId=${user?.id}`);
      if (!res.ok) throw new Error("Failed to fetch listings");
      return res.json();
    },
  });

  const updateBicycleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await fetch(`/api/bicycles/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
    },
    onSuccess: () => {
      toast({
        title: "Status Updated",
        description: "Bicycle status has been updated successfully.",
      });
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues | CyclingProficiencyUpdate) => {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update profile");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async (data: PasswordFormValues) => {
      const res = await fetch("/api/user/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update password");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Password Updated",
        description: "Your password has been updated successfully.",
      });
      passwordForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateProfileImageMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch("/api/user/profile-image", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to update profile image");
      const data = await res.json();
      return data.imageUrl;
    },
    onSuccess: (imageUrl) => {
      setProfileImage(imageUrl);
      toast({
        title: "Profile Image Updated",
        description: "Your profile image has been updated successfully.",
      });
    },
  });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const formData = new FormData();
      formData.append("image", file);
      updateProfileImageMutation.mutate(formData);
    }
  };

  return (
    <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin text-border" />}>
      <ErrorBoundary>
        <div className="min-h-screen bg-background">
          <Navbar />
          <main className="container max-w-7xl mx-auto px-4 py-8">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Sidebar */}
              <aside className="w-full lg:w-80 mb-8 lg:mb-0">
                <div className="lg:sticky lg:top-24 space-y-6">
                  <Card className="overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center text-center space-y-4">
                        <div className="relative">
                          <div className="w-32 h-32 rounded-full overflow-hidden bg-muted">
                            {profileImage ? (
                              <img
                                src={profileImage}
                                alt="Profile"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <UserCircle className="w-full h-full text-muted-foreground p-4" />
                            )}
                          </div>
                          <label
                            htmlFor="profile-image"
                            className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full cursor-pointer hover:bg-primary/90 shadow-lg"
                          >
                            <Camera className="h-4 w-4" />
                            <input
                              type="file"
                              id="profile-image"
                              className="hidden"
                              accept="image/*"
                              onChange={handleImageUpload}
                            />
                          </label>
                        </div>

                        <div className="space-y-2">
                          <h2 className="text-xl font-semibold">
                            {user.firstName} {user.lastName}
                          </h2>
                          <Badge variant={user.type === "institutional" ? "default" : "secondary"}>
                            {user.type === "institutional" ? "Business Seller" : "Individual Seller"}
                          </Badge>
                          {user.cyclingProficiency && (
                            <Badge variant="outline" className="mt-2">
                              {PROFICIENCY_LEVELS.find(level => level.value === user.cyclingProficiency)?.label}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Tabs defaultValue="profile" className="w-full">
                    <TabsList className="w-full flex flex-row lg:flex-col space-x-2 lg:space-x-0 lg:space-y-2 overflow-x-auto lg:overflow-x-visible">
                      <TabsTrigger value="profile" className="w-full justify-start gap-2 h-10">
                        <UserCircle className="h-4 w-4" />
                        Personal Info
                      </TabsTrigger>
                      {user.type === "institutional" && (
                        <TabsTrigger value="business" className="w-full justify-start gap-2 h-10">
                          <Store className="h-4 w-4" />
                          Business Profile
                        </TabsTrigger>
                      )}
                      <TabsTrigger value="listings" className="w-full justify-start gap-2 h-10">
                        <Bike className="h-4 w-4" />
                        My Listings
                      </TabsTrigger>
                      <TabsTrigger value="wishlist" className="w-full justify-start gap-2 h-10">
                        <Heart className="h-4 w-4" />
                        Wishlist
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </aside>

              {/* Main Content */}
              <div className="flex-1">
                <Tabs defaultValue="profile">
                  <TabsContent value="profile">
                    <div className="space-y-6">
                      {/* Personal Information Form */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Personal Information</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Form {...profileForm}>
                            <form onSubmit={profileForm.handleSubmit((data) => updateProfileMutation.mutate(data))}
                                  className="space-y-6">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormField
                                  control={profileForm.control}
                                  name="firstName"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>First Name</FormLabel>
                                      <FormControl>
                                        <Input {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={profileForm.control}
                                  name="lastName"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Last Name</FormLabel>
                                      <FormControl>
                                        <Input {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={profileForm.control}
                                  name="mobile"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Mobile</FormLabel>
                                      <FormControl>
                                        <Input {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={profileForm.control}
                                  name="cityId"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>City</FormLabel>
                                      <Select
                                        value={field.value?.toString()}
                                        onValueChange={(value) => field.onChange(parseInt(value))}
                                      >
                                        <FormControl>
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select a city" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          {cities?.map((city) => (
                                            <SelectItem key={city.id} value={city.id.toString()}>
                                              {city.name}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                {profileForm.watch("cityId") && (
                                  <FormField
                                    control={profileForm.control}
                                    name="subCityId"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Sub City</FormLabel>
                                        <Select
                                          value={field.value?.toString()}
                                          onValueChange={(value) => field.onChange(parseInt(value))}
                                        >
                                          <FormControl>
                                            <SelectTrigger>
                                              <SelectValue placeholder="Select a sub city" />
                                            </SelectTrigger>
                                          </FormControl>
                                          <SelectContent>
                                            {subCities?.map((subCity) => (
                                              <SelectItem key={subCity.id} value={subCity.id.toString()}>
                                                {subCity.name}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                )}
                              </div>
                              <Button
                                type="submit"
                                disabled={!profileForm.formState.isValid || updateProfileMutation.isPending}
                              >
                                {updateProfileMutation.isPending ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                  </>
                                ) : (
                                  "Save Changes"
                                )}
                              </Button>
                            </form>
                          </Form>
                        </CardContent>
                      </Card>

                      {/* Password Change Form */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Change Password</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Form {...passwordForm}>
                            <form onSubmit={passwordForm.handleSubmit((data) => updatePasswordMutation.mutate(data))}
                                  className="space-y-4">
                              <FormField
                                control={passwordForm.control}
                                name="currentPassword"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Current Password</FormLabel>
                                    <FormControl>
                                      <Input type="password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={passwordForm.control}
                                name="newPassword"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>New Password</FormLabel>
                                    <FormControl>
                                      <Input type="password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <Button
                                type="submit"
                                disabled={!passwordForm.formState.isValid || updatePasswordMutation.isPending}
                              >
                                {updatePasswordMutation.isPending ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Updating...
                                  </>
                                ) : (
                                  "Change Password"
                                )}
                              </Button>
                            </form>
                          </Form>
                        </CardContent>
                      </Card>

                      {/* Cycling Proficiency */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Cycling Proficiency</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {PROFICIENCY_LEVELS.map((level) => (
                              <div
                                key={level.value}
                                className={cn(
                                  "relative flex items-center space-x-4 rounded-lg border p-4 cursor-pointer hover:bg-accent transition-colors",
                                  user.cyclingProficiency === level.value && "border-primary"
                                )}
                                onClick={() =>
                                  updateProfileMutation.mutate({ cyclingProficiency: level.value })
                                }
                              >
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold">{level.label}</h3>
                                  <p className="text-sm text-muted-foreground mt-0.5">
                                    {level.description}
                                  </p>
                                </div>
                                {user.cyclingProficiency === level.value && (
                                  <Badge>Selected</Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  {/* Business Profile Tab */}
                  {user.type === "institutional" && (
                    <TabsContent value="business">
                      <Card>
                        <CardHeader>
                          <CardTitle>Business Profile</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Form {...profileForm}>
                            <form onSubmit={profileForm.handleSubmit((data) => updateProfileMutation.mutate(data))}
                                  className="space-y-6">
                              <FormField
                                control={profileForm.control}
                                name="businessName"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Business Name</FormLabel>
                                    <FormControl>
                                      <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={profileForm.control}
                                name="businessDescription"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Business Description</FormLabel>
                                    <FormControl>
                                      <Textarea {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={profileForm.control}
                                name="businessPhone"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Business Phone</FormLabel>
                                    <FormControl>
                                      <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={profileForm.control}
                                name="businessAddress"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Business Address</FormLabel>
                                    <FormControl>
                                      <Textarea {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <Button
                                type="submit"
                                disabled={!profileForm.formState.isValid || updateProfileMutation.isPending}
                              >
                                {updateProfileMutation.isPending ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                  </>
                                ) : (
                                  "Save Business Profile"
                                )}
                              </Button>
                            </form>
                          </Form>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  )}

                  {/* Listings Tab */}
                  <TabsContent value="listings">
                    {isLoadingListings ? (
                      <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin" />
                      </div>
                    ) : !userListings?.length ? (
                      <Card>
                        <CardContent className="text-center py-12">
                          <Bike className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                          <p className="text-muted-foreground">
                            You haven't listed any bicycles yet.
                          </p>
                          <Button className="mt-4" asChild>
                            <a href="/sell">List a Bicycle</a>
                          </Button>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="space-y-4">
                        {userListings.map((bicycle) => (
                          <Card key={bicycle.id} className="overflow-hidden">
                            <CardContent className="p-6">
                              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                <img
                                  src={bicycle.images?.[0] || "https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=800"}
                                  alt={`${bicycle.brand} ${bicycle.model}`}
                                  className="w-full sm:w-24 h-24 object-cover rounded-md"
                                />
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-xl font-semibold truncate">
                                    {bicycle.brand} {bicycle.model}
                                  </h3>
                                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-1">
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-4 w-4" />
                                      Listed {format(new Date(bicycle.createdAt || Date.now()), "MMM d, yyyy")}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <MessageCircle className="h-4 w-4" />
                                      {bicycle.inquiries || 0} Inquiries
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Star className="h-4 w-4" />
                                      {bicycle.views || 0} Views
                                    </div>
                                  </div>
                                </div>
                                <Select
                                  value={bicycle.status || "available"}
                                  onValueChange={(value) =>
                                    updateBicycleStatusMutation.mutate({
                                      id: bicycle.id,
                                      status: value,
                                    })
                                  }
                                >
                                  <SelectTrigger className="w-[140px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="available">Available</SelectItem>
                                    <SelectItem value="sold">Sold</SelectItem>
                                    <SelectItem value="reserved">Reserved</SelectItem>
                                    <SelectItem value="unlisted">Unlisted</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <Separator className="my-4" />

                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Price</span>
                                  <p className="font-medium">₹{bicycle.price.toLocaleString()}</p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Condition</span>
                                  <p className="font-medium">{bicycle.condition}</p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Category</span>
                                  <p className="font-medium">{bicycle.category}</p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Frame</span>
                                  <p className="font-medium">{bicycle.frameMaterial}</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  {/* Wishlist Tab */}
                  <TabsContent value="wishlist">
                    {isLoadingWishlist ? (
                      <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin" />
                      </div>
                    ) : !wishlistBicycles?.length ? (
                      <Card>
                        <CardContent className="text-center py-12">
                          <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                          <p className="text-muted-foreground">
                            Your wishlist is empty. Browse bicycles and add them to your wishlist!
                          </p>
                          <Button className="mt-4" asChild>
                            <a href="/">Browse Bicycles</a>
                          </Button>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {wishlistBicycles.map((bicycle) => (
                          <Card key={bicycle.id} className="overflow-hidden">
                            <div className="aspect-square relative">
                              <img
                                src={bicycle.images?.[0] || "https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=800"}
                                alt={`${bicycle.brand} ${bicycle.model}`}
                                className="w-full h-full object-cover"
                              />
                              <Button
                                variant="destructive"
                                size="icon"
                                className="absolute top-2 right-2"
                                onClick={() => {
                                  removeFromWishlist(bicycle.id);
                                  toast({
                                    title: "Removed from wishlist",
                                    description: "Bicycle removed from your wishlist",
                                  });
                                }}
                              >
                                <Heart className="h-5 w-5 fill-current" />
                              </Button>
                            </div>
                            <CardContent className="p-4">
                              <h3 className="font-semibold truncate">
                                {bicycle.brand} {bicycle.model}
                              </h3>
                              <p className="text-lg font-semibold mt-2">
                                ₹{bicycle.price?.toLocaleString() ?? 0}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant={
                                  bicycle.condition === "Like New" ? "default" :
                                    bicycle.condition === "Good" ? "secondary" :
                                      "outline"
                                }>
                                  {bicycle.condition}
                                </Badge>
                                <Badge variant="outline">{bicycle.category}</Badge>
                              </div>
                              <Button
                                className="w-full mt-4"
                                asChild
                              >
                                <a href={`/bicycles/${bicycle.id}`}>View Details</a>
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </main>
        </div>
      </ErrorBoundary>
    </Suspense>
  );
}

const PROFICIENCY_LEVELS = [
  {
    value: "occasional",
    label: "Occasional Rider",
    description: "You ride a bicycle occasionally for leisure or short trips",
  },
  {
    value: "regular",
    label: "Regular Rider",
    description: "You ride frequently and are comfortable with most terrains",
  },
  {
    value: "professional",
    label: "Professional Rider",
    description: "You're an expert cyclist with advanced skills and experience",
  },
];