type PricingInputItem = {
  price: number;
  quantity: number;
};

export function calculateOrderPricing(items: PricingInputItem[], taxRate = 0) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = Number((subtotal * taxRate).toFixed(2));
  const serviceCharge = 0;
  const discount = 0;
  const grandTotal = Number((subtotal + tax + serviceCharge - discount).toFixed(2));

  return {
    subtotal,
    tax,
    serviceCharge,
    discount,
    grandTotal
  };
}
