"use client";

import { useState } from "react";
import axios from "axios";
import { Contact } from "./useContacts";

export const useSendEmails = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<
    { email: string; status: "sent" | "failed" }[]
  >([]);
  const [error, setError] = useState("");

  const sendEmails = async (
    contacts: Contact[],
    type: "direct" | "referral"
  ) => {
    try {
      setLoading(true);
      setError("");

      const res = await axios.post("/api/send-emails", {
        contacts,
        type,
      });

      setResults(res.data.results || []);
      return res.data;
    } catch (err: any) {
      setError("Failed to send emails");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getStatus = (email: string) => {
    const found = results.find((r) => r.email === email);
    return found?.status;
  };

  return {
    sendEmails,
    loading,
    results,
    error,
    getStatus,
  };
};