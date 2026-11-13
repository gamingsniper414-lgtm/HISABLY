import { useEffect, useState } from "react";
import { Download, ShieldAlert } from "lucide-react";

import { subscribeToCustomers } from "../services/customers.js";
import { subscribeToTransactions } from "../services/transactions.js";

export default function BackupPage({ user }) {
  const [customers, setCustomers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloadError, setDownloadError] = useState("");

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
        console.error("Backup customer error:", err);
        setError("Could not load backup data. Check your connection.");
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
        console.error("Backup transaction error:", err);
        setError("Could not load backup data. Check your connection.");
        setTransactionsLoading(false);
      }
    );

    return () => {
      stopCustomers();
      stopTransactions();
    };
  }, [user?.uid]);

  const loading = customersLoading || transactionsLoading;

  function downloadBackup() {
    setDownloadError("");

    try {
      const backup = {
        format: "hisably-json-export",
        version: 1,
        exportedAt: new Date().toISOString(),
        accountUid: user.uid,
        note: "Hisably data export. Automatic restoration is not yet available.",
        customers,
        transactions,
      };

      const json = JSON.stringify(backup, null, 2);
      const blob = new Blob([json], {
        type: "application/json;charset=utf-8",
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `hisably-data-${new Date()
        .toISOString()
        .slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Backup download error:", err);
      setDownloadError("Could not download the file. Please try again.");
    }
  }

  return (
    <section className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
      <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
        YOUR DATA
      </p>

      <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
        Data backup
      </h1>

      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        Download a copy of your customer and transaction records.
      </p>

      <div className="mt-6 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
        <ShieldAlert size={20} className="shrink-0" />
        <div>
          <p className="font-semibold">Keep this file private</p>
          <p className="mt-1">
            The download is not encrypted and contains customer and financial
            information. Store it securely. Automatic restore is not yet
            available, so this export has not been verified as a complete
            recovery solution. Continue using fictional test data only.
          </p>
        </div>
      </div>

      {(error || downloadError) && (
        <p
          role="alert"
          className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-800 dark:bg-red-950 dark:text-red-100"
        >
          {error || downloadError}
        </p>
      )}

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          JSON data export
        </h2>

        {loading ? (
          <p role="status" className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            Loading your records...
          </p>
        ) : !error ? (
          <>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Includes {customers.length} customer records and{" "}
              {transactions.length} transaction records currently loaded from
              your account.
            </p>

            <button
              type="button"
              onClick={downloadBackup}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Download size={18} />
              Download JSON
            </button>
          </>
        ) : null}
      </div>
    </section>
  );
}
