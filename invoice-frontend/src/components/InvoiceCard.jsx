import React from "react";

const InvoiceCard = ({ invoice }) => {
  return (
    <div className="invoice-card">
      <h4>{invoice.client}</h4>
      <p>Amount: ₹{invoice.amount}</p>
      <p>Status: {invoice.status}</p>
    </div>
  );
};

export default InvoiceCard;
