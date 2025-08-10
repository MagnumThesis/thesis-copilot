import React from "react";
import { IdeaDefinition } from "@/components/ui/idealist"; // Import IdeaDefinition

interface IdeaDetailProps {
  idea: IdeaDefinition;
}

export const IdeaDetail: React.FC<IdeaDetailProps> = ({ idea }) => {
  return (
    <div key={idea.id} className="border p-3 rounded-md">
      <h4 className="font-semibold">{idea.title}</h4>
      <p className="text-sm text-muted-foreground">{idea.description}</p>
    </div>
  );
};
