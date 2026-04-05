export function generateOrderNumber(prefix = "POS") {
  const stamp = Date.now().toString().slice(-6);
  return `${prefix}-${stamp}`;
}
