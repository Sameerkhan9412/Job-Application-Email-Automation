"use client";

import StatusBadge from "./StatusBadge";

interface Contact {
  hr_name: string;
  company_name: string;
  email: string;
}

interface Props {
  contacts: Contact[];
  selected: Contact[];
  toggleSelect: (c: Contact) => void;
  toggleSelectAll: () => void;
  onPreview: (c: Contact) => void;
  getStatus: (email: string) => "sent" | "failed" | undefined;
}

export default function Table({
  contacts,
  selected,
  toggleSelect,
  toggleSelectAll,
  onPreview,
  getStatus,
}: Props) {
  const isSelected = (c: Contact) =>
    selected.some((s) => s.email === c.email);

  return (
    <div className="overflow-x-auto border rounded">
      <table className="w-full text-left">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2">
              <input
                type="checkbox"
                onChange={toggleSelectAll}
                checked={selected.length === contacts.length && contacts.length > 0}
              />
            </th>
            <th className="p-2">HR Name</th>
            <th className="p-2">Company</th>
            <th className="p-2">Email</th>
            <th className="p-2">Preview</th>
            <th className="p-2">Status</th>
          </tr>
        </thead>

        <tbody>
          {contacts.map((c, i) => (
            <tr key={i} className="border-t">
              <td className="p-2">
                <input
                  type="checkbox"
                  checked={isSelected(c)}
                  onChange={() => toggleSelect(c)}
                />
              </td>

              <td className="p-2">{c.hr_name}</td>
              <td className="p-2">{c.company_name}</td>
              <td className="p-2">{c.email}</td>

              <td className="p-2">
                <button
                  onClick={() => onPreview(c)}
                  className="text-blue-600 underline"
                >
                  Preview
                </button>
              </td>

              <td className="p-2">
                <StatusBadge status={getStatus(c.email)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}