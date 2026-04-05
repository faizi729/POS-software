import { Types } from "mongoose";

import { connectToDatabase } from "@/lib/db/connect";
import { ItemAddon, ItemAddonGroup, ItemVariant, MenuCategory, MenuItem, Order, Payment, Restaurant } from "@/models";
import { derivePaymentStatus } from "@/server/services/payment-status";

type CategoryInput = {
  restaurantId: string;
  name: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
};

type OrderInput = {
  restaurantId: string;
  orderNumber: string;
  channel: string;
  type: string;
  status: string;
  tableNo?: string;
  tokenNumber?: number;
  customer: {
    name?: string;
    phone?: string;
  };
  items: Array<{
    menuItemId: string;
    nameSnapshot: string;
    priceSnapshot: number;
    quantity: number;
    notes?: string;
    lineTotal: number;
  }>;
  pricing: {
    subtotal: number;
    tax: number;
    serviceCharge: number;
    discount: number;
    grandTotal: number;
  };
  paymentStatus: string;
  createdBy: string;
};

type MenuItemInput = {
  restaurantId: string;
  categoryId: string;
  name: string;
  slug: string;
  sku?: string;
  description?: string;
  imageUrl?: string;
  price: number;
  taxRate: number;
  isAvailable: boolean;
  isActive: boolean;
  tags: string[];
  prepStation?: string;
  sortOrder: number;
};

function toId(value: string) {
  return new Types.ObjectId(value);
}

function serializeCategory(category: any) {
  return {
    id: category._id.toString(),
    restaurantId: category.restaurantId.toString(),
    name: category.name,
    slug: category.slug,
    sortOrder: category.sortOrder,
    isActive: category.isActive
  };
}

function serializeMenuItem(item: any) {
  return {
    id: item._id.toString(),
    restaurantId: item.restaurantId.toString(),
    categoryId: item.categoryId.toString(),
    name: item.name,
    slug: item.slug,
    sku: item.sku,
    description: item.description,
    imageUrl: item.imageUrl,
    pricingMode: item.pricingMode ?? "base",
    price: item.price,
    taxRate: item.taxRate,
    isAvailable: item.isAvailable,
    isActive: item.isActive,
    tags: item.tags,
    prepStation: item.prepStation,
    sortOrder: item.sortOrder
  };
}

function serializeVariant(variant: any) {
  return {
    id: variant._id.toString(),
    itemId: variant.itemId.toString(),
    groupName: variant.groupName,
    optionName: variant.optionName,
    variantType: variant.variantType,
    priceDelta: variant.priceDelta ?? 0,
    absolutePrice: variant.absolutePrice,
    sortOrder: variant.sortOrder ?? 0,
    isDefault: Boolean(variant.isDefault),
    isActive: Boolean(variant.isActive)
  };
}

function serializeAddonGroup(group: any) {
  return {
    id: group._id.toString(),
    itemId: group.itemId.toString(),
    name: group.name,
    selectionType: group.selectionType,
    minSelect: group.minSelect ?? 0,
    maxSelect: group.maxSelect ?? 1,
    required: Boolean(group.required),
    sortOrder: group.sortOrder ?? 0,
    isActive: Boolean(group.isActive)
  };
}

function serializeAddon(addon: any) {
  return {
    id: addon._id.toString(),
    itemId: addon.itemId.toString(),
    addonGroupId: addon.addonGroupId.toString(),
    name: addon.name,
    price: addon.price ?? 0,
    sortOrder: addon.sortOrder ?? 0,
    isActive: Boolean(addon.isActive)
  };
}

function serializeOrder(order: any) {
  return {
    id: order._id.toString(),
    restaurantId: order.restaurantId.toString(),
    orderNumber: order.orderNumber,
    tokenNumber: order.tokenNumber ?? 0,
    channel: order.channel,
    type: order.type,
    status: order.status,
    tableNo: order.tableNo ?? "",
    customer: {
      name: order.customer?.name ?? "",
      phone: order.customer?.phone ?? ""
    },
    items: order.items.map((item: any) => ({
      id: item._id?.toString(),
      menuItemId: item.menuItemId.toString(),
      nameSnapshot: item.nameSnapshot,
      priceSnapshot: item.priceSnapshot,
      quantity: item.quantity,
      notes: item.notes,
      lineTotal: item.lineTotal
    })),
    pricing: order.pricing,
    paymentStatus: order.paymentStatus,
    createdBy: order.createdBy.toString(),
    paidAt: order.paidAt?.toISOString(),
    completedAt: order.completedAt?.toISOString(),
    createdAt: order.createdAt?.toISOString(),
    updatedAt: order.updatedAt?.toISOString()
  };
}

