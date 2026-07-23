import React from "react";
import { createRoot } from "react-dom/client";
import {
  LayoutDashboard,
  Users,
  UserRoundCheck,
  FileText,
  CalendarDays,
  ShieldCheck,
  Plus,
  LogOut,
  HeartHandshake,
  Search,
  Eye,
} from "lucide-react";
import { supabase, supabaseConfigured } from "./lib/supabase";
import "./styles.css";

const seedClients = [
  {
    id: "demo-client-1",
    full_name: "Demo Client",
    phone: "312-555-0101",
    email: "client@example.com",
    city: "Park Forest",
    status: "lead",
    service_needed: "Companion care and homemaker support",
    preferred_schedule: "Mondays, Wednesdays, Fridays",
    emergency_contact_name: "Family Contact",
    emergency_contact_phone: "312-555-0199",
    notes: "Demo record. Connect Supabase to save live data.",
  },
];

const seedCaregivers = [
  {
    id: "demo-caregiver-1",
    full_name: "Demo Caregiver",
    phone: "312-555-0202",
    email: "caregiver@example.com",
    status: "applicant",
    experience: "2 years private duty care",
    certifications: "CNA, CPR",
    availability: "Weekdays",
    background_check_status: "pending",
    notes: "Demo record. Connect Supabase to save live data.",
  },
];

function friendlyAuthError(error) {
  const message = String(error?.message || error || "");
  if (/failed to fetch|load failed|networkerror|network request failed/i.test(message)) {
    return "The login service could not be reached. Please refresh and try again. If this continues, the Supabase connection in Vercel needs to be repaired.";
  }
  if (/invalid login credentials/i.test(message)) {
    return "The email or password is incorrect.";
  }
  if (/email not confirmed/i.test(message)) {
    return "Please confirm your email address before signing in.";
  }
  return message || "Unable to sign in. Please try again.";
}

function LogoMark() {
  return (
    <div className="mark">
      <HeartHandshake size={24} />
    </div>
  );
}

