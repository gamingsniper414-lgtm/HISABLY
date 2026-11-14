import React, { useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom/client";
import {
  BarChart3,
  Bell,
  BookOpen,
  Database,
  HandCoins,
  LayoutDashboard,
  LogOut,
  Mail,
  Moon,
  Sun,
  UserCircle,
  Users,
} from "lucide-react";

import App from "./App.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import CustomersPage from "./pages/CustomersPage.jsx";
import TransactionsPage from "./pages/TransactionsPage.jsx";
import ReportsPage from "./pages/ReportsPage.jsx";
import BackupPage from "./pages/BackupPage.jsx";
import ReminderPage from "./pages/ReminderPage.jsx";
import BorrowedPage from "./pages/BorrowedPage.jsx";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { subscribeToCustomers } from "./services/customers.js";
import { subscribeToTransactions } from "./services/transactions.js";
import { formatPaise } from "./utils/money.js";
import "./index.css";

function ProfilePage({ user }) {
  return (
    <section className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
      <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
        YOUR ACCOUNT
      </p>

      <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
        Profile
      </h1>

      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        Your account information comes from Google.
      </p>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-4">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt=""
              referrerPolicy="no-referrer"
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <div className="grid h-16 w-16 place-items-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              <UserCircle size={34} />
            </div>
          )}

          <div className="min-w-0">
            <h2 className="break-words text-xl font-bold text-slate-900 dark:text-white">
              {user.displayName || "Google user"}
            </h2>
            <p className="break-all text-sm text-slate-500 dark:text-slate-400">
              {user.email || "Email unavailable"}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Sign-in method
            </p>
            <p className="mt-1 font-semibold text-slate-900 dark:text-white">
              Google
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Ledger currency
            </p>
            <p className="mt-1 font-semibold text-slate-900 dark:text-white">
              Indian rupee (INR)
            </p>
          </div>
        </div>

        <p className="mt-5 text-sm text-slate-500 dark:text-slate-400">
          Profile editing and additional currencies are not available yet.
        </p>
      </div>
    </section>
  );
}

