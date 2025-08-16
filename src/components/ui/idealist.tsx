"use client"

import React, { useState, useEffect } from "react" // Re-added useState
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/shadcn/scroll-area" // Import ScrollArea for scrollable content
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/shadcn/sheet" // Import Sheet components
import { Input } from "@/components/ui/shadcn/input" // Import Input component
import { Button } from "@/components/ui/shadcn/button" // Import Button component
// Assuming Textarea is available at this path, if not, it needs to be created or the import adjusted.
import { Textarea } from "@/components/ui/shadcn/textarea" // Import Textarea component
import { IdeaDetail } from "@/react-app/pages/IdeaDetail"; // Import IdeaDetail component
import { fetchIdeas, createIdea, updateIdea, deleteIdea, generateIdeas } from "@/lib/idea-api"; // Import API functions
import { Skeleton } from "@/components/ui/shadcn/skeleton"; // Import Skeleton for loading states
import { IdeaDefinition } from "@/lib/ai-types"; // Import shared IdeaDefinition interface

interface IdealistProps {
  isOpen: boolean;
  onClose: () => void;
  currentConversation: { title: string; id: string }; // Added currentConversation prop
}

// Function to check for duplicate ideas
const isDuplicateIdea = (newIdea: {title: string, description: string}, existingIdeas: IdeaDefinition[]) => {
  return existingIdeas.some(idea =>
    idea.title.toLowerCase() === newIdea.title.toLowerCase() ||
    idea.description.toLowerCase() === newIdea.description.toLowerCase()
  );
};