function serializePayment(payment: any) {
  return {
    id: payment._id.toString(),
    restaurantId: payment.restaurantId.toString(),
    orderId: payment.orderId.toString(),
    amount: payment.amount,
    method: payment.method,
    status: payment.status,
    reference: payment.reference,
    receivedBy: payment.receivedBy.toString(),
    paidAt: payment.paidAt?.toISOString(),
    createdAt: payment.createdAt?.toISOString(),
    updatedAt: payment.updatedAt?.toISOString()
  };
}

export async function getRestaurantBundle(restaurantId: string) {
  await connectToDatabase();

  const restaurantObjectId = toId(restaurantId);

  const [restaurant, categories, menuItems, variants, addonGroups, addons, orders, payments] =
    await Promise.all([
    Restaurant.findById(restaurantObjectId).lean(),
    MenuCategory.find({ restaurantId: restaurantObjectId, isActive: true })
      .sort({ sortOrder: 1 })
      .lean(),
    MenuItem.find({ restaurantId: restaurantObjectId, isActive: true })
      .sort({ sortOrder: 1, name: 1 })
      .lean(),
    ItemVariant.find({ restaurantId: restaurantObjectId, isActive: true })
      .sort({ sortOrder: 1, optionName: 1 })
      .lean(),
    ItemAddonGroup.find({ restaurantId: restaurantObjectId, isActive: true })
      .sort({ sortOrder: 1, name: 1 })
      .lean(),
    ItemAddon.find({ restaurantId: restaurantObjectId, isActive: true })
      .sort({ sortOrder: 1, name: 1 })
      .lean(),
    Order.find({ restaurantId: restaurantObjectId }).sort({ createdAt: -1 }).lean(),
    Payment.find({ restaurantId: restaurantObjectId }).sort({ paidAt: -1, createdAt: -1 }).lean()
  ]);

  const serializedItems = menuItems.map(serializeMenuItem);
  const serializedVariants = variants.map(serializeVariant);
  const serializedAddonGroups = addonGroups.map(serializeAddonGroup);
  const serializedAddons = addons.map(serializeAddon);

  const variantsByItem = new Map<string, ReturnType<typeof serializeVariant>[]>();
  for (const variant of serializedVariants) {
    variantsByItem.set(variant.itemId, [...(variantsByItem.get(variant.itemId) ?? []), variant]);
  }

  const addonsByGroup = new Map<string, ReturnType<typeof serializeAddon>[]>();
  for (const addon of serializedAddons) {
    addonsByGroup.set(addon.addonGroupId, [...(addonsByGroup.get(addon.addonGroupId) ?? []), addon]);
  }

  const addonGroupsByItem = new Map<
    string,
    Array<ReturnType<typeof serializeAddonGroup> & { addons: ReturnType<typeof serializeAddon>[] }>
  >();
  for (const group of serializedAddonGroups) {
    addonGroupsByItem.set(group.itemId, [
      ...(addonGroupsByItem.get(group.itemId) ?? []),
      { ...group, addons: addonsByGroup.get(group.id) ?? [] }
    ]);
  }

  return {
    restaurant: restaurant
      ? {
          id: restaurant._id.toString(),
          name: restaurant.name,
          slug: restaurant.slug,
          timezone: restaurant.timezone,
          currency: restaurant.currency,
          status: restaurant.status,
          contact: {
            phone: restaurant.contact?.phone ?? "",
            email: restaurant.contact?.email ?? "",
            address: restaurant.contact?.address ?? ""
          },
          settings: {
            taxMode: restaurant.settings?.taxMode ?? "exclusive",
            gstEnabled: (restaurant.settings?.gstEnabled ?? true) === true,
            gstRatePercent: Number(restaurant.settings?.gstRatePercent ?? 5),
            gstin: restaurant.settings?.gstin ?? "",
            orderPrefix: restaurant.settings?.orderPrefix ?? "POS",
            serviceChargeEnabled: restaurant.settings?.serviceChargeEnabled ?? false
          }
        }
      : null,
    categories: categories.map(serializeCategory),
    menuItems: serializedItems.map((item) => ({
      ...item,
      variants: variantsByItem.get(item.id) ?? [],
      addonGroups: addonGroupsByItem.get(item.id) ?? []
    })),
    orders: orders.map(serializeOrder),
    payments: payments.map(serializePayment)
  };
}

