"use client";

import { useEffect, useState, useRef } from "react";
import axios from "axios";

interface Contact {
  hr_name: string;
  company_name: string;
  email: string;
  isManual?: boolean;
}

interface EmailLog {
  _id: string;
  email: string;
  hr_name: string;
  company: string;
  status: "sent" | "failed";
  type: "direct" | "referral";
  subject: string;
  message?: string;
  followUpCount: number;
  lastSentAt: string;
  createdAt: string;
  hasReplied?: boolean;
  isAutoFollowUpPaused?: boolean;
}

interface DBTemplate {
  _id?: string;
  name: string;
  key: string;
  subjectDirect: string;
  subjectReferral: string;
  bodyDirect: string;
  bodyReferral: string;
  isBuiltIn: boolean;
}

// Animated counter component
function AnimatedCounter({ end, duration = 2000, suffix = "" }: { end: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          let start = 0;
          const step = end / (duration / 16);
          const timer = setInterval(() => {
            start += step;
            if (start >= end) {
              setCount(end);
              clearInterval(timer);
            } else {
              setCount(Math.floor(start));
            }
          }, 16);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration, hasAnimated]);

  return <span ref={ref}>{count}{suffix}</span>;
}

// Floating particle component
function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full opacity-20"
          style={{
            width: `${Math.random() * 4 + 2}px`,
            height: `${Math.random() * 4 + 2}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: `hsl(${220 + Math.random() * 60}, 80%, 70%)`,
            animation: `float-particle ${8 + Math.random() * 12}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 5}s`,
          }}
        />
      ))}
    </div>
  );
}

export default function Home() {
  // Authentication states
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState("");
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Dynamic template states
  const [templates, setTemplates] = useState<DBTemplate[]>([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<DBTemplate | null>(null);

  // Template Form inputs
  const [tplName, setTplName] = useState("");
  const [tplKey, setTplKey] = useState("");
  const [tplSubDirect, setTplSubDirect] = useState("");
  const [tplSubReferral, setTplSubReferral] = useState("");
  const [tplBodyDirect, setTplBodyDirect] = useState("");
  const [tplBodyReferral, setTplBodyReferral] = useState("");
  const [savingTemplate, setSavingTemplate] = useState(false);

  // General lists
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selected, setSelected] = useState<Contact[]>([]);

  // Configuration states
  const [type, setType] = useState<"direct" | "referral">("direct");
  const [role, setRole] = useState("fullstack");
  const [customSubject, setCustomSubject] = useState("");
  const [emailFormat, setEmailFormat] = useState<"html" | "text">("html");

  // UI/Loading states
  const [sending, setSending] = useState(false);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [loadingFollowUp, setLoadingFollowUp] = useState<string | null>(null);
  const [loadingResend, setLoadingResend] = useState<string | null>(null);

  // Tracking logs state
  const [logs, setLogs] = useState<EmailLog[]>([]);

  // Pagination states for Logs
  const [logPage, setLogPage] = useState(1);
  const [logTotalPages, setLogTotalPages] = useState(1);
  const [logTotalCount, setLogTotalCount] = useState(0);
  const logLimit = 10;

  // Follow-up / Reminder states
  const [selectedLogIds, setSelectedLogIds] = useState<string[]>([]);
  const [checkingReplies, setCheckingReplies] = useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [followUpMessage, setFollowUpMessage] = useState("");
  const [targetFollowUpIds, setTargetFollowUpIds] = useState<string[]>([]);
  const [sendingFollowUp, setSendingFollowUp] = useState(false);

  // Manual contacts state
  const [manualContacts, setManualContacts] = useState<Contact[]>([]);

  // Manual adding form inputs
  const [activeManualTab, setActiveManualTab] = useState<"single" | "bulk">("single");
  const [singleHR, setSingleHR] = useState("");
  const [singleCompany, setSingleCompany] = useState("");
  const [singleEmail, setSingleEmail] = useState("");
  const [bulkText, setBulkText] = useState("");

  // Feedback notifications
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Mobile nav
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Active dashboard tab
  const [activeTab, setActiveTab] = useState<"dispatch" | "contacts" | "logs" | "templates">("dispatch");

  // Helper to fetch authorization header
  const getHeaders = () => {
    const token = localStorage.getItem("session_token");
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  };

  const showFeedback = (t: "success" | "error", txt: string) => {
    setFeedback({ type: t, text: txt });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    try {
      const res = await axios.post("/api/auth", {
        username: usernameInput,
        password: passwordInput,
      });
      if (res.data.success && res.data.token) {
        localStorage.setItem("session_token", res.data.token);
        setIsLoggedIn(true);
        setShowLoginModal(false);
        setUsernameInput("");
        setPasswordInput("");
        showFeedback("success", "Welcome back, Admin!");
      }
    } catch (err: any) {
      console.error(err);
      setAuthError(err.response?.data?.message || "Invalid credentials. Please try again.");
    }
  };

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem("session_token");
    setIsLoggedIn(false);
    showFeedback("success", "Logged out successfully");
  };

  // Fetch dynamic templates
  const fetchTemplates = async () => {
    try {
      const res = await axios.get("/api/templates", getHeaders());
      if (res.data.success) {
        setTemplates(res.data.templates || []);
      }
    } catch (err) {
      console.error("Error fetching templates:", err);
    }
  };

  // Fetch History Logs
  const fetchLogs = async (page = logPage) => {
    try {
      setLoadingLogs(true);
      const res = await axios.get(`/api/logs?page=${page}&limit=${logLimit}`, getHeaders());
      if (res.data.success) {
        setLogs(res.data.logs || []);
        setLogTotalPages(res.data.totalPages || 1);
        setLogTotalCount(res.data.total || 0);
        setLogPage(res.data.page || 1);
      }
    } catch (err) {
      console.error("Error fetching logs:", err);
    } finally {
      setLoadingLogs(false);
    }
  };

  // Setup data on mount
  useEffect(() => {
    const token = localStorage.getItem("session_token");
    if (!token) {
      setIsLoggedIn(false);
      return;
    }
    setIsLoggedIn(true);
  }, []);

  // Fetch data after login is verified
  useEffect(() => {
    if (isLoggedIn !== true) return;

    const saved = localStorage.getItem("manual_contacts");
    let loadedManual: Contact[] = [];
    if (saved) {
      try {
        loadedManual = JSON.parse(saved);
        setManualContacts(loadedManual);
      } catch (e) {
        console.error("Error parsing manual contacts", e);
      }
    }

    const loadData = async () => {
      setLoadingContacts(true);
      let fetched: Contact[] = [];
      try {
        const res = await axios.get("/api/contacts");
        fetched = res.data.contacts || [];
      } catch (err) {
        console.error("Error loading spreadsheet contacts:", err);
      }
      setContacts([...loadedManual, ...fetched]);
      setLoadingContacts(false);
    };

    loadData();
    fetchTemplates();
    fetchLogs(1);
  }, [isLoggedIn]);

  // Handle template selection changes
  const getSelectedTemplate = () => {
    return templates.find((t) => t.key === role) || templates[0];
  };

  const getDefaultSubject = () => {
    const tpl = getSelectedTemplate();
    if (!tpl) return "Application for opportunity at {{company}}";
    return type === "direct" ? tpl.subjectDirect : tpl.subjectReferral;
  };

  // Save manual contacts utility
  const saveManualContacts = (updated: Contact[]) => {
    setManualContacts(updated);
    localStorage.setItem("manual_contacts", JSON.stringify(updated));
    setContacts((prev) => [...updated, ...prev.filter((c) => !c.isManual)]);
  };

  // Add single manual contact
  const handleAddSingle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleHR.trim() || !singleCompany.trim() || !singleEmail.trim()) {
      alert("Please fill in all manual contact fields.");
      return;
    }

    const emailFormatted = singleEmail.trim().toLowerCase();
    if (!emailFormatted.includes("@") || !emailFormatted.includes(".")) {
      alert("Please enter a valid email address.");
      return;
    }

    if (contacts.some((c) => c.email.toLowerCase() === emailFormatted)) {
      alert("A contact with this email already exists.");
      return;
    }

    const newContact: Contact = {
      hr_name: singleHR.trim(),
      company_name: singleCompany.trim(),
      email: emailFormatted,
      isManual: true,
    };

    const updated = [newContact, ...manualContacts];
    saveManualContacts(updated);
    setSelected((prev) => [...prev, newContact]);

    setSingleHR("");
    setSingleCompany("");
    setSingleEmail("");
    showFeedback("success", "Manual contact added!");
  };

  // Add bulk contacts
  const handleAddBulk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkText.trim()) {
      alert("Please paste contact details first.");
      return;
    }

    const lines = bulkText.split("\n").map((l) => l.trim()).filter(Boolean);
    const parsedContacts: Contact[] = [];
    let duplicates = 0;
    let errors = 0;

    for (const line of lines) {
      const parts = line.split(/[,\t]/).map((p) => p.trim());
      if (parts.length >= 3) {
        const hr = parts[0];
        const company = parts[1];
        const email = parts[2].toLowerCase();

        if (email.includes("@") && email.includes(".")) {
          const contact: Contact = { hr_name: hr, company_name: company, email, isManual: true };
          if (
            contacts.some((c) => c.email.toLowerCase() === email) ||
            parsedContacts.some((c) => c.email === email)
          ) {
            duplicates++;
          } else {
            parsedContacts.push(contact);
          }
        } else {
          errors++;
        }
      } else {
        errors++;
      }
    }

    if (parsedContacts.length > 0) {
      const updated = [...parsedContacts, ...manualContacts];
      saveManualContacts(updated);
      setSelected((prev) => [...prev, ...parsedContacts]);
      setBulkText("");
      showFeedback(
        "success",
        `Imported ${parsedContacts.length} contacts! (Skipped ${duplicates} duplicates, ${errors} format errors)`
      );
    } else {
      alert(`No valid contacts found. ${errors} formatting errors, ${duplicates} duplicate emails.`);
    }
  };

  // Delete manual contact
  const handleDeleteManual = (email: string) => {
    const updated = manualContacts.filter((c) => c.email !== email);
    saveManualContacts(updated);
    setSelected((prev) => prev.filter((c) => c.email !== email));
    showFeedback("success", "Manual contact deleted.");
  };

  // Clear all manual contacts
  const handleClearAllManual = () => {
    if (confirm("Are you sure you want to clear all manual contacts?")) {
      saveManualContacts([]);
      setSelected((prev) => prev.filter((c) => !c.isManual));
      showFeedback("success", "Cleared manual directory.");
    }
  };

  // Send Emails
  const sendEmails = async () => {
    if (selected.length === 0) {
      alert("Please select at least one contact to send.");
      return;
    }

    setSending(true);
    try {
      const res = await axios.post(
        "/api/send-mails",
        { contacts: selected, type, role, customSubject: customSubject.trim() || undefined, format: emailFormat },
        getHeaders()
      );

      if (res.data.success) {
        showFeedback("success", `Successfully processed ${selected.length} emails!`);
        setSelected([]);
        fetchLogs(1);
      } else {
        alert(res.data.message || "Failed to send emails");
      }
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to dispatch emails");
    } finally {
      setSending(false);
    }
  };

  // Resend from Previous Logs
  const handleResend = async (logId: string) => {
    setLoadingResend(logId);
    try {
      const res = await axios.post("/api/resend", { logId }, getHeaders());
      if (res.data.success) {
        showFeedback("success", "Email successfully resent!");
        fetchLogs(logPage);
      } else {
        alert(res.data.message || "Failed to resend");
      }
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to resend email");
    } finally {
      setLoadingResend(null);
    }
  };

  // Follow-up handler
  const sendFollowUp = async (email: string) => {
    try {
      setLoadingFollowUp(email);
      const res = await axios.post("/api/follow-up", { email }, getHeaders());
      showFeedback("success", res.data.message || "Follow-up sent!");
      fetchLogs(logPage);
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || "Failed to send follow-up");
    } finally {
      setLoadingFollowUp(null);
    }
  };

  // Trigger IMAP check for replies
  const handleCheckReplies = async () => {
    setCheckingReplies(true);
    try {
      const res = await axios.post("/api/logs/check-replies", {}, getHeaders());
      if (res.data.success) {
        showFeedback(
          "success",
          res.data.updatedCount > 0
            ? `Checked replies: found ${res.data.updatedCount} new reply/replies!`
            : "Checked replies: No new replies found."
        );
        fetchLogs(logPage);
      }
    } catch (err: any) {
      console.error("Check replies error:", err);
      showFeedback("error", err.response?.data?.message || "Failed to check replies");
    } finally {
      setCheckingReplies(false);
    }
  };

  // Open the follow-up/reminder modal
  const openFollowUpModal = (logIds: string[]) => {
    setTargetFollowUpIds(logIds);
    setFollowUpMessage("");
    setShowFollowUpModal(true);
  };

  // Handle bulk or single follow-up reminders submission
  const submitFollowUpReminders = async () => {
    if (targetFollowUpIds.length === 0) return;
    setSendingFollowUp(true);
    try {
      const res = await axios.post(
        "/api/logs/bulk-followup",
        { logIds: targetFollowUpIds, customMessage: followUpMessage },
        getHeaders()
      );
      if (res.data.success) {
        showFeedback("success", `Successfully sent follow-up/reminder to ${targetFollowUpIds.length} candidate(s)!`);
        setShowFollowUpModal(false);
        setSelectedLogIds([]);
        fetchLogs(logPage);
      }
    } catch (err: any) {
      console.error("Bulk follow-up error:", err);
      alert(err.response?.data?.message || "Failed to send follow-up reminder(s).");
    } finally {
      setSendingFollowUp(false);
    }
  };

  // Checkbox toggle for email logs
  const toggleSelectLog = (logId: string) => {
    setSelectedLogIds((prev) =>
      prev.includes(logId) ? prev.filter((id) => id !== logId) : [...prev, logId]
    );
  };

  // Selection checkboxes
  const toggleSelect = (contact: Contact) => {
    setSelected((prev) =>
      prev.some((c) => c.email === contact.email)
        ? prev.filter((c) => c.email !== contact.email)
        : [...prev, contact]
    );
  };

  const isSelected = (contact: Contact) => selected.some((c) => c.email === contact.email);

  const toggleSelectAll = () => {
    if (selected.length === contacts.length) {
      setSelected([]);
    } else {
      setSelected(contacts);
    }
  };

  const stripHTML = (html: string) => {
    return html
      .replace(/<p[^>]*>/gi, "")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<strong>/gi, "")
      .replace(/<\/strong>/gi, "")
      .replace(/<a[^>]*href=["']([^"']*)["'][^>]*>(.*?)<\/a>/gi, "$2 ($1)")
      .replace(/<[^>]*>/g, "")
      .trim();
  };

  const getPreviewText = () => {
    const hr = "Hiring Team";
    const company = "Acme Corp";
    const greeting = type === "referral" ? `Hi ${hr} sir,` : `Hi ${hr},`;

    const activeTpl = getSelectedTemplate();
    if (!activeTpl) return "Loading preview...";

    const rawBody = type === "direct" ? activeTpl.bodyDirect : activeTpl.bodyReferral;
    const strippedBody = stripHTML(rawBody);
    const evaluatedBody = strippedBody
      .replace(/\{\{company\}\}/gi, company)
      .replace(/\{\{company_name\}\}/gi, company)
      .replace(/\{\{hr\}\}/gi, hr)
      .replace(/\{\{hr_name\}\}/gi, hr);

    return `${greeting}

${evaluatedBody}

Best regards,
Sameer
Email: sameerkhan.cse1@gmail.com
Phone: +91 9412803911
Portfolio: https://sameerwork.vercel.app/
GitHub: https://github.com/sameerkhan9412
LinkedIn: https://linkedin.com/in/sameerkhn
Resume: https://drive.google.com/file/d/1_Ky8_5W-IkpzoDCGfBNu1sVPCalUOtab`;
  };

  // Dynamic template rendering preview
  const getPreviewBody = () => {
    const hr = "Hiring Team";
    const company = "Acme Corp";
    const greeting = type === "referral" ? `Hi ${hr} sir,` : `Hi ${hr},`;

    const activeTpl = getSelectedTemplate();
    if (!activeTpl) return `<p style="color:#94a3b8;">Loading preview...</p>`;

    const rawBody = type === "direct" ? activeTpl.bodyDirect : activeTpl.bodyReferral;
    const evaluatedBody = rawBody
      .replace(/\{\{company\}\}/gi, company)
      .replace(/\{\{company_name\}\}/gi, company)
      .replace(/\{\{hr\}\}/gi, hr)
      .replace(/\{\{hr_name\}\}/gi, hr);

    return `
      <div style="font-family: 'Inter', sans-serif; font-size: 13px; line-height: 1.7; color: #cbd5e1;">
        <p style="margin-bottom:12px;">${greeting}</p>
        ${evaluatedBody}
        <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid rgba(148,163,184,0.15);">
          <p style="margin:0; color: #94a3b8;">Best regards,</p>
          <p style="margin:4px 0 0 0; font-weight: 600; color: #e2e8f0;">Sameer</p>
          <p style="margin:2px 0 0 0; font-size: 11px; color: #64748b;">sameerkhan.cse1@gmail.com</p>
        </div>
      </div>
    `;
  };

  // Custom Template CRUD Operations
  const openAddTemplate = () => {
    setEditingTemplate(null);
    setTplName("");
    setTplKey("");
    setTplSubDirect("");
    setTplSubReferral("");
    setTplBodyDirect("");
    setTplBodyReferral("");
    setShowTemplateModal(true);
  };

  const openEditTemplate = (tpl: DBTemplate) => {
    setEditingTemplate(tpl);
    setTplName(tpl.name);
    setTplKey(tpl.key);
    setTplSubDirect(tpl.subjectDirect);
    setTplSubReferral(tpl.subjectReferral);
    setTplBodyDirect(tpl.bodyDirect);
    setTplBodyReferral(tpl.bodyReferral);
    setShowTemplateModal(true);
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tplName.trim() || !tplKey.trim() || !tplSubDirect.trim() || !tplSubReferral.trim() || !tplBodyDirect.trim() || !tplBodyReferral.trim()) {
      alert("Please fill all template fields.");
      return;
    }

    setSavingTemplate(true);
    try {
      const res = await axios.post(
        "/api/templates",
        {
          id: editingTemplate?._id,
          name: tplName.trim(),
          key: tplKey.trim(),
          subjectDirect: tplSubDirect.trim(),
          subjectReferral: tplSubReferral.trim(),
          bodyDirect: tplBodyDirect.trim(),
          bodyReferral: tplBodyReferral.trim(),
        },
        getHeaders()
      );

      if (res.data.success) {
        showFeedback("success", `Template "${tplName}" saved!`);
        setShowTemplateModal(false);
        fetchTemplates();
      } else {
        alert(res.data.message || "Failed to save template");
      }
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to save template");
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleDeleteTemplate = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete template "${name}"?`)) return;

    try {
      const res = await axios.delete(`/api/templates?id=${id}`, getHeaders());
      if (res.data.success) {
        showFeedback("success", `Template "${name}" deleted.`);
        fetchTemplates();
        if (role === templates.find((t) => t._id === id)?.key) {
          setRole("fullstack");
        }
      } else {
        alert(res.data.message || "Failed to delete template");
      }
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to delete template");
    }
  };

  // Loading state
  if (isLoggedIn === null) {
    return (
      <div className="min-h-screen bg-[#030712] text-white flex items-center justify-center font-sans">
        <style jsx global>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
          * { font-family: 'Inter', sans-serif; }
          @keyframes float-particle {
            0%, 100% { transform: translateY(0) translateX(0); opacity: 0.2; }
            25% { transform: translateY(-20px) translateX(10px); opacity: 0.4; }
            50% { transform: translateY(-10px) translateX(-10px); opacity: 0.2; }
            75% { transform: translateY(-30px) translateX(5px); opacity: 0.3; }
          }
          @keyframes pulse-glow {
            0%, 100% { opacity: 0.4; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(1.05); }
          }
          @keyframes slide-up {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes slide-down {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes spin-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .animate-slide-up { animation: slide-up 0.6s ease-out forwards; }
          .animate-slide-down { animation: slide-down 0.4s ease-out forwards; }
          .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
          .stagger-1 { animation-delay: 0.1s; opacity: 0; }
          .stagger-2 { animation-delay: 0.2s; opacity: 0; }
          .stagger-3 { animation-delay: 0.3s; opacity: 0; }
          .stagger-4 { animation-delay: 0.4s; opacity: 0; }
          .stagger-5 { animation-delay: 0.5s; opacity: 0; }
          .stagger-6 { animation-delay: 0.6s; opacity: 0; }
        `}</style>
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="h-12 w-12 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
            <div className="absolute inset-0 h-12 w-12 rounded-full border-2 border-cyan-500/30 border-b-transparent animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
          </div>
          <p className="text-slate-400 text-sm tracking-wide">Initializing secure session...</p>
        </div>
      </div>
    );
  }

  // LANDING PAGE (NOT LOGGED IN)
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#030712] text-white font-sans selection:bg-violet-500/30 selection:text-white relative overflow-x-hidden">
        <style jsx global>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
          * { font-family: 'Inter', sans-serif; }
          @keyframes float-particle {
            0%, 100% { transform: translateY(0) translateX(0); opacity: 0.2; }
            25% { transform: translateY(-20px) translateX(10px); opacity: 0.4; }
            50% { transform: translateY(-10px) translateX(-10px); opacity: 0.2; }
            75% { transform: translateY(-30px) translateX(5px); opacity: 0.3; }
          }
          @keyframes pulse-glow {
            0%, 100% { opacity: 0.4; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(1.05); }
          }
          @keyframes slide-up {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes slide-down {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes gradient-shift {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
          }
          @keyframes orbit {
            from { transform: rotate(0deg) translateX(120px) rotate(0deg); }
            to { transform: rotate(360deg) translateX(120px) rotate(-360deg); }
          }
          .animate-slide-up { animation: slide-up 0.6s ease-out forwards; }
          .animate-slide-down { animation: slide-down 0.4s ease-out forwards; }
          .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
          .animate-gradient { animation: gradient-shift 6s ease infinite; background-size: 200% 200%; }
          .stagger-1 { animation-delay: 0.1s; opacity: 0; }
          .stagger-2 { animation-delay: 0.2s; opacity: 0; }
          .stagger-3 { animation-delay: 0.3s; opacity: 0; }
          .stagger-4 { animation-delay: 0.4s; opacity: 0; }
          .stagger-5 { animation-delay: 0.5s; opacity: 0; }
          .stagger-6 { animation-delay: 0.6s; opacity: 0; }
          .glass { background: rgba(255,255,255,0.03); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); }
          .glass-strong { background: rgba(255,255,255,0.06); backdrop-filter: blur(40px); -webkit-backdrop-filter: blur(40px); }
          .hover-lift { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
          .hover-lift:hover { transform: translateY(-4px); }
          .text-gradient { background: linear-gradient(135deg, #818cf8, #c084fc, #f472b6, #818cf8); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; background-size: 300% 300%; animation: gradient-shift 4s ease infinite; }
          .text-gradient-static { background: linear-gradient(135deg, #818cf8, #a78bfa, #c084fc); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
          .border-gradient { border-image: linear-gradient(135deg, rgba(129,140,248,0.3), rgba(192,132,252,0.3)) 1; }
          ::-webkit-scrollbar { width: 6px; }
          ::-webkit-scrollbar-track { background: rgba(15,23,42,0.5); }
          ::-webkit-scrollbar-thumb { background: rgba(100,116,139,0.3); border-radius: 3px; }
          ::-webkit-scrollbar-thumb:hover { background: rgba(100,116,139,0.5); }
        `}</style>

        <FloatingParticles />

        {/* Gradient orbs */}
        <div className="fixed top-[-20%] left-[-10%] w-[600px] h-[600px] bg-violet-600/8 rounded-full blur-[150px] pointer-events-none" />
        <div className="fixed top-[20%] right-[-10%] w-[500px] h-[500px] bg-cyan-500/6 rounded-full blur-[130px] pointer-events-none" />
        <div className="fixed bottom-[-10%] left-[30%] w-[400px] h-[400px] bg-fuchsia-500/5 rounded-full blur-[120px] pointer-events-none" />

        {/* Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50 animate-slide-down">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="glass-strong border border-white/[0.06] rounded-2xl mt-4 px-4 sm:px-6 py-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                  <span className="text-base sm:text-lg font-bold tracking-tight text-gradient-static">
                    MailForge
                  </span>
                </div>

                {/* Desktop nav */}
                <div className="hidden md:flex items-center gap-1">
                  <a href="#features" className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-white/[0.04]">Features</a>
                  <a href="#how-it-works" className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-white/[0.04]">How it Works</a>
                  <a href="#stats" className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-white/[0.04]">Stats</a>
                  <div className="w-px h-6 bg-white/10 mx-2" />
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="relative group px-5 py-2 text-sm font-semibold rounded-xl overflow-hidden cursor-pointer"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-fuchsia-600 transition-all group-hover:opacity-90" />
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-fuchsia-600 opacity-0 group-hover:opacity-100 blur-xl transition-all" />
                    <span className="relative text-white">Launch Console</span>
                  </button>
                </div>

                {/* Mobile hamburger */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-2 rounded-lg hover:bg-white/[0.06] transition-colors"
                >
                  <svg className="w-5 h-5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    {mobileMenuOpen ? (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                    )}
                  </svg>
                </button>
              </div>

              {/* Mobile menu */}
              {mobileMenuOpen && (
                <div className="md:hidden mt-4 pt-4 border-t border-white/[0.06] animate-slide-down">
                  <div className="flex flex-col gap-2">
                    <a href="#features" className="px-4 py-3 text-sm text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-white/[0.04]" onClick={() => setMobileMenuOpen(false)}>Features</a>
                    <a href="#how-it-works" className="px-4 py-3 text-sm text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-white/[0.04]" onClick={() => setMobileMenuOpen(false)}>How it Works</a>
                    <a href="#stats" className="px-4 py-3 text-sm text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-white/[0.04]" onClick={() => setMobileMenuOpen(false)}>Stats</a>
                    <button
                      onClick={() => { setShowLoginModal(true); setMobileMenuOpen(false); }}
                      className="mt-2 px-5 py-3 text-sm font-semibold rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white cursor-pointer"
                    >
                      Launch Console
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center pt-24 pb-20 px-4">
          {/* Animated background grid */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(rgba(148,163,184,0.05) 1px, transparent 1px)`,
              backgroundSize: '40px 40px',
            }} />
          </div>

          {/* Orbiting elements */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none hidden lg:block">
            <div className="relative w-[300px] h-[300px]">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ animation: 'orbit 20s linear infinite' }}>
                <div className="w-3 h-3 rounded-full bg-violet-400/40 blur-[1px]" />
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ animation: 'orbit 25s linear infinite reverse' }}>
                <div className="w-2 h-2 rounded-full bg-cyan-400/30 blur-[1px]" />
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ animation: 'orbit 30s linear infinite', animationDelay: '-5s' }}>
                <div className="w-2 h-2 rounded-full bg-fuchsia-400/30 blur-[1px]" />
              </div>
            </div>
          </div>

          <div className="max-w-5xl mx-auto text-center relative z-10">
            {/* Badge */}
            <div className="animate-slide-up stagger-1">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-white/[0.08] mb-8">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-medium text-slate-300 tracking-wide">Production-Ready Outreach Engine</span>
              </div>
            </div>

            {/* Main headline */}
            <h1 className="animate-slide-up stagger-2 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] mb-6">
              <span className="text-white">Automate Your</span>
              <br />
              <span className="text-gradient">Job Outreach</span>
              <br />
              <span className="text-white">Like a Pro</span>
            </h1>

            {/* Subtitle */}
            <p className="animate-slide-up stagger-3 text-base sm:text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              A powerful platform for sending personalized cold emails to HR teams. 
              Dynamic templates, real-time tracking, and instant resend — all in one beautiful console.
            </p>

            {/* CTA Buttons */}
            <div className="animate-slide-up stagger-4 flex flex-col sm:flex-row justify-center gap-4 mb-16">
              <button
                onClick={() => setShowLoginModal(true)}
                className="group relative px-8 py-4 text-base font-semibold rounded-2xl overflow-hidden cursor-pointer transition-all hover:shadow-2xl hover:shadow-violet-500/20"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-violet-600 animate-gradient" />
                <div className="absolute inset-[1px] bg-[#030712] rounded-2xl" />
                <div className="absolute inset-[1px] bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 rounded-2xl" />
                <span className="relative flex items-center justify-center gap-2 text-white">
                  Open Console
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </button>
              <a
                href="#features"
                className="px-8 py-4 text-base font-semibold rounded-2xl glass border border-white/[0.08] text-slate-300 hover:text-white hover:border-white/[0.15] transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
                Explore Features
              </a>
            </div>

            {/* Hero visual - Floating email preview card */}
            <div className="animate-slide-up stagger-5 max-w-2xl mx-auto">
              <div className="glass-strong border border-white/[0.08] rounded-3xl p-1 shadow-2xl shadow-violet-500/5">
                <div className="bg-gradient-to-br from-slate-900/80 to-slate-950/80 rounded-[20px] p-6 sm:p-8">
                  {/* Fake browser bar */}
                  <div className="flex items-center gap-2 mb-6">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-rose-500/60" />
                      <div className="w-3 h-3 rounded-full bg-amber-500/60" />
                      <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
                    </div>
                    <div className="flex-1 bg-white/[0.04] rounded-lg h-7 flex items-center px-3">
                      <span className="text-[11px] text-slate-500">mailforge.studio/console</span>
                    </div>
                  </div>

                  {/* Fake email content */}
                  <div className="space-y-4 text-left">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-xs font-bold text-white">S</div>
                      <div>
                        <div className="text-sm font-semibold text-slate-200">Application for Full Stack Developer</div>
                        <div className="text-xs text-slate-500">To: hr@techcorp.com</div>
                      </div>
                      <div className="ml-auto">
                        <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Sent ✓</span>
                      </div>
                    </div>
                    <div className="h-px bg-white/[0.06]" />
                    <div className="space-y-2">
                      <div className="h-2.5 bg-white/[0.06] rounded-full w-full" />
                      <div className="h-2.5 bg-white/[0.06] rounded-full w-4/5" />
                      <div className="h-2.5 bg-white/[0.06] rounded-full w-3/5" />
                      <div className="h-2.5 bg-white/[0.04] rounded-full w-2/3 mt-4" />
                      <div className="h-2.5 bg-white/[0.04] rounded-full w-1/2" />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <div className="px-3 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20 text-[10px] text-violet-400 font-medium">🔁 Resend</div>
                      <div className="px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-[10px] text-cyan-400 font-medium">📨 Follow Up</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section id="stats" className="relative py-20 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="glass border border-white/[0.06] rounded-3xl p-8 sm:p-12">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {[
                  { value: 500, suffix: "+", label: "Emails Sent", icon: "📧" },
                  { value: 98, suffix: "%", label: "Delivery Rate", icon: "✅" },
                  { value: 50, suffix: "+", label: "Templates", icon: "📝" },
                  { value: 24, suffix: "/7", label: "Uptime", icon: "⚡" },
                ].map((stat, i) => (
                  <div key={i} className="text-center group">
                    <div className="text-2xl mb-3 group-hover:scale-110 transition-transform">{stat.icon}</div>
                    <div className="text-3xl sm:text-4xl font-black text-gradient-static mb-1">
                      <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                    </div>
                    <div className="text-xs sm:text-sm text-slate-400 font-medium">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="relative py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass border border-white/[0.06] mb-4">
                <span className="text-xs font-medium text-violet-400">✨ Core Capabilities</span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white mb-4">
                Everything You Need
              </h2>
              <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto">
                Built with precision for developers who want to automate their job application outreach.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                    </svg>
                  ),
                  title: "Smart Contact Management",
                  description: "Import from spreadsheets or add contacts manually. Single entry or bulk paste with validation.",
                  gradient: "from-blue-500 to-cyan-500",
                  bgGlow: "bg-blue-500/5",
                },
                {
                  icon: (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                    </svg>
                  ),
                  title: "Dynamic Templates",
                  description: "Create templates with {{company}} and {{hr}} placeholders that auto-populate per recipient.",
                  gradient: "from-violet-500 to-purple-500",
                  bgGlow: "bg-violet-500/5",
                },
                {
                  icon: (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                    </svg>
                  ),
                  title: "Real-time Tracking",
                  description: "Every email is logged with status, timestamp, subject and content. Full delivery transparency.",
                  gradient: "from-emerald-500 to-teal-500",
                  bgGlow: "bg-emerald-500/5",
                },
                {
                  icon: (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M2.985 19.644l3.181-3.183" />
                    </svg>
                  ),
                  title: "Instant Resend",
                  description: "Resend any previously sent email with one click. No need to reconfigure templates or contacts.",
                  gradient: "from-amber-500 to-orange-500",
                  bgGlow: "bg-amber-500/5",
                },
                {
                  icon: (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                    </svg>
                  ),
                  title: "Dual Outreach Modes",
                  description: "Switch between Direct Application and Referral Request with separate subjects and body templates.",
                  gradient: "from-rose-500 to-pink-500",
                  bgGlow: "bg-rose-500/5",
                },
                {
                  icon: (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  ),
                  title: "Live Preview",
                  description: "See exactly how your email will look before sending. Dynamic placeholders resolve in real-time.",
                  gradient: "from-indigo-500 to-blue-500",
                  bgGlow: "bg-indigo-500/5",
                },
              ].map((feature, i) => (
                <div
                  key={i}
                  className="group relative glass border border-white/[0.06] rounded-2xl p-6 hover:border-white/[0.12] transition-all duration-500 hover-lift overflow-hidden"
                >
                  <div className={`absolute inset-0 ${feature.bgGlow} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl`} />
                  <div className="relative">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-white mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      {feature.icon}
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-gradient-static transition-all">{feature.title}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section id="how-it-works" className="relative py-20 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass border border-white/[0.06] mb-4">
                <span className="text-xs font-medium text-cyan-400">🚀 Workflow</span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white mb-4">
                How It Works
              </h2>
              <p className="text-slate-400 text-base sm:text-lg max-w-xl mx-auto">
                Three simple steps from contact list to delivered email.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              {/* Connecting line */}
              <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-px bg-gradient-to-r from-violet-500/30 via-fuchsia-500/30 to-cyan-500/30" />

              {[
                {
                  step: "01",
                  title: "Import Contacts",
                  description: "Upload from spreadsheets or manually add HR contacts with name, company and email.",
                  color: "violet",
                },
                {
                  step: "02",
                  title: "Configure & Preview",
                  description: "Select template, choose outreach type, customize subject line and preview the output.",
                  color: "fuchsia",
                },
                {
                  step: "03",
                  title: "Send & Track",
                  description: "Dispatch emails to selected recipients and monitor delivery status in real-time logs.",
                  color: "cyan",
                },
              ].map((item, i) => (
                <div key={i} className="relative text-center group">
                  <div className={`w-16 h-16 mx-auto rounded-2xl bg-${item.color}-500/10 border border-${item.color}-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <span className={`text-2xl font-black text-${item.color}-400`}>{item.step}</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Two outreach modes */}
        <section className="relative py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Direct Application Card */}
              <div className="group glass border border-white/[0.06] rounded-3xl p-8 hover:border-violet-500/20 transition-all duration-500 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-violet-500/5 rounded-full blur-[80px] group-hover:bg-violet-500/10 transition-all pointer-events-none" />
                <div className="relative">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-white">Direct Application</h3>
                  </div>
                  <p className="text-slate-400 text-sm leading-relaxed mb-6">
                    Send formal job application emails directly to hiring teams. Professional introductions with relevant experience highlights.
                  </p>
                  <div className="space-y-3">
                    {["Formal professional tone", "Role-specific content", "Resume & portfolio links"].map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                          <svg className="w-3 h-3 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-sm text-slate-300">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Referral Request Card */}
              <div className="group glass border border-white/[0.06] rounded-3xl p-8 hover:border-fuchsia-500/20 transition-all duration-500 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-fuchsia-500/5 rounded-full blur-[80px] group-hover:bg-fuchsia-500/10 transition-all pointer-events-none" />
                <div className="relative">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-fuchsia-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-white">Referral Request</h3>
                  </div>
                  <p className="text-slate-400 text-sm leading-relaxed mb-6">
                    Reach out to developers and professionals at target companies for internal referral opportunities. Polite and personalized.
                  </p>
                  <div className="space-y-3">
                    {["Networking-friendly tone", "Personalized greetings", "Respectful referral ask"].map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-fuchsia-500/10 flex items-center justify-center flex-shrink-0">
                          <svg className="w-3 h-3 text-fuchsia-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-sm text-slate-300">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative py-24 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="glass border border-white/[0.06] rounded-3xl p-12 sm:p-16 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-600/5 via-transparent to-fuchsia-600/5 pointer-events-none" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-1 bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />
              
              <div className="relative">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white mb-6">
                  Ready to Supercharge<br />Your Outreach?
                </h2>
                <p className="text-slate-400 text-base sm:text-lg max-w-xl mx-auto mb-10">
                  Stop sending emails one by one. Automate your entire job application pipeline today.
                </p>
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="group relative inline-flex items-center gap-3 px-10 py-5 text-lg font-bold rounded-2xl overflow-hidden cursor-pointer transition-all hover:shadow-2xl hover:shadow-violet-500/20"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-fuchsia-600" />
                  <span className="relative text-white">Get Started Now</span>
                  <svg className="relative w-5 h-5 text-white group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="relative border-t border-white/[0.06] py-12 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-sm font-semibold text-slate-300">MailForge</span>
                <span className="text-xs text-slate-600">© 2026 Sameer Khan</span>
              </div>
              <div className="flex items-center gap-6">
                <a
                  href="https://github.com/sameerkhan9412"
                  className="group flex items-center gap-2 text-sm text-slate-500 hover:text-white transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                  GitHub
                </a>
                <a
                  href="https://linkedin.com/in/sameerkhn"
                  className="group flex items-center gap-2 text-sm text-slate-500 hover:text-white transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                  LinkedIn
                </a>
              </div>
            </div>
          </div>
        </footer>

        {/* LOGIN MODAL */}
        {showLoginModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowLoginModal(false)}>
            <div className="absolute inset-0 bg-[#030712]/90 backdrop-blur-xl" />
            <div
              className="relative w-full max-w-md animate-slide-up"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="glass-strong border border-white/[0.08] rounded-3xl p-8 shadow-2xl shadow-violet-500/5">
                {/* Close button */}
                <button
                  onClick={() => setShowLoginModal(false)}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full glass border border-white/[0.08] flex items-center justify-center text-slate-400 hover:text-white hover:border-white/[0.15] transition-all"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* Header */}
                <div className="text-center mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-violet-500/20">
                    <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-black text-white mb-1">Welcome Back</h3>
                  <p className="text-sm text-slate-400">Enter your credentials to access the console</p>
                </div>

                {authError && (
                  <div className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-xl text-sm mb-6 animate-slide-down">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                    <span>{authError}</span>
                  </div>
                )}

                <form onSubmit={handleLogin} className="space-y-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Username
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        required
                        placeholder="admin"
                        value={usernameInput}
                        onChange={(e) => setUsernameInput(e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/[0.08] text-white rounded-xl pl-11 pr-4 py-3 text-sm outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all placeholder:text-slate-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                        </svg>
                      </div>
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/[0.08] text-white rounded-xl pl-11 pr-4 py-3 text-sm outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all placeholder:text-slate-600"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full relative group py-3.5 text-sm font-bold rounded-xl overflow-hidden cursor-pointer transition-all"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-fuchsia-600 group-hover:opacity-90 transition-opacity" />
                    <span className="relative text-white">Sign In</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==================== DASHBOARD (LOGGED IN) ====================
  return (
    <div className="min-h-screen bg-[#030712] text-white font-sans selection:bg-violet-500/30 selection:text-white relative overflow-x-hidden">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        * { font-family: 'Inter', sans-serif; }
        @keyframes slide-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slide-down { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes pulse-dot { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        .animate-slide-up { animation: slide-up 0.5s ease-out forwards; }
        .animate-slide-down { animation: slide-down 0.4s ease-out forwards; }
        .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
        .glass { background: rgba(255,255,255,0.03); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); }
        .glass-strong { background: rgba(255,255,255,0.06); backdrop-filter: blur(40px); -webkit-backdrop-filter: blur(40px); }
        .text-gradient-static { background: linear-gradient(135deg, #818cf8, #a78bfa, #c084fc); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: rgba(15,23,42,0.5); }
        ::-webkit-scrollbar-thumb { background: rgba(100,116,139,0.3); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(100,116,139,0.5); }
      `}</style>

      {/* Background */}
      <div className="fixed top-[-10%] left-[-5%] w-[500px] h-[500px] bg-violet-600/6 rounded-full blur-[150px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-5%] w-[400px] h-[400px] bg-fuchsia-500/4 rounded-full blur-[120px] pointer-events-none" />

      {/* Feedback toast */}
      {feedback && (
        <div className="fixed bottom-6 right-6 z-[60] animate-slide-up">
          <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border ${
            feedback.type === "success"
              ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20 shadow-emerald-500/5"
              : "bg-rose-500/10 text-rose-300 border-rose-500/20 shadow-rose-500/5"
          }`} style={{ backdropFilter: 'blur(20px)' }}>
            <div className={`w-2 h-2 rounded-full ${feedback.type === "success" ? "bg-emerald-400" : "bg-rose-400"}`} style={{ animation: 'pulse-dot 1s ease-in-out infinite' }} />
            <span className="text-sm font-medium">{feedback.text}</span>
          </div>
        </div>
      )}

      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-50 border-b border-white/[0.06]" style={{ background: 'rgba(3,7,18,0.85)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-base font-bold text-gradient-static hidden sm:inline">MailForge</span>
            </div>

            {/* Dashboard Tabs */}
            <div className="hidden md:flex items-center bg-white/[0.03] rounded-xl p-1 border border-white/[0.06]">
              {[
                { key: "dispatch" as const, label: "Dispatch", icon: "⚡" },
                { key: "contacts" as const, label: "Contacts", icon: "👥" },
                { key: "logs" as const, label: "Logs", icon: "📊" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    activeTab === tab.key
                      ? "bg-violet-600/80 text-white shadow-md shadow-violet-600/20"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <span className="mr-1.5">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={openAddTemplate}
                className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg glass border border-white/[0.08] text-slate-300 hover:text-white hover:border-white/[0.15] transition-all"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Templates
              </button>
              <div className="w-px h-6 bg-white/[0.08] hidden sm:block" />
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                </svg>
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>

          {/* Mobile Tab Bar */}
          <div className="md:hidden flex items-center gap-1 pb-3 overflow-x-auto">
            {[
              { key: "dispatch" as const, label: "Dispatch", icon: "⚡" },
              { key: "contacts" as const, label: "Contacts", icon: "👥" },
              { key: "logs" as const, label: "Logs", icon: "📊" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                  activeTab === tab.key
                    ? "bg-violet-600/80 text-white shadow-md"
                    : "text-slate-400 hover:text-white bg-white/[0.03]"
                }`}
              >
                <span className="mr-1">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
            <button
              onClick={openAddTemplate}
              className="sm:hidden px-4 py-2 text-xs font-semibold rounded-lg text-slate-400 hover:text-white bg-white/[0.03] whitespace-nowrap"
            >
              🛠️ Templates
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-20">

        {/* ===== DISPATCH TAB ===== */}
        {activeTab === "dispatch" && (
          <div className="animate-fade-in space-y-6 sm:space-y-8">
            {/* Header */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-1">Email Dispatch</h1>
              <p className="text-sm text-slate-400">Configure and send personalized emails to your selected contacts.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
              {/* Configuration Panel */}
              <div className="lg:col-span-7 glass border border-white/[0.06] rounded-2xl p-5 sm:p-6">
                <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                    <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.506-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" />
                    </svg>
                  </div>
                  Configuration
                </h2>

                {/* Type Toggle */}
                <div className="mb-5">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Outreach Type
                  </label>
                  <div className="flex bg-white/[0.03] p-1 rounded-xl w-full sm:w-fit border border-white/[0.06]">
                    <button
                      onClick={() => setType("direct")}
                      className={`flex-1 sm:flex-none px-4 sm:px-5 py-2 text-xs font-semibold rounded-lg transition-all ${
                        type === "direct"
                          ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-600/20"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Direct Application
                    </button>
                    <button
                      onClick={() => setType("referral")}
                      className={`flex-1 sm:flex-none px-4 sm:px-5 py-2 text-xs font-semibold rounded-lg transition-all ${
                        type === "referral"
                          ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-600/20"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Referral Request
                    </button>
                  </div>
                </div>

                {/* Email Format Toggle */}
                <div className="mb-5">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Email Format
                  </label>
                  <div className="flex bg-white/[0.03] p-1 rounded-xl w-full sm:w-fit border border-white/[0.06]">
                    <button
                      onClick={() => setEmailFormat("html")}
                      className={`flex-1 sm:flex-none px-4 sm:px-5 py-2 text-xs font-semibold rounded-lg transition-all ${
                        emailFormat === "html"
                          ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-600/20"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Styled HTML
                    </button>
                    <button
                      onClick={() => setEmailFormat("text")}
                      className={`flex-1 sm:flex-none px-4 sm:px-5 py-2 text-xs font-semibold rounded-lg transition-all ${
                        emailFormat === "text"
                          ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-600/20"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Plain Text (Normal Text)
                    </button>
                  </div>
                </div>

                {/* Template Selector */}
                <div className="mb-5">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Template / Role
                  </label>
                  {templates.length === 0 ? (
                    <div className="text-xs text-slate-500 py-2">Loading templates...</div>
                  ) : (
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/[0.08] text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all appearance-none cursor-pointer"
                      style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.75rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.25em 1.25em' }}
                    >
                      {templates.map((tpl) => (
                        <option key={tpl.key} value={tpl.key} className="bg-slate-900">{tpl.name}</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Subject Line */}
                <div className="mb-6">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    <span className="flex items-center justify-between">
                      <span>Subject Line</span>
                      <span className="text-[10px] text-violet-400 lowercase font-normal italic">Supports {"{{company}} & {{hr}}"} tags</span>
                    </span>
                  </label>
                  <input
                    type="text"
                    placeholder={getDefaultSubject().replace("{{company}}", "[Company]")}
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/[0.08] text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all placeholder:text-slate-600"
                  />
                </div>

                {/* Send action */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-5 border-t border-white/[0.06]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                      <span className="text-lg font-black text-violet-400">{selected.length}</span>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Recipients Selected</div>
                      <div className="text-xs text-slate-500">from contacts directory</div>
                    </div>
                  </div>
                  <button
                    onClick={sendEmails}
                    disabled={sending || selected.length === 0}
                    className="group relative px-6 py-3 text-sm font-bold rounded-xl overflow-hidden cursor-pointer transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-fuchsia-600" />
                    <span className="relative flex items-center justify-center gap-2 text-white">
                      {sending ? (
                        <>
                          <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                          </svg>
                          Send Emails ({selected.length})
                        </>
                      )}
                    </span>
                  </button>
                </div>
              </div>

              {/* Live Preview */}
              <div className="lg:col-span-5 glass border border-white/[0.06] rounded-2xl p-5 sm:p-6 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Live Preview
                  </h2>
                  <span className="text-[10px] px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] text-slate-400">
                    {type === "direct" ? "Direct" : "Referral"}
                  </span>
                </div>
                 <div className="bg-[#0a0f1e] border border-white/[0.04] rounded-xl p-4 flex-1 overflow-y-auto max-h-[350px]">
                  {emailFormat === "html" ? (
                    <div dangerouslySetInnerHTML={{ __html: getPreviewBody() }} />
                  ) : (
                    <pre className="whitespace-pre-wrap font-sans text-xs text-slate-300 leading-relaxed font-normal">
                      {getPreviewText()}
                    </pre>
                  )}
                </div>
                <div className="text-[10px] text-slate-500 mt-3 text-center">
                  Placeholders resolve dynamically for each contact
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== CONTACTS TAB ===== */}
        {activeTab === "contacts" && (
          <div className="animate-fade-in space-y-6 sm:space-y-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-1">Contact Directory</h1>
              <p className="text-sm text-slate-400">Manage your recipient list and add manual contacts.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
              {/* Contacts Table */}
              <div className="lg:col-span-7 glass border border-white/[0.06] rounded-2xl p-5 sm:p-6">
                <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-white">All Contacts</h2>
                      <p className="text-[11px] text-slate-500">{contacts.length} total · {selected.length} selected</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={toggleSelectAll}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg glass border border-white/[0.08] text-slate-300 hover:text-white hover:border-white/[0.15] transition-all"
                    >
                      {selected.length === contacts.length && contacts.length > 0 ? "Deselect All" : "Select All"}
                    </button>
                    {manualContacts.length > 0 && (
                      <button
                        onClick={handleClearAllManual}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition-all"
                      >
                        Clear Manual
                      </button>
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto border border-white/[0.04] rounded-xl max-h-[450px]">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-white/[0.02] text-slate-400 sticky top-0 border-b border-white/[0.06]">
                      <tr>
                        <th className="p-3 w-10"></th>
                        <th className="p-3 font-semibold">HR Name</th>
                        <th className="p-3 font-semibold">Company</th>
                        <th className="p-3 font-semibold hidden sm:table-cell">Email</th>
                        <th className="p-3 text-right font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.03]">
                      {loadingContacts ? (
                        <tr>
                          <td colSpan={5} className="text-center p-12">
                            <div className="flex flex-col items-center gap-3">
                              <div className="w-6 h-6 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
                              <span className="text-slate-500 text-xs">Loading contacts...</span>
                            </div>
                          </td>
                        </tr>
                      ) : contacts.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center p-12">
                            <div className="flex flex-col items-center gap-3">
                              <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                                <svg className="w-6 h-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                                </svg>
                              </div>
                              <span className="text-slate-500 text-xs">No contacts yet. Add manually or connect a sheet.</span>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        contacts.map((c, i) => (
                          <tr
                            key={i}
                            className={`transition-colors ${
                              isSelected(c) ? "bg-violet-500/[0.04]" : "hover:bg-white/[0.02]"
                            }`}
                          >
                            <td className="p-3">
                              <div className="relative">
                                <input
                                  type="checkbox"
                                  checked={isSelected(c)}
                                  onChange={() => toggleSelect(c)}
                                  className="w-4 h-4 rounded border-white/20 bg-white/[0.04] text-violet-600 focus:ring-violet-500 focus:ring-offset-0 cursor-pointer"
                                />
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-white/[0.06] flex items-center justify-center text-[10px] font-bold text-violet-300 flex-shrink-0">
                                  {c.hr_name.charAt(0).toUpperCase()}
                                </div>
                                <span className="font-medium text-slate-200 truncate">{c.hr_name}</span>
                              </div>
                            </td>
                            <td className="p-3 text-slate-300 truncate max-w-[120px]">{c.company_name}</td>
                            <td className="p-3 text-slate-400 hidden sm:table-cell truncate max-w-[180px]">{c.email}</td>
                            <td className="p-3 text-right">
                              <div className="flex justify-end items-center gap-1.5">
                                {c.isManual ? (
                                  <>
                                    <span className="px-2 py-0.5 text-[9px] font-bold rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase">Manual</span>
                                    <button
                                      onClick={() => handleDeleteManual(c.email)}
                                      className="p-1.5 rounded-lg hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 transition-all"
                                      title="Delete"
                                    >
                                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                      </svg>
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    onClick={() => sendFollowUp(c.email)}
                                    disabled={loadingFollowUp === c.email}
                                    className="px-2.5 py-1 text-[10px] font-semibold rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 transition-all disabled:opacity-30"
                                  >
                                    {loadingFollowUp === c.email ? "..." : "Follow Up"}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Add Manual Contact */}
              <div className="lg:col-span-5 glass border border-white/[0.06] rounded-2xl p-5 sm:p-6 flex flex-col">
                <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                    </svg>
                  </div>
                  Add Contacts
                </h2>

                {/* Tab toggle */}
                <div className="flex bg-white/[0.03] p-1 rounded-xl border border-white/[0.06] mb-5">
                  <button
                    onClick={() => setActiveManualTab("single")}
                    className={`flex-1 px-3 py-2 text-xs rounded-lg transition-all font-semibold ${
                      activeManualTab === "single"
                        ? "bg-white/[0.06] text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    Single Entry
                  </button>
                  <button
                    onClick={() => setActiveManualTab("bulk")}
                    className={`flex-1 px-3 py-2 text-xs rounded-lg transition-all font-semibold ${
                      activeManualTab === "bulk"
                        ? "bg-white/[0.06] text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    Bulk Import
                  </button>
                </div>

                {activeManualTab === "single" ? (
                  <form onSubmit={handleAddSingle} className="space-y-4 flex-1 flex flex-col">
                    <div className="space-y-3 flex-1">
                      {[
                        { label: "HR Name", placeholder: "e.g. Priyanjali", value: singleHR, setter: setSingleHR, type: "text" },
                        { label: "Company", placeholder: "e.g. Technopedia", value: singleCompany, setter: setSingleCompany, type: "text" },
                        { label: "Email Address", placeholder: "e.g. hr@company.com", value: singleEmail, setter: setSingleEmail, type: "email" },
                      ].map((field, i) => (
                        <div key={i}>
                          <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">{field.label}</label>
                          <input
                            type={field.type}
                            required
                            placeholder={field.placeholder}
                            value={field.value}
                            onChange={(e) => field.setter(e.target.value)}
                            className="w-full bg-white/[0.03] border border-white/[0.08] text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all placeholder:text-slate-600"
                          />
                        </div>
                      ))}
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2.5 text-sm font-bold rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:opacity-90 transition-all"
                    >
                      + Add Contact
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleAddBulk} className="flex-1 flex flex-col">
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Paste Contacts</label>
                        <span className="text-[9px] text-violet-400 italic">comma or tab separated</span>
                      </div>
                      <textarea
                        rows={7}
                        placeholder="HR Name, Company, email@address.com&#10;John Doe, Google, john@google.com"
                        value={bulkText}
                        onChange={(e) => setBulkText(e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/[0.08] text-white rounded-xl px-4 py-3 text-xs outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all placeholder:text-slate-600 font-mono resize-none"
                      />
                      <div className="text-[10px] text-slate-500 mt-1.5">One contact per line: Name, Company, Email</div>
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2.5 text-sm font-bold rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:opacity-90 transition-all mt-4"
                    >
                      📥 Import Contacts
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ===== LOGS TAB ===== */}
        {activeTab === "logs" && (
          <div className="animate-fade-in space-y-6">
            <div className="flex flex-wrap justify-between items-start gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-1">Email Logs</h1>
                <p className="text-sm text-slate-400">Track delivery status and resend from previous records.</p>
              </div>
              <div className="flex items-center gap-2">
                {selectedLogIds.length > 0 && (
                  <button
                    onClick={() => openFollowUpModal(selectedLogIds)}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-900/20 transition-all"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Send Reminder ({selectedLogIds.length})
                  </button>
                )}

                <button
                  onClick={handleCheckReplies}
                  disabled={checkingReplies}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-900/20 transition-all disabled:opacity-40"
                >
                  {checkingReplies ? (
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3 3 6-6" />
                    </svg>
                  )}
                  Check Replies
                </button>

                <button
                  onClick={() => fetchLogs(logPage)}
                  disabled={loadingLogs}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl glass border border-white/[0.08] text-slate-300 hover:text-white hover:border-white/[0.15] transition-all disabled:opacity-40"
                >
                  {loadingLogs ? (
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-400 border-t-transparent animate-spin" />
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M2.985 19.644l3.181-3.183" />
                    </svg>
                  )}
                  Refresh
                </button>
              </div>
            </div>

            <div className="glass border border-white/[0.06] rounded-2xl overflow-hidden">
              <div className="overflow-x-auto max-h-[500px]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-white/[0.02] text-slate-400 sticky top-0 border-b border-white/[0.06]">
                    <tr>
                      <th className="p-3.5 w-10">
                        <input
                          type="checkbox"
                          checked={logs.length > 0 && logs.filter(l => l.status === "sent" && !l.hasReplied).every(l => selectedLogIds.includes(l._id))}
                          onChange={(e) => {
                            if (e.target.checked) {
                              const eligible = logs.filter(l => l.status === "sent" && !l.hasReplied).map(l => l._id);
                              setSelectedLogIds(eligible);
                            } else {
                              setSelectedLogIds([]);
                            }
                          }}
                          className="rounded border-white/[0.1] bg-white/[0.05] text-violet-500 focus:ring-violet-500/30"
                        />
                      </th>
                      <th className="p-3.5 font-semibold">Recipient</th>
                      <th className="p-3.5 font-semibold hidden sm:table-cell">Company</th>
                      <th className="p-3.5 font-semibold hidden md:table-cell">Subject</th>
                      <th className="p-3.5 font-semibold hidden lg:table-cell">Sent At</th>
                      <th className="p-3.5 font-semibold">Status</th>
                      <th className="p-3.5 text-right font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.03]">
                    {logs.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center p-16">
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                              <svg className="w-6 h-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                              </svg>
                            </div>
                            <span className="text-slate-500 text-xs">No email logs recorded yet</span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      logs.map((log) => (
                        <tr key={log._id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="p-3.5 w-10">
                            {log.status === "sent" && !log.hasReplied ? (
                              <input
                                type="checkbox"
                                checked={selectedLogIds.includes(log._id)}
                                onChange={() => toggleSelectLog(log._id)}
                                className="rounded border-white/[0.1] bg-white/[0.05] text-violet-500 focus:ring-violet-500/30"
                              />
                            ) : null}
                          </td>
                          <td className="p-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-white/[0.06] flex items-center justify-center text-[10px] font-bold text-violet-300 flex-shrink-0">
                                {(log.hr_name || "?").charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="font-medium text-slate-200 truncate text-xs">{log.hr_name || "-"}</div>
                                <div className="text-[10px] text-slate-500 truncate sm:hidden">{log.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-3.5 text-slate-300 hidden sm:table-cell truncate max-w-[120px]">{log.company || "-"}</td>
                          <td className="p-3.5 text-slate-400 hidden md:table-cell truncate max-w-[200px]" title={log.subject}>{log.subject}</td>
                          <td className="p-3.5 text-slate-500 hidden lg:table-cell whitespace-nowrap">
                            {new Date(log.createdAt || log.lastSentAt).toLocaleString("en-IN", {
                              hour12: true,
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </td>
                          <td className="p-3.5">
                            <div className="flex flex-wrap gap-1.5 items-center">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold rounded-full border uppercase tracking-wide ${
                                log.status === "sent"
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                  : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                              }`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${log.status === "sent" ? "bg-emerald-400" : "bg-rose-400"}`} />
                                {log.status}
                              </span>
                              {log.hasReplied && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold rounded-full border uppercase tracking-wide bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
                                  Replied
                                </span>
                              )}
                              {log.isAutoFollowUpPaused && !log.hasReplied && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold rounded-full border uppercase tracking-wide bg-amber-500/10 text-amber-400 border-amber-500/20">
                                  Paused
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleResend(log._id)}
                                disabled={loadingResend === log._id}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-semibold rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20 hover:bg-violet-500/20 transition-all disabled:opacity-30"
                              >
                                {loadingResend === log._id ? (
                                  <div className="w-3 h-3 rounded-full border-2 border-violet-400 border-t-transparent animate-spin" />
                                ) : (
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M2.985 19.644l3.181-3.183" />
                                  </svg>
                                )}
                                {loadingResend === log._id ? "..." : "Resend"}
                              </button>

                              {log.status === "sent" && !log.hasReplied && (
                                <button
                                  onClick={() => openFollowUpModal([log._id])}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-semibold rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all"
                                >
                                  Remind
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {logTotalPages > 1 && (
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-t border-white/[0.04]">
                  <div className="text-xs text-slate-400">
                    Page <span className="font-bold text-white">{logPage}</span> of{" "}
                    <span className="font-bold text-white">{logTotalPages}</span>
                    <span className="text-slate-500 ml-2">({logTotalCount} total)</span>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      disabled={logPage === 1}
                      onClick={() => fetchLogs(logPage - 1)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold glass border border-white/[0.08] text-slate-400 hover:text-white disabled:opacity-30 transition-all"
                    >
                      ← Prev
                    </button>
                    {Array.from({ length: logTotalPages }, (_, i) => {
                      const p = i + 1;
                      if (p === 1 || p === logTotalPages || Math.abs(p - logPage) <= 1) {
                        return (
                          <button
                            key={p}
                            onClick={() => fetchLogs(p)}
                            className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                              logPage === p
                                ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20"
                                : "glass border border-white/[0.08] text-slate-400 hover:text-white"
                            }`}
                          >
                            {p}
                          </button>
                        );
                      } else if (p === 2 || p === logTotalPages - 1) {
                        return <span key={p} className="text-slate-600 px-1 self-center text-xs">...</span>;
                      }
                      return null;
                    })}
                    <button
                      disabled={logPage === logTotalPages}
                      onClick={() => fetchLogs(logPage + 1)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold glass border border-white/[0.08] text-slate-400 hover:text-white disabled:opacity-30 transition-all"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ===== FOLLOW-UP / REMINDER MODAL ===== */}
      {showFollowUpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setShowFollowUpModal(false)}>
          <div className="absolute inset-0 bg-[#030712]/90 backdrop-blur-xl" />
          <div
            className="relative w-full max-w-lg animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="glass-strong border border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-2xl">
              <button
                onClick={() => setShowFollowUpModal(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full glass border border-white/[0.08] flex items-center justify-center text-slate-400 hover:text-white hover:border-white/[0.15] transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="mb-6">
                <h3 className="text-xl font-black text-white mb-1">✉️ Send Follow-up Reminder</h3>
                <p className="text-sm text-slate-400">
                  Sending a thread-linked reply to {targetFollowUpIds.length} recipient(s).
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Custom Message (Optional)
                  </label>
                  <textarea
                    rows={6}
                    placeholder="Write a custom follow-up message here... Leave empty to send the default template follow-up reply."
                    value={followUpMessage}
                    onChange={(e) => setFollowUpMessage(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/[0.08] text-white rounded-xl px-4 py-3 text-xs outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all placeholder:text-slate-600 resize-none animate-none"
                  />
                  <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">
                    💡 If left blank, the system will send the standard follow-up reply based on the original email type and follow-up count.
                  </p>
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-white/[0.06]">
                  <button
                    onClick={() => setShowFollowUpModal(false)}
                    className="px-4 py-2 text-xs font-semibold rounded-xl glass border border-white/[0.08] text-slate-300 hover:text-white hover:border-white/[0.15] transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitFollowUpReminders}
                    disabled={sendingFollowUp}
                    className="flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:opacity-90 transition-all disabled:opacity-50"
                  >
                    {sendingFollowUp ? (
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    )}
                    {sendingFollowUp ? "Sending..." : "Send Reminder"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== TEMPLATE MANAGER MODAL ===== */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={() => setShowTemplateModal(false)}>
          <div className="absolute inset-0 bg-[#030712]/90 backdrop-blur-xl" />
          <div
            className="relative w-full max-w-5xl my-8 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="glass-strong border border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-2xl">
              <button
                onClick={() => setShowTemplateModal(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full glass border border-white/[0.08] flex items-center justify-center text-slate-400 hover:text-white hover:border-white/[0.15] transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="mb-6">
                <h3 className="text-2xl font-black text-white mb-1">Template Manager</h3>
                <p className="text-sm text-slate-400">Create, edit, and manage your email templates. Changes persist in MongoDB.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-6 mb-6 border-b border-white/[0.06]">
                {/* Template list */}
                <div className="lg:col-span-4 lg:border-r lg:border-white/[0.06] lg:pr-6">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Templates</h4>
                    <button
                      onClick={openAddTemplate}
                      className="text-[10px] font-semibold text-violet-400 hover:text-violet-300 transition-colors"
                    >
                      + New
                    </button>
                  </div>
                  <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                    {templates.map((t) => (
                      <div
                        key={t.key}
                        className={`flex justify-between items-center p-3 rounded-xl border text-xs transition-all cursor-pointer ${
                          editingTemplate?.key === t.key
                            ? "bg-violet-500/[0.06] border-violet-500/30"
                            : "bg-white/[0.02] border-white/[0.04] hover:border-white/[0.1]"
                        }`}
                        onClick={() => openEditTemplate(t)}
                      >
                        <span className="font-medium text-slate-200 truncate pr-2">{t.name}</span>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {t.isBuiltIn ? (
                            <span className="text-[8px] px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.06] text-slate-500 uppercase font-bold tracking-wider">Built-in</span>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                t._id && handleDeleteTemplate(t._id, t.name);
                              }}
                              className="p-1 rounded hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 transition-all"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Template Editor */}
                <form onSubmit={handleSaveTemplate} className="lg:col-span-8 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Template Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Python Developer"
                        value={tplName}
                        onChange={(e) => setTplName(e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/[0.08] text-white rounded-xl px-3 py-2.5 text-xs outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all placeholder:text-slate-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Unique Key</label>
                      <input
                        type="text"
                        required
                        disabled={editingTemplate?.isBuiltIn}
                        placeholder="e.g. python_dev"
                        value={tplKey}
                        onChange={(e) => setTplKey(e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/[0.08] text-white rounded-xl px-3 py-2.5 text-xs outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all placeholder:text-slate-600 disabled:opacity-30"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Subject (Direct)</label>
                      <input
                        type="text"
                        required
                        placeholder="Application for role at {{company}}"
                        value={tplSubDirect}
                        onChange={(e) => setTplSubDirect(e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/[0.08] text-white rounded-xl px-3 py-2.5 text-xs outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all placeholder:text-slate-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Subject (Referral)</label>
                      <input
                        type="text"
                        required
                        placeholder="Referral Request for {{company}}"
                        value={tplSubReferral}
                        onChange={(e) => setTplSubReferral(e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/[0.08] text-white rounded-xl px-3 py-2.5 text-xs outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all placeholder:text-slate-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Body (Direct)</label>
                        <span className="text-[9px] text-violet-400 font-normal">HTML supported</span>
                      </div>
                      <textarea
                        rows={6}
                        required
                        placeholder="<p>Hi {{hr}}, applying for {{company}}...</p>"
                        value={tplBodyDirect}
                        onChange={(e) => setTplBodyDirect(e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/[0.08] text-white rounded-xl px-3 py-2.5 text-xs outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all placeholder:text-slate-600 font-mono resize-y"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Body (Referral)</label>
                        <span className="text-[9px] text-violet-400 font-normal">HTML supported</span>
                      </div>
                      <textarea
                        rows={6}
                        required
                        placeholder="<p>Hi {{hr}}, referring at {{company}}...</p>"
                        value={tplBodyReferral}
                        onChange={(e) => setTplBodyReferral(e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/[0.08] text-white rounded-xl px-3 py-2.5 text-xs outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all placeholder:text-slate-600 font-mono resize-y"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTemplate(null);
                        setTplName(""); setTplKey(""); setTplSubDirect(""); setTplSubReferral(""); setTplBodyDirect(""); setTplBodyReferral("");
                      }}
                      className="px-4 py-2.5 text-xs font-semibold rounded-xl glass border border-white/[0.08] text-slate-400 hover:text-white transition-all"
                    >
                      Clear Form
                    </button>
                    <button
                      type="submit"
                      disabled={savingTemplate}
                      className="px-6 py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:opacity-90 transition-all disabled:opacity-30"
                    >
                      {savingTemplate ? "Saving..." : editingTemplate ? "Update Template" : "+ Create Template"}
                    </button>
                  </div>
                </form>
              </div>

              <div className="text-[10px] text-slate-500">
                Use <code className="text-slate-400 font-mono bg-white/[0.03] px-1.5 py-0.5 rounded">{"{{company}}"}</code> for company name and{" "}
                <code className="text-slate-400 font-mono bg-white/[0.03] px-1.5 py-0.5 rounded">{"{{hr}}"}</code> for recipient name in templates.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}