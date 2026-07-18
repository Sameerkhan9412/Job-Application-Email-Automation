"use client";

import { useEffect, useState } from "react";
import axios from "axios";

interface Contact {
  hr_name: string;
  company_name: string;
  email: string;
  phone?: string;
}

export default function DashboardPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selected, setSelected] = useState<Contact[]>([]);
  const [type, setType] = useState<"direct" | "referral">("direct");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [preview, setPreview] = useState<Contact | null>(null);
  const [latestSentDates, setLatestSentDates] = useState<Record<string, string>>({});

  // 📥 Fetch Contacts
  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const res = await axios.get("/api/contacts");
      setContacts(res.data.contacts || []);
      setLatestSentDates(res.data.latestSentDates || {});
    } catch (err) {
      alert("Failed to load contacts");
    }
  };

  // ✅ Select / Deselect
  const toggleSelect = (contact: Contact) => {
    setSelected((prev) =>
      prev.includes(contact)
        ? prev.filter((c) => c !== contact)
        : [...prev, contact],
    );
  };

  // ✅ Select All
  const toggleSelectAll = () => {
    if (selected.length === contacts.length) {
      setSelected([]);
    } else {
      setSelected(contacts);
    }
  };

  // 📧 Send Emails
  const sendEmails = async () => {
    if (selected.length === 0) {
      alert("Please select at least one contact");
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post("/api/send-emails", {
        contacts: selected,
        type,
      });
      console.log("reeee",res)

      setResults(res.data.results || []);
      alert("Emails sent successfully!");
    } catch (err) {
      alert("Failed to send emails");
    } finally {
      setLoading(false);
    }
  };

  // 📊 Get Status
  const getStatus = (email: string) => {
    const found = results.find((r) => r.email === email);
    return found?.status;
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* 🔥 Header */}
      <h1 className="text-3xl font-bold mb-4">📧 Email Automation Dashboard</h1>

      {/* ⚙️ Controls */}
      <div className="flex flex-wrap gap-4 mb-6 items-center">
        <select
          value={type}
          onChange={(e) => setType(e.target.value as any)}
          className="border px-3 py-2 rounded"
        >
          <option value="direct">Direct Application</option>
          <option value="referral">Referral Request</option>
        </select>

        <button
          onClick={sendEmails}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {loading ? "Sending..." : "Send Emails"}
        </button>

        <button
          onClick={toggleSelectAll}
          className="bg-gray-200 px-4 py-2 rounded"
        >
          {selected.length === contacts.length ? "Deselect All" : "Select All"}
        </button>

        <span className="text-sm text-gray-600">
          Selected: {selected.length}
        </span>
      </div>

      {/* 📊 Table */}
      <div className="overflow-x-auto border rounded">
        <table className="w-full text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2">Select</th>
              <th className="p-2">HR Name</th>
              <th className="p-2">Company</th>
              <th className="p-2">Email</th>
              <th className="p-2">Phone</th>
              <th className="p-2">Last Sent</th>
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
                    checked={selected.includes(c)}
                    onChange={() => toggleSelect(c)}
                  />
                </td>

                <td className="p-2">{c.hr_name}</td>
                <td className="p-2">{c.company_name}</td>
                <td className="p-2">{c.email}</td>
                <td className="p-2">{c.phone || "-"}</td>
                <td className="p-2">
                  {latestSentDates[c.email.toLowerCase()] ? (
                    new Date(latestSentDates[c.email.toLowerCase()]).toLocaleString("en-IN", {
                      hour12: true,
                      dateStyle: "medium",
                      timeStyle: "short",
                    })
                  ) : (
                    <span className="text-gray-400 italic">Never</span>
                  )}
                </td>

                {/* 👁 Preview */}
                <td className="p-2">
                  <button
                    onClick={() => setPreview(c)}
                    className="text-blue-600 underline"
                  >
                    Preview
                  </button>
                </td>

                {/* 📊 Status */}
                <td className="p-2">
                  {getStatus(c.email) === "sent" && (
                    <span className="text-green-600 font-semibold">Sent</span>
                  )}
                  {getStatus(c.email) === "failed" && (
                    <span className="text-red-600 font-semibold">Failed</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 👁 Preview Modal */}
      {preview && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center">
          <div className="bg-white p-6 rounded w-[500px]">
            <h2 className="text-xl font-bold mb-2">Email Preview</h2>

            <p className="text-sm text-gray-600 mb-3">To: {preview.email}</p>

            <div className="border p-3 text-sm whitespace-pre-line max-h-60 overflow-y-auto">
              {type === "direct"
                ? `Dear ${preview.hr_name},

I am Sameer, a MERN Stack Developer.

I am interested in opportunities at ${preview.company_name}.

Skills: React, Node.js, Next.js, MongoDB

Resume: your-link
Portfolio: your-link

Thanks`
                : `Hi ${preview.hr_name} sir,

I hope you're doing well.

I wanted to ask if you could refer me to ${preview.company_name}.

I am a MERN Stack Developer.

Thanks & Regards,
Sameer`}
            </div>

            <button
              onClick={() => setPreview(null)}
              className="mt-4 bg-gray-800 text-white px-4 py-2 rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
