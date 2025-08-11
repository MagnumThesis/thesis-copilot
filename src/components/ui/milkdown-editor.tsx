import React from 'react';
import { Crepe } from "@milkdown/crepe";
import "@milkdown/crepe/theme/common/style.css";
/**
 * Available themes:
 * frame, classic, nord
 * frame-dark, classic-dark, nord-dark
 */
import "@milkdown/crepe/theme/frame.css";
import { useEffect, useRef } from "react";


export const MilkdownEditor = () => {
  const editorRef = useRef<Crepe | null>(null);

  useEffect(() => {
    if (!editorRef.current) {
      const crepe = new Crepe({
        root: "#builder-tool-editor",
        defaultValue: "Hello, Milkdown!",
      });
      crepe.create().then(() => {
        console.log("Editor created");
        editorRef.current = crepe;
      });
    }

    return () => {
      if (editorRef.current) {
        editorRef.current.destroy(); // Assuming Crepe has a destroy method
        editorRef.current = null;
      }
    };
  }, []);

  
  return (
    <div id="builder-tool-editor" />
  );
};



