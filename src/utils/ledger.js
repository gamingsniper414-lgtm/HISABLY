/*
  HISABLY — LEDGER CALCULATIONS

  All amounts are stored as whole paise.

  Customer balance:
  Positive = the customer owes you.
  Negative = you owe the customer.
  Zero = the balance is settled.

  Each transaction represents one event. For example, a partial
  repayment is recorded as its own transaction, not as an edit
  to the original loan.
*/

export const TRANSACTION_TYPES = {
  LOAN_GIVEN: "loan_given",
  LOAN_RECEIVED: "loan_received",
  REPAYMENT_RECEIVED: "repayment_received",
  REPAYMENT_GIVEN: "repayment_given",
  CREDIT_SALE: "credit_sale",
  CREDIT_PURCHASE: "credit_purchase",
  CASH_INCOME: "cash_income",
  CASH_EXPENSE: "cash_expense",
};

export const TRANSACTION_TYPE_LABELS = {
  [TRANSACTION_TYPES.LOAN_GIVEN]: "Loan given",
  [TRANSACTION_TYPES.LOAN_RECEIVED]: "Loan received",
  [TRANSACTION_TYPES.REPAYMENT_RECEIVED]: "Repayment received",
  [TRANSACTION_TYPES.REPAYMENT_GIVEN]: "Repayment given",
  [TRANSACTION_TYPES.CREDIT_SALE]: "Sale on credit",
  [TRANSACTION_TYPES.CREDIT_PURCHASE]: "Purchase on credit",
  [TRANSACTION_TYPES.CASH_INCOME]: "Cash income",
  [TRANSACTION_TYPES.CASH_EXPENSE]: "Cash expense",
};

const effects = {
  [TRANSACTION_TYPES.LOAN_GIVEN]: {
    cash: -1,
    customer: 1,
  },
  [TRANSACTION_TYPES.LOAN_RECEIVED]: {
    cash: 1,
    customer: -1,
  },
  [TRANSACTION_TYPES.REPAYMENT_RECEIVED]: {
    cash: 1,
    customer: -1,
  },
  [TRANSACTION_TYPES.REPAYMENT_GIVEN]: {
    cash: -1,
    customer: 1,
  },
  [TRANSACTION_TYPES.CREDIT_SALE]: {
    cash: 0,
    customer: 1,
  },
  [TRANSACTION_TYPES.CREDIT_PURCHASE]: {
    cash: 0,
    customer: -1,
  },
  [TRANSACTION_TYPES.CASH_INCOME]: {
    cash: 1,
    customer: 0,
  },
  [TRANSACTION_TYPES.CASH_EXPENSE]: {
    cash: -1,
    customer: 0,
  },
};

export function getTransactionEffects(transaction) {
  const effect = effects[transaction.type];

  if (
    !effect ||
    !Number.isSafeInteger(transaction.amountPaise) ||
    transaction.amountPaise <= 0
  ) {
    throw new Error("Invalid transaction type or amount.");
  }

  return {
    cashPaise: effect.cash * transaction.amountPaise,
    customerBalancePaise: effect.customer * transaction.amountPaise,
  };
}

export function calculateCustomerBalance(transactions, customerId) {
  if (!customerId) {
    throw new Error("A customer ID is required.");
  }

  return transactions
    .filter((transaction) => transaction.customerId === customerId)
    .reduce((balance, transaction) => {
      const { customerBalancePaise } = getTransactionEffects(transaction);
      const nextBalance = balance + customerBalancePaise;

      if (!Number.isSafeInteger(nextBalance)) {
        throw new Error("Customer balance exceeds the supported limit.");
      }

      return nextBalance;
    }, 0);
}

export function getBalanceStatus(balancePaise) {
  if (!Number.isSafeInteger(balancePaise)) {
    throw new Error("Invalid balance.");
  }

  if (balancePaise > 0) return "receivable";
  if (balancePaise < 0) return "payable";
  return "settled";
}