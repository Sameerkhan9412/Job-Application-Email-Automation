"use client";

import { useState } from "react";
import { Contact } from "./useContacts";

export const useSelection = () => {
  const [selected, setSelected] = useState<Contact[]>([]);

  const isSelected = (contact: Contact) => {
    return selected.some((c) => c.email === contact.email);
  };

  const toggleSelect = (contact: Contact) => {
    setSelected((prev) =>
      prev.some((c) => c.email === contact.email)
        ? prev.filter((c) => c.email !== contact.email)
        : [...prev, contact]
    );
  };

  const toggleSelectAll = (contacts: Contact[]) => {
    if (selected.length === contacts.length) {
      setSelected([]);
    } else {
      setSelected(contacts);
    }
  };

  const clearSelection = () => setSelected([]);

  return {
    selected,
    setSelected,
    isSelected,
    toggleSelect,
    toggleSelectAll,
    clearSelection,
  };
};