export const Idealist: React.FC<IdealistProps> = ({ isOpen, onClose, currentConversation }) => {
  // Initialize with an empty array, and use the IdeaDefinition type.
  const [ideaDefinitions, setIdeaDefinitions] = useState<IdeaDefinition[]>([]);
  const [newIdeaTitle, setNewIdeaTitle] = useState<string>("");
  const [newIdeaDescription, setNewIdeaDescription] = useState<string>("");
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false); // State to control form visibility
  const [loading, setLoading] = useState<boolean>(true); // Loading state
  const [error, setError] = useState<string | null>(null); // Error state
  const [retryCount, setRetryCount] = useState<number>(0); // Retry count for failed operations
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false); // Form submission state
  const [isGenerating, setIsGenerating] = useState<boolean>(false); // Generate ideas loading state

  // Fetch ideas when component mounts or when sheet opens
  useEffect(() => {
    if (isOpen) {
      loadIdeas();
    }
  }, [isOpen]);

  const loadIdeas = async () => {
    try {
      setLoading(true);
      const ideas = await fetchIdeas(currentConversation.id);
      setIdeaDefinitions(ideas);
      setRetryCount(0); // Reset retry count on success
      toast.success("Ideas loaded successfully!");
    } catch (err) {
      console.error("Failed to load ideas:", err);
      const errorMessage = "Failed to load ideas. Please try again.";
      toast.error(errorMessage);
      
      // Implement retry mechanism
      if (retryCount < 3) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          loadIdeas();
        }, 2000 * (retryCount + 1)); // Exponential backoff
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddIdea = async () => {
    if (newIdeaTitle.trim() === "" || newIdeaDescription.trim() === "") {
      toast.error("Please fill in both title and description.");
      return;
    }
    
    try {
      setIsSubmitting(true);
      const newIdea = await createIdea({
        title: newIdeaTitle,
        description: newIdeaDescription,
        conversationid: currentConversation?.id, // Assign conversationid from props
      });
      setIdeaDefinitions((prevIdeas) => [...prevIdeas, newIdea]);
      setNewIdeaTitle("");
      setNewIdeaDescription("");
      setIsFormOpen(false); // Close the form after submission
      
      // Notify content retrieval service that ideas have changed
      const { contentRetrievalService } = await import("@/lib/content-retrieval-service");
      contentRetrievalService.invalidateCache(currentConversation.id, 'ideas');
      
      toast.success("Idea created successfully!");
    } catch (err) {
      console.error("Failed to create idea:", err);
      const errorMessage = "Failed to create idea. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateIdea = async (id: number, updates: Partial<Omit<IdeaDefinition, "id">>) => {
    try {
      const updatedIdea = await updateIdea(id, updates);
      setIdeaDefinitions(prevIdeas =>
        prevIdeas.map(idea => idea.id === id ? { ...idea, ...updatedIdea } : idea)
      );
      
      // Notify content retrieval service that ideas have changed
      const { contentRetrievalService } = await import("@/lib/content-retrieval-service");
      contentRetrievalService.invalidateCache(currentConversation.id, 'ideas');
      
      toast.success("Idea updated successfully!");
    } catch (err) {
      console.error("Failed to update idea:", err);
      const errorMessage = "Failed to update idea. Please try again.";
      toast.error(errorMessage);
      throw err; // Re-throw to let the child component handle it
    }
  };

  const handleDeleteIdea = async (id: number) => {
    try {
      await deleteIdea(id);
      setIdeaDefinitions(prevIdeas => prevIdeas.filter(idea => idea.id !== id));
      
      // Notify content retrieval service that ideas have changed
      const { contentRetrievalService } = await import("@/lib/content-retrieval-service");
      contentRetrievalService.invalidateCache(currentConversation.id, 'ideas');
      
      toast.success("Idea deleted successfully!");
    } catch (err) {
      console.error("Failed to delete idea:", err);
      const errorMessage = "Failed to delete idea. Please try again.";
      toast.error(errorMessage);
      throw err; // Re-throw to let the child component handle it
    }
  };

  const handleGenerateIdeas = async () => {
    try {
      setIsGenerating(true);
      const ideas = await generateIdeas(currentConversation.id, ideaDefinitions);
      
      // Filter out duplicate ideas
      const uniqueIdeas = ideas.filter(idea => !isDuplicateIdea(idea, ideaDefinitions));
      
      // Add non-duplicate ideas to the state
      if (uniqueIdeas.length > 0) {
        setIdeaDefinitions(prevIdeas => [...prevIdeas, ...uniqueIdeas.map(idea => ({
          id: Date.now() + Math.random(), // Temporary ID until saved to DB
          ...idea
        }))]);
        
        // Notify content retrieval service that ideas have changed
        const { contentRetrievalService } = await import("@/lib/content-retrieval-service");
        contentRetrievalService.invalidateCache(currentConversation.id, 'ideas');
      }
      
      // Show appropriate toast message based on results
      const duplicateCount = ideas.length - uniqueIdeas.length;
      if (uniqueIdeas.length === 0) {
        toast.info("No new ideas were generated");
      } else if (duplicateCount > 0) {
        toast.success(`Added ${uniqueIdeas.length} new ideas (${duplicateCount} duplicates filtered out)`);
      } else {
        toast.success(`Added ${uniqueIdeas.length} new ideas`);
      }
    } catch (err) {
      console.error("Failed to generate ideas:", err);
      const errorMessage = "Failed to generate ideas. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-[425px]">
        <SheetHeader>
          <SheetTitle>Idea Definitions</SheetTitle>
          <SheetDescription>A list of your thesis idea definitions.</SheetDescription>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-150px)] pr-4"> {/* Adjust height as needed */}
          {error && (
            <div className="py-4 text-center text-red-500">
              {error}
            </div>
          )}
          {loading ? (
            <div className="py-4 space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : ideaDefinitions.length === 0 ? (
            <div className="py-4 text-center text-muted-foreground"> {/* Centered placeholder text */}
              Add your idea definitions here
            </div>
          ) : (
            <div className="py-4 space-y-4">
              {ideaDefinitions.map((idea) => (
                <IdeaDetail 
                  key={idea.id} 
                  idea={idea} 
                  onUpdate={handleUpdateIdea}
                  onDelete={handleDeleteIdea}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Button to toggle the form */}
        {!isFormOpen && (
          <div className="flex flex-col space-y-2 mt-4">
            <Button onClick={() => setIsFormOpen(true)} className="w-full" disabled={isSubmitting || isGenerating}>
              Add New Idea
            </Button>
            <Button
              onClick={handleGenerateIdeas}
              className="w-full"
              disabled={isSubmitting || isGenerating}
              variant="secondary"
            >
              {isGenerating ? "Generating..." : "Generate Ideas"}
            </Button>
          </div>
        )}

        {/* Form to add a new idea */}
        {isFormOpen && (
          <div className="mt-4 p-4 border rounded-md">
            <h3 className="text-lg font-semibold mb-2">Add New Idea</h3>
            <div className="space-y-2">
              <Input
                placeholder="Idea Title"
                value={newIdeaTitle}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewIdeaTitle(e.target.value)}
                disabled={isSubmitting}
              />
              <Textarea
                placeholder="Idea Description"
                value={newIdeaDescription}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewIdeaDescription(e.target.value)}
                disabled={isSubmitting}
              />
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsFormOpen(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button onClick={handleAddIdea} disabled={isSubmitting}>
                  {isSubmitting ? "Adding..." : "Add Idea"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
