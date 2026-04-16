"use client";

import { useEffect, useState } from "react";
import axios from "axios";

export default function Home() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [selected, setSelected] = useState<any[]>([]);
  const [type, setType] = useState("direct");
  const [loadingFollowUp, setLoadingFollowUp] = useState<string | null>(null);

  // ✅ Fetch contacts
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const res = await axios.get("/api/contacts");
        setContacts(res.data.contacts || []);
      } catch (err) {
        console.error("Error fetching contacts:", err);
      }
    };

    fetchContacts();
  }, []);

  // ✅ Selection logic
  const toggleSelect = (contact: any) => {
    setSelected((prev) =>
      prev.some((c) => c.email === contact.email)
        ? prev.filter((c) => c.email !== contact.email)
        : [...prev, contact]
    );
  };

  const isSelected = (contact: any) => {
    return selected.some((c) => c.email === contact.email);
  };

  // ✅ Send emails
  const sendEmails = async () => {
    if (selected.length === 0) {
      alert("Please select at least one contact");
      return;
    }

    try {
      await axios.post("/api/send-mails", {
        contacts: selected,
        type,
      });

      alert("Emails sent successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to send emails");
    }
  };

  // 🔥 FOLLOW-UP FUNCTION
  const sendFollowUp = async (email: string) => {
    try {
      setLoadingFollowUp(email);

      const res = await axios.post("/api/follow-up", { email });

      alert(res.data.message || "Follow-up sent!");
    } catch (err: any) {
      console.error(err);
      alert(
        err?.response?.data?.message || "Failed to send follow-up"
      );
    } finally {
      setLoadingFollowUp(null);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">📧 Email Automation</h1>

      {/* Email Type */}
      <div className="my-4">
        <select
          className="border p-2 rounded"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="direct">Direct Application</option>
          <option value="referral">Referral Request</option>
        </select>
      </div>

      {/* Table */}
      <table className="w-full border">
        <thead className="bg-gray-100">
          <tr>
            <th>Select</th>
            <th>HR</th>
            <th>Company</th>
            <th>Email</th>
            <th>Follow-Up</th> {/* 🔥 NEW COLUMN */}
          </tr>
        </thead>

        <tbody>
          {contacts.length === 0 ? (
            <tr>
              <td colSpan={5} className="text-center p-4">
                No contacts found
              </td>
            </tr>
          ) : (
            contacts.map((c, i) => (
              <tr key={i} className="border-t">
                <td>
                  <input
                    type="checkbox"
                    checked={isSelected(c)}
                    onChange={() => toggleSelect(c)}
                  />
                </td>
                <td>{c.hr_name}</td>
                <td>{c.company_name}</td>
                <td>{c.email}</td>

                {/* 🔥 FOLLOW-UP BUTTON */}
                <td>
                  <button
                    onClick={() => sendFollowUp(c.email)}
                    disabled={loadingFollowUp === c.email}
                    className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded text-sm"
                  >
                    {loadingFollowUp === c.email
                      ? "Sending..."
                      : "Follow Up"}
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Send Button */}
      <button
        onClick={sendEmails}
        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 mt-4 rounded"
      >
        Send Emails ({selected.length})
      </button>
    </div>
  );
}