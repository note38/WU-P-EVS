import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  PlusIcon,
  SearchIcon,
  UploadIcon,
  UserIcon,
  AlertCircle,
  Loader2,
  X,
} from "lucide-react";
import { useRef, useState, useEffect, useCallback } from "react";
import { useDebounce } from "../../../hooks/use-debounce";
import { ImageCropDialog } from "./image-crop-dialog";
import { toast } from "@/hooks/use-toast";

interface Voter {
  id: number;
  name: string;
  firstName: string;
  lastName: string;
  middleName: string;
  email: string;
  avatar: string;
  department: string;
  year: string;
  yearId: number;
}

interface CandidateFormProps {
  electionId: number;
  positions: any[];
  partylists: any[];
  onCandidateAdded: () => void;
}

export function CandidateForm({
  electionId,
  positions,
  partylists,
  onCandidateAdded,
}: CandidateFormProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [newCandidate, setNewCandidate] = useState({
    name: "",
    position: "",
    party: "",
    voterId: 0,
    avatar: "",
    yearId: 0,
  });
  const [voters, setVoters] = useState<Voter[]>([]);
  const [votersLoading, setVotersLoading] = useState(true);
  const [voterSearchTerm, setVoterSearchTerm] = useState("");
  const [selectedVoter, setSelectedVoter] = useState<Voter | null>(null);
  const [formStep, setFormStep] = useState<"search" | "details">("search");
  const [customAvatar, setCustomAvatar] = useState<string | null>(null);
  const [existingCandidates, setExistingCandidates] = useState<string[]>([]);
  const [existingCandidatesLoading, setExistingCandidatesLoading] =
    useState(false);
  const [existingCandidatesError, setExistingCandidatesError] = useState<
    string | null
  >(null);
  const [isCropDialogOpen, setIsCropDialogOpen] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const debouncedSearchTerm = useDebounce(voterSearchTerm, 300);

  const fetchExistingCandidates = useCallback(async () => {
    setExistingCandidatesLoading(true);
    setExistingCandidatesError(null);

    try {
      console.log(
        `🔄 Fetching candidates for election ID: ${electionId} (type: ${typeof electionId})`
      );

      // Validate electionId before making the request
      if (!electionId || isNaN(Number(electionId))) {
        throw new Error(`Invalid election ID: ${electionId}`);
      }

      const response = await fetch(`/api/elections/${electionId}/candidates`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include cookies for authentication
      });

      console.log(
        `📊 API Response Status: ${response.status} ${response.statusText}`
      );

      if (response.ok) {
        const data = await response.json();

        // Handle both array and object responses
        const candidates = data.candidates || data;
        const candidateNames = Array.isArray(candidates)
          ? candidates.map((candidate: any) => candidate.name)
          : [];

        setExistingCandidates(candidateNames);
        console.log(
          `✅ Successfully fetched ${candidateNames.length} existing candidates:`,
          candidateNames
        );
      } else {
        // Handle different types of HTTP errors
        let errorMessage = "Failed to fetch existing candidates";
        let errorDetails = "";

        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          errorDetails = errorData.message || "";
        } catch {
          // If JSON parsing fails, use status-based messages
          if (response.status === 401) {
            errorMessage = "Authentication required. Please sign in again.";
            errorDetails =
              "Your session may have expired. Try refreshing the page.";
          } else if (response.status === 403) {
            errorMessage = "Admin access required to view candidates.";
            errorDetails = "Make sure you're signed in with an admin account.";
          } else if (response.status === 404) {
            errorMessage = "Election not found.";
            errorDetails = `The election with ID ${electionId} may not exist. Please check the URL and try again.`;
          } else if (response.status >= 500) {
            errorMessage = "Server error occurred.";
            errorDetails = `Please try again later. (Error ${response.status})`;
          } else {
            errorMessage = `Request failed (${response.status})`;
            errorDetails = response.statusText || "Unknown error";
          }
        }

        const fullErrorMessage = errorDetails
          ? `${errorMessage} ${errorDetails}`
          : errorMessage;
        console.error(
          `❌ Failed to fetch existing candidates: ${fullErrorMessage}`
        );
        setExistingCandidatesError(fullErrorMessage);

        // For auth errors, still set empty array so form can continue
        if (response.status === 401 || response.status === 403) {
          setExistingCandidates([]);
        }
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? `Network error: ${error.message}`
          : "Network error occurred while fetching candidates";

      console.error("❌ Error fetching existing candidates:", error);
      setExistingCandidatesError(
        `${errorMessage}. Please check your internet connection and try again.`
      );

      // Set empty array to allow form to continue functioning
      setExistingCandidates([]);
    } finally {
      setExistingCandidatesLoading(false);
    }
  }, [electionId]);

  const fetchVoters = useCallback(
    async (search: string = "") => {
      setVotersLoading(true);
      try {
        const response = await fetch(
          `/api/elections/${electionId}/voters?limit=4${search ? `&search=${encodeURIComponent(search)}` : ""}`
        );
        if (response.ok) {
          const data = await response.json();
          const votersArray = data.voters || data;
          const formattedVoters = votersArray.map((voter: any) => ({
            id: voter.id,
            firstName: voter.firstName,
            lastName: voter.lastName,
            middleName: voter.middleName,
            name: `${voter.lastName}, ${voter.firstName} ${voter.middleName || ""}`.trim(),
            email: voter.email,
            avatar: voter.avatar || "/placeholder.svg",
            department: voter.department?.name || "N/A",
            year: voter.year?.name || "N/A",
            yearId: voter.yearId,
          }));

          const availableVoters = formattedVoters.filter(
            (voter: Voter) => !existingCandidates.includes(voter.name)
          );
          setVoters(availableVoters);
        } else {
          setVoters([]);
        }
      } catch (error) {
        setVoters([]);
      } finally {
        setVotersLoading(false);
      }
    },
    [electionId, existingCandidates]
  );

  useEffect(() => {
    if (isAddDialogOpen && formStep === "search") {
      fetchExistingCandidates();
    }
  }, [isAddDialogOpen, formStep, fetchExistingCandidates]);

  useEffect(() => {
    if (!existingCandidatesLoading && existingCandidates.length >= 0) {
      fetchVoters();
    }
  }, [
    isAddDialogOpen,
    formStep,
    fetchVoters,
    existingCandidates,
    existingCandidatesLoading,
  ]);

  useEffect(() => {
    if (!existingCandidatesLoading && existingCandidates.length >= 0) {
      fetchVoters(debouncedSearchTerm);
    }
  }, [
    debouncedSearchTerm,
    fetchVoters,
    existingCandidates,
    existingCandidatesLoading,
  ]);

  const getPartylistOptions = () => {
    const hasIndependent = partylists.some(
      (p) => p.name.toLowerCase() === "independent"
    );

    if (hasIndependent) {
      return partylists;
    } else {
      if (partylists.length === 0) {
        return [{ id: -1, name: "Independent" }];
      }
      return [...partylists, { id: -1, name: "Independent" }];
    }
  };

  const handleSelectVoter = (voter: Voter) => {
    const partylistOptions = getPartylistOptions();
    const independent = partylistOptions.find(
      (p) => p.name.toLowerCase() === "independent"
    );
    const defaultPartylist = independent
      ? independent.id.toString()
      : partylistOptions.length > 0
        ? partylistOptions[0].id.toString()
        : "";

    setSelectedVoter(voter);
    setNewCandidate({
      ...newCandidate,
      name: voter.name,
      voterId: voter.id,
      avatar: voter.avatar,
      party: defaultPartylist,
      yearId: voter.yearId,
    });
    setCustomAvatar(null);
    setVoterSearchTerm("");
    setFormStep("details");
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Error",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "Image must be less than 5MB",
          variant: "destructive",
        });
        return;
      }

      // Store the selected file and open crop dialog
      setSelectedImageFile(file);
      setIsCropDialogOpen(true);
    }
  };

  const handleCropComplete = (croppedFile: File) => {
    setAvatarFile(croppedFile);

    // Create preview of cropped image
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setAvatarPreview(result);
      setCustomAvatar(result);
      setNewCandidate({
        ...newCandidate,
        avatar: result,
      });
    };
    reader.readAsDataURL(croppedFile);

    setIsCropDialogOpen(false);
    setSelectedImageFile(null);
  };

  const handleCropCancel = () => {
    setIsCropDialogOpen(false);
    setSelectedImageFile(null);
    // Clear the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview("");
    setCustomAvatar(null);
    setNewCandidate({
      ...newCandidate,
      avatar: selectedVoter?.avatar || "/placeholder.svg",
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleBackToSearch = () => {
    setFormStep("search");
  };

  const resetForm = () => {
    setNewCandidate({
      name: "",
      position: "",
      party: "",
      voterId: 0,
      avatar: "",
      yearId: 0,
    });
    setSelectedVoter(null);
    setCustomAvatar(null);
    setVoterSearchTerm("");
    setFormStep("search");
    setExistingCandidatesLoading(false);
    setExistingCandidatesError(null);
    setAvatarFile(null);
    setAvatarPreview("");
    setSelectedImageFile(null);
    setIsCropDialogOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAddCandidate = async () => {
    setError(null);
    setLoading(true);

    if (!selectedVoter) {
      setError("Please select a voter");
      setLoading(false);
      return;
    }

    if (!newCandidate.position) {
      setError("Please select a position");
      setLoading(false);
      return;
    }

    if (!newCandidate.party) {
      setError("Please select a party/affiliation");
      setLoading(false);
      return;
    }

    if (
      !avatarFile &&
      !avatarPreview &&
      !customAvatar &&
      newCandidate.avatar === (selectedVoter.avatar || "/placeholder.svg")
    ) {
      setError("Please upload and crop a candidate avatar");
      setLoading(false);
      return;
    }

    try {
      const partylistId = parseInt(newCandidate.party);
      let finalPartylistId = partylistId;

      if (partylistId === -1) {
        const independentResponse = await fetch(
          `/api/elections/${electionId}/partylists`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: "Independent",
              electionId: electionId,
            }),
          }
        );

        if (independentResponse.ok) {
          const independentPartylist = await independentResponse.json();
          finalPartylistId = independentPartylist.id;
        } else {
          const getPartylistsResponse = await fetch(
            `/api/elections/${electionId}/partylists`
          );
          if (getPartylistsResponse.ok) {
            const partylists = await getPartylistsResponse.json();
            const independent = partylists.find(
              (p: any) => p.name === "Independent"
            );
            if (independent) {
              finalPartylistId = independent.id;
            } else {
              throw new Error("Failed to create or find Independent partylist");
            }
          }
        }
      }

      const requestBody = {
        name: newCandidate.name,
        positionId: parseInt(newCandidate.position),
        electionId: electionId,
        voterId: newCandidate.voterId,
        avatar: newCandidate.avatar,
        yearId: newCandidate.yearId,
        partylistId: finalPartylistId,
      };

      const response = await fetch(`/api/elections/${electionId}/candidates`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        console.log("Candidate added successfully");
        onCandidateAdded();
        setIsAddDialogOpen(false);
        resetForm();
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to add candidate");
      }
    } catch (error) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Error adding candidate:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setIsAddDialogOpen(false);
    resetForm();
    setError(null);
    setExistingCandidatesError(null);
    setLoading(false);
  };

  return (
    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Candidate
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Candidate</DialogTitle>
          <DialogDescription>
            Add a new candidate to run for a position in this election.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="mt-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {existingCandidatesError && (
          <Alert variant="destructive" className="mt-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <div className="font-medium">Error loading candidates:</div>
                <div className="text-sm">{existingCandidatesError}</div>
                {existingCandidatesError.includes("Authentication") && (
                  <div className="text-xs mt-2 text-muted-foreground">
                    Try refreshing the page or signing in again.
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {formStep === "search" ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="voter-search">Search Voter</Label>
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="voter-search"
                  placeholder="Search by first name or last name..."
                  className="pl-10"
                  value={voterSearchTerm}
                  onChange={(e) => setVoterSearchTerm(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            <div className="border rounded-md">
              {existingCandidatesLoading || votersLoading ? (
                <div className="p-8 text-center">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>
                      {existingCandidatesLoading
                        ? "Loading candidate data..."
                        : "Loading available voters..."}
                    </span>
                  </div>
                </div>
              ) : existingCandidatesError ? (
                <div className="p-8 text-center">
                  <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <AlertCircle className="h-8 w-8 text-destructive" />
                    <div className="text-sm text-center max-w-sm">
                      <div className="font-medium text-foreground mb-2">
                        Unable to load candidate data
                      </div>
                      <div className="text-sm mb-3">
                        {existingCandidatesError}
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={fetchExistingCandidates}
                          disabled={existingCandidatesLoading}
                        >
                          {existingCandidatesLoading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Retrying...
                            </>
                          ) : (
                            "Try Again"
                          )}
                        </Button>
                        {existingCandidatesError.includes("Authentication") && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.location.reload()}
                            className="text-xs"
                          >
                            Refresh Page
                          </Button>
                        )}
                      </div>
                      <div className="text-xs mt-3 text-muted-foreground">
                        You can still add candidates manually if needed.
                      </div>
                    </div>
                  </div>
                </div>
              ) : voters.length > 0 ? (
                <div className="max-h-[300px] overflow-y-auto p-1">
                  {voters.map((voter) => (
                    <div
                      key={voter.id}
                      className="flex items-center gap-3 p-3 hover:bg-muted rounded transition-colors cursor-pointer"
                      onClick={() => handleSelectVoter(voter)}
                    >
                      <Avatar className="h-10 w-10 border">
                        <AvatarImage
                          src={voter.avatar || "/placeholder.svg"}
                          alt={voter.name}
                        />
                        <AvatarFallback>
                          {voter.firstName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{voter.name}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {voter.email}
                        </div>
                        <div className="text-xs font-medium">
                          <Badge variant="outline" className="mr-1">
                            {voter.department}
                          </Badge>
                          <Badge variant="secondary">{voter.year}</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : voterSearchTerm ? (
                <div className="p-8 text-center text-muted-foreground">
                  No available voters found matching "{voterSearchTerm}"
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  Start typing to search for available voters
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <div className="flex flex-col items-center gap-2">
                <div className="relative group">
                  <Avatar className="h-24 w-24 border-2 border-border">
                    <AvatarImage
                      src={
                        avatarPreview ||
                        customAvatar ||
                        selectedVoter?.avatar ||
                        "/placeholder.svg"
                      }
                      alt={selectedVoter?.name || "Avatar"}
                    />
                    <AvatarFallback className="text-2xl">
                      {selectedVoter?.firstName.charAt(0) || (
                        <UserIcon className="h-8 w-8" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                  {(avatarPreview || customAvatar) &&
                    avatarPreview !==
                      (selectedVoter?.avatar || "/placeholder.svg") && (
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full"
                        onClick={handleRemoveAvatar}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    )}
                  <div
                    className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                    onClick={triggerFileInput}
                  >
                    <UploadIcon className="h-8 w-8 text-white" />
                  </div>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={triggerFileInput}
                    className="text-xs"
                  >
                    {avatarFile ? "Change Photo" : "Upload Photo"}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    PNG, JPG up to 5MB • Square crop recommended
                  </p>
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <div>
                  <Label className="text-muted-foreground text-xs">
                    Selected Voter
                  </Label>
                  <div className="font-medium text-lg">
                    {selectedVoter?.name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {selectedVoter?.email}
                  </div>
                  <div className="mt-1">
                    <Badge variant="outline" className="mr-1">
                      {selectedVoter?.department}
                    </Badge>
                    <Badge variant="secondary">{selectedVoter?.year}</Badge>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToSearch}
                  className="mt-2 text-xs"
                >
                  Change Voter
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="candidate-position">Position</Label>
                <Select
                  onValueChange={(value) =>
                    setNewCandidate({ ...newCandidate, position: value })
                  }
                  value={newCandidate.position}
                >
                  <SelectTrigger id="candidate-position">
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    {positions.map((position: any) => (
                      <SelectItem
                        key={position.id}
                        value={position.id.toString()}
                      >
                        {position.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="candidate-party">Party/Affiliation</Label>
                <Select
                  onValueChange={(value) =>
                    setNewCandidate({ ...newCandidate, party: value })
                  }
                  value={newCandidate.party}
                >
                  <SelectTrigger id="candidate-party">
                    <SelectValue placeholder="Select party/affiliation" />
                  </SelectTrigger>
                  <SelectContent>
                    {getPartylistOptions().map((partylist: any) => (
                      <SelectItem
                        key={partylist.id}
                        value={partylist.id.toString()}
                      >
                        {partylist.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-2">
          <Button
            variant="outline"
            onClick={handleCloseDialog}
            className="sm:order-1 order-2"
          >
            Cancel
          </Button>
          {formStep === "details" && (
            <Button
              onClick={handleAddCandidate}
              className="sm:order-2 order-1"
              disabled={
                !newCandidate.position || !newCandidate.party || loading
              }
            >
              {loading ? "Adding..." : "Add Candidate"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>

      {/* Image Crop Dialog */}
      <ImageCropDialog
        isOpen={isCropDialogOpen}
        onClose={handleCropCancel}
        onCropComplete={handleCropComplete}
        imageFile={selectedImageFile}
        originalFileName={selectedImageFile?.name || "cropped-avatar.jpg"}
      />
    </Dialog>
  );
}
