"use client";

interface Props {
  value: "direct" | "referral";
  onChange: (val: "direct" | "referral") => void;
}

export default function EmailTypeSelector({ value, onChange }: Props) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as any)}
      className="border px-3 py-2 rounded"
    >
      <option value="direct">Direct Application</option>
      <option value="referral">Referral Request</option>
    </select>
  );
}