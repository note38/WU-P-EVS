"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function VotingGuide({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            Voting System Guide
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">How to Vote</h3>
            <ol className="list-decimal pl-5 space-y-2">
              <li>
                <strong>Select Candidates:</strong> You will be presented with
                positions one by one. For each position, review the candidates
                and select your preferred choice.
              </li>
              <li>
                <strong>Navigate:</strong> Use the "Previous" and "Next" buttons
                to move between positions. You can change your selections at any
                time before submitting.
              </li>
              <li>
                <strong>Review:</strong> Once you've made selections for all
                positions, you'll be taken to a review page to confirm your
                choices.
              </li>
              <li>
                <strong>Submit:</strong> After reviewing your ballot, click
                "Submit Ballot" to finalize your vote. Note that you can only
                vote once.
              </li>
            </ol>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Important Notes</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>You can only vote in elections you've been assigned to.</li>
              <li>Your vote is anonymous and cannot be traced back to you.</li>
              <li>Once submitted, your ballot cannot be changed.</li>
              <li>
                After voting, you will be automatically signed out for security.
              </li>
              <li>
                If you encounter any issues, contact your system administrator.
              </li>
            </ul>
          </div>

          <div className="pt-4">
            <Button onClick={onContinue} className="w-full">
              Continue to Ballot
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
