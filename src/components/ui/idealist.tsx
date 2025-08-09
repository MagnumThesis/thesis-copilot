"use client"

import React, { useState } from "react" // Re-added useState
import { ScrollArea } from "@/components/ui/scroll-area" // Import ScrollArea for scrollable content
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet" // Import Sheet components
import { Input } from "@/components/ui/input" // Import Input component
import { Button } from "@/components/ui/button" // Import Button component
// Assuming Textarea is available at this path, if not, it needs to be created or the import adjusted.
import { Textarea } from "@/components/ui/textarea" // Import Textarea component

// Interface for idea definitions
interface IdeaDefinition {
  id: number;
  title: string;
  description: string;
}

interface IdealistProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Idealist: React.FC<IdealistProps> = ({ isOpen, onClose }) => {
  // Initialize with an empty array, and use the IdeaDefinition type.
  const [ideaDefinitions, setIdeaDefinitions] = useState<IdeaDefinition[]>([]);
  const [newIdeaTitle, setNewIdeaTitle] = useState<string>("");
  const [newIdeaDescription, setNewIdeaDescription] = useState<string>("");
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false); // State to control form visibility

  const handleAddIdea = () => {
    if (newIdeaTitle.trim() === "" || newIdeaDescription.trim() === "") {
      // Optionally, show an error message or prevent submission
      return;
    }
    const newIdea: IdeaDefinition = {
      id: Date.now(), // Simple unique ID generation
      title: newIdeaTitle,
      description: newIdeaDescription,
    };
    setIdeaDefinitions((prevIdeas) => [...prevIdeas, newIdea]);
    setNewIdeaTitle("");
    setNewIdeaDescription("");
    setIsFormOpen(false); // Close the form after submission
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-[425px]">
        <SheetHeader>
          <SheetTitle>Idea Definitions</SheetTitle>
          <SheetDescription>A list of your thesis idea definitions.</SheetDescription>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-150px)] pr-4"> {/* Adjust height as needed */}
          {ideaDefinitions.length === 0 ? (
            <div className="py-4 text-center text-muted-foreground"> {/* Centered placeholder text */}
              Add your idea definitions here
            </div>
          ) : (
            <div className="py-4 space-y-4">
              {ideaDefinitions.map((idea) => (
                <div key={idea.id} className="border p-3 rounded-md">
                  <h4 className="font-semibold">{idea.title}</h4>
                  <p className="text-sm text-muted-foreground">{idea.description}</p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Button to toggle the form */}
        {!isFormOpen && (
          <Button onClick={() => setIsFormOpen(true)} className="w-full mt-4">
            Add New Idea
          </Button>
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
              />
              <Textarea
                placeholder="Idea Description"
                value={newIdeaDescription}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewIdeaDescription(e.target.value)}
              />
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
                <Button onClick={handleAddIdea}>Add Idea</Button>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
