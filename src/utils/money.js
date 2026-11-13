// Hisably stores INR amounts as whole paise.
// Example: ₹12.50 is stored as 1250 paise.

const MAX_PAISE = 1_000_000_000_000;

export function parseRupeesToPaise(value) {
  const text = String(value).trim();

  // Accept positive amounts with at most two decimal places.
  if (!/^\d+(\.\d{1,2})?$/.test(text)) {
    throw new Error(
      "Enter a valid amount with no more than two decimal places."
    );
  }

  const [rupeesText, decimalText = ""] = text.split(".");
  const rupees = Number(rupeesText);
  const paise = Number(decimalText.padEnd(2, "0"));
  const total = rupees * 100 + paise;

  if (!Number.isSafeInteger(total) || total <= 0 || total > MAX_PAISE) {
    throw new Error("Enter an amount greater than zero and within the limit.");
  }

  return total;
}

export function formatPaise(amount) {
  if (!Number.isSafeInteger(amount)) {
    return "—";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount / 100);
}