export async function createMenuItem(
  input: MenuItemInput
) {
  await connectToDatabase();

  const count = await MenuItem.countDocuments({
    restaurantId: toId(input.restaurantId),
    categoryId: toId(input.categoryId)
  });

  const item = await MenuItem.create({
    restaurantId: toId(input.restaurantId),
    categoryId: toId(input.categoryId),
    name: input.name,
    slug: input.slug,
    sku: input.sku?.trim() || undefined,
    description: input.description,
    imageUrl: input.imageUrl,
    price: input.price,
    taxRate: input.taxRate,
    isAvailable: input.isAvailable,
    isActive: input.isActive,
    tags: input.tags,
    prepStation: input.prepStation,
    sortOrder: count + 1
  });

  return serializeMenuItem(item.toObject());
}

export async function updateMenuItemAvailability(id: string, restaurantId: string) {
  await connectToDatabase();

  const item = await MenuItem.findOne({
    _id: toId(id),
    restaurantId: toId(restaurantId)
  });

  if (!item) {
    throw new Error("Menu item not found.");
  }

  item.isAvailable = !item.isAvailable;
  await item.save();

  return serializeMenuItem(item.toObject());
}

export async function updateMenuItem(id: string, input: MenuItemInput) {
  await connectToDatabase();

  const item = await MenuItem.findOne({
    _id: toId(id),
    restaurantId: toId(input.restaurantId)
  });

  if (!item) {
    throw new Error("Menu item not found.");
  }

  item.categoryId = toId(input.categoryId);
  item.name = input.name;
  item.slug = input.slug;
  item.sku = input.sku?.trim() || undefined;
  item.description = input.description;
  item.imageUrl = input.imageUrl;
  item.price = input.price;
  item.taxRate = input.taxRate;
  item.isAvailable = input.isAvailable;
  item.isActive = input.isActive;
  item.tags = input.tags;
  item.prepStation = input.prepStation;
  await item.save();

  return serializeMenuItem(item.toObject());
}

export async function deleteMenuItem(id: string, restaurantId: string) {
  await connectToDatabase();

  const deleted = await MenuItem.findOneAndDelete({
    _id: toId(id),
    restaurantId: toId(restaurantId)
  });

  if (!deleted) {
    throw new Error("Menu item not found.");
  }

  return { id };
}

export async function createCategory(
  input: CategoryInput
) {
  await connectToDatabase();

  const category = await MenuCategory.create({
    restaurantId: toId(input.restaurantId),
    name: input.name,
    slug: input.slug,
    sortOrder: input.sortOrder,
    isActive: input.isActive
  });

  return serializeCategory(category.toObject());
}

export async function updateCategory(id: string, input: CategoryInput) {
  await connectToDatabase();

  const category = await MenuCategory.findOne({
    _id: toId(id),
    restaurantId: toId(input.restaurantId)
  });

  if (!category) {
    throw new Error("Category not found.");
  }

  category.name = input.name;
  category.slug = input.slug;
  category.sortOrder = input.sortOrder;
  category.isActive = input.isActive;
  await category.save();

  return serializeCategory(category.toObject());
}

export async function deleteCategory(id: string, restaurantId: string) {
  await connectToDatabase();

  const linkedItems = await MenuItem.countDocuments({
    restaurantId: toId(restaurantId),
    categoryId: toId(id),
    isActive: true
  });

  if (linkedItems > 0) {
    throw new Error("Cannot delete a category that still has active menu items.");
  }

  const deleted = await MenuCategory.findOneAndDelete({
    _id: toId(id),
    restaurantId: toId(restaurantId)
  });

  if (!deleted) {
    throw new Error("Category not found.");
  }

  return { id };
}

