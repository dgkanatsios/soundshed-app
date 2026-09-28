declare module "@yaireo/tagify/dist/react.tagify.jsx" {
  import type { ComponentType } from "react";

  const Tags: ComponentType<{
    value?: string[];
    onChange?: (event: Event & { target: HTMLInputElement }) => void;
  }>;

  export default Tags;
}
