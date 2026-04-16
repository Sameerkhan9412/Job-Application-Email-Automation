"use client";

interface Contact {
  hr_name: string;
  company_name: string;
  email: string;
}

interface Props {
  contact: Contact | null;
  type: "direct" | "referral";
  onClose: () => void;
}

export default function PreviewModal({ contact, type, onClose }: Props) {
  if (!contact) return null;

  const content =
    type === "direct"
      ? `Hi ${contact.hr_name},

I hope you're doing well.

I am Sameer, a MERN Stack Developer.

I am interested in opportunities at ${contact.company_name}.

Skills: React, Node.js, Next.js, MongoDB

Resume: your-link
Portfolio: your-link

Best regards,
Sameer`
      : `Hi ${contact.hr_name},

I hope you're doing well.

I wanted to ask if you could refer me to ${contact.company_name}.

I am a MERN Stack Developer.

Thanks & Regards,
Sameer`;

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded w-[500px]">
        <h2 className="text-xl font-bold mb-2">Email Preview</h2>

        <p className="text-sm text-gray-600 mb-3">
          To: {contact.email}
        </p>

        <div className="border p-3 text-sm whitespace-pre-line max-h-60 overflow-y-auto">
          {content}
        </div>

        <button
          onClick={onClose}
          className="mt-4 bg-gray-800 text-white px-4 py-2 rounded"
        >
          Close
        </button>
      </div>
    </div>
  );
}