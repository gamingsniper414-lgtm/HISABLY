import { useEffect, useMemo, useState } from "react";
import { Download, FileText } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
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
} from "../utils/ledger.js";
import { formatPaise } from "../utils/money.js";

function localDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateRange(period) {
  const today = new Date();
  const end = localDate(today);
  const start = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  if (period === "week") start.setDate(start.getDate() - 6);
  if (period === "month") start.setDate(1);

  if (period === "year") {
    start.setMonth(0, 1);
  }

  return { start: localDate(start), end };
}

function csvCell(value) {
  let text = String(value ?? "");

  // Protect spreadsheet users from formula injection.
  if (/^[\t\r\n ]*[=+\-@]/.test(text)) {
    text = `'${text}`;
  }

  return `"${text.replaceAll('"', '""')}"`;
}

function downloadCsv(rows) {
  const headers = [
    "Date",
    "Type",
    "Amount INR",
    "Customer",
    "Category",
    "Description",
  ];

  const csv = [headers, ...rows]
    .map((row) => row.map(csvCell).join(","))
    .join("\r\n");

  const blob = new Blob(["\uFEFF", csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "hisably-transaction-report.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function downloadPdf(rows, start, end) {
  const pdf = new jsPDF();

  pdf.setFontSize(18);
  pdf.text("Hisably transaction report", 14, 18);
  pdf.setFontSize(10);
  pdf.text(`Period: ${start} to ${end}`, 14, 26);
  pdf.text("Amounts in INR", 14, 32);

  autoTable(pdf, {
    startY: 38,
    head: [
      ["Date", "Type", "Amount", "Customer", "Category", "Description"],
    ],
    body: rows,
    styles: { fontSize: 8, overflow: "linebreak" },
    headStyles: { fillColor: [37, 99, 235] },
  });

  pdf.save("hisably-transaction-report.pdf");
}

// Positive balance: customer owes you.
// Negative balance: you owe the customer.
function customerBalanceEffect(transaction) {
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

  if (!Object.prototype.hasOwnProperty.call(signs, transaction.type)) {
    throw new Error("Unknown transaction type.");
  }

  if (
    !Number.isSafeInteger(transaction.amountPaise) ||
    transaction.amountPaise <= 0
  ) {
    throw new Error("Invalid transaction amount.");
  }

  return signs[transaction.type] * transaction.amountPaise;
}

function checkedAdd(current, amount) {
  const result = current + amount;

  if (!Number.isSafeInteger(result)) {
    throw new Error("Report totals exceed the supported range.");
  }

  return result;
}

export default function ReportsPage({ user }) {
  const [customers, setCustomers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [exportError, setExportError] = useState("");
  const [period, setPeriod] = useState("month");
  const [range, setRange] = useState(() => dateRange("month"));

  useEffect(() => {
    if (!user?.uid) return;

    setCustomers([]);
    setTransactions([]);
    setCustomersLoading(true);
    setTransactionsLoading(true);
    setLoadError("");

    const stopCustomers = subscribeToCustomers(
      user.uid,
      (records) => {
        setCustomers(records);
        setCustomersLoading(false);
      },
      (error) => {
        console.error("Report customer error:", error);
        setLoadError(
          "Could not load report data. Check your connection and permissions."
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
      (error) => {
        console.error("Report transaction error:", error);
        setLoadError(
          "Could not load report data. Check your connection and permissions."
        );
        setTransactionsLoading(false);
      }
    );

    return () => {
      stopCustomers();
      stopTransactions();
    };
  }, [user?.uid]);

  function selectPeriod(value) {
    setPeriod(value);
    setRange(dateRange(value));
  }

  const report = useMemo(() => {
    try {
      const filtered = transactions.filter(
        (transaction) =>
          transaction.date >= range.start &&
          transaction.date <= range.end
      );

      const names = new Map(
        customers.map((customer) => [customer.id, customer.name])
      );

      let received = 0;
      let given = 0;
      const daily = new Map();

      const rows = filtered.map((transaction) => {
        const { cashPaise } = getTransactionEffects(transaction);

        if (!Number.isSafeInteger(cashPaise)) {
          throw new Error("Invalid cash movement.");
        }

        if (cashPaise > 0) {
          received = checkedAdd(received, cashPaise);
        }

        if (cashPaise < 0) {
          given = checkedAdd(given, Math.abs(cashPaise));
        }

        const day = daily.get(transaction.date) || {
          date: transaction.date,
          Received: 0,
          Given: 0,
        };

        if (cashPaise > 0) {
          day.Received = checkedAdd(day.Received, cashPaise);
        }

        if (cashPaise < 0) {
          day.Given = checkedAdd(day.Given, Math.abs(cashPaise));
        }

        daily.set(transaction.date, day);

        return [
          transaction.date,
          TRANSACTION_TYPE_LABELS[transaction.type] || "Unknown",
          (transaction.amountPaise / 100).toFixed(2),
          transaction.customerId
            ? names.get(transaction.customerId) || "Customer unavailable"
            : "",
          transaction.category || "",
          transaction.description || "",
        ];
      });

      const chart = [...daily.values()]
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((day) => ({
          ...day,
          Received: day.Received / 100,
          Given: day.Given / 100,
        }));

      // Include all customer transactions up to the report's end date,
      // including transactions before the selected period.
      const balances = new Map();

      for (const transaction of transactions) {
        if (transaction.date > range.end) continue;

        const effect = customerBalanceEffect(transaction);

        if (effect === 0) continue;

        if (!transaction.customerId) {
          throw new Error("A balance transaction has no customer.");
        }

        const current = balances.get(transaction.customerId) || 0;

        balances.set(
          transaction.customerId,
          checkedAdd(current, effect)
        );
      }

      let receivable = 0;
      let payable = 0;

      const balanceRows = [...balances.entries()]
        .filter(([, balance]) => balance !== 0)
        .map(([customerId, balance]) => {
          if (balance > 0) {
            receivable = checkedAdd(receivable, balance);
          } else {
            payable = checkedAdd(payable, Math.abs(balance));
          }

          return {
            customerId,
            name: names.get(customerId) || "Customer unavailable",
            balance,
          };
        })
        .sort((a, b) => a.name.localeCompare(b.name));

      return {
        rows,
        received,
        given,
        chart,
        balanceRows,
        receivable,
        payable,
        error: "",
      };
    } catch (error) {
      console.error("Report calculation error:", error);

      return {
        rows: [],
        received: 0,
        given: 0,
        chart: [],
        balanceRows: [],
        receivable: 0,
        payable: 0,
        error:
          "Could not calculate the report. Check your transaction records.",
      };
    }
  }, [transactions, customers, range]);

  function handleExport(kind) {
    setExportError("");

    try {
      if (kind === "csv") {
        downloadCsv(report.rows);
      } else {
        downloadPdf(report.rows, range.start, range.end);
      }
    } catch (error) {
      console.error("Report export error:", error);
      setExportError("Could not export the report. Please try again.");
    }
  }

  const loading = customersLoading || transactionsLoading;
  const error = loadError || report.error;
  const canExport = !loading && !error && report.rows.length > 0;

  return (
    <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
            YOUR INSIGHTS
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
            Reports
          </h1>

          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Review transaction activity and customer balances.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleExport("csv")}
            disabled={!canExport}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            <Download size={17} />
            Export transactions CSV
          </button>

          <button
            type="button"
            onClick={() => handleExport("pdf")}
            disabled={!canExport}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <FileText size={17} />
            Export transactions PDF
          </button>
        </div>
      </div>

      <p className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-100">
        Use fictional test records only. Exports contain selected transactions,
        not the outstanding balance report, and may include customer
        information. Store them safely.
      </p>

      <div className="mt-6 flex flex-wrap gap-2" aria-label="Report period">
        {[
          ["day", "Today"],
          ["week", "Last 7 days"],
          ["month", "This month"],
          ["year", "This year"],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => selectPeriod(value)}
            aria-pressed={period === value}
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${
              period === value
                ? "bg-blue-600 text-white"
                : "border border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
        Transaction period: {range.start} to {range.end}
      </p>

      {(error || exportError) && (
        <p
          role="alert"
          className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-800 dark:bg-red-950 dark:text-red-100"
        >
          {error || exportError}
        </p>
      )}

      {loading ? (
        <p
          role="status"
          className="mt-8 text-sm text-slate-500 dark:text-slate-400"
        >
          Loading report...
        </p>
      ) : (
        !error && (
          <>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {[
                ["Money received", formatPaise(report.received)],
                ["Money given", formatPaise(report.given)],
                ["Transactions", report.rows.length],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
                >
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {label}
                  </p>

                  <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
                    {value}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="font-bold text-slate-900 dark:text-white">
                Outstanding customer balances
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                As of {range.end}, using all customer transactions up to that
                date, including transactions before the selected period.
                Balances are net per customer, not per invoice.
              </p>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-blue-50 p-4 dark:bg-blue-950">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Customers owe you
                  </p>
                  <p className="mt-2 text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {formatPaise(report.receivable)}
                  </p>
                </div>

                <div className="rounded-xl bg-orange-50 p-4 dark:bg-orange-950">
                  <p className="text-sm text-orange-800 dark:text-orange-200">
                    You owe customers
                  </p>
                  <p className="mt-2 text-2xl font-bold text-orange-900 dark:text-orange-100">
                    {formatPaise(report.payable)}
                  </p>
                </div>
              </div>

              {report.balanceRows.length === 0 ? (
                <p className="mt-5 rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  No outstanding customer balances as of this date.
                </p>
              ) : (
                <div className="mt-5 overflow-x-auto">
                  <table className="w-full min-w-[450px] text-left text-sm">
                    <thead className="border-b border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400">
                      <tr>
                        <th className="p-3 font-semibold">Customer</th>
                        <th className="p-3 font-semibold">Status</th>
                        <th className="p-3 font-semibold">Amount</th>
                      </tr>
                    </thead>

                    <tbody className="text-slate-700 dark:text-slate-300">
                      {report.balanceRows.map((row) => (
                        <tr
                          key={row.customerId}
                          className="border-b border-slate-100 dark:border-slate-800"
                        >
                          <td className="break-words p-3">{row.name}</td>
                          <td className="p-3">
                            {row.balance > 0 ? "Owes you" : "You owe"}
                          </td>
                          <td className="p-3 font-semibold">
                            {formatPaise(Math.abs(row.balance))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="font-bold text-slate-900 dark:text-white">
                Cash movements by day
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Loans and repayments are cash movements, not necessarily income
                or expenses.
              </p>

              {report.rows.length === 0 ? (
                <p className="mt-6 rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  No transactions in this period.
                </p>
              ) : (
                <div className="mt-6 h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={report.chart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
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
                      <Bar dataKey="Received" fill="#2563eb" />
                      <Bar dataKey="Given" fill="#f97316" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="font-bold text-slate-900 dark:text-white">
                Transactions in this period
              </h2>

              <table className="mt-4 w-full min-w-[650px] text-left text-sm">
                <thead className="border-b border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  <tr>
                    {[
                      "Date",
                      "Type",
                      "Amount (INR)",
                      "Customer",
                      "Category",
                      "Description",
                    ].map((heading) => (
                      <th key={heading} className="p-3 font-semibold">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="text-slate-700 dark:text-slate-300">
                  {report.rows.map((row, index) => (
                    <tr
                      key={`${row[0]}-${index}`}
                      className="border-b border-slate-100 dark:border-slate-800"
                    >
                      {row.map((cell, cellIndex) => (
                        <td
                          key={cellIndex}
                          className="max-w-xs break-words p-3"
                        >
                          {cell || "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )
      )}
    </section>
  );
}