export async function createOrder(input: OrderInput) {
  await connectToDatabase();

  const order = await Order.create({
    restaurantId: toId(input.restaurantId),
    orderNumber: input.orderNumber,
    tokenNumber: input.tokenNumber ?? 0,
    channel: input.channel,
    type: input.type,
    status: input.status,
    tableNo: input.tableNo,
    customer: input.customer,
    items: input.items.map((item) => ({
      menuItemId: toId(item.menuItemId),
      nameSnapshot: item.nameSnapshot,
      priceSnapshot: item.priceSnapshot,
      quantity: item.quantity,
      notes: item.notes,
      lineTotal: item.lineTotal
    })),
    pricing: input.pricing,
    paymentStatus: input.paymentStatus,
    createdBy: toId(input.createdBy)
  });

  return serializeOrder(order.toObject());
}

export async function getOrderById(id: string, restaurantId: string) {
  await connectToDatabase();

  const order = await Order.findOne({
    _id: toId(id),
    restaurantId: toId(restaurantId)
  }).lean();

  if (!order) {
    throw new Error("Order not found.");
  }

  return serializeOrder(order);
}

export async function updateOrder(
  id: string,
  restaurantId: string,
  input: Partial<Pick<OrderInput, "status" | "paymentStatus" | "tableNo" | "type" | "customer">>
) {
  await connectToDatabase();

  const order = await Order.findOne({
    _id: toId(id),
    restaurantId: toId(restaurantId)
  });

  if (!order) {
    throw new Error("Order not found.");
  }

  if (input.status) {
    order.status = input.status as any;
    if (input.status === "completed") {
      order.completedAt = new Date();
    }
  }

  if (input.paymentStatus) {
    order.paymentStatus = input.paymentStatus as any;
    if (input.paymentStatus === "paid") {
      order.paidAt = new Date();
    }
    if (input.paymentStatus !== "paid") {
      order.paidAt = undefined;
    }
  }

  if (typeof input.tableNo !== "undefined") {
    order.tableNo = input.tableNo;
  }

  if (input.type) {
    order.type = input.type as any;
  }

  if (input.customer) {
    order.customer = {
      name: input.customer.name ?? order.customer?.name,
      phone: input.customer.phone ?? order.customer?.phone
    };
  }

  await order.save();

  return serializeOrder(order.toObject());
}

export async function deleteOrder(id: string, restaurantId: string) {
  await connectToDatabase();

  const paymentCount = await Payment.countDocuments({
    restaurantId: toId(restaurantId),
    orderId: toId(id),
    status: "completed"
  });

  if (paymentCount > 0) {
    throw new Error("Cannot delete an order that already has completed payments.");
  }

  const deleted = await Order.findOneAndDelete({
    _id: toId(id),
    restaurantId: toId(restaurantId)
  });

  if (!deleted) {
    throw new Error("Order not found.");
  }

  await Payment.deleteMany({
    restaurantId: toId(restaurantId),
    orderId: toId(id)
  });

  return { id };
}

export async function updateOrderStatus(id: string, restaurantId: string, status: string) {
  await connectToDatabase();

  const order = await Order.findOne({
    _id: toId(id),
    restaurantId: toId(restaurantId)
  });

  if (!order) {
    throw new Error("Order not found.");
  }

  order.status = status as any;

  if (status === "completed") {
    order.completedAt = new Date();
  }

  await order.save();

  return serializeOrder(order.toObject());
}

export async function createPayment(input: {
  restaurantId: string;
  orderId: string;
  amount: number;
  method: string;
  status: string;
  reference?: string;
  receivedBy: string;
  paidAt: string;
}) {
  await connectToDatabase();

  const payment = await Payment.create({
    restaurantId: toId(input.restaurantId),
    orderId: toId(input.orderId),
    amount: input.amount,
    method: input.method,
    status: input.status,
    reference: input.reference,
    receivedBy: toId(input.receivedBy),
    paidAt: new Date(input.paidAt)
  });

  const [order, completedPayments] = await Promise.all([
    Order.findOne({
      _id: toId(input.orderId),
      restaurantId: toId(input.restaurantId)
    }),
    Payment.find({
      orderId: toId(input.orderId),
      restaurantId: toId(input.restaurantId),
      status: "completed"
    }).lean()
  ]);

  if (order) {
    const totalPaid = completedPayments.reduce((sum, item) => sum + item.amount, 0);
    const grandTotal = order.pricing?.grandTotal ?? 0;
    order.paymentStatus = derivePaymentStatus(totalPaid, grandTotal);

    if (order.paymentStatus === "paid") {
      order.paidAt = new Date(input.paidAt);
    }

    await order.save();
  }

  return serializePayment(payment.toObject());
}
