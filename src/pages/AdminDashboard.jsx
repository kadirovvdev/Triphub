import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useSearchParams, Link } from "react-router-dom";
import StatCard from "@/components/StatCard";
import EmptyState from "@/components/EmptyState";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from "recharts";
import {
  ShieldCheck, Users, Compass, Calendar, Star, Check, X, Trash2, Loader2,
  Hourglass, CheckCircle2, XCircle, UserX, FileBarChart,
} from "lucide-react";
import { formatPrice, formatDate } from "@/lib/triphub";

const TABS = [
  { key: "overview", label: "Overview", icon: FileBarChart },
  { key: "organizers", label: "Organizers", icon: ShieldCheck },
  { key: "tours", label: "Tours", icon: Compass },
  { key: "users", label: "Users", icon: Users },
];

export default function AdminDashboard() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") || "overview";
  const qc = useQueryClient();

  const isAdmin = user?.role === "admin";

  const { data: users = [], isLoading: lu } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => base44.entities.User.list(),
    enabled: isAdmin,
  });
  const { data: organizers = [], isLoading: lo } = useQuery({
    queryKey: ["admin-organizers"],
    queryFn: () => base44.asServiceRole.entities.OrganizerProfile.list("-created_date", 200),
    enabled: isAdmin,
  });
  const { data: tours = [], isLoading: lt } = useQuery({
    queryKey: ["admin-tours"],
    queryFn: () => base44.asServiceRole.entities.Tour.list("-created_date", 200),
    enabled: isAdmin,
  });
  const { data: bookings = [], isLoading: lb } = useQuery({
    queryKey: ["admin-bookings"],
    queryFn: () => base44.asServiceRole.entities.Booking.list("-created_date", 200),
    enabled: isAdmin,
  });

  if (!isAdmin) {
    return <div className="mx-auto max-w-3xl px-6 py-24"><EmptyState icon={ShieldCheck} title="Admins only" description="You don't have access to the admin dashboard." actionLabel="Go home" actionTo="/" /></div>;
  }

  const pendingOrganizers = organizers.filter((o) => o.verification_status === "pending");
  const pendingTours = tours.filter((t) => t.status === "pending");
  const approvedTours = tours.filter((t) => t.status === "approved");
  const travelers = users.filter((u) => u.role === "traveler");
  const orgUsers = users.filter((u) => u.role === "organizer");
  const totalRevenue = bookings.filter((b) => b.status === "approved").reduce((s, b) => s + (b.total_price || 0), 0);

  const chartData = [
    { name: "Approved", value: approvedTours.length, fill: "#10b981" },
    { name: "Pending", value: pendingTours.length, fill: "#f59e0b" },
    { name: "Rejected", value: tours.filter((t) => t.status === "rejected").length, fill: "#f43f5e" },
    { name: "Draft", value: tours.filter((t) => t.status === "draft").length, fill: "#94a3b8" },
  ];

  const setOrgStatus = async (oid, status) => {
    await base44.asServiceRole.entities.OrganizerProfile.update(oid, {
      verification_status: status,
      verified: status === "approved",
    });
    qc.invalidateQueries(["admin-organizers"]);
  };

  const setTourStatus = async (tid, status) => {
    await base44.asServiceRole.entities.Tour.update(tid, { status });
    qc.invalidateQueries(["admin-tours"]);
  };

  const deleteTour = async (tid) => {
    if (!confirm("Delete this tour permanently?")) return;
    await base44.asServiceRole.entities.Tour.delete(tid);
    qc.invalidateQueries(["admin-tours"]);
  };

  const deleteUser = async (uid) => {
    if (!confirm("Delete this user?")) return;
    try {
      await base44.asServiceRole.entities.User.delete(uid);
      qc.invalidateQueries(["admin-users"]);
    } catch (e) { alert(e.message); }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex items-center gap-2">
        <ShieldCheck className="text-emerald-600" />
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">Verify organizers, moderate tours and monitor platform health.</p>

      <div className="mt-6 flex gap-2 overflow-x-auto border-b border-border">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setParams({ tab: t.key })}
            className={`inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition ${tab === t.key ? "border-emerald-600 text-emerald-600" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            <t.icon size={16} /> {t.label}
            {t.key === "organizers" && pendingOrganizers.length > 0 && <Badge n={pendingOrganizers.length} />}
            {t.key === "tours" && pendingTours.length > 0 && <Badge n={pendingTours.length} />}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {tab === "overview" && (lu || lo || lt || lb ? <CenterLoader /> : (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard icon={Users} label="Total users" value={users.length} hint={`${travelers.length} travelers · ${orgUsers.length} organizers`} tone="emerald" />
              <StatCard icon={Compass} label="Total tours" value={tours.length} hint={`${approvedTours.length} live`} tone="indigo" />
              <StatCard icon={Calendar} label="Bookings" value={bookings.length} hint={`${bookings.filter((b) => b.status === "approved").length} approved`} tone="amber" />
              <StatCard icon={Star} label="Revenue" value={formatPrice(totalRevenue)} hint="approved bookings" tone="sky" />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-border bg-card p-6">
                <h3 className="font-semibold">Tours by status</h3>
                <div className="mt-4 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="#94a3b8" />
                      <Tooltip cursor={{ fill: "rgba(0,0,0,0.04)" }} />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {chartData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6">
                <h3 className="font-semibold">Pending approvals</h3>
                {pendingOrganizers.length === 0 && pendingTours.length === 0 ? (
                  <p className="mt-4 text-sm text-muted-foreground">All caught up — nothing pending. 🎉</p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {pendingOrganizers.map((o) => (
                      <div key={o.id} className="flex items-center justify-between rounded-xl border border-border p-3">
                        <span className="text-sm font-medium">{o.full_name}</span>
                        <button onClick={() => setParams({ tab: "organizers" })} className="text-xs font-medium text-emerald-600 hover:underline">Review →</button>
                      </div>
                    ))}
                    {pendingTours.map((t) => (
                      <div key={t.id} className="flex items-center justify-between rounded-xl border border-border p-3">
                        <span className="text-sm font-medium">{t.title}</span>
                        <button onClick={() => setParams({ tab: "tours" })} className="text-xs font-medium text-emerald-600 hover:underline">Review →</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {tab === "organizers" && (
          lo ? <CenterLoader /> : organizers.length === 0 ? <EmptyState icon={ShieldCheck} title="No organizers" /> : (
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <table className="w-full text-left text-sm">
                <thead className="bg-accent/60 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr><th className="p-4">Organizer</th><th className="p-4">Status</th><th className="p-4">Tours</th><th className="p-4">Rating</th><th className="p-4 text-right">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {organizers.map((o) => (
                    <tr key={o.id}>
                      <td className="p-4">
                        <p className="font-medium">{o.full_name}</p>
                        <p className="text-xs text-muted-foreground">{o.created_by || "—"}</p>
                      </td>
                      <td className="p-4">
                        <StatusChip status={o.verification_status} />
                      </td>
                      <td className="p-4">{o.tours_count || 0}</td>
                      <td className="p-4">{o.rating ? o.rating.toFixed(1) : "—"}</td>
                      <td className="p-4">
                        <div className="flex justify-end gap-2">
                          {o.verification_status !== "approved" && <ActBtn tone="emerald" icon={Check} label="Approve" onClick={() => setOrgStatus(o.id, "approved")} />}
                          {o.verification_status !== "rejected" && <ActBtn tone="rose" icon={X} label="Reject" onClick={() => setOrgStatus(o.id, "rejected")} />}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {tab === "tours" && (
          lt ? <CenterLoader /> : tours.length === 0 ? <EmptyState icon={Compass} title="No tours" /> : (
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <table className="w-full text-left text-sm">
                <thead className="bg-accent/60 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr><th className="p-4">Tour</th><th className="p-4">Region</th><th className="p-4">Starts</th><th className="p-4">Status</th><th className="p-4 text-right">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {tours.map((t) => (
                    <tr key={t.id}>
                      <td className="p-4">
                        <Link to={`/tours/${t.id}`} className="font-medium hover:text-emerald-600">{t.title}</Link>
                        <p className="text-xs text-muted-foreground">{formatPrice(t.price)}</p>
                      </td>
                      <td className="p-4 text-muted-foreground">{t.region}</td>
                      <td className="p-4 text-muted-foreground">{formatDate(t.start_date)}</td>
                      <td className="p-4"><TourStatusChip status={t.status} /></td>
                      <td className="p-4">
                        <div className="flex justify-end gap-2">
                          {t.status !== "approved" && <ActBtn tone="emerald" icon={Check} label="Approve" onClick={() => setTourStatus(t.id, "approved")} />}
                          {t.status !== "rejected" && <ActBtn tone="amber" icon={X} label="Reject" onClick={() => setTourStatus(t.id, "rejected")} />}
                          <ActBtn tone="rose" icon={Trash2} label="" onClick={() => deleteTour(t.id)} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {tab === "users" && (
          lu ? <CenterLoader /> : users.length === 0 ? <EmptyState icon={Users} title="No users" /> : (
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <table className="w-full text-left text-sm">
                <thead className="bg-accent/60 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr><th className="p-4">User</th><th className="p-4">Role</th><th className="p-4">Joined</th><th className="p-4 text-right">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td className="p-4">
                        <p className="font-medium">{u.full_name || "Unnamed"}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </td>
                      <td className="p-4"><RoleChip role={u.role} /></td>
                      <td className="p-4 text-muted-foreground">{formatDate(u.created_date)}</td>
                      <td className="p-4 text-right">
                        {u.id !== user.id && (
                          <button onClick={() => deleteUser(u.id)} className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-destructive hover:bg-rose-50"><UserX size={13} /> Delete</button>
                        )}
                        {u.id === user.id && <span className="text-xs text-muted-foreground">You</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </div>
  );
}

function Badge({ n }) { return <span className="grid h-5 min-w-5 place-items-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">{n}</span>; }
function CenterLoader() { return <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-muted-foreground" /></div>; }

function StatusChip({ status }) {
  const map = { approved: "bg-emerald-50 text-emerald-700", pending: "bg-amber-50 text-amber-700", rejected: "bg-rose-50 text-rose-700" };
  return <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${map[status] || "bg-slate-100"}`}>{status}</span>;
}
function TourStatusChip({ status }) {
  const map = { approved: "bg-emerald-50 text-emerald-700", pending: "bg-amber-50 text-amber-700", rejected: "bg-rose-50 text-rose-700", draft: "bg-slate-100 text-slate-600" };
  return <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${map[status] || "bg-slate-100"}`}>{status}</span>;
}
function RoleChip({ role }) {
  const map = { admin: "bg-indigo-50 text-indigo-700", organizer: "bg-amber-50 text-amber-700", traveler: "bg-emerald-50 text-emerald-700" };
  return <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${map[role] || "bg-slate-100"}`}>{role || "guest"}</span>;
}
function ActBtn({ tone, icon: Icon, label, onClick }) {
  const tones = {
    emerald: "bg-emerald-600 text-white hover:bg-emerald-700",
    amber: "border border-border text-amber-600 hover:bg-amber-50",
    rose: "border border-border text-destructive hover:bg-rose-50",
  };
  return <button onClick={onClick} className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium ${tones[tone]}`}><Icon size={13} /> {label}</button>;
}