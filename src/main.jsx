import React from "react";
import { createRoot } from "react-dom/client";
import {
  LayoutDashboard, Users, UserRoundCheck, FileText, CalendarDays,
  ShieldCheck, Plus, LogOut, HeartHandshake, Search, Eye, Inbox,
  CheckCircle2, PhoneCall, CalendarCheck, XCircle
} from "lucide-react";
import { supabase, supabaseConfigured } from "./lib/supabase";
import "./styles.css";

const seedClients = [];
const seedCaregivers = [];

function friendlyError(error) {
  const message = String(error?.message || error || "");
  if (/failed to fetch|load failed|networkerror|network request failed/i.test(message)) {
    return "The database could not be reached. Refresh and try again.";
  }
  if (/invalid login credentials/i.test(message)) return "The email or password is incorrect.";
  if (/email not confirmed/i.test(message)) return "Please confirm your email address before signing in.";
  return message || "Something went wrong. Please try again.";
}

function LogoMark() {
  return <div className="mark"><HeartHandshake size={24} /></div>;
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
    setSubmitting(true);
    setMessage("");
    try {
      if (!supabaseConfigured || !supabase) throw new Error("Supabase is not configured in Vercel.");
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.user) {
          const { error: profileError } = await supabase.from("profiles").upsert({
            id: data.user.id, full_name: fullName || email, email, role: "admin"
          });
          if (profileError) throw profileError;
        }
        setMessage("Account created. Confirm your email if required, then sign in.");
        setMode("signin");
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (!data.session) throw new Error("No secure session was returned.");
        onSession(data.session);
      }
    } catch (error) {
      setMessage(friendlyError(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <section className="login-brand">
        <div className="logo-mark"><HeartHandshake size={40} /></div>
        <h1>Hampton Healthcare OS</h1>
        <p>Private operations for patient intake, clients, caregivers, documents, and scheduling.</p>
      </section>
      <section className="login-card">
        <form className="auth-box" onSubmit={submit}>
          <h2>{mode === "signin" ? "Sign in" : "Create owner account"}</h2>
          <div className="form-grid">
            {mode === "signup" && <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" />}
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email address" required />
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" required />
            <button className="btn gold" disabled={submitting}>{submitting ? "Please wait..." : mode === "signin" ? "Sign In" : "Create Account"}</button>
            <button type="button" className="btn light" onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>{mode === "signin" ? "Create first admin account" : "Back to sign in"}</button>
            {message && <p className={message.includes("created") ? "success" : "error"}>{message}</p>}
          </div>
        </form>
      </section>
    </div>
  );
}

function Sidebar({ page, setPage, signOut, newIntakes }) {
  const items = [
    ["dashboard", "Dashboard", LayoutDashboard],
    ["intakes", `Patient Intakes${newIntakes ? ` (${newIntakes})` : ""}`, Inbox],
    ["clients", "Clients", Users],
    ["caregivers", "Caregivers", UserRoundCheck],
    ["documents", "Documents", FileText],
    ["schedule", "Scheduling", CalendarDays],
    ["compliance", "Compliance", ShieldCheck],
  ];
  return (
    <aside className="sidebar">
      <div className="sidebar-brand"><LogoMark /><div><strong>Hampton OS</strong><span>Home Care Command Center</span></div></div>
      <nav className="side-nav">
        {items.map(([key, label, Icon]) => <button key={key} className={`nav-item ${page === key ? "active" : ""}`} onClick={() => setPage(key)}><Icon size={18} />{label}</button>)}
      </nav>
      <div className="sidebar-footer"><button className="nav-item" onClick={signOut}><LogOut size={18} />Sign Out</button></div>
    </aside>
  );
}

function Dashboard({ clients, caregivers, intakes, goToIntakes }) {
  const activeClients = clients.filter((x) => x.status === "active").length;
  const leads = clients.filter((x) => x.status === "lead").length;
  const activeCaregivers = caregivers.filter((x) => x.status === "active").length;
  const newIntakes = intakes.filter((x) => (x.type || "care_request") === "care_request").length;
  return <>
    <div className="topbar"><div><h1>Executive Dashboard</h1><p>Overview of Hampton Healthcare Services operations.</p></div></div>
    <div className="stat-grid">
      <div className="card stat-card"><span>New Patient Intakes</span><strong>{newIntakes}</strong></div>
      <div className="card stat-card"><span>Active Clients</span><strong>{activeClients}</strong></div>
      <div className="card stat-card"><span>Client Leads</span><strong>{leads}</strong></div>
      <div className="card stat-card"><span>Active Caregivers</span><strong>{activeCaregivers}</strong></div>
    </div>
    <div className="panel"><div className="panel-head"><div><h2>Patient Intake Queue</h2><p>Website requests waiting for staff review.</p></div><button className="btn gold" onClick={goToIntakes}>Open Intake Queue</button></div></div>
  </>;
}

function Modal({ title, children, onClose }) {
  return <div className="modal-backdrop" onClick={onClose}><div className="modal" onClick={(e) => e.stopPropagation()}><div className="panel-head"><h2>{title}</h2><button className="btn light" onClick={onClose}>Close</button></div>{children}</div></div>;
}

function DetailView({ item }) {
  return <div className="detail-grid">{Object.entries(item).map(([key, value]) => <div className="detail" key={key}><label>{key.replaceAll("_", " ")}</label><div>{String(value ?? "")}</div></div>)}</div>;
}

function DataTable({ title, subtitle, rows, columns, onAdd, onView, addLabel }) {
  const [query, setQuery] = React.useState("");
  const filtered = rows.filter((row) => JSON.stringify(row).toLowerCase().includes(query.toLowerCase()));
  return <div className="panel">
    <div className="panel-head"><div><h2>{title}</h2><p>{subtitle}</p></div>{onAdd && <button className="btn gold" onClick={onAdd}><Plus size={16} />{addLabel}</button>}</div>
    <div style={{ marginBottom: 14, maxWidth: 360, position: "relative" }}><Search size={16} style={{ position: "absolute", left: 14, top: 15, color: "#617186" }} /><input style={{ paddingLeft: 40 }} placeholder="Search..." value={query} onChange={(e) => setQuery(e.target.value)} /></div>
    {filtered.length === 0 ? <div className="empty">No records yet.</div> : <table className="table"><thead><tr>{columns.map((c) => <th key={c.key}>{c.label}</th>)}<th>View</th></tr></thead><tbody>{filtered.map((row) => <tr key={row.id}>{columns.map((c) => <td key={c.key}>{c.render ? c.render(row) : row[c.key]}</td>)}<td><button className="btn light" onClick={() => onView(row)}><Eye size={15} />View</button></td></tr>)}</tbody></table>}
  </div>;
}

function IntakeActions({ intake, onStatus, onConvert, busy }) {
  const current = intake.type || "care_request";
  return <div className="form-grid" style={{ marginTop: 18 }}>
    <div className="two-col">
      <button className="btn light" disabled={busy} onClick={() => onStatus(intake, "contacted")}><PhoneCall size={16} />Mark Contacted</button>
      <button className="btn light" disabled={busy} onClick={() => onStatus(intake, "scheduled")}><CalendarCheck size={16} />Assessment Scheduled</button>
      <button className="btn gold" disabled={busy || current === "converted"} onClick={() => onConvert(intake)}><CheckCircle2 size={16} />Convert to Client</button>
      <button className="btn light" disabled={busy} onClick={() => onStatus(intake, "rejected")}><XCircle size={16} />Reject</button>
    </div>
  </div>;
}

function IntakesPage({ intakes, updateStatus, convertToClient }) {
  const [selected, setSelected] = React.useState(null);
  const [busy, setBusy] = React.useState(false);
  const columns = [
    { key: "full_name", label: "Patient" },
    { key: "phone", label: "Phone" },
    { key: "service_needed", label: "Service" },
    { key: "type", label: "Status", render: (row) => <span className={`badge ${row.type || "care_request"}`}>{(row.type || "care_request").replaceAll("_", " ")}</span> },
    { key: "created_at", label: "Submitted", render: (row) => row.created_at ? new Date(row.created_at).toLocaleDateString() : "" },
  ];
  async function act(fn) { setBusy(true); try { await fn(); setSelected(null); } finally { setBusy(false); } }
  return <>
    <DataTable title="Patient Intake Queue" subtitle="Requests submitted through HamptonCareServices.com." rows={intakes} columns={columns} onView={setSelected} />
    {selected && <Modal title={selected.full_name || "Patient Intake"} onClose={() => setSelected(null)}><DetailView item={selected} /><IntakeActions intake={selected} busy={busy} onStatus={(row, status) => act(() => updateStatus(row, status))} onConvert={(row) => act(() => convertToClient(row))} /></Modal>}
  </>;
}

function ClientForm({ onSave, onCancel }) {
  const [form, setForm] = React.useState({ full_name: "", phone: "", email: "", address: "", city: "", status: "lead", service_needed: "", preferred_schedule: "", emergency_contact_name: "", emergency_contact_phone: "", notes: "" });
  const update = (key, value) => setForm((x) => ({ ...x, [key]: value }));
  return <form className="form-grid" onSubmit={(e) => { e.preventDefault(); onSave(form); }}><div className="two-col"><input required placeholder="Client full name" value={form.full_name} onChange={(e) => update("full_name", e.target.value)} /><input placeholder="Phone" value={form.phone} onChange={(e) => update("phone", e.target.value)} /><input placeholder="Email" value={form.email} onChange={(e) => update("email", e.target.value)} /><select value={form.status} onChange={(e) => update("status", e.target.value)}><option value="lead">Lead</option><option value="active">Active</option><option value="archived">Archived</option></select><input placeholder="Address" value={form.address} onChange={(e) => update("address", e.target.value)} /><input placeholder="City" value={form.city} onChange={(e) => update("city", e.target.value)} /></div><input placeholder="Service needed" value={form.service_needed} onChange={(e) => update("service_needed", e.target.value)} /><input placeholder="Preferred schedule" value={form.preferred_schedule} onChange={(e) => update("preferred_schedule", e.target.value)} /><textarea placeholder="Notes" value={form.notes} onChange={(e) => update("notes", e.target.value)} /><button className="btn gold">Save Client</button><button type="button" className="btn light" onClick={onCancel}>Cancel</button></form>;
}

function ClientsPage({ clients, addClient }) {
  const [modal, setModal] = React.useState(null);
  const columns = [{ key: "full_name", label: "Name" }, { key: "phone", label: "Phone" }, { key: "city", label: "City" }, { key: "status", label: "Status", render: (row) => <span className={`badge ${row.status}`}>{row.status}</span> }, { key: "service_needed", label: "Service Needed" }];
  return <><DataTable title="Clients" subtitle="Leads and active clients." rows={clients} columns={columns} addLabel="Add Client" onAdd={() => setModal("add")} onView={setModal} />{modal === "add" && <Modal title="Add Client" onClose={() => setModal(null)}><ClientForm onSave={async (data) => { await addClient(data); setModal(null); }} onCancel={() => setModal(null)} /></Modal>}{modal && modal !== "add" && <Modal title={modal.full_name} onClose={() => setModal(null)}><DetailView item={modal} /></Modal>}</>;
}

function CaregiversPage({ caregivers }) {
  const [modal, setModal] = React.useState(null);
  const columns = [{ key: "full_name", label: "Name" }, { key: "phone", label: "Phone" }, { key: "status", label: "Status" }, { key: "certifications", label: "Certifications" }, { key: "background_check_status", label: "Background" }];
  return <><DataTable title="Caregivers" subtitle="Profiles, certifications, and availability." rows={caregivers} columns={columns} onView={setModal} />{modal && <Modal title={modal.full_name} onClose={() => setModal(null)}><DetailView item={modal} /></Modal>}</>;
}

function DocumentsPage() { return <div className="panel"><div className="panel-head"><div><h2>Document Center</h2><p>Client and agency document tracking.</p></div></div><div className="detail-grid">{["Client Service Agreement", "Client Intake Form", "Care Assessment", "Emergency Contacts", "Privacy Policy", "Incident Report", "Timesheet"].map((x) => <div className="detail" key={x}><label>Template</label>{x}</div>)}</div></div>; }
function SchedulePage() { return <div className="panel"><div className="panel-head"><div><h2>Scheduling</h2><p>Visits, assessments, and caregiver assignments.</p></div></div><div className="empty">Scheduling tools are ready for the next workflow phase.</div></div>; }
function CompliancePage() { return <div className="panel"><div className="panel-head"><div><h2>Compliance Checklist</h2><p>Agency startup and operating requirements.</p></div></div><div className="detail-grid"><div className="detail"><label>Business</label>LLC, EIN, bank account, operating agreement.</div><div className="detail"><label>Insurance</label>General liability, professional liability, workers compensation, non-owned auto.</div><div className="detail"><label>Screening</label>Background checks, references, ID, certifications.</div></div></div>; }

function AppShell({ session }) {
  const [page, setPage] = React.useState("dashboard");
  const [clients, setClients] = React.useState(seedClients);
  const [caregivers, setCaregivers] = React.useState(seedCaregivers);
  const [intakes, setIntakes] = React.useState([]);

  React.useEffect(() => { loadData(); }, []);

  async function loadData() {
    if (!supabaseConfigured || !supabase || !session) return;
    const [clientResult, caregiverResult, intakeResult] = await Promise.all([
      supabase.from("clients").select("*").order("created_at", { ascending: false }),
      supabase.from("caregivers").select("*").order("created_at", { ascending: false }),
      supabase.from("submissions").select("*").neq("type", "caregiver_application").order("created_at", { ascending: false }),
    ]);
    if (!clientResult.error) setClients(clientResult.data || []);
    if (!caregiverResult.error) setCaregivers(caregiverResult.data || []);
    if (!intakeResult.error) setIntakes(intakeResult.data || []);
    else console.error("Unable to load patient intakes", intakeResult.error);
  }

  async function addClient(data) {
    const { data: inserted, error } = await supabase.from("clients").insert(data).select().single();
    if (error) throw error;
    setClients((x) => [inserted, ...x]);
    return inserted;
  }

  async function updateIntakeStatus(intake, status) {
    const { data, error } = await supabase.from("submissions").update({ type: status }).eq("id", intake.id).select().single();
    if (error) { alert(friendlyError(error)); return; }
    setIntakes((rows) => rows.map((row) => row.id === intake.id ? data : row));
  }

  async function convertToClient(intake) {
    try {
      const client = {
        full_name: intake.full_name || "New Client",
        phone: intake.phone || "",
        email: intake.email || "",
        status: "lead",
        service_needed: intake.service_needed || "",
        preferred_schedule: intake.preferred_start_date || intake.experience || "",
        notes: intake.message || "Converted from website patient intake."
      };
      await addClient(client);
      await updateIntakeStatus(intake, "converted");
      alert("Patient intake converted to a client lead.");
    } catch (error) {
      alert(friendlyError(error));
    }
  }

  async function signOut() { await supabase?.auth.signOut(); window.location.reload(); }
  const newIntakes = intakes.filter((x) => (x.type || "care_request") === "care_request").length;

  return <div className="app-shell"><Sidebar page={page} setPage={setPage} signOut={signOut} newIntakes={newIntakes} /><main className="main">
    {page === "dashboard" && <Dashboard clients={clients} caregivers={caregivers} intakes={intakes} goToIntakes={() => setPage("intakes")} />}
    {page === "intakes" && <IntakesPage intakes={intakes} updateStatus={updateIntakeStatus} convertToClient={convertToClient} />}
    {page === "clients" && <ClientsPage clients={clients} addClient={addClient} />}
    {page === "caregivers" && <CaregiversPage caregivers={caregivers} />}
    {page === "documents" && <DocumentsPage />}
    {page === "schedule" && <SchedulePage />}
    {page === "compliance" && <CompliancePage />}
  </main></div>;
}

function App() {
  const [session, setSession] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    let mounted = true;
    let subscription;
    async function init() {
      if (!supabaseConfigured || !supabase) { setLoading(false); return; }
      const { data } = await supabase.auth.getSession();
      if (mounted) { setSession(data.session); setLoading(false); }
      subscription = supabase.auth.onAuthStateChange((_event, next) => mounted && setSession(next)).data.subscription;
    }
    init();
    return () => { mounted = false; subscription?.unsubscribe(); };
  }, []);
  if (loading) return <div className="login-page"><section className="login-brand"><h1>Loading secure access...</h1></section></div>;
  if (!session) return <Login onSession={setSession} />;
  return <AppShell session={session} />;
}

createRoot(document.getElementById("root")).render(<App />);
