import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertBicycleSchema, type InsertBicycle } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface BicycleFormProps {
  onSubmit?: (data: InsertBicycle) => void;
  defaultValues?: Partial<InsertBicycle>;
}

export default function BicycleForm({ onSubmit, defaultValues }: BicycleFormProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showCustomBrand, setShowCustomBrand] = useState(false);

  console.log("BicycleForm mounted", { defaultValues, isAuthenticated: !!user });

  // Initialize form with default values
  const form = useForm<InsertBicycle>({
    resolver: zodResolver(insertBicycleSchema),
    defaultValues: {
      category: "Adult",
      brand: "",
      model: "",
      purchaseYear: new Date().getFullYear(),
      price: 0,
      gearTransmission: "Non-Geared",
      frameMaterial: "Steel",
      suspension: "None",
      condition: "Good",
      cycleType: "Hybrid",
      wheelSize: "26",
      hasReceipt: false,
      additionalDetails: "",
      images: [],
      ...defaultValues,
    }
  });

  // Autosave form data every 30 seconds
  useEffect(() => {
    const autosaveInterval = setInterval(() => {
      const formData = form.getValues();
      if (Object.keys(formData).length > 0) {
        console.log("Autosaving form data:", formData);
        localStorage.setItem('bicycleFormData', JSON.stringify({
          ...formData,
          previewUrls,
          imageFiles: Array.from(imageFiles)
        }));
      }
    }, 30000);

    return () => {
      clearInterval(autosaveInterval);
      // Final save on unmount
      const formData = form.getValues();
      if (Object.keys(formData).length > 0) {
        localStorage.setItem('bicycleFormData', JSON.stringify({
          ...formData,
          previewUrls,
          imageFiles: Array.from(imageFiles)
        }));
      }
    };
  }, [form, previewUrls, imageFiles]);

  // Load saved form data on mount
  useEffect(() => {
    const savedData = localStorage.getItem('bicycleFormData');
    if (savedData && !defaultValues) { // Only load if no default values provided
      try {
        console.log("Restoring saved form data");
        const parsedData = JSON.parse(savedData);
        form.reset(parsedData);
        if (parsedData.previewUrls) {
          setPreviewUrls(parsedData.previewUrls);
        }
        if (parsedData.imageFiles) {
          setImageFiles(parsedData.imageFiles);
        }
      } catch (error) {
        console.error("Error restoring form data:", error);
        localStorage.removeItem('bicycleFormData');
      }
    }
  }, [form, defaultValues]);

  const validateImage = (file: File): boolean => {
    console.log("Validating image file", { name: file.name, size: file.size, type: file.type });

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please upload only image files",
        variant: "destructive",
      });
      return false;
    }

    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "Image size should be less than 5MB",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleImageFiles = async (files: File[]) => {
    console.log("Handling image files", { fileCount: files.length });

    if (files.length + imageFiles.length > 5) {
      toast({
        title: "Too Many Images",
        description: "Maximum 5 images allowed",
        variant: "destructive",
      });
      return;
    }

    const validFiles = files.filter(file => validateImage(file));
    if (validFiles.length > 0) {
      setImageFiles(prev => [...prev, ...validFiles]);

      // Generate preview URLs
      validFiles.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrls(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: InsertBicycle) => {
      try {
        console.log("Starting form submission", { data, isAuthenticated: !!user });
        setIsUploading(true);

        // For authenticated users, enforce image requirement
        if (imageFiles.length === 0) {
          console.log("No images uploaded, showing error");
          toast({
            title: "Validation Error",
            description: "Please upload at least one image before listing.",
            variant: "destructive"
          });
          throw new Error("At least one image is required");
        }

        console.log("Uploading images", { imageCount: imageFiles.length });
        const imageUrls = await Promise.all(
          imageFiles.map(async (file) => {
            const formData = new FormData();
            formData.append('image', file);
            const res = await fetch('/api/upload', {
              method: 'POST',
              body: formData
            });
            if (!res.ok) throw new Error('Failed to upload image');
            const { url } = await res.json();
            return url;
          })
        );

        // Create bicycle listing with uploaded image URLs
        const finalData = {
          ...data,
          sellerId: user!.id,
          images: imageUrls
        };

        console.log("Submitting bicycle data:", finalData);

        const res = await apiRequest("/api/bicycles", {
          method: "POST",
          body: finalData
        });

        if (!res.ok) throw new Error('Failed to create listing');

        const newBicycle = await res.json();
        console.log("Listing created successfully", { bicycleId: newBicycle.id });
        return newBicycle;
      } catch (error) {
        console.error('Error in mutationFn:', error);
        throw error;
      } finally {
        setIsUploading(false);
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/bicycles"] });
      localStorage.removeItem('bicycleFormData'); // Clear saved form data

      toast({
        title: "Success!",
        description: "Your bicycle has been listed successfully.",
      });

      form.reset();
      setImageFiles([]);
      setPreviewUrls([]);

      // Redirect to the bicycle detail page
      setLocation(`/bicycles/${data.id}`);
    },
    onError: (error: Error) => {
      // Only show toast for errors other than the image validation error
      if (error.message !== "At least one image is required") {
        toast({
          title: "Error Creating Listing",
          description: error.message || "Failed to create listing. Please try again.",
          variant: "destructive",
        });
      }
    },
  });

  const watchCategory = form.watch("category");
  const watchBrand = form.watch("brand");

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) => {
          console.log("Form submitted in bicycle-form", { data, isAuthenticated: !!user });

          if (!user && onSubmit) {
            // For unauthenticated users, save form state and trigger parent handler
            console.log("Unauthenticated submission, saving draft and calling onSubmit");
            const formData = form.getValues();
            localStorage.setItem('bicycleFormData', JSON.stringify({
              ...formData,
              previewUrls,
              imageFiles: Array.from(imageFiles)
            }));
            onSubmit(data);
          } else if (user) {
            // For authenticated users, proceed with mutation
            console.log("Authenticated submission, calling mutate");
            mutate(data);
          }
        })}
        className="space-y-6"
      >
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Adult">Adult</SelectItem>
                  <SelectItem value="Kids">Kids</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="brand"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Brand</FormLabel>
              <Select
                onValueChange={(value) => {
                  field.onChange(value);
                  setShowCustomBrand(value === "Other");
                }}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select brand" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {BRANDS.map((brand) => (
                    <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {showCustomBrand && (
                <Input
                  placeholder="Enter brand name"
                  onChange={(e) => field.onChange(e.target.value)}
                  className="mt-2"
                />
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="model"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Model</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="purchaseYear"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Year of Purchase</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(parseInt(value))}
                defaultValue={field.value?.toString()}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {YEARS.map((year) => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Price (₹)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="condition"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Condition</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Fair">Fair</SelectItem>
                  <SelectItem value="Good">Good</SelectItem>
                  <SelectItem value="Like New">Like New</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Image Upload Section with validation message */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <FormLabel>Images (Upload up to 5 images)</FormLabel>
            {imageFiles.length === 0 && (
              <span className="text-sm text-destructive">*At least one image is required</span>
            )}
          </div>
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
              isUploading ? "opacity-50 cursor-not-allowed" : "hover:border-primary",
              imageFiles.length === 0 ? "border-destructive" : "border-border"
            )}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (!isUploading) {
                const files = Array.from(e.dataTransfer.files);
                handleImageFiles(files);
              }
            }}
            onClick={() => {
              if (!isUploading) {
                document.getElementById('image-input')?.click();
              }
            }}
          >
            <input
              id="image-input"
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files) {
                  handleImageFiles(Array.from(e.target.files));
                }
              }}
              disabled={isUploading}
            />
            <div className="flex flex-col items-center gap-2">
              {isUploading ? (
                <>
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <p>Uploading images...</p>
                </>
              ) : (
                <>
                  <p>Drag and drop images here or click to select</p>
                  <p className="text-sm text-muted-foreground">
                    Supported formats: JPG, PNG, GIF (max 5MB each)
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Image Previews */}
          {previewUrls.length > 0 && (
            <div className="grid grid-cols-3 gap-4 mt-4">
              {previewUrls.map((url, index) => (
                <div key={index} className="relative">
                  <img
                    src={url}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                    onClick={() => {
                      if (!isUploading) {
                        setPreviewUrls(prev => prev.filter((_, i) => i !== index));
                        setImageFiles(prev => prev.filter((_, i) => i !== index));
                      }
                    }}
                    disabled={isUploading}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <FormField
          control={form.control}
          name="gearTransmission"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Gear Transmission</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Gear Transmission" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Non-Geared">Non-Geared</SelectItem>
                  <SelectItem value="Geared">Geared</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="frameMaterial"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Frame Material</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Frame Material" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Steel">Steel</SelectItem>
                  <SelectItem value="Aluminum">Aluminum</SelectItem>
                  <SelectItem value="Carbon Fiber">Carbon Fiber</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="suspension"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Suspension</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Suspension" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="None">None</SelectItem>
                  <SelectItem value="Front">Front</SelectItem>
                  <SelectItem value="Full">Full</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="cycleType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cycle Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Cycle Type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Hybrid">Hybrid</SelectItem>
                  <SelectItem value="Mountain">Mountain</SelectItem>
                  <SelectItem value="Road">Road</SelectItem>
                  <SelectItem value="Cruiser">Cruiser</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="wheelSize"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Wheel Size</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Wheel Size" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="26">26</SelectItem>
                  <SelectItem value="27.5">27.5</SelectItem>
                  <SelectItem value="29">29</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="hasReceipt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Has Receipt</FormLabel>
              <FormControl>
                <Input
                  type="checkbox"
                  {...field}
                  onChange={(e) => field.onChange(e.target.checked)}
                  checked={field.value}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="additionalDetails"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Additional Details</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={isPending || isUploading}
          className="w-full"
          onClick={() => console.log("Submit button clicked")}
        >
          {isPending || isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isUploading ? "Uploading Images..." : "Creating Listing..."}
            </>
          ) : (
            "List Bicycle"
          )}
        </Button>
      </form>
    </Form>
  );
}

const BRANDS = [
  "Trek", "Giant", "Specialized", "Cannondale", "Scott",
  "Merida", "BMC", "Bianchi", "Other"
];

const YEARS = Array.from(
  { length: new Date().getFullYear() - 1999 },
  (_, i) => (new Date().getFullYear() - i).toString()
);