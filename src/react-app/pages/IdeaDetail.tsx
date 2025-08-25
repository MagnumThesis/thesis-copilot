import React, { useState } from "react";
import { IdeaDefinition } from "@/lib/ai-types"; // Import IdeaDefinition
import { Button } from "@/components/ui/shadcn/button";
import { Input } from "@/components/ui/shadcn/input";
import { Textarea } from "@/components/ui/shadcn/textarea";
import { toast } from "sonner";

interface IdeaDetailProps {
  idea: IdeaDefinition;
  onUpdate?: (id: number, updates: Partial<Omit<IdeaDefinition, "id">>) => Promise<void>;
  onDelete?: (id: number) => Promise<void>;
}

export const IdeaDetail: React.FC<IdeaDetailProps> = ({ idea, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(idea.title);
  const [editedDescription, setEditedDescription] = useState(idea.description);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async () => {
    if (!onUpdate) return;
    
    try {
      setIsUpdating(true);
      await onUpdate(Number(idea.id), { title: editedTitle, description: editedDescription });
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update idea:", error);
      toast.error("Failed to update idea. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    
    try {
      await onDelete(Number(idea.id));
      setIsDeleting(false);
    } catch (error) {
      console.error("Failed to delete idea:", error);
      toast.error("Failed to delete idea. Please try again.");
    }
  };

  const handleCancelDelete = () => {
    setIsDeleting(false);
  };

  return (
    <div key={idea.id} className="border p-3 rounded-md">
      {isDeleting ? (
        <div className="space-y-2">
          <p className="text-sm">Are you sure you want to delete "{idea.title}"?</p>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleCancelDelete}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </div>
      ) : isEditing ? (
        <div className="space-y-2">
          <Input
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            placeholder="Idea Title"
            disabled={isUpdating}
          />
          <Textarea
            value={editedDescription}
            onChange={(e) => setEditedDescription(e.target.value)}
            placeholder="Idea Description"
            disabled={isUpdating}
          />
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => {
              setIsEditing(false);
              setEditedTitle(idea.title);
              setEditedDescription(idea.description);
            }} disabled={isUpdating}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={isUpdating}>
              {isUpdating ? "Updating..." : "Save"}
            </Button>
          </div>
        </div>
      ) : (
        <>
          <h4 className="font-semibold">{idea.title}</h4>
          <p className="text-sm text-muted-foreground">{idea.description}</p>
          <div className="flex justify-end space-x-2 mt-2">
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              Edit
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setIsDeleting(true)}>
              Delete
            </Button>
          </div>
        </>
      )}
    </div>
  );
};
