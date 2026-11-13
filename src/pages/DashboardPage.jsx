import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { subscribeToCustomers } from "../services/customers.js";
import { subscribeToTransactions } from "../services/transactions.js";
import {
  getTransactionEffects,
  TRANSACTION_TYPE_LABELS,
  TRANSACTION_TYPES,
} from "../utils/ledger.js";
import { formatPaise } from "../utils/money.js";

function todayLocal() {
  const date = new Date();

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function checkedAdd(a, b) {
  const result = a + b;

  if (!Number.isSafeInteger(result)) {
    throw new Error("A total exceeds the supported range.");
  }

  return result;
}

function calculateOverview(transactions, customers) {
  const today = todayLocal();
  const currentMonth = today.slice(0, 7);
  const customerIds = new Set(customers.map((customer) => customer.id));

  let received = 0;
  let given = 0;
  let income = 0;
  let expenses = 0;

  const balances = new Map();
  const months = new Map();

  const included = transactions.filter(
    (transaction) => transaction.date <= today
  );

  for (const transaction of included) {
    if (
      typeof transaction.date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(transaction.date) ||
      !Number.isSafeInteger(transaction.amountPaise) ||
      transaction.amountPaise <= 0 ||
      !Object.prototype.hasOwnProperty.call(
        TRANSACTION_TYPE_LABELS,
        transaction.type
      )
    ) {
      throw new Error("Invalid transaction record.");
    }

    const { cashPaise, customerBalancePaise } =
      getTransactionEffects(transaction);

    if (
      !Number.isSafeInteger(cashPaise) ||
      !Number.isSafeInteger(customerBalancePaise)
    ) {
      throw new Error("Invalid transaction effect.");
    }

    if (cashPaise > 0) {
      received = checkedAdd(received, cashPaise);
    }

    if (cashPaise < 0) {
      given = checkedAdd(given, Math.abs(cashPaise));
    }

    if (transaction.date.startsWith(currentMonth)) {
      if (transaction.type === TRANSACTION_TYPES.CASH_INCOME) {
        income = checkedAdd(income, transaction.amountPaise);
      }

      if (transaction.type === TRANSACTION_TYPES.CASH_EXPENSE) {
        expenses = checkedAdd(expenses, transaction.amountPaise);
      }
    }

    if (customerBalancePaise !== 0) {
      if (
        !transaction.customerId ||
        !customerIds.has(transaction.customerId)
      ) {
        throw new Error("A transaction has an unavailable customer.");
      }

      const previous = balances.get(transaction.customerId) || 0;

      balances.set(
        transaction.customerId,
        checkedAdd(previous, customerBalancePaise)
      );
    }

    const month = transaction.date.slice(0, 7);

    if (cashPaise !== 0) {
      const entry = months.get(month) || {
        month,
        received: 0,
        given: 0,
      };

      if (cashPaise > 0) {
        entry.received = checkedAdd(entry.received, cashPaise);
      } else {
        entry.given = checkedAdd(entry.given, Math.abs(cashPaise));
      }

      months.set(month, entry);
    }
  }

  let receivables = 0;
  let payables = 0;

  for (const balance of balances.values()) {
    if (balance > 0) {
      receivables = checkedAdd(receivables, balance);
    } else if (balance < 0) {
      payables = checkedAdd(payables, Math.abs(balance));
    }
  }

  const chart = [...months.values()]
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-6)
    .map((entry) => ({
      month: entry.month,
      Received: entry.received / 100,
      Given: entry.given / 100,
    }));

  const recent = [...included]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  return {
    today,
    received,
    given,
    receivables,
    payables,
    income,
    expenses,
    chart,
    recent,
  };
}

function StatCard({ title, value, description, icon: Icon, color }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
          {title}
        </p>

        <span className={`grid h-10 w-10 place-items-center rounded-xl ${color}`}>
          <Icon size={19} />
        </span>
      </div>

      <p className="mt-6 break-words text-2xl font-bold text-slate-900 dark:text-white">
        {formatPaise(value)}
      </p>

      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        {description}
      </p>
    </div>
  );
}

