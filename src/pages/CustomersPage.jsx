import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Pencil, Plus, Search, Users, X } from "lucide-react";
import {
  addCustomer,
  subscribeToCustomers,
  updateCustomer,
} from "../services/customers.js";
import { subscribeToTransactions } from "../services/transactions.js";
import {
  calculateCustomerBalance,
  getBalanceStatus,
  TRANSACTION_TYPE_LABELS,
} from "../utils/ledger.js";
import { formatPaise } from "../utils/money.js";

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white";

export default function CustomersPage({ user }) {
  const [customers, setCustomers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [expandedId, setExpandedId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

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
        console.error("Customer loading error:", error);
        setLoadError("Could not load customers. Check your connection and permissions.");
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
        console.error("Transaction loading error:", error);
        setLoadError("Could not load transactions. Customer balances are unavailable.");
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
      const entries = customers.map((customer) => {
        const history = transactions.filter(
          (transaction) => transaction.customerId === customer.id
        );
        const balance = calculateCustomerBalance(transactions, customer.id);

        return {
          ...customer,
          history,
          balance,
          status: getBalanceStatus(balance),
        };
      });

      return { entries, error: "" };
    } catch (error) {
      console.error("Customer balance error:", error);
      return {
        entries: [],
        error: "Could not calculate balances. Check your transaction records.",
      };
    }
  }, [customers, transactions]);

  function openAddForm() {
    setEditingId(null);
    setName("");
    setPhone("");
    setFormError("");
    setSuccess("");
    setFormOpen(true);
  }

  function openEditForm(customer) {
    setEditingId(customer.id);
    setName(customer.name);
    setPhone(customer.phone || "");
    setFormError("");
    setSuccess("");
    setFormOpen(true);
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");
    setSuccess("");
    setSaving(true);

    try {
      if (editingId) {
        await updateCustomer(user.uid, editingId, { name, phone });
        setSuccess("Customer updated successfully.");
      } else {
        await addCustomer(user.uid, { name, phone });
        setSuccess("Customer added successfully.");
      }

      setName("");
      setPhone("");
      setEditingId(null);
      setFormOpen(false);
    } catch (error) {
      console.error("Customer save error:", error);
      setFormError(
        error.code
          ? "Could not save the customer. Check your connection and permissions."
          : error.message || "Could not save the customer."
      );
    } finally {
      setSaving(false);
    }
  }

  const loading = customersLoading || transactionsLoading;
  const pageError = loadError || result.error;
  const query = search.trim().toLowerCase();

  const filtered = result.entries.filter((customer) => {
    const matchesSearch = `${customer.name} ${customer.phone || ""}`
      .toLowerCase()
      .includes(query);
    const matchesFilter = filter === "all" || customer.status === filter;
    return matchesSearch && matchesFilter;
  });

  function balanceLabel(customer) {
    if (customer.status === "receivable") return "Owes you";
    if (customer.status === "payable") return "You owe";
    return "Settled";
  }

  return (
    <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
            YOUR KHATA
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
            Customers
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            View customer balances and transaction history.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddForm}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Plus size={18} />
          Add customer
        </button>
      </div>

      <p className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-100">
        Use fictional test data only while Hisably is being tested. Balances are
        net balances per customer, not individual invoice statuses.
      </p>

      {pageError && (
        <p role="alert" className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-800 dark:bg-red-950 dark:text-red-100">
          {pageError}
        </p>
      )}

      {formError && (
        <p role="alert" className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-800 dark:bg-red-950 dark:text-red-100">
          {formError}
        </p>
      )}

      {success && (
        <p role="status" className="mt-4 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-100">
          {success}
        </p>
      )}

      {formOpen && (
        <form
          onSubmit={handleSubmit}
          className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {editingId ? "Edit customer" : "Add a customer"}
            </h2>
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              disabled={saving}
              aria-label="Close customer form"
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X size={20} />
            </button>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="customer-name" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Name *
              </label>
              <input
                id="customer-name"
                className={inputClass}
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={100}
                required
                placeholder="Enter a name"
              />
            </div>

            <div>
              <label htmlFor="customer-phone" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Phone (optional)
              </label>
              <input
                id="customer-phone"
                className={inputClass}
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                maxLength={30}
                placeholder="Enter a phone number"
              />
            </div>
          </div>

          <div className="mt-5 flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? "Saving..." : editingId ? "Save changes" : "Save customer"}
            </button>
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              disabled={saving}
              className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold dark:border-slate-700 dark:text-white"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Customer list
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
                aria-label="Search customers"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name or phone"
                className={`${inputClass} pl-10`}
              />
            </div>

            <select
              aria-label="Filter by balance"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className={`${inputClass} sm:w-44`}
            >
              <option value="all">All balances</option>
              <option value="receivable">Owes you</option>
              <option value="payable">You owe</option>
              <option value="settled">Settled</option>
            </select>
          </div>
        </div>

        {loading ? (
          <p role="status" className="mt-8 text-sm text-slate-500 dark:text-slate-400">
            Loading customers and balances...
          </p>
        ) : pageError ? (
          <p className="mt-8 text-sm text-slate-500 dark:text-slate-400">
            Customer balances are unavailable.
          </p>
        ) : filtered.length === 0 ? (
          <div className="mt-6 flex flex-col items-center rounded-xl border border-dashed border-slate-200 p-10 text-center dark:border-slate-700">
            <Users size={28} className="text-slate-400" />
            <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
              {query || filter !== "all" ? "No matching customers" : "No customers yet"}
            </p>
          </div>
        ) : (
          <ul className="mt-6 divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map((customer) => {
              const expanded = expandedId === customer.id;

              return (
                <li key={customer.id} className="py-5">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-blue-50 font-bold text-blue-600 dark:bg-blue-950 dark:text-blue-300">
                        {customer.name.charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="break-words font-semibold text-slate-900 dark:text-white">
                          {customer.name}
                        </p>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                          {customer.phone || "No phone number"}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {balanceLabel(customer)}
                        </p>
                        <p className="font-bold text-slate-900 dark:text-white">
                          {formatPaise(Math.abs(customer.balance))}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => openEditForm(customer)}
                        aria-label={`Edit ${customer.name}`}
                        className="rounded-lg p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800"
                      >
                        <Pencil size={18} />
                      </button>

                      <button
                        type="button"
                        onClick={() => setExpandedId(expanded ? null : customer.id)}
                        aria-expanded={expanded}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200"
                      >
                        {expanded ? "Hide history" : "View history"}
                        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>
                  </div>

                  {expanded && (
                    <div className="mt-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        Transaction history
                      </h3>
                      {customer.history.length === 0 ? (
                        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                          No transactions for this customer yet.
                        </p>
                      ) : (
                        <ul className="mt-3 divide-y divide-slate-200 dark:divide-slate-700">
                          {customer.history.map((transaction) => (
                            <li key={transaction.id} className="flex justify-between gap-4 py-3">
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                  {TRANSACTION_TYPE_LABELS[transaction.type] || "Transaction"}
                                </p>
                                <p className="mt-1 break-words text-xs text-slate-500 dark:text-slate-400">
                                  {transaction.date}
                                  {transaction.description ? ` · ${transaction.description}` : ""}
                                </p>
                              </div>
                              <span className="shrink-0 text-sm font-semibold text-slate-900 dark:text-white">
                                {formatPaise(transaction.amountPaise)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}