import { useEffect, useState, type FC } from "react";

import { Crepe } from "@milkdown/crepe";
import { Milkdown, useEditor } from "@milkdown/react";

import "@milkdown/crepe/theme/common/style.css";
import "@milkdown/crepe/theme/frame.css";
import "./milkdown-editor.css";
import { insert } from "@milkdown/kit/utils";


export const MilkdownEditor: FC = () => {
  const [content, setContent] = useState("# Hello");

  const {get} = useEditor((root) => {
    const crepe = new Crepe({
      root,
      defaultValue: content,
    });
    return crepe;
  }, []);

  useEffect(() => {
    get()?.action(insert(content))
  }, [content])

  //TODOS: call


  return(
    <Milkdown />
  );
};