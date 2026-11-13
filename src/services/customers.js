import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase/config.js";

function validateCustomer(input) {
  const name = String(input.name || "").trim();
  const phone = String(input.phone || "").trim();

  if (!name || name.length > 100) {
    throw new Error("Enter a customer name of up to 100 characters.");
  }

  if (phone.length > 30) {
    throw new Error("Phone number must be 30 characters or fewer.");
  }

  return { name, phone };
}

function customerCollection(userId) {
  if (!userId) {
    throw new Error("You must be signed in to manage customers.");
  }

  return collection(db, "users", userId, "customers");
}

export async function addCustomer(userId, input) {
  const customer = validateCustomer(input);

  return addDoc(customerCollection(userId), {
    ...customer,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateCustomer(userId, customerId, input) {
  if (!userId || !customerId) {
    throw new Error("A signed-in user and customer are required.");
  }

  const customer = validateCustomer(input);
  const customerRef = doc(db, "users", userId, "customers", customerId);

  await updateDoc(customerRef, {
    ...customer,
    updatedAt: serverTimestamp(),
  });
}

export function subscribeToCustomers(userId, onData, onError) {
  return onSnapshot(
    customerCollection(userId),
    (snapshot) => {
      const customers = snapshot.docs.map((customerDoc) => ({
        id: customerDoc.id,
        ...customerDoc.data(),
      }));

      customers.sort((a, b) => a.name.localeCompare(b.name));
      onData(customers);
    },
    onError
  );
}