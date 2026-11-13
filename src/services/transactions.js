import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase/config.js";
import { TRANSACTION_TYPES } from "../utils/ledger.js";

const validTypes = Object.values(TRANSACTION_TYPES);

const typesRequiringCustomer = [
  TRANSACTION_TYPES.LOAN_GIVEN,
  TRANSACTION_TYPES.LOAN_RECEIVED,
  TRANSACTION_TYPES.REPAYMENT_RECEIVED,
  TRANSACTION_TYPES.REPAYMENT_GIVEN,
  TRANSACTION_TYPES.CREDIT_SALE,
  TRANSACTION_TYPES.CREDIT_PURCHASE,
];

const MAX_PAISE = 1_000_000_000_000;

function validateDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
}

function validateTransaction(input) {
  const type = input.type;
  const amountPaise = input.amountPaise;
  const date = input.date;
  const customerId = String(input.customerId || "").trim();
  const category = String(input.category || "").trim();
  const description = String(input.description || "").trim();

  if (!validTypes.includes(type)) {
    throw new Error("Choose a valid transaction type.");
  }

  if (
    !Number.isSafeInteger(amountPaise) ||
    amountPaise <= 0 ||
    amountPaise > MAX_PAISE
  ) {
    throw new Error("Enter a valid amount within the supported limit.");
  }

  if (!validateDate(date)) {
    throw new Error("Choose a valid transaction date.");
  }

  if (typesRequiringCustomer.includes(type) && !customerId) {
    throw new Error("Choose a customer for this transaction.");
  }

  if (customerId.length > 128 || customerId.includes("/")) {
    throw new Error("Invalid customer.");
  }

  if (category.length > 60) {
    throw new Error("Category must be 60 characters or fewer.");
  }

  if (description.length > 500) {
    throw new Error("Description must be 500 characters or fewer.");
  }

  return {
    type,
    amountPaise,
    date,
    customerId: customerId || null,
    category,
    description,
  };
}

function transactionCollection(userId) {
  if (!userId) {
    throw new Error("You must be signed in to manage transactions.");
  }

  return collection(db, "users", userId, "transactions");
}

function transactionReference(userId, transactionId) {
  if (!userId || !transactionId) {
    throw new Error("A signed-in user and transaction are required.");
  }

  return doc(db, "users", userId, "transactions", transactionId);
}

export async function addTransaction(userId, input) {
  const transaction = validateTransaction(input);

  return addDoc(transactionCollection(userId), {
    ...transaction,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateTransaction(userId, transactionId, input) {
  const transaction = validateTransaction(input);

  await updateDoc(transactionReference(userId, transactionId), {
    ...transaction,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteTransaction(userId, transactionId) {
  await deleteDoc(transactionReference(userId, transactionId));
}

export function subscribeToTransactions(userId, onData, onError) {
  return onSnapshot(
    transactionCollection(userId),
    (snapshot) => {
      const transactions = snapshot.docs.map((transactionDoc) => ({
        ...transactionDoc.data(),
        id: transactionDoc.id,
      }));

      transactions.sort((a, b) =>
        String(b.date || "").localeCompare(String(a.date || ""))
      );

      onData(transactions);
    },
    onError
  );
}