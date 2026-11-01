import { useEffect, useState } from "react";
import { METHODS } from "../money/pricing.js";

/* amount + payment method + "Mark paid". onPay({ amount, method }) */
export default function PayControl({ amount, onPay, label = "Mark paid" }) {
  const [amt, setAmt] = useState(amount);
  const [method, setMethod] = useState("Cash");
  const [busy, setBusy] = useState(false);
  useEffect(() => setAmt(amount), [amount]);
  return (
    <span className="cq-row" style={{ flexWrap: "nowrap", gap: 6 }}>
      <input
        type="number"
        min={0}
        step="0.01"
        value={amt}
        onChange={(e) => setAmt(e.target.value)}
        style={{ width: 100 }}
        aria-label="Amount"
      />
      <select
        value={method}
        onChange={(e) => setMethod(e.target.value)}
        aria-label="Payment method"
        style={{ width: 100 }}
      >
        {METHODS.map((m) => (
          <option key={m}>{m}</option>
        ))}
      </select>
      <button
        className="small on"
        disabled={busy || !(Number(amt) > 0)}
        onClick={async () => {
          setBusy(true);
          await onPay({ amount: Number(amt), method });
          setBusy(false);
        }}
      >
        {label}
      </button>
    </span>
  );
}
