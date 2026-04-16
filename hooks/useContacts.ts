"use client";

import { useEffect, useState } from "react";
import axios from "axios";

export interface Contact {
  hr_name: string;
  company_name: string;
  email: string;
  phone?: string;
}

export const useContacts = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/contacts");

      setContacts(res.data.contacts || []);
    } catch (err: any) {
      setError("Failed to fetch contacts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  return {
    contacts,
    loading,
    error,
    refetch: fetchContacts,
  };
};