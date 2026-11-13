import { useEffect, useState } from "react";
import { Pencil, Plus, Search, Trash2, X } from "lucide-react";
import {
  addTransaction,
  deleteTransaction,
  subscribeToTransactions,
  updateTransaction,
} from "../services/transactions.js";
import { subscribeToCustomers } from "../services/customers.js";
import {
  TRANSACTION_TYPES,
  TRANSACTION_TYPE_LABELS,
} from "../utils/ledger.js";
import { formatPaise, parseRupeesToPaise } from "../utils/money.js";

const customerTypes = new Set([
  TRANSACTION_TYPES.LOAN_GIVEN,
  TRANSACTION_TYPES.LOAN_RECEIVED,
  TRANSACTION_TYPES.REPAYMENT_RECEIVED,
  TRANSACTION_TYPES.REPAYMENT_GIVEN,
  TRANSACTION_TYPES.CREDIT_SALE,
  TRANSACTION_TYPES.CREDIT_PURCHASE,
]);

function todayLocal() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function emptyForm() {
  return {
    type: TRANSACTION_TYPES.CASH_EXPENSE,
    amount: "",
    date: todayLocal(),
    customerId: "",
    category: "",
    description: "",
  };
}

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white";

const labelClass =
  "mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300";

export default function TransactionsPage({ user }) {
  const [transactions, setTransactions] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    if (!user?.uid) return;

    setTransactions([]);
    setCustomers([]);
    setTransactionsLoading(true);
    setCustomersLoading(true);
    setLoadError("");

    const stopTransactions = subscribeToTransactions(
      user.uid,
      (records) => {
        setTransactions(records);
        setTransactionsLoading(false);
      },
      (subscriptionError) => {
        console.error("Transaction loading error:", subscriptionError);
        setLoadError(
          "Could not load records. Check your connection and database permissions."
        );
        setTransactionsLoading(false);
      }
    );

    const stopCustomers = subscribeToCustomers(
      user.uid,
      (records) => {
        setCustomers(records);
        setCustomersLoading(false);
      },
      (subscriptionError) => {
        console.error("Customer loading error:", subscriptionError);
        setLoadError(
          "Could not load records. Check your connection and database permissions."
        );
        setCustomersLoading(false);
      }
    );

    return () => {
      stopTransactions();
      stopCustomers();
    };
  }, [user?.uid]);

  function changeField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function startNew() {
    setForm(emptyForm());
    setEditingId(null);
    setError("");
    setMessage("");
    setFormOpen(true);
  }

  function startEdit(transaction) {
    setForm({
      type: transaction.type,
      amount: (transaction.amountPaise / 100).toFixed(2),
      date: transaction.date,
      customerId: transaction.customerId || "",
      category: transaction.category || "",
      description: transaction.description || "",
    });
    setEditingId(transaction.id);
    setError("");
    setMessage("");
    setFormOpen(true);
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);

    try {
      const data = {
        type: form.type,
        amountPaise: parseRupeesToPaise(form.amount),
        date: form.date,
        customerId: form.customerId || null,
        category: form.category,
        description: form.description,
      };

      if (editingId) {
        await updateTransaction(user.uid, editingId, data);
        setMessage("Transaction updated.");
      } else {
        await addTransaction(user.uid, data);
        setMessage("Transaction added.");
      }

      setFormOpen(false);
      setEditingId(null);
      setForm(emptyForm());
    } catch (saveError) {
      console.error("Transaction save error:", saveError);
      setError(
        saveError.code
          ? "Could not save the transaction. Check your connection and database permissions."
          : saveError.message || "Could not save the transaction."
      );
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      await deleteTransaction(user.uid, deleteTarget.id);
      setDeleteTarget(null);
      setMessage("Transaction deleted.");
    } catch (deleteError) {
      console.error("Transaction delete error:", deleteError);
      setError("Could not delete the transaction. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function customerName(customerId) {
    if (!customerId) return "No customer";
    return customers.find((customer) => customer.id === customerId)?.name ||
      "Customer unavailable";
  }

  const query = search.trim().toLowerCase();
  const filteredTransactions = transactions.filter((transaction) => {
    const text = [
      TRANSACTION_TYPE_LABELS[transaction.type],
      transaction.date,
      transaction.category,
      transaction.description,
      customerName(transaction.customerId),
    ]
      .join(" ")
      .toLowerCase();

    return (
      text.includes(query) &&
      (typeFilter === "all" || transaction.type === typeFilter)
    );
  });

  const loading = transactionsLoading || customersLoading;
  const requiresCustomer = customerTypes.has(form.type);

  return (
    <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
            YOUR LEDGER
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
            Transactions
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Record and review your financial activity.
          </p>
        </div>

        <button
          type="button"
          onClick={startNew}
          disabled={loading || Boolean(loadError)}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          <Plus size={18} />
          Add transaction
        </button>
      </div>

      <p className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-100">
        This ledger is still under construction. Do not enter real financial
        data until the security rules and calculations have been tested.
      </p>

      {loadError && (
        <p role="alert" className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-800 dark:bg-red-950 dark:text-red-100">
          {loadError}
        </p>
      )}

      {error && (
        <p role="alert" className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-800 dark:bg-red-950 dark:text-red-100">
          {error}
        </p>
      )}

      {message && (
        <p role="status" className="mt-4 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-100">
          {message}
        </p>
      )}

      {formOpen && (
        <form
          onSubmit={handleSubmit}
          className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {editingId ? "Edit transaction" : "New transaction"}
            </h2>
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              disabled={saving}
              aria-label="Close transaction form"
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X size={20} />
            </button>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="transaction-type">
                Transaction type
              </label>
              <select
                id="transaction-type"
                name="type"
                value={form.type}
                onChange={changeField}
                className={inputClass}
              >
                {Object.entries(TRANSACTION_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass} htmlFor="transaction-amount">
                Amount in INR
              </label>
              <input
                id="transaction-amount"
                name="amount"
                type="text"
                inputMode="decimal"
                placeholder="For example, 150.50"
                value={form.amount}
                onChange={changeField}
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="transaction-date">
                Date
              </label>
              <input
                id="transaction-date"
                name="date"
                type="date"
                value={form.date}
                onChange={changeField}
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="transaction-customer">
                Customer {requiresCustomer ? "(required)" : "(optional)"}
              </label>
              <select
                id="transaction-customer"
                name="customerId"
                value={form.customerId}
                onChange={changeField}
                required={requiresCustomer}
                className={inputClass}
              >
                <option value="">Select a customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
              {requiresCustomer && customers.length === 0 && (
                <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
                  Add a customer first for this transaction type.
                </p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor="transaction-category">
                Category (optional)
              </label>
              <input
                id="transaction-category"
                name="category"
                value={form.category}
                onChange={changeField}
                maxLength={60}
                placeholder="For example, groceries"
                className={inputClass}
              />
            </div>

            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor="transaction-description">
                Description (optional)
              </label>
              <textarea
                id="transaction-description"
                name="description"
                value={form.description}
                onChange={changeField}
                maxLength={500}
                rows={3}
                className={inputClass}
              />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving || (requiresCustomer && customers.length === 0)}
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : editingId ? "Save changes" : "Save transaction"}
            </button>
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              disabled={saving}
              className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Transaction history
          </h2>
          <div className="flex w-full flex-wrap gap-3 sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search
                aria-hidden="true"
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="search"
                aria-label="Search transactions"
                placeholder="Search transactions"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className={`${inputClass} pl-10`}
              />
            </div>
            <select
              aria-label="Filter transaction type"
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              className={`${inputClass} sm:w-52`}
            >
              <option value="all">All types</option>
              {Object.entries(TRANSACTION_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <p role="status" className="mt-6 text-sm text-slate-500 dark:text-slate-400">
            Loading transactions...
          </p>
        ) : loadError ? (
          <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">
            Transaction history is unavailable.
          </p>
        ) : filteredTransactions.length === 0 ? (
          <p className="mt-6 rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            {query || typeFilter !== "all"
              ? "No transactions match your search."
              : "No transactions yet."}
          </p>
        ) : (
          <ul className="mt-6 divide-y divide-slate-100 dark:divide-slate-800">
            {filteredTransactions.map((transaction) => (
              <li
                key={transaction.id}
                className="flex flex-wrap items-center justify-between gap-4 py-5"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {TRANSACTION_TYPE_LABELS[transaction.type] || "Unknown type"}
                  </p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {transaction.date} · {customerName(transaction.customerId)}
                    {transaction.category ? ` · ${transaction.category}` : ""}
                  </p>
                  {transaction.description && (
                    <p className="mt-1 break-words text-sm text-slate-600 dark:text-slate-300">
                      {transaction.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="mr-2 font-bold text-slate-900 dark:text-white">
                    {formatPaise(transaction.amountPaise)}
                  </span>
                  <button
                    type="button"
                    onClick={() => startEdit(transaction)}
                    aria-label={`Edit ${TRANSACTION_TYPE_LABELS[transaction.type] || "transaction"}`}
                    className="rounded-lg p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800"
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setError("");
                      setDeleteTarget(transaction);
                    }}
                    aria-label={`Delete ${TRANSACTION_TYPE_LABELS[transaction.type] || "transaction"}`}
                    className="rounded-lg p-2 text-red-600 hover:bg-red-50 dark:hover:bg-slate-800"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {deleteTarget && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="delete-title"
          aria-describedby="delete-description"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-5"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
            <h2 id="delete-title" className="text-xl font-bold text-slate-900 dark:text-white">
              Delete transaction?
            </h2>
            <p id="delete-description" className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
              This will remove the record and may change customer balances.
              This action cannot be undone.
            </p>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={saving}
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold dark:border-slate-700 dark:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={saving}
                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {saving ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}