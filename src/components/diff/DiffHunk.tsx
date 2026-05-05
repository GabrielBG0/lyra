import type { DiffHunk as DiffHunkType } from "../../lib/types";

interface DiffHunkProps {
  hunk: DiffHunkType;
}

export default function DiffHunk({ hunk }: DiffHunkProps) {
  if (hunk.kind === "equal") {
    return <span>{hunk.text}</span>;
  }
  if (hunk.kind === "insert") {
    return (
      <mark className="bg-diff-add text-diff-add-text rounded-[2px]">
        {hunk.text}
      </mark>
    );
  }
  return (
    <del className="bg-diff-remove text-diff-remove-text rounded-[2px] line-through">
      {hunk.text}
    </del>
  );
}