function todayLocal() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function NotificationsPage({ user, openCustomers }) {
  const [customers, setCustomers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.uid) return;

    setCustomers([]);
    setTransactions([]);
    setCustomersLoading(true);
    setTransactionsLoading(true);
    setError("");

    const stopCustomers = subscribeToCustomers(
      user.uid,
      (records) => {
        setCustomers(records);
        setCustomersLoading(false);
      },
      (err) => {
        console.error("Notification customer error:", err);
        setError("Could not load balances. Check your connection.");
        setCustomersLoading(false);
      }
    );

    const stopTransactions = subscribeToTransactions(
      user.uid,
      (records) => {
        setTransactions(records);
        setTransactionsLoading(false);
      },
      (err) => {
        console.error("Notification transaction error:", err);
        setError("Could not load balances. Check your connection.");
        setTransactionsLoading(false);
      }
    );

    return () => {
      stopCustomers();
      stopTransactions();
    };
  }, [user?.uid]);

  const result = useMemo(() => {
    try {
      const signs = {
        loan_given: 1,
        loan_received: -1,
        repayment_received: -1,
        repayment_given: 1,
        credit_sale: 1,
        credit_purchase: -1,
        cash_income: 0,
        cash_expense: 0,
      };

      const names = new Map(
        customers.map((customer) => [customer.id, customer.name])
      );

      const balances = new Map();
      const today = todayLocal();

      for (const transaction of transactions) {
        if (transaction.date > today) continue;

        if (
          !Object.prototype.hasOwnProperty.call(signs, transaction.type) ||
          !Number.isSafeInteger(transaction.amountPaise) ||
          transaction.amountPaise <= 0
        ) {
          throw new Error("Invalid transaction.");
        }

        const effect = signs[transaction.type] * transaction.amountPaise;
        if (effect === 0) continue;

        if (!transaction.customerId) {
          throw new Error("Missing customer.");
        }

        const balance =
          (balances.get(transaction.customerId) || 0) + effect;

        if (!Number.isSafeInteger(balance)) {
          throw new Error("Balance exceeds the supported range.");
        }

        balances.set(transaction.customerId, balance);
      }

      const items = [...balances.entries()]
        .filter(([, balance]) => balance !== 0)
        .map(([customerId, balance]) => ({
          customerId,
          name: names.get(customerId) || "Customer unavailable",
          balance,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      return { items, error: "" };
    } catch (err) {
      console.error("Notification calculation error:", err);

      return {
        items: [],
        error: "Could not calculate balances. Check your transaction records.",
      };
    }
  }, [customers, transactions]);

  const loading = customersLoading || transactionsLoading;
  const message = error || result.error;

  return (
    <section className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
      <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
        YOUR ACTIVITY
      </p>

      <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
        Notifications
      </h1>

      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        Outstanding net customer balances as of today.
      </p>

      <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-100">
        These are balance alerts, not due-date reminders. They are calculated
        when you open this page. No email, SMS, push notification, or automatic
        reminder is sent. Continue using fictional test data.
      </div>

      {message && (
        <p
          role="alert"
          className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-800 dark:bg-red-950 dark:text-red-100"
        >
          {message}
        </p>
      )}

      {loading ? (
        <p
          role="status"
          className="mt-6 text-sm text-slate-500 dark:text-slate-400"
        >
          Loading balances...
        </p>
      ) : (
        !message && (
          <div className="mt-6 space-y-3">
            {result.items.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                No outstanding customer balances as of today.
              </div>
            ) : (
              result.items.map((item) => (
                <div
                  key={item.customerId}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="min-w-0">
                    <p className="break-words font-semibold text-slate-900 dark:text-white">
                      {item.name}
                    </p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {item.balance > 0 ? "Owes you" : "You owe"}
                    </p>
                  </div>

                  <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                    {formatPaise(Math.abs(item.balance))}
                  </p>
                </div>
              ))
            )}

            <button
              type="button"
              onClick={openCustomers}
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Open customers
            </button>
          </div>
        )
      )}
    </section>
  );
}

function AppEntry() {
  const { user, authLoading, logOut } = useAuth();

  const [dark, setDark] = useState(false);
  const [page, setPage] = useState("dashboard");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleLogout() {
    setError("");
    setBusy(true);

    try {
      await logOut();
      setPage("dashboard");
    } catch (logoutError) {
      console.error("Sign-out error:", logoutError);
      setError("Could not sign out. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (authLoading || !user) {
    return <App />;
  }

  const navButton = (active) =>
    `inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
      active
        ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
        : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
    }`;

  const navigation = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "customers", label: "Customers", icon: Users },
    { id: "borrowed", label: "Borrowed money", icon: HandCoins },
    { id: "transactions", label: "Transactions", icon: BookOpen },
    { id: "reports", label: "Reports", icon: BarChart3 },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "reminder", label: "Email reminder", icon: Mail },
    { id: "backup", label: "Data backup", icon: Database },
    { id: "profile", label: "Profile", icon: UserCircle },
  ];

  return (
    <div className={dark ? "dark" : ""}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto flex min-h-20 max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-3 sm:px-8">
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              hisably<span className="text-blue-600">.</span>
            </span>

            <nav
              aria-label="Workspace navigation"
              className="flex flex-wrap gap-1"
            >
              {navigation.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setPage(id)}
                  aria-current={page === id ? "page" : undefined}
                  className={navButton(page === id)}
                >
                  <Icon size={18} />
                  {label}
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDark((value) => !value)}
                aria-label={
                  dark ? "Switch to light mode" : "Switch to dark mode"
                }
                className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                {dark ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              <button
                type="button"
                onClick={handleLogout}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <LogOut size={17} />
                {busy ? "Signing out..." : "Sign out"}
              </button>
            </div>
          </div>
        </header>

        {error && (
          <div
            role="alert"
            className="mx-auto mt-4 max-w-7xl rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-900"
          >
            {error}
          </div>
        )}

        <main>
          {page === "dashboard" && <DashboardPage user={user} />}
          {page === "customers" && <CustomersPage user={user} />}
          {page === "borrowed" && <BorrowedPage user={user} />}
          {page === "transactions" && <TransactionsPage user={user} />}
          {page === "reports" && <ReportsPage user={user} />}
          {page === "notifications" && (
            <NotificationsPage
              user={user}
              openCustomers={() => setPage("customers")}
            />
          )}
          {page === "reminder" && <ReminderPage user={user} />}
          {page === "backup" && <BackupPage user={user} />}
          {page === "profile" && <ProfilePage user={user} />}
        </main>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <AppEntry />
    </AuthProvider>
  </React.StrictMode>
);