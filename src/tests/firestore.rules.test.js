import { readFileSync } from "node:fs";
import { after, before, beforeEach, test } from "node:test";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";

const projectId = "demo-hisably";
let environment;

function googleUser(uid) {
  return environment.authenticatedContext(uid, {
    firebase: { sign_in_provider: "google.com" },
  }).firestore();
}

function customerData() {
  return {
    name: "Test Customer",
    phone: "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

function transactionData(customerId = null) {
  return {
    type: "cash_expense",
    amountPaise: 15050,
    date: "2026-01-15",
    customerId,
    category: "Test",
    description: "Test record only",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

before(async () => {
  environment = await initializeTestEnvironment({
    projectId,
    firestore: {
      rules: readFileSync("src/firestore.rules", "utf8"),
    },
  });
});

beforeEach(async () => {
  await environment.clearFirestore();
});

after(async () => {
  if (environment) await environment.cleanup();
});

test("owner can create and read their customer", async () => {
  const db = googleUser("alice");
  const ref = doc(db, "users/alice/customers/customer1");

  await assertSucceeds(setDoc(ref, customerData()));
  await assertSucceeds(getDoc(ref));
  await assertSucceeds(getDocs(collection(db, "users/alice/customers")));
});

test("anonymous and other users cannot read a customer's record", async () => {
  const ownerDb = googleUser("alice");
  const ownerRef = doc(ownerDb, "users/alice/customers/customer1");
  await assertSucceeds(setDoc(ownerRef, customerData()));

  const anonymousDb = environment.unauthenticatedContext().firestore();
  const otherDb = googleUser("bob");

  await assertFails(getDoc(doc(anonymousDb, "users/alice/customers/customer1")));
  await assertFails(getDoc(doc(otherDb, "users/alice/customers/customer1")));
});

test("other users cannot create or update another user's customer", async () => {
  const ownerDb = googleUser("alice");
  const otherDb = googleUser("bob");
  const path = "users/alice/customers/customer1";

  await assertSucceeds(setDoc(doc(ownerDb, path), customerData()));
  await assertFails(setDoc(doc(otherDb, "users/alice/customers/customer2"), customerData()));
  await assertFails(updateDoc(doc(otherDb, path), {
    name: "Changed",
    updatedAt: serverTimestamp(),
  }));
});

test("customer validation rejects missing or extra fields", async () => {
  const db = googleUser("alice");

  await assertFails(setDoc(doc(db, "users/alice/customers/bad1"), {
    name: "",
    phone: "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }));

  await assertFails(setDoc(doc(db, "users/alice/customers/bad2"), {
    ...customerData(),
    extra: true,
  }));
});

test("customer deletion is denied", async () => {
  const db = googleUser("alice");
  const ref = doc(db, "users/alice/customers/customer1");

  await assertSucceeds(setDoc(ref, customerData()));
  await assertFails(deleteDoc(ref));
});

test("owner can create, update and delete a transaction", async () => {
  const db = googleUser("alice");
  const ref = doc(db, "users/alice/transactions/transaction1");

  await assertSucceeds(setDoc(ref, transactionData()));
  await assertSucceeds(getDoc(ref));
  await assertSucceeds(updateDoc(ref, {
    description: "Updated test record",
    updatedAt: serverTimestamp(),
  }));
  await assertSucceeds(deleteDoc(ref));
});

test("other users cannot read or delete a transaction", async () => {
  const ownerDb = googleUser("alice");
  const otherDb = googleUser("bob");
  const path = "users/alice/transactions/transaction1";

  await assertSucceeds(setDoc(doc(ownerDb, path), transactionData()));
  await assertFails(getDoc(doc(otherDb, path)));
  await assertFails(deleteDoc(doc(otherDb, path)));
});

test("transaction amount and type are validated", async () => {
  const db = googleUser("alice");

  await assertFails(setDoc(doc(db, "users/alice/transactions/bad1"), {
    ...transactionData(),
    amountPaise: -100,
  }));

  await assertFails(setDoc(doc(db, "users/alice/transactions/bad2"), {
    ...transactionData(),
    type: "unknown",
  }));
});

test("loan transaction requires an existing customer", async () => {
  const db = googleUser("alice");
  const transactionRef = doc(db, "users/alice/transactions/loan1");

  await assertFails(setDoc(transactionRef, {
    ...transactionData(),
    type: "loan_given",
    customerId: "customer1",
  }));

  await assertSucceeds(
    setDoc(doc(db, "users/alice/customers/customer1"), customerData())
  );

  await assertSucceeds(setDoc(transactionRef, {
    ...transactionData(),
    type: "loan_given",
    customerId: "customer1",
  }));
});

test("non-Google authentication is denied", async () => {
  const db = environment.authenticatedContext("alice", {
    firebase: { sign_in_provider: "password" },
  }).firestore();

  await assertFails(getDoc(doc(db, "users/alice/customers/customer1")));
});