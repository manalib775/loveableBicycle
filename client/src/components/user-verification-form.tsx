import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { insertUserSchema } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Check, Upload } from "lucide-react";

const verificationSchema = insertUserSchema.pick({ 
  aadhaarNumber: true 
}).extend({
  aadhaarFrontImage: insertUserSchema.shape.aadhaarFrontImage,
  aadhaarBackImage: insertUserSchema.shape.aadhaarBackImage,
});

type VerificationFormData = {
  aadhaarNumber: string;
  aadhaarFrontImage: string;
  aadhaarBackImage: string;
};

export function UserVerificationForm() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [frontImagePreview, setFrontImagePreview] = useState<string>("");
  const [backImagePreview, setBackImagePreview] = useState<string>("");

  const form = useForm<VerificationFormData>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      aadhaarNumber: "",
      aadhaarFrontImage: "",
      aadhaarBackImage: "",
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async (data: VerificationFormData) => {
      const response = await apiRequest("/api/verify-identity", {
        method: "POST",
        body: data,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Verification submitted",
        description: "Your identity verification request has been submitted for review.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Verification failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    side: "front" | "back"
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      if (side === "front") {
        setFrontImagePreview(base64String);
        form.setValue("aadhaarFrontImage", base64String);
      } else {
        setBackImagePreview(base64String);
        form.setValue("aadhaarBackImage", base64String);
      }
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = (data: VerificationFormData) => {
    verifyMutation.mutate(data);
  };

  if (!user) return null;

  // Show different states based on verification status
  if (user.isIdentityVerified) {
    return (
      <div className="p-6 bg-green-50 rounded-lg">
        <div className="flex items-center gap-2 text-green-600">
          <Check className="w-5 h-5" />
          <span>Your identity has been verified</span>
        </div>
      </div>
    );
  }

  if (user.verificationStatus === "pending") {
    return (
      <div className="p-6 bg-yellow-50 rounded-lg">
        <p className="text-yellow-600">
          Your verification is pending review. We'll notify you once it's approved.
        </p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="aadhaarNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Aadhaar Number</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Enter your 12-digit Aadhaar number"
                  maxLength={12}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="aadhaarFrontImage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Aadhaar Front Image</FormLabel>
                <FormControl>
                  <div className="flex flex-col items-center gap-4">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, "front")}
                      className="hidden"
                      id="frontImage"
                    />
                    <label
                      htmlFor="frontImage"
                      className="flex flex-col items-center gap-2 p-4 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary"
                    >
                      {frontImagePreview ? (
                        <img
                          src={frontImagePreview}
                          alt="Aadhaar front preview"
                          className="w-full max-w-xs rounded"
                        />
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-gray-400" />
                          <span>Upload front image</span>
                        </>
                      )}
                    </label>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="aadhaarBackImage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Aadhaar Back Image</FormLabel>
                <FormControl>
                  <div className="flex flex-col items-center gap-4">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, "back")}
                      className="hidden"
                      id="backImage"
                    />
                    <label
                      htmlFor="backImage"
                      className="flex flex-col items-center gap-2 p-4 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary"
                    >
                      {backImagePreview ? (
                        <img
                          src={backImagePreview}
                          alt="Aadhaar back preview"
                          className="w-full max-w-xs rounded"
                        />
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-gray-400" />
                          <span>Upload back image</span>
                        </>
                      )}
                    </label>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button
          type="submit"
          disabled={verifyMutation.isPending}
          className="w-full"
        >
          {verifyMutation.isPending ? "Submitting..." : "Submit for Verification"}
        </Button>
      </form>
    </Form>
  );
}
