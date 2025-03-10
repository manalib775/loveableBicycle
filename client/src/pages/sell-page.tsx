import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Navbar from "@/components/navbar";
import BicycleForm from "@/components/bicycle-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { InsertBicycle } from "@shared/schema";
import useDraftListing from "@/hooks/use-draft-listing";
import { useToast } from "@/hooks/use-toast";

export default function SellPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const { draft, setDraft, clearDraft } = useDraftListing();

  useEffect(() => {
    console.log("SellPage mounted", { isAuthenticated: !!user, hasDraft: !!draft });
    return () => console.log("SellPage unmounted");
  }, [user, draft]);

  const handleFormSubmit = async (data: InsertBicycle) => {
    console.log("handleFormSubmit called in sell-page", { data, isAuthenticated: !!user });

    if (!user) {
      // Store form data and show auth dialog
      console.log("User not authenticated, saving draft and showing auth dialog");
      setDraft(data);
      setShowAuthDialog(true);
      return;
    }

    try {
      console.log("User authenticated, submitting bicycle listing");
      // Make API call to save the bicycle listing
      const response = await fetch('/api/bicycles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to create listing');
      }

      const savedBicycle = await response.json();
      console.log("Bicycle listing created successfully", savedBicycle);

      // Clear any saved draft after successful submission
      clearDraft();
      localStorage.removeItem('bicycleFormData'); // Clear form autosave data

      toast({
        title: "Success!",
        description: "Your bicycle has been listed successfully.",
      });

      // Redirect to the bicycle detail page
      setLocation(`/bicycles/${savedBicycle.id}`);
    } catch (error) {
      console.error('Error creating listing:', error);
      toast({
        title: "Error",
        description: "Failed to create listing. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">List Your Bicycle</h1>
          <div className="bg-card rounded-lg shadow-lg p-6">
            <BicycleForm 
              onSubmit={handleFormSubmit}
              defaultValues={draft || undefined}
            />
          </div>
        </div>
      </main>

      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign in to List Your Bicycle</DialogTitle>
            <DialogDescription>
              Please sign in or create an account to complete listing your bicycle. Your form data will be saved.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <Button
              onClick={() => {
                console.log("Redirecting to auth with saved form data");
                setLocation('/auth?redirect=/sell');
              }}
              className="w-full"
            >
              Continue to Sign In
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowAuthDialog(false)}
            >
              Continue Editing
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}