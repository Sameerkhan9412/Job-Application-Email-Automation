"use client";

interface Props {
  status?: "sent" | "failed";
}

export default function StatusBadge({ status }: Props) {
  if (!status) return null;

  if (status === "sent") {
    return (
      <span className="px-2 py-1 text-sm bg-green-100 text-green-700 rounded">
        Sent
      </span>
    );
  }

  return (
    <span className="px-2 py-1 text-sm bg-red-100 text-red-700 rounded">
      Failed
    </span>
  );
}