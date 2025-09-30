"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { Upload, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { ImageCropper } from "@/app/components/ui/image-cropper";

interface Candidate {
  id: number;
  name: string;
  position: string;
  positionId: number;
  party: string;
  partylistId: number;
  votes: number;
  avatar: string;
  year?: {
    id: number;
    name: string;
    department?: {
      id: number;
      name: string;
    };
  };
}

interface EditCandidateDialogProps {
  candidate: Candidate | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  electionId: number;
  positions: any[];
  partylists: any[];
}

export function EditCandidateDialog({
  candidate,
  isOpen,
  onClose,
  onSuccess,
  electionId,
  positions,
  partylists,
}: EditCandidateDialogProps) {
  const [editForm, setEditForm] = useState({
    name: "",
    positionId: "",
    partylistId: "",
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCropDialogOpen, setIsCropDialogOpen] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize form when candidate changes
  useEffect(() => {
    if (candidate) {
      setEditForm({
        name: candidate.name,
        positionId: candidate.positionId.toString(),
        partylistId: candidate.partylistId.toString(),
      });
      setAvatarPreview(candidate.avatar);
      setAvatarFile(null);
    }
  }, [candidate]);

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
      setAvatarPreview(e.target?.result as string);
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

  const handleRemoveImage = () => {
    setAvatarFile(null);
    setAvatarPreview("/placeholder.svg");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", "candidate-avatar");

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to upload image");
    }

    const data = await response.json();
    return data.url;
  };

  const handleUpdateCandidate = async () => {
    if (!candidate) return;

    setIsSubmitting(true);

    try {
      let avatarUrl = candidate.avatar;

      // Upload new image if file was selected and cropped
      if (avatarFile) {
        avatarUrl = await uploadImage(avatarFile);
      }

      const response = await fetch(
        `/api/elections/${electionId}/candidates/${candidate.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: editForm.name,
            avatar: avatarUrl,
            positionId: parseInt(editForm.positionId),
            partylistId: parseInt(editForm.partylistId),
          }),
        }
      );

      if (response.ok) {
        toast({
          title: "Success",
          description: "Candidate updated successfully",
        });
        onClose();
        onSuccess();
      } else {
        const data = await response.json();
        toast({
          title: "Error",
          description: data.error || "Failed to update candidate",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating candidate:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setAvatarFile(null);
    setAvatarPreview("");
    setSelectedImageFile(null);
    setIsCropDialogOpen(false);
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Candidate</DialogTitle>
            <DialogDescription>
              Update the candidate's information.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Avatar Upload Section */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <Avatar className="w-24 h-24">
                  <AvatarImage
                    src={avatarPreview || "/placeholder.svg"}
                    alt="Candidate avatar"
                  />
                  <AvatarFallback>
                    {editForm.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {avatarPreview && avatarPreview !== "/placeholder.svg" && (
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full"
                    onClick={handleRemoveImage}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </div>

              <div className="flex flex-col items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {avatarFile ? "Change Photo" : "Upload Photo"}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <p className="text-xs text-muted-foreground text-center">
                  PNG, JPG up to 5MB • Square crop recommended
                </p>
              </div>
            </div>

            {/* Name Field */}
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
                placeholder="Enter candidate name"
              />
            </div>

            {/* Position Field */}
            <div className="grid gap-2">
              <Label htmlFor="edit-position">Position</Label>
              <Select
                value={editForm.positionId}
                onValueChange={(value) =>
                  setEditForm({ ...editForm, positionId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a position" />
                </SelectTrigger>
                <SelectContent>
                  {positions.map((position) => (
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

            {/* Party Field */}
            <div className="grid gap-2">
              <Label htmlFor="edit-party">Party/Affiliation</Label>
              <Select
                value={editForm.partylistId}
                onValueChange={(value) =>
                  setEditForm({ ...editForm, partylistId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a party" />
                </SelectTrigger>
                <SelectContent>
                  {partylists.map((party) => (
                    <SelectItem key={party.id} value={party.id.toString()}>
                      {party.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateCandidate} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Crop Dialog */}
      <ImageCropper
        open={isCropDialogOpen}
        onOpenChange={setIsCropDialogOpen}
        imageSrc={
          selectedImageFile ? URL.createObjectURL(selectedImageFile) : null
        }
        onCropComplete={(croppedImage) => {
          // Convert data URL to file
          fetch(croppedImage)
            .then((res) => res.blob())
            .then((blob) => {
              const file = new File(
                [blob],
                selectedImageFile?.name || "cropped-avatar.jpg",
                { type: blob.type }
              );
              handleCropComplete(file);
            });
        }}
        onCancel={handleCropCancel}
        title="Crop Candidate Photo"
        description="Adjust the crop area for the candidate's photo"
      />
    </>
  );
}