function Login({ onSession }) {
  const [mode, setMode] = React.useState("signin");
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  async function submit(event) {
    event.preventDefault();
    if (submitting) return;
    setMessage("");

    if (!supabaseConfigured || !supabase) {
      setMessage(
        "The secure login service is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to the Vercel project."
      );
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;

        if (data.user) {
          const { error: profileError } = await supabase.from("profiles").upsert({
            id: data.user.id,
            full_name: fullName || email,
            email,
            role: "admin",
          });
          if (profileError) throw profileError;
        }

        setMessage("Account created. Check your email if confirmation is required, then sign in.");
        setMode("signin");
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (!data.session) throw new Error("No secure session was returned.");
      onSession(data.session);
    } catch (error) {
      console.error("Authentication error", error);
      setMessage(friendlyAuthError(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <section className="login-brand">
        <div className="logo-mark">
          <HeartHandshake size={40} />
        </div>
        <h1>Hampton Healthcare OS</h1>
        <p>
          A private operations platform for client care, caregiver management,
          documents, schedules, and agency growth.
        </p>
      </section>
      <section className="login-card">
        <form className="auth-box" onSubmit={submit}>
          <h2>{mode === "signin" ? "Sign in" : "Create owner account"}</h2>
          <p>Secure access for Hampton Healthcare Services leadership.</p>
          <div className="form-grid">
            {mode === "signup" && (
              <input
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Full name"
              />
            )}
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              placeholder="Email address"
              autoComplete="email"
              required
            />
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              placeholder="Password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              required
            />
            <button className="btn gold" type="submit" disabled={submitting}>
              {submitting ? "Please wait..." : mode === "signin" ? "Sign In" : "Create Account"}
            </button>
            <button
              className="btn light"
              type="button"
              disabled={submitting}
              onClick={() => {
                setMessage("");
                setMode(mode === "signin" ? "signup" : "signin");
              }}
            >
              {mode === "signin" ? "Create first admin account" : "Back to sign in"}
            </button>
            {message && (
              <p className={message.includes("created") ? "success" : "error"}>{message}</p>
            )}
          </div>
        </form>
      </section>
    </div>
  );
}

function Sidebar({ page, setPage, signOut }) {
  const items = [
    ["dashboard", "Dashboard", LayoutDashboard],
    ["clients", "Clients", Users],
    ["caregivers", "Caregivers", UserRoundCheck],
    ["documents", "Documents", FileText],
    ["schedule", "Scheduling", CalendarDays],
    ["compliance", "Compliance", ShieldCheck],
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <LogoMark />
        <div>
          <strong>Hampton OS</strong>
          <span>Home Care Command Center</span>
        </div>
      </div>
      <nav className="side-nav">
        {items.map(([key, label, Icon]) => (
          <button
            key={key}
            className={`nav-item ${page === key ? "active" : ""}`}
            onClick={() => setPage(key)}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
      </nav>
      <div className="sidebar-footer">
        <button className="nav-item" onClick={signOut}>
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}

function Dashboard({ clients, caregivers }) {
  const activeClients = clients.filter((client) => client.status === "active").length;
  const leads = clients.filter((client) => client.status === "lead").length;
  const activeCaregivers = caregivers.filter((caregiver) => caregiver.status === "active").length;
  const applicants = caregivers.filter((caregiver) => caregiver.status === "applicant").length;

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Executive Dashboard</h1>
          <p>Overview of Hampton Healthcare Services operations.</p>
        </div>
      </div>
      <div className="stat-grid">
        <div className="card stat-card"><span>Active Clients</span><strong>{activeClients}</strong></div>
        <div className="card stat-card"><span>Client Leads</span><strong>{leads}</strong></div>
        <div className="card stat-card"><span>Active Caregivers</span><strong>{activeCaregivers}</strong></div>
        <div className="card stat-card"><span>Applicants</span><strong>{applicants}</strong></div>
      </div>
      <div className="panel">
        <div className="panel-head">
          <div>
            <h2>Priority Alerts</h2>
            <p>Items to address before launch and during early operations.</p>
          </div>
        </div>
        <div className="detail-grid">
          <div className="detail"><label>Compliance</label>Confirm Illinois/Park Forest requirements before providing paid services.</div>
          <div className="detail"><label>Insurance</label>General liability, professional liability, workers compensation, and non-owned auto should be quoted.</div>
          <div className="detail"><label>Website</label>Verify Request Care and Caregiver Application forms are saving to Supabase.</div>
          <div className="detail"><label>Operations</label>Build client packet and caregiver packet before onboarding first client.</div>
        </div>
      </div>
    </>
  );
}

function DataTable({ title, subtitle, rows, columns, onAdd, onView, addLabel }) {
  const [query, setQuery] = React.useState("");
  const filtered = rows.filter((row) =>
    JSON.stringify(row).toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="panel">
      <div className="panel-head">
        <div><h2>{title}</h2><p>{subtitle}</p></div>
        <button className="btn gold" onClick={onAdd}><Plus size={16} />{addLabel}</button>
      </div>
      <div style={{ marginBottom: 14, maxWidth: 360, position: "relative" }}>
        <Search size={16} style={{ position: "absolute", left: 14, top: 15, color: "#617186" }} />
        <input style={{ paddingLeft: 40 }} placeholder="Search..." value={query} onChange={(event) => setQuery(event.target.value)} />
      </div>
      {filtered.length === 0 ? (
        <div className="empty">No records yet.</div>
      ) : (
        <table className="table">
          <thead><tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}<th>View</th></tr></thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.id}>
                {columns.map((column) => <td key={column.key}>{column.render ? column.render(row) : row[column.key]}</td>)}
                <td><button className="btn light" onClick={() => onView(row)}><Eye size={15} />View</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        <div className="panel-head"><h2>{title}</h2><button className="btn light" onClick={onClose}>Close</button></div>
        {children}
      </div>
    </div>
  );
}

function ClientForm({ onSave, onCancel }) {
  const [form, setForm] = React.useState({ full_name: "", phone: "", email: "", address: "", city: "", status: "lead", service_needed: "", preferred_schedule: "", emergency_contact_name: "", emergency_contact_phone: "", notes: "" });
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  return (
    <form className="form-grid" onSubmit={(event) => { event.preventDefault(); onSave(form); }}>
      <div className="two-col">
        <input required placeholder="Client full name" value={form.full_name} onChange={(event) => update("full_name", event.target.value)} />
        <input placeholder="Phone" value={form.phone} onChange={(event) => update("phone", event.target.value)} />
        <input placeholder="Email" value={form.email} onChange={(event) => update("email", event.target.value)} />
        <select value={form.status} onChange={(event) => update("status", event.target.value)}><option value="lead">Lead</option><option value="active">Active</option><option value="archived">Archived</option></select>
        <input placeholder="Address" value={form.address} onChange={(event) => update("address", event.target.value)} />
        <input placeholder="City" value={form.city} onChange={(event) => update("city", event.target.value)} />
        <input placeholder="Emergency contact name" value={form.emergency_contact_name} onChange={(event) => update("emergency_contact_name", event.target.value)} />
        <input placeholder="Emergency contact phone" value={form.emergency_contact_phone} onChange={(event) => update("emergency_contact_phone", event.target.value)} />
      </div>
      <input placeholder="Service needed" value={form.service_needed} onChange={(event) => update("service_needed", event.target.value)} />
      <input placeholder="Preferred schedule" value={form.preferred_schedule} onChange={(event) => update("preferred_schedule", event.target.value)} />
      <textarea placeholder="Notes" value={form.notes} onChange={(event) => update("notes", event.target.value)} />
      <button className="btn gold">Save Client</button>
      <button type="button" className="btn light" onClick={onCancel}>Cancel</button>
    </form>
  );
}

function CaregiverForm({ onSave, onCancel }) {
  const [form, setForm] = React.useState({ full_name: "", phone: "", email: "", status: "applicant", experience: "", certifications: "", availability: "", background_check_status: "pending", notes: "" });
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  return (
    <form className="form-grid" onSubmit={(event) => { event.preventDefault(); onSave(form); }}>
      <div className="two-col">
        <input required placeholder="Caregiver full name" value={form.full_name} onChange={(event) => update("full_name", event.target.value)} />
        <input placeholder="Phone" value={form.phone} onChange={(event) => update("phone", event.target.value)} />
        <input placeholder="Email" value={form.email} onChange={(event) => update("email", event.target.value)} />
        <select value={form.status} onChange={(event) => update("status", event.target.value)}><option value="applicant">Applicant</option><option value="active">Active</option><option value="inactive">Inactive</option></select>
        <input placeholder="Experience" value={form.experience} onChange={(event) => update("experience", event.target.value)} />
        <input placeholder="Certifications" value={form.certifications} onChange={(event) => update("certifications", event.target.value)} />
        <input placeholder="Availability" value={form.availability} onChange={(event) => update("availability", event.target.value)} />
        <select value={form.background_check_status} onChange={(event) => update("background_check_status", event.target.value)}><option value="pending">Background: Pending</option><option value="clear">Background: Clear</option><option value="review">Background: Review</option></select>
      </div>
      <textarea placeholder="Notes" value={form.notes} onChange={(event) => update("notes", event.target.value)} />
      <button className="btn gold">Save Caregiver</button>
      <button type="button" className="btn light" onClick={onCancel}>Cancel</button>
    </form>
  );
}

function DetailView({ item }) {
  return <div className="detail-grid">{Object.entries(item).map(([key, value]) => <div className="detail" key={key}><label>{key.replaceAll("_", " ")}</label><div>{String(value ?? "")}</div></div>)}</div>;
}

function ClientsPage({ clients, addClient }) {
  const [modal, setModal] = React.useState(null);
  const columns = [
    { key: "full_name", label: "Name" },
    { key: "phone", label: "Phone" },
    { key: "city", label: "City" },
    { key: "status", label: "Status", render: (row) => <span className={`badge ${row.status}`}>{row.status}</span> },
    { key: "service_needed", label: "Service Needed" },
  ];
  return <><DataTable title="Clients" subtitle="Leads, active clients, emergency contacts, and care needs." rows={clients} columns={columns} addLabel="Add Client" onAdd={() => setModal("add")} onView={setModal} />{modal === "add" && <Modal title="Add Client" onClose={() => setModal(null)}><ClientForm onSave={async (data) => { await addClient(data); setModal(null); }} onCancel={() => setModal(null)} /></Modal>}{modal && modal !== "add" && <Modal title={modal.full_name} onClose={() => setModal(null)}><DetailView item={modal} /></Modal>}</>;
}

function CaregiversPage({ caregivers, addCaregiver }) {
  const [modal, setModal] = React.useState(null);
  const columns = [
    { key: "full_name", label: "Name" },
    { key: "phone", label: "Phone" },
    { key: "status", label: "Status", render: (row) => <span className={`badge ${row.status}`}>{row.status}</span> },
    { key: "certifications", label: "Certifications" },
    { key: "background_check_status", label: "Background" },
  ];
  return <><DataTable title="Caregivers" subtitle="Applications, profiles, certifications, availability, and background tracking." rows={caregivers} columns={columns} addLabel="Add Caregiver" onAdd={() => setModal("add")} onView={setModal} />{modal === "add" && <Modal title="Add Caregiver" onClose={() => setModal(null)}><CaregiverForm onSave={async (data) => { await addCaregiver(data); setModal(null); }} onCancel={() => setModal(null)} /></Modal>}{modal && modal !== "add" && <Modal title={modal.full_name} onClose={() => setModal(null)}><DetailView item={modal} /></Modal>}</>;
}

function DocumentsPage() {
  return <div className="panel"><div className="panel-head"><div><h2>Document Center</h2><p>Templates and files to prepare before opening.</p></div></div><div className="detail-grid">{["Client Service Agreement", "Client Intake Form", "Care Assessment", "Emergency Contacts", "HIPAA / Privacy Policy", "Caregiver Application", "Background Check Authorization", "Employee Handbook", "Incident Report", "Timesheet"].map((document) => <div className="detail" key={document}><label>Template Needed</label>{document}</div>)}</div></div>;
}

function SchedulePage() {
  return <div className="panel"><div className="panel-head"><div><h2>Scheduling</h2><p>Sprint 2 module placeholder.</p></div></div><div className="empty">Next sprint: recurring visits, open shifts, caregiver assignments, and timesheets.</div></div>;
}

function CompliancePage() {
  return <div className="panel"><div className="panel-head"><div><h2>Compliance Checklist</h2><p>Startup tracking for Phase 2 and Phase 3.</p></div></div><div className="detail-grid"><div className="detail"><label>Business</label>LLC, EIN, bank account, operating agreement.</div><div className="detail"><label>Local</label>Park Forest business registration and zoning/home occupation confirmation.</div><div className="detail"><label>Insurance</label>General liability, professional liability, workers compensation, non-owned auto.</div><div className="detail"><label>Caregiver Screening</label>Background checks, references, ID, certifications, availability.</div><div className="detail"><label>Documents</label>Service agreement, intake, care plan, privacy policy, handbook, incident reports.</div></div></div>;
}

function AppShell({ session }) {
  const [page, setPage] = React.useState("dashboard");
  const [clients, setClients] = React.useState(seedClients);
  const [caregivers, setCaregivers] = React.useState(seedCaregivers);

  React.useEffect(() => { loadData(); }, []);

  async function loadData() {
    if (!supabaseConfigured || !supabase || !session) return;
    try {
      const [clientResult, caregiverResult] = await Promise.all([
        supabase.from("clients").select("*").order("created_at", { ascending: false }),
        supabase.from("caregivers").select("*").order("created_at", { ascending: false }),
      ]);
      if (!clientResult.error) setClients(clientResult.data || []);
      if (!caregiverResult.error) setCaregivers(caregiverResult.data || []);
    } catch (error) {
      console.error("Unable to load dashboard data", error);
    }
  }

  async function addClient(data) {
    if (!supabaseConfigured || !supabase) {
      setClients((current) => [{ ...data, id: crypto.randomUUID() }, ...current]);
      return;
    }
    try {
      const { data: inserted, error } = await supabase.from("clients").insert(data).select().single();
      if (error) throw error;
      setClients((current) => [inserted, ...current]);
    } catch (error) {
      alert(friendlyAuthError(error));
    }
  }

  async function addCaregiver(data) {
    if (!supabaseConfigured || !supabase) {
      setCaregivers((current) => [{ ...data, id: crypto.randomUUID() }, ...current]);
      return;
    }
    try {
      const { data: inserted, error } = await supabase.from("caregivers").insert(data).select().single();
      if (error) throw error;
      setCaregivers((current) => [inserted, ...current]);
    } catch (error) {
      alert(friendlyAuthError(error));
    }
  }

  async function signOut() {
    try {
      if (supabaseConfigured && supabase) await supabase.auth.signOut();
    } finally {
      window.location.reload();
    }
  }

  return <div className="app-shell"><Sidebar page={page} setPage={setPage} signOut={signOut} /><main className="main">{page === "dashboard" && <Dashboard clients={clients} caregivers={caregivers} />}{page === "clients" && <ClientsPage clients={clients} addClient={addClient} />}{page === "caregivers" && <CaregiversPage caregivers={caregivers} addCaregiver={addCaregiver} />}{page === "documents" && <DocumentsPage />}{page === "schedule" && <SchedulePage />}{page === "compliance" && <CompliancePage />}</main></div>;
}

function App() {
  const [session, setSession] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [startupMessage, setStartupMessage] = React.useState("");

  React.useEffect(() => {
    let mounted = true;
    let subscription;

    async function initializeAuth() {
      if (!supabaseConfigured || !supabase) {
        if (mounted) setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (mounted) setSession(data.session);
      } catch (error) {
        console.error("Unable to initialize authentication", error);
        if (mounted) setStartupMessage(friendlyAuthError(error));
      } finally {
        if (mounted) setLoading(false);
      }

      const authListener = supabase.auth.onAuthStateChange((_event, newSession) => {
        if (mounted) setSession(newSession);
      });
      subscription = authListener.data.subscription;
    }

    initializeAuth();
    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  if (loading) return <div className="login-page"><section className="login-brand"><h1>Loading secure access...</h1></section></div>;
  if (!session) return <><Login onSession={setSession} />{startupMessage && <div style={{ position: "fixed", left: 20, right: 20, bottom: 20, zIndex: 20 }}><p className="error" style={{ maxWidth: 760, margin: "0 auto", padding: 14, background: "white", borderRadius: 10 }}>{startupMessage}</p></div>}</>;
  return <AppShell session={session} />;
}

createRoot(document.getElementById("root")).render(<App />);
