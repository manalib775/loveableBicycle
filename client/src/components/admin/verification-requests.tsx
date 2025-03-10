import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { User } from "@shared/schema";
import { Check, X } from "lucide-react";

type VerificationRequest = Pick<User, "id" | "firstName" | "lastName" | "email" | "aadhaarNumber" | "aadhaarFrontImage" | "aadhaarBackImage">;

export function VerificationRequests() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: requests, isLoading } = useQuery<VerificationRequest[]>({
    queryKey: ["/api/admin/verification-requests"],
    queryFn: async () => {
      const response = await apiRequest("/api/admin/verification-requests");
      return response.json();
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async ({ userId, action }: { userId: number; action: "approve" | "reject" }) => {
      const response = await apiRequest(`/api/admin/verify-user/${userId}`, {
        method: "POST",
        body: { action },
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/verification-requests"] });
      toast({
        title: "Success",
        description: "Verification status updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return <div>Loading verification requests...</div>;
  }

  if (!requests?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Verification Requests</CardTitle>
          <CardDescription>No pending verification requests</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Verification Requests</h2>
      {requests.map((request) => (
        <Card key={request.id}>
          <CardHeader>
            <CardTitle>{request.firstName} {request.lastName}</CardTitle>
            <CardDescription>{request.email}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-medium">Aadhaar Number:</p>
              <p className="text-sm text-gray-600">{request.aadhaarNumber}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="font-medium mb-2">Front Image:</p>
                <img
                  src={request.aadhaarFrontImage}
                  alt="Aadhaar front"
                  className="w-full rounded-lg"
                />
              </div>
              <div>
                <p className="font-medium mb-2">Back Image:</p>
                <img
                  src={request.aadhaarBackImage}
                  alt="Aadhaar back"
                  className="w-full rounded-lg"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => verifyMutation.mutate({ userId: request.id, action: "reject" })}
              disabled={verifyMutation.isPending}
            >
              <X className="w-4 h-4 mr-2" />
              Reject
            </Button>
            <Button
              onClick={() => verifyMutation.mutate({ userId: request.id, action: "approve" })}
              disabled={verifyMutation.isPending}
            >
              <Check className="w-4 h-4 mr-2" />
              Approve
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
