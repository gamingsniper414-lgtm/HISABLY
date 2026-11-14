import test from "node:test";
import assert from "node:assert/strict";

import {
  TRANSACTION_TYPES,
  getTransactionEffects,
  calculateCustomerBalance,
  getBalanceStatus,
} from "../utils/ledger.js";

const cases = [
  [TRANSACTION_TYPES.LOAN_GIVEN, -10000, 10000],
  [TRANSACTION_TYPES.LOAN_RECEIVED, 10000, -10000],
  [TRANSACTION_TYPES.REPAYMENT_RECEIVED, 10000, -10000],
  [TRANSACTION_TYPES.REPAYMENT_GIVEN, -10000, 10000],
  [TRANSACTION_TYPES.CREDIT_SALE, 0, 10000],
  [TRANSACTION_TYPES.CREDIT_PURCHASE, 0, -10000],
  [TRANSACTION_TYPES.CASH_INCOME, 10000, 0],
  [TRANSACTION_TYPES.CASH_EXPENSE, -10000, 0],
];

for (const [type, cashPaise, customerBalancePaise] of cases) {
  test(`${type} has the correct effects`, () => {
    assert.deepEqual(
      getTransactionEffects({ type, amountPaise: 10000 }),
      { cashPaise, customerBalancePaise }
    );
  });
}

test("partial repayment reduces a customer's balance", () => {
  const transactions = [
    { customerId: "alice", type: TRANSACTION_TYPES.LOAN_GIVEN, amountPaise: 100000 },
    { customerId: "alice", type: TRANSACTION_TYPES.REPAYMENT_RECEIVED, amountPaise: 40000 },
  ];

  assert.equal(calculateCustomerBalance(transactions, "alice"), 60000);
});

test("full repayment settles the balance", () => {
  const transactions = [
    { customerId: "alice", type: TRANSACTION_TYPES.LOAN_GIVEN, amountPaise: 100000 },
    { customerId: "alice", type: TRANSACTION_TYPES.REPAYMENT_RECEIVED, amountPaise: 100000 },
  ];

  assert.equal(calculateCustomerBalance(transactions, "alice"), 0);
});

test("borrowing and repayment give the correct payable balance", () => {
  const transactions = [
    { customerId: "alice", type: TRANSACTION_TYPES.LOAN_RECEIVED, amountPaise: 100000 },
    { customerId: "alice", type: TRANSACTION_TYPES.REPAYMENT_GIVEN, amountPaise: 40000 },
  ];

  assert.equal(calculateCustomerBalance(transactions, "alice"), -60000);
});

test("transactions for other customers are excluded", () => {
  const transactions = [
    { customerId: "alice", type: TRANSACTION_TYPES.CREDIT_SALE, amountPaise: 50000 },
    { customerId: "bob", type: TRANSACTION_TYPES.CREDIT_SALE, amountPaise: 90000 },
  ];

  assert.equal(calculateCustomerBalance(transactions, "alice"), 50000);
  assert.equal(calculateCustomerBalance(transactions, "bob"), 90000);
});

test("cash income and expenses do not change customer balances", () => {
  const transactions = [
    { customerId: "alice", type: TRANSACTION_TYPES.CASH_INCOME, amountPaise: 50000 },
    { customerId: "alice", type: TRANSACTION_TYPES.CASH_EXPENSE, amountPaise: 20000 },
  ];

  assert.equal(calculateCustomerBalance(transactions, "alice"), 0);
});

test("balance statuses match their signs", () => {
  assert.equal(getBalanceStatus(1), "receivable");
  assert.equal(getBalanceStatus(-1), "payable");
  assert.equal(getBalanceStatus(0), "settled");
  assert.throws(() => getBalanceStatus(1.5));
});

test("invalid amounts and transaction types are rejected", () => {
  for (const amountPaise of [0, -1, 1.5, NaN, Infinity]) {
    assert.throws(() =>
      getTransactionEffects({
        type: TRANSACTION_TYPES.LOAN_GIVEN,
        amountPaise,
      })
    );
  }

  assert.throws(() =>
    getTransactionEffects({ type: "unknown", amountPaise: 100 })
  );
});

test("a customer ID is required", () => {
  assert.throws(() => calculateCustomerBalance([], ""));
});

test("overflowing customer balances are rejected", () => {
  const transactions = [
    {
      customerId: "alice",
      type: TRANSACTION_TYPES.CREDIT_SALE,
      amountPaise: Number.MAX_SAFE_INTEGER,
    },
    {
      customerId: "alice",
      type: TRANSACTION_TYPES.CREDIT_SALE,
      amountPaise: 1,
    },
  ];

  assert.throws(() => calculateCustomerBalance(transactions, "alice"));
});