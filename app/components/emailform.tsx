"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SendIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

// Define the voter credentials interface
interface VoterCredentials {
  firstName: string;
  lastName: string;
  email: string;
  voterId: string;
  pollingLocation?: string;
}

export function EmailForm() {
  // State to manage form inputs
  const [voters, setVoters] = useState<VoterCredentials[]>([
    {
      firstName: "",
      lastName: "",
      email: "",
      voterId: "",
      pollingLocation: "",
    },
  ]);

  // State to track submission process
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Function to update a specific voter's details
  const updateVoter = (
    index: number,
    field: keyof VoterCredentials,
    value: string
  ) => {
    const updatedVoters = [...voters];
    updatedVoters[index] = {
      ...updatedVoters[index],
      [field]: value,
    };
    setVoters(updatedVoters);
  };

  // Handle email sending
  const handleSendCredentials = async () => {
    // Basic validation
    const isValid = voters.every(
      (voter) =>
        voter.firstName && voter.lastName && voter.email && voter.voterId
    );

    if (!isValid) {
      toast.error("Please fill in all required fields for each voter");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/send-voter-credentials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ voters }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(`Emails sent successfully. 
          Total: ${result.total}, 
          Successful: ${result.successful}, 
          Failed: ${result.failed}`);

        // Reset form after successful submission
        setVoters([
          {
            firstName: "",
            lastName: "",
            email: "",
            voterId: "",
            pollingLocation: "",
          },
        ]);
      } else {
        toast.error(result.error || "Failed to send voter credentials");
      }
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>Voter Credentials</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {voters.map((voter, index) => (
            <div key={index} className="grid grid-cols-2 gap-4">
              <Input
                placeholder="First Name"
                value={voter.firstName}
                onChange={(e) =>
                  updateVoter(index, "firstName", e.target.value)
                }
                disabled={isSubmitting}
                required
              />
              <Input
                placeholder="Last Name"
                value={voter.lastName}
                onChange={(e) => updateVoter(index, "lastName", e.target.value)}
                disabled={isSubmitting}
                required
              />
              <Input
                placeholder="Email"
                type="email"
                value={voter.email}
                onChange={(e) => updateVoter(index, "email", e.target.value)}
                disabled={isSubmitting}
                required
              />
              <Input
                placeholder="Voter ID"
                value={voter.voterId}
                onChange={(e) => updateVoter(index, "voterId", e.target.value)}
                disabled={isSubmitting}
                required
              />
              <Input
                placeholder="Polling Location (Optional)"
                value={voter.pollingLocation}
                onChange={(e) =>
                  updateVoter(index, "pollingLocation", e.target.value)
                }
                disabled={isSubmitting}
                className="col-span-2"
              />
            </div>
          ))}

          <div className="flex justify-end mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSendCredentials}
              disabled={isSubmitting}
            >
              <SendIcon className="mr-2 h-4 w-4" />
              {isSubmitting ? "Sending..." : "Send Credentials"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
