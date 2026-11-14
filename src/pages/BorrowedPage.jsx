import { useEffect, useMemo, useState } from "react";
import { subscribeToCustomers } from "../services/customers.js";
import { subscribeToTransactions } from "../services/transactions.js";
import { TRANSACTION_TYPES } from "../utils/ledger.js";
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
  const total = a + b;
  if (!Number.isSafeInteger(total)) {
    throw new Error("Amount exceeds the supported range.");
  }
  return total;
}

function summary(borrowed, repaid) {
  const remaining = Math.max(0, borrowed - repaid);
  const extra = Math.max(0, repaid - borrowed);

  return {
    borrowed,
    repaid,
    remaining,
    extra,
    percentage: borrowed > 0 ? (extra / borrowed) * 100 : null,
  };
}

function extraPercent(item) {
  return item.percentage === null
    ? "Not available — no borrowing recorded"
    : `${item.percentage.toFixed(2)}% of borrowed`;
}

function AmountCard({ title, value, note }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
        {title}
      </p>
      <p className="mt-3 break-words text-2xl font-bold text-slate-900 dark:text-white">
        {formatPaise(value)}
      </p>
      {note && (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {note}
        </p>
      )}
    </div>
  );
}

export default function BorrowedPage({ user }) {
  const [customers, setCustomers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

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
        console.error("Borrowed customer error:", error);
        setLoadError("Could not load customers. Check your connection.");
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
        console.error("Borrowed transaction error:", error);
        setLoadError("Could not load transactions. Check your connection.");
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
      const names = new Map(
        customers.map((customer) => [customer.id, customer.name])
      );
      const totalsByCustomer = new Map();

      for (const transaction of transactions) {
        if (
          transaction.type !== TRANSACTION_TYPES.LOAN_RECEIVED &&
          transaction.type !== TRANSACTION_TYPES.REPAYMENT_GIVEN
        ) {
          continue;
        }

        if (
          typeof transaction.date !== "string" ||
          !/^\d{4}-\d{2}-\d{2}$/.test(transaction.date) ||
          !Number.isSafeInteger(transaction.amountPaise) ||
          transaction.amountPaise <= 0 ||
          !transaction.customerId ||
          !names.has(transaction.customerId)
        ) {
          throw new Error("Invalid borrowing record.");
        }

        if (transaction.date > today) continue;

        const entry = totalsByCustomer.get(transaction.customerId) || {
          borrowed: 0,
          repaid: 0,
        };

        if (transaction.type === TRANSACTION_TYPES.LOAN_RECEIVED) {
          entry.borrowed = checkedAdd(
            entry.borrowed,
            transaction.amountPaise
          );
        } else {
          entry.repaid = checkedAdd(entry.repaid, transaction.amountPaise);
        }

        totalsByCustomer.set(transaction.customerId, entry);
      }

      const people = [...totalsByCustomer.entries()]
        .map(([id, entry]) => ({
          id,
          name: names.get(id),
          ...summary(entry.borrowed, entry.repaid),
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      let borrowed = 0;
      let repaid = 0;
      let remaining = 0;
      let extra = 0;

      for (const person of people) {
        borrowed = checkedAdd(borrowed, person.borrowed);
        repaid = checkedAdd(repaid, person.repaid);
        remaining = checkedAdd(remaining, person.remaining);
        extra = checkedAdd(extra, person.extra);
      }

      return {
        today,
        people,
        totals: {
          borrowed,
          repaid,
          remaining,
          extra,
          percentage: borrowed > 0 ? (extra / borrowed) * 100 : null,
        },
        error: "",
      };
    } catch (error) {
      console.error("Borrowing calculation error:", error);
      return {
        today: "",
        people: [],
        totals: null,
        error: "Could not calculate borrowing totals. Check your records.",
      };
    }
  }, [customers, transactions]);

  const loading = customersLoading || transactionsLoading;
  const error = loadError || result.error;

  return (
    <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
      <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
        YOUR BORROWING
      </p>

      <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
        Borrowed money
      </h1>

      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        See how much you borrowed, repaid, and paid extra.
      </p>

      <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-900 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-100">
        Use fictional test records only. This summary uses only transactions
        marked <strong>Loan received</strong> and{" "}
        <strong>Repayment given</strong>, through today. It does not include
        credit purchases, sales, loans you gave, or other transaction types.
        Extra payment is not automatically classified as interest.
      </div>

      {loading ? (
        <p role="status" className="mt-6 text-sm text-slate-500 dark:text-slate-400">
          Loading borrowing summary...
        </p>
      ) : error ? (
        <p
          role="alert"
          className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-800 dark:bg-red-950 dark:text-red-100"
        >
          {error}
        </p>
      ) : (
        <>
          <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">
            Summary through {result.today}. Future-dated records are excluded.
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <AmountCard title="Total borrowed" value={result.totals.borrowed} />
            <AmountCard title="Total repaid" value={result.totals.repaid} />
            <AmountCard
              title="Remaining"
              value={result.totals.remaining}
              note="Sum of remaining amounts per person"
            />
            <AmountCard
              title="Extra paid"
              value={result.totals.extra}
              note={extraPercent(result.totals)}
            />
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              By person
            </h2>

            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              For each person, remaining is borrowed minus repaid, if positive.
              Extra is repaid minus borrowed, if positive. The total extra
              percentage is the sum of each person’s extra divided by total
              borrowed.
            </p>

            {result.people.length === 0 ? (
              <p className="mt-5 rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                No borrowing or repayment records through today. Add them from
                the Transactions page.
              </p>
            ) : (
              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[780px] text-left text-sm">
                  <thead className="border-b border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    <tr>
                      {[
                        "Person",
                        "Borrowed",
                        "Repaid",
                        "Remaining",
                        "Extra paid",
                        "Extra %",
                      ].map((heading) => (
                        <th key={heading} className="p-3 font-semibold">
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody className="text-slate-700 dark:text-slate-300">
                    {result.people.map((person) => (
                      <tr
                        key={person.id}
                        className="border-b border-slate-100 dark:border-slate-800"
                      >
                        <td className="break-words p-3 font-semibold">
                          {person.name}
                        </td>
                        <td className="p-3">{formatPaise(person.borrowed)}</td>
                        <td className="p-3">{formatPaise(person.repaid)}</td>
                        <td className="p-3">{formatPaise(person.remaining)}</td>
                        <td className="p-3">{formatPaise(person.extra)}</td>
                        <td className="p-3">{extraPercent(person)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <p className="mt-5 text-xs leading-5 text-slate-500 dark:text-slate-400">
              This is a summary across all borrowing records for each person,
              not a separate balance or interest rate for each loan. If you
              recorded a repayment without recording the borrowing, it appears
              as extra; check your records before relying on it.
            </p>
          </div>
        </>
      )}
    </section>
  );
}