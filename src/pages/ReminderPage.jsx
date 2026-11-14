import { useEffect, useMemo, useState } from "react";
import { Mail } from "lucide-react";

import { subscribeToCustomers } from "../services/customers.js";
import { subscribeToTransactions } from "../services/transactions.js";
import {
  calculateCustomerBalance,
  getBalanceStatus,
} from "../utils/ledger.js";
import { formatPaise } from "../utils/money.js";

function todayLocal() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white";

export default function ReminderPage({ user }) {
  const [customers, setCustomers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [error, setError] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [email, setEmail] = useState("");

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
        console.error("Reminder customer error:", err);
        setError("Could not load customers. Check your connection.");
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
        console.error("Reminder transaction error:", err);
        setError("Could not load transactions. Check your connection.");
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
      const today = todayLocal();
      const included = transactions.filter((transaction) => {
        if (
          typeof transaction.date !== "string" ||
          !/^\d{4}-\d{2}-\d{2}$/.test(transaction.date)
        ) {
          throw new Error("Invalid transaction date.");
        }

        return transaction.date <= today;
      });

      const eligible = customers
        .map((customer) => {
          const balance = calculateCustomerBalance(included, customer.id);

          return { ...customer, balance };
        })
        .filter((customer) => getBalanceStatus(customer.balance) === "receivable");

      return { eligible, today, error: "" };
    } catch (err) {
      console.error("Reminder calculation error:", err);

      return {
        eligible: [],
        today: "",
        error: "Could not calculate balances. Check your transaction records.",
      };
    }
  }, [customers, transactions]);

  const loading = customersLoading || transactionsLoading;
  const pageError = error || result.error;
  const selected = result.eligible.find(
    (customer) => customer.id === customerId
  );

  const cleanEmail = email.trim();
  const validEmail =
    cleanEmail.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail);

  const subject = "Friendly payment reminder";
  const body = selected
    ? `Hello ${selected.name},

This is a friendly reminder that our records show an outstanding net balance of ${formatPaise(
        selected.balance
      )} as of ${result.today}.

Please let me know if you have already paid or if you would like to discuss the balance.

Thank you.`
    : "";

  const mailLink =
    selected && validEmail
      ? `mailto:${encodeURIComponent(cleanEmail)}?subject=${encodeURIComponent(
          subject
        )}&body=${encodeURIComponent(body)}`
      : "";

  function selectCustomer(event) {
    const id = event.target.value;
    setCustomerId(id);

    const customer = result.eligible.find((item) => item.id === id);
    setEmail(customer?.email || "");
  }

  return (
    <section className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
      <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
        PAYMENT REMINDERS
      </p>

      <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
        Write an email reminder
      </h1>

      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        Hisably prepares a draft for you to review and send.
      </p>

      <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-100">
        This opens your email app; it does not send automatically or repeat
        every 7 days. Only contact customers who agreed to receive reminders.
        Continue using fictional test records while Hisably is being tested.
      </div>

      {pageError && (
        <p
          role="alert"
          className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-800 dark:bg-red-950 dark:text-red-100"
        >
          {pageError}
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
        !pageError && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            {result.eligible.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No customers have a positive outstanding balance as of{" "}
                {result.today}.
              </p>
            ) : (
              <>
                <label
                  htmlFor="reminder-customer"
                  className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
                >
                  Customer
                </label>

                <select
                  id="reminder-customer"
                  value={customerId}
                  onChange={selectCustomer}
                  className={inputClass}
                >
                  <option value="">Choose a customer</option>
                  {result.eligible.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} — {formatPaise(customer.balance)}
                    </option>
                  ))}
                </select>

                <label
                  htmlFor="reminder-email"
                  className="mb-2 mt-5 block text-sm font-semibold text-slate-700 dark:text-slate-300"
                >
                  Customer email address
                </label>

                <input
                  id="reminder-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  maxLength={254}
                  placeholder="customer@example.com"
                  className={inputClass}
                />

                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  The address entered here is not saved by this page.
                </p>

                {selected && (
                  <div className="mt-6">
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                      Draft preview
                    </h2>

                    <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Subject: {subject}
                    </p>

                    <pre className="mt-3 whitespace-pre-wrap break-words rounded-xl bg-slate-50 p-4 font-sans text-sm leading-6 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      {body}
                    </pre>
                  </div>
                )}

                {mailLink ? (
                  <a
                    href={mailLink}
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    <Mail size={18} />
                    Open email draft
                  </a>
                ) : (
                  <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">
                    Select a customer and enter a valid email address to open
                    the draft.
                  </p>
                )}
              </>
            )}
          </div>
        )
      )}
    </section>
  );
}