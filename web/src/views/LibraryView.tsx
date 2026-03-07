import type { ReactNode } from "react";

interface LibraryViewProps {
  statsSection: ReactNode;
  toolbarSection: ReactNode;
  linksSection: ReactNode;
}

export function LibraryView({ statsSection, toolbarSection, linksSection }: LibraryViewProps) {
  return (
    <>
      {statsSection}
      {toolbarSection}
      {linksSection}
    </>
  );
}