export default function DashboardPage({ user }) {
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
      (subscriptionError) => {
        console.error("Customer loading error:", subscriptionError);
        setError(
          "Could not load dashboard records. Check your connection and permissions."
        );
        setCustomersLoading(false);
      }
    );

    const stopTransactions = subscribeToTransactions(
      user.uid,
      (records) => {
        setTransactions(records);
        setTransactionsLoading(false);
      },
      (subscriptionError) => {
        console.error("Transaction loading error:", subscriptionError);
        setError(
          "Could not load dashboard records. Check your connection and permissions."
        );
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
      return {
        overview: calculateOverview(transactions, customers),
        error: "",
      };
    } catch (calculationError) {
      console.error("Dashboard calculation error:", calculationError);

      return {
        overview: null,
        error: "Could not calculate totals. Check your transaction records.",
      };
    }
  }, [transactions, customers]);

  const loading = customersLoading || transactionsLoading;
  const dashboardError = error || result.error;
  const overview = result.overview;

  return (
    <div className="min-h-[calc(100vh-81px)] bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <div>
          <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
            YOUR WORKSPACE
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Welcome, {user.displayName?.split(" ")[0] || "there"}
          </h1>

          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Your money, organized in one place.
          </p>
        </div>

        <div className="mt-8 flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-5 text-sm leading-6 text-blue-900 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-100">
          <ShieldCheck className="mt-0.5 shrink-0" size={20} />
          <p>
            Hisably is still under construction. Use fictional test records
            only until the ledger, calculations, security, and backups have
            been fully tested. Balances are net per customer, not per invoice.
          </p>
        </div>

        {loading ? (
          <p
            role="status"
            className="mt-8 text-sm text-slate-500 dark:text-slate-400"
          >
            Loading your dashboard...
          </p>
        ) : dashboardError ? (
          <p
            role="alert"
            className="mt-8 rounded-xl bg-red-50 p-4 text-sm text-red-800 dark:bg-red-950 dark:text-red-100"
          >
            {dashboardError}
          </p>
        ) : (
          <>
            <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">
              Totals include transactions through {overview.today}.
              Future-dated records are excluded.
            </p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Money received"
                value={overview.received}
                description="All incoming cash movements through today"
                icon={ArrowDownLeft}
                color="bg-emerald-50 text-emerald-600"
              />

              <StatCard
                title="Money given"
                value={overview.given}
                description="All outgoing cash movements through today"
                icon={ArrowUpRight}
                color="bg-blue-50 text-blue-600"
              />

              <StatCard
                title="Receivables"
                value={overview.receivables}
                description="Positive net customer balances"
                icon={Wallet}
                color="bg-violet-50 text-violet-600"
              />

              <StatCard
                title="Payables"
                value={overview.payables}
                description="Negative net customer balances"
                icon={CreditCard}
                color="bg-orange-50 text-orange-600"
              />
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <StatCard
                title="Monthly cash income"
                value={overview.income}
                description="Cash income records this month through today"
                icon={ArrowDownLeft}
                color="bg-emerald-50 text-emerald-600"
              />

              <StatCard
                title="Monthly cash expenses"
                value={overview.expenses}
                description="Cash expense records this month through today"
                icon={ArrowUpRight}
                color="bg-orange-50 text-orange-600"
              />
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-3">
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
                <h2 className="font-bold text-slate-900 dark:text-white">
                  Cash movements
                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Up to six months with recorded cash movements through today.
                </p>

                {overview.chart.length === 0 ? (
                  <div className="mt-6 grid min-h-48 place-items-center rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    No cash transactions to chart yet.
                  </div>
                ) : (
                  <div className="mt-6 h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={overview.chart}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip
                          formatter={(value) =>
                            new Intl.NumberFormat("en-IN", {
                              style: "currency",
                              currency: "INR",
                            }).format(value)
                          }
                        />
                        <Legend />
                        <Bar
                          dataKey="Received"
                          fill="#2563eb"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="Given"
                          fill="#f97316"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h2 className="font-bold text-slate-900 dark:text-white">
                  Recent activity
                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Latest transaction dates through today.
                </p>

                {overview.recent.length === 0 ? (
                  <p className="mt-6 rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    No transactions through today.
                  </p>
                ) : (
                  <ul className="mt-5 divide-y divide-slate-100 dark:divide-slate-800">
                    {overview.recent.map((transaction) => (
                      <li
                        key={transaction.id}
                        className="flex justify-between gap-3 py-4"
                      >
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">
                            {TRANSACTION_TYPE_LABELS[transaction.type] ||
                              "Transaction"}
                          </p>

                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {transaction.date}
                          </p>
                        </div>

                        <span className="text-sm font-semibold text-slate-900 dark:text-white">
                          {formatPaise(transaction.amountPaise)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>

            <p className="mt-6 text-xs leading-5 text-slate-500 dark:text-slate-400">
              Money received and given include loans and repayments; they are
              not the same as income and expenses. The monthly income and
              expense cards count only records explicitly marked cash income
              or cash expense. Credit sales and purchases affect customer
              balances but are not included in those cards.
            </p>
          </>
        )}

        <p className="mt-8 break-all text-xs text-slate-500 dark:text-slate-400">
          Signed in as {user.email || "Google user"}
        </p>
      </div>
    </div>
  );
}