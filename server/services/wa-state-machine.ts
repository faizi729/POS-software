/**
 * WhatsApp conversation state machine.
 *
 * Receives a parsed incoming message and the current session,
 * determines the next state, mutates the cart / session as needed,
 * and sends the appropriate WhatsApp reply.
 *
 * Universal commands (work in ANY state):
 *   "menu"     → restart to START
 *   "cart"     → show cart
 *   "checkout" → jump to checkout
 *   "cancel"   → reset session
 */

import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import { MenuCategory, MenuItem } from "@/models";
import { WA_CONFIG, WA_STATES, WaState } from "@/lib/whatsapp/config";
import {
  sendTextWithConfig,
  sendButtonsWithConfig,
  sendListWithConfig,
} from "@/lib/whatsapp/client";
import { getRestaurantWaConfig } from "@/lib/whatsapp/restaurant-config";
import {
  getOrCreateSessionForRestaurant,
  updateSessionForRestaurant,
  resetSessionForRestaurant,
  type SessionData,
} from "./wa-session-service";
import {
  addToCart,
  formatCartMessage,
  clearCart,
  type Cart,
} from "./wa-cart-service";
import {
  createPaymentLink,
} from "./wa-payment-service";
import {
  createWhatsAppOrder,
} from "./wa-pos-service";

/* ─────── Incoming message shape (parsed by webhook) ─────── */

export type IncomingMessage = {
  from: string; // phone number e.g. "919876543210"
  messageId: string;
  type: "text" | "interactive" | "order" | "unknown";
  text?: string; // for type=text
  buttonReplyId?: string; // for interactive button reply
  listReplyId?: string; // for interactive list reply
  productIds?: string[]; // for catalog product selection
};

/* ─────── Helpers ─────── */

function oid(id: string) {
  return new Types.ObjectId(id);
}

function waRestaurantId() {
  // Current design: a single WA number is bound to a single restaurant (env/config).
  // Multi-tenant WA routing should map incoming phone_number_id -> restaurantId.
  return WA_CONFIG.restaurantId;
}

async function waConfig(restaurantId: string) {
  const cfg = await getRestaurantWaConfig(restaurantId);
  if (!cfg.token || !cfg.phoneNumberId) {
    throw new Error("WhatsApp tenant config missing for this restaurant.");
  }
  return { token: cfg.token, phoneNumberId: cfg.phoneNumberId };
}

const restaurantId = () => WA_CONFIG.restaurantId;

/**
 * Check for universal commands. Returns true if handled.
 */
async function handleUniversalCommand(
  msg: IncomingMessage,
  session: SessionData
): Promise<boolean> {
  const text = msg.text?.trim().toLowerCase();

  if (text === "menu" || text === "start" || text === "hi" || text === "hello") {
    await resetSessionForRestaurant(session.restaurantId || restaurantId(), msg.from);
    await sendWelcome(msg.from);
    return true;
  }

  if (text === "cart") {
    await showCart(msg.from, session);
    return true;
  }

  if (text === "checkout") {
    if (session.cart.items.length === 0) {
      await sendTextWithConfig(await waConfig(session.restaurantId || restaurantId()), msg.from, "Your cart is empty. Browse our menu first! 🍽️");
      await sendWelcome(msg.from);
      return true;
    }
    await updateSessionForRestaurant(session.restaurantId || restaurantId(), msg.from, { state: WA_STATES.CHECKOUT_NAME });
    await sendTextWithConfig(await waConfig(session.restaurantId || restaurantId()), msg.from, "Great! Let's checkout 🧾\n\nWhat is your *name*?");
    return true;
  }

  if (text === "cancel") {
    await resetSessionForRestaurant(session.restaurantId || restaurantId(), msg.from);
    await sendTextWithConfig(
      await waConfig(session.restaurantId || restaurantId()),
      msg.from,
      "Order cancelled. Your cart has been cleared. 🗑️\n\nSend *menu* to start again."
    );
    return true;
  }

  return false;
}

/* ─────── Message builders ─────── */

async function sendWelcome(phone: string) {
  await sendButtonsWithConfig(
    await waConfig(restaurantId()),
    phone,
    "Welcome to our restaurant! 🍽️\n\nHow would you like to order?",
    [
      { id: "btn_browse_catalog", title: "📋 View Menu" },
      { id: "btn_chat_order", title: "💬 Order via Chat" },
    ],
    "Welcome! 👋"
  );
}

async function showCategories(phone: string) {
  await connectToDatabase();

  const categories = await MenuCategory.find({
    restaurantId: oid(restaurantId()),
    isActive: true,
    nodeType: "category",
  })
    .sort({ sortOrder: 1 })
    .select("_id name")
    .lean();

  if (categories.length === 0) {
    await sendTextWithConfig(await waConfig(restaurantId()), phone, "Sorry, no categories available right now. Please try again later.");
    return;
  }

  const rows = categories.map((cat) => ({
    id: `cat_${cat._id.toString()}`,
    title: cat.name.slice(0, 24),
  }));

  await sendListWithConfig(
    await waConfig(restaurantId()),
    phone,
    "Choose a category to browse items 👇",
    "View Categories",
    [{ title: "Menu Categories", rows }],
    "Our Menu"
  );
}

async function showCategoryItems(phone: string, categoryId: string) {
  await connectToDatabase();

  const items = await MenuItem.find({
    restaurantId: oid(restaurantId()),
    categoryId: oid(categoryId),
    isActive: true,
    isAvailable: true,
  })
    .sort({ sortOrder: 1 })
    .select("_id name price description")
    .lean();

  if (items.length === 0) {
    await sendTextWithConfig(await waConfig(restaurantId()), phone, "No items available in this category right now. 😔");
    await showCategories(phone);
    return;
  }

  const rows = items.map((item) => ({
    id: `item_${item._id.toString()}`,
    title: item.name.slice(0, 24),
    description: `₹${item.price}${item.description ? " — " + item.description.slice(0, 50) : ""}`,
  }));

  // List messages allow max 10 rows per section
  const sections = [];
  for (let i = 0; i < rows.length; i += 10) {
    sections.push({
      title: i === 0 ? "Items" : `Items (cont.)`,
      rows: rows.slice(i, i + 10),
    });
  }

  await sendListWithConfig(
    await waConfig(restaurantId()),
    phone,
    "Select an item to add to your cart 🛒",
    "View Items",
    sections,
    "Menu Items"
  );
}

async function showCart(phone: string, session: SessionData) {
  const cartText = formatCartMessage(session.cart);

  if (session.cart.items.length === 0) {
    await sendTextWithConfig(await waConfig(session.restaurantId || restaurantId()), phone, "Your cart is empty. Browse our menu first! 🍽️");
    await sendWelcome(phone);
    return;
  }

  await updateSessionForRestaurant(session.restaurantId || restaurantId(), phone, { state: WA_STATES.CART_VIEW });

  await sendButtonsWithConfig(
    await waConfig(session.restaurantId || restaurantId()),
    phone,
    `🛒 *Your Cart*\n\n${cartText}`,
    [
      { id: "btn_add_more", title: "➕ Add More" },
      { id: "btn_checkout", title: "✅ Checkout" },
      { id: "btn_clear_cart", title: "🗑️ Clear Cart" },
    ],
    "Cart Summary"
  );
}

async function askQuantity(phone: string, itemName: string) {
  await sendButtonsWithConfig(
    await waConfig(restaurantId()),
    phone,
    `How many *${itemName}* would you like to add?`,
    [
      { id: "qty_1", title: "1" },
      { id: "qty_2", title: "2" },
      { id: "qty_3", title: "3" },
    ]
  );
}

async function sendItemAdded(phone: string, itemName: string, qty: number) {
  await sendButtonsWithConfig(
    await waConfig(restaurantId()),
    phone,
    `✅ Added *${qty}× ${itemName}* to your cart!`,
    [
      { id: "btn_add_more", title: "➕ Add More" },
      { id: "btn_view_cart", title: "🛒 View Cart" },
      { id: "btn_checkout", title: "✅ Checkout" },
    ]
  );
}

async function sendPaymentLink(phone: string, session: SessionData) {
  const link = await createPaymentLink({
    amount: session.cart.total,
    description: `Order from WhatsApp — ${session.customerName}`,
    customerName: session.customerName!,
    customerPhone: phone,
  });

  await updateSessionForRestaurant(session.restaurantId || restaurantId(), phone, {
    state: WA_STATES.PAYMENT_PENDING,
    paymentStatus: "pending",
    paymentLinkId: link.id,
    paymentLinkUrl: link.shortUrl,
  });

  await sendTextWithConfig(
    await waConfig(session.restaurantId || restaurantId()),
    phone,
    `💳 *Payment Required*\n\n` +
    `Amount: ₹${session.cart.total}\n\n` +
    `Click below to pay securely:\n${link.shortUrl}\n\n` +
    `We'll confirm your order as soon as payment is received. ⏳`
  );
}

async function sendOrderConfirmation(
  phone: string,
  orderNumber: string,
  tokenNumber: number
) {
  await sendTextWithConfig(
    await waConfig(restaurantId()),
    phone,
    `🎉 *Order Confirmed!*\n\n` +
    `Order: *#${orderNumber}*\n` +
    `Token: *#${tokenNumber}*\n\n` +
    `Estimated time: ~30 mins\n\n` +
    `Thank you for ordering! 🙏\n` +
    `Send *menu* to order again.`
  );
}

async function sendFallback(phone: string) {
  await sendButtonsWithConfig(
    await waConfig(restaurantId()),
    phone,
    "Sorry, I didn't understand that. 😅\n\nPlease choose an option below 👇",
    [
      { id: "btn_browse_catalog", title: "📋 View Menu" },
      { id: "btn_view_cart", title: "🛒 View Cart" },
      { id: "btn_checkout", title: "✅ Checkout" },
    ]
  );
}

/* ─────── Fuzzy item search (fallback for free-text) ─────── */

async function fuzzyFindItem(text: string) {
  await connectToDatabase();
  const regex = new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

  return MenuItem.findOne({
    restaurantId: oid(restaurantId()),
    isActive: true,
    isAvailable: true,
    name: regex,
  })
    .select("_id name price")
    .lean();
}

/* ─────── State handlers ─────── */

async function handleStart(msg: IncomingMessage, session: SessionData) {
  const btnId = msg.buttonReplyId;

  if (btnId === "btn_browse_catalog" || btnId === "btn_chat_order") {
    await updateSessionForRestaurant(session.restaurantId || restaurantId(), msg.from, { state: WA_STATES.BROWSING });
    await showCategories(msg.from);
    return;
  }

  // Default: show welcome
  await sendWelcome(msg.from);
}

async function handleBrowsing(msg: IncomingMessage, session: SessionData) {
  // Handle catalog product selection
  if (msg.productIds && msg.productIds.length > 0) {
    const productId = msg.productIds[0];
    await connectToDatabase();
    const item = await MenuItem.findOne({
      _id: oid(productId),
      restaurantId: oid(waRestaurantId()),
      isActive: true,
      isAvailable: true
    })
      .select("_id name price")
      .lean();

    if (item) {
      await updateSessionForRestaurant(session.restaurantId || restaurantId(), msg.from, {
        state: WA_STATES.ADDING_QUANTITY,
        selectedItemId: item._id.toString(),
      });
      await askQuantity(msg.from, item.name);
      return;
    }
  }

  // Handle category selection from list
  const listId = msg.listReplyId;
  if (listId?.startsWith("cat_")) {
    const categoryId = listId.replace("cat_", "");
    await updateSessionForRestaurant(session.restaurantId || restaurantId(), msg.from, {
      state: WA_STATES.BROWSING,
      selectedCategoryId: categoryId,
    });
    await showCategoryItems(msg.from, categoryId);
    return;
  }

  // Handle item selection from list
  if (listId?.startsWith("item_")) {
    const itemId = listId.replace("item_", "");
    await connectToDatabase();
    const item = await MenuItem.findOne({
      _id: oid(itemId),
      restaurantId: oid(waRestaurantId()),
      isActive: true,
      isAvailable: true
    })
      .select("_id name price")
      .lean();

    if (item) {
      await updateSessionForRestaurant(session.restaurantId || restaurantId(), msg.from, {
        state: WA_STATES.ADDING_QUANTITY,
        selectedItemId: item._id.toString(),
      });
      await askQuantity(msg.from, item.name);
      return;
    }
  }

  // Handle button replies
  const btnId = msg.buttonReplyId;
  if (btnId === "btn_add_more" || btnId === "btn_browse_catalog" || btnId === "btn_chat_order") {
    await showCategories(msg.from);
    return;
  }

  // Fuzzy text search for item name
  if (msg.text) {
    const found = await fuzzyFindItem(msg.text);
    if (found) {
      await updateSessionForRestaurant(session.restaurantId || restaurantId(), msg.from, {
        state: WA_STATES.ADDING_QUANTITY,
        selectedItemId: found._id.toString(),
      });
      await askQuantity(msg.from, found.name);
      return;
    }
  }

  // Fallback: show categories again
  await showCategories(msg.from);
}

async function handleAddingQuantity(msg: IncomingMessage, session: SessionData) {
  if (!session.selectedItemId) {
    await updateSessionForRestaurant(session.restaurantId || restaurantId(), msg.from, { state: WA_STATES.BROWSING });
    await showCategories(msg.from);
    return;
  }

  // Parse quantity from button or text
  let qty = 0;
  const btnId = msg.buttonReplyId;

  if (btnId?.startsWith("qty_")) {
    qty = parseInt(btnId.replace("qty_", ""), 10);
  } else if (msg.text) {
    const parsed = parseInt(msg.text.trim(), 10);
    if (!isNaN(parsed) && parsed > 0 && parsed <= 99) {
      qty = parsed;
    }
  }

  if (qty <= 0) {
    await sendTextWithConfig(await waConfig(session.restaurantId || restaurantId()), msg.from, "Please enter a valid quantity (1-99) or tap a button above.");
    return;
  }

  // Fetch the item
  await connectToDatabase();
  const item = await MenuItem.findOne({
    _id: oid(session.selectedItemId),
    restaurantId: oid(waRestaurantId()),
    isActive: true
  })
    .select("_id name price")
    .lean();

  if (!item) {
    await sendTextWithConfig(await waConfig(session.restaurantId || restaurantId()), msg.from, "Sorry, this item is no longer available. 😔");
    await updateSessionForRestaurant(session.restaurantId || restaurantId(), msg.from, { state: WA_STATES.BROWSING });
    await showCategories(msg.from);
    return;
  }

  // Add to cart
  const newCart = addToCart(session.cart, {
    menuItemId: item._id.toString(),
    name: item.name,
    price: item.price,
  }, qty);

  await updateSessionForRestaurant(session.restaurantId || restaurantId(), msg.from, {
    state: WA_STATES.ITEM_SELECTED,
    cart: newCart,
    selectedItemId: null,
  });

  await sendItemAdded(msg.from, item.name, qty);
}

async function handleItemSelected(msg: IncomingMessage, session: SessionData) {
  const btnId = msg.buttonReplyId;

  if (btnId === "btn_add_more" || btnId === "btn_browse_catalog") {
    await updateSessionForRestaurant(session.restaurantId || restaurantId(), msg.from, { state: WA_STATES.BROWSING });
    await showCategories(msg.from);
    return;
  }

  if (btnId === "btn_view_cart") {
    await showCart(msg.from, session);
    return;
  }

  if (btnId === "btn_checkout") {
    if (session.cart.items.length === 0) {
      await sendTextWithConfig(await waConfig(session.restaurantId || restaurantId()), msg.from, "Your cart is empty! Add some items first. 🍽️");
      return;
    }
    await updateSessionForRestaurant(session.restaurantId || restaurantId(), msg.from, { state: WA_STATES.CHECKOUT_NAME });
    await sendTextWithConfig(await waConfig(session.restaurantId || restaurantId()), msg.from, "Great! Let's checkout 🧾\n\nWhat is your *name*?");
    return;
  }

  // Handle catalog product selection (user picked an item from catalog)
  if (msg.productIds && msg.productIds.length > 0) {
    const productId = msg.productIds[0];
    await connectToDatabase();
    const item = await MenuItem.findOne({
      _id: oid(productId),
      restaurantId: oid(waRestaurantId()),
      isActive: true
    })
      .select("_id name price")
      .lean();

    if (item) {
      await updateSessionForRestaurant(session.restaurantId || restaurantId(), msg.from, {
        state: WA_STATES.ADDING_QUANTITY,
        selectedItemId: item._id.toString(),
      });
      await askQuantity(msg.from, item.name);
      return;
    }
  }

  // Default: send fallback
  await sendFallback(msg.from);
}

async function handleCartView(msg: IncomingMessage, session: SessionData) {
  const btnId = msg.buttonReplyId;

  if (btnId === "btn_add_more") {
    await updateSessionForRestaurant(session.restaurantId || restaurantId(), msg.from, { state: WA_STATES.BROWSING });
    await showCategories(msg.from);
    return;
  }

  if (btnId === "btn_checkout") {
    if (session.cart.items.length === 0) {
      await sendTextWithConfig(await waConfig(session.restaurantId || restaurantId()), msg.from, "Your cart is empty! Add some items first. 🍽️");
      return;
    }
    await updateSessionForRestaurant(session.restaurantId || restaurantId(), msg.from, { state: WA_STATES.CHECKOUT_NAME });
    await sendTextWithConfig(await waConfig(session.restaurantId || restaurantId()), msg.from, "Great! Let's checkout 🧾\n\nWhat is your *name*?");
    return;
  }

  if (btnId === "btn_clear_cart") {
    await updateSessionForRestaurant(session.restaurantId || restaurantId(), msg.from, {
      state: WA_STATES.START,
      cart: clearCart(),
    });
    await sendTextWithConfig(await waConfig(session.restaurantId || restaurantId()), msg.from, "Cart cleared! 🗑️");
    await sendWelcome(msg.from);
    return;
  }

  // If user sends a catalog product while viewing cart, handle it
  if (msg.productIds && msg.productIds.length > 0) {
    const productId = msg.productIds[0];
    await connectToDatabase();
    const item = await MenuItem.findOne({
      _id: oid(productId),
      restaurantId: oid(waRestaurantId()),
      isActive: true
    })
      .select("_id name price")
      .lean();

    if (item) {
      await updateSessionForRestaurant(session.restaurantId || restaurantId(), msg.from, {
        state: WA_STATES.ADDING_QUANTITY,
        selectedItemId: item._id.toString(),
      });
      await askQuantity(msg.from, item.name);
      return;
    }
  }

  await showCart(msg.from, session);
}

async function handleCheckoutName(msg: IncomingMessage, session: SessionData) {
  const name = msg.text?.trim();

  if (!name || name.length < 2) {
    await sendTextWithConfig(await waConfig(session.restaurantId || restaurantId()), msg.from, "Please enter your name (at least 2 characters).");
    return;
  }

  await updateSessionForRestaurant(session.restaurantId || restaurantId(), msg.from, {
    state: WA_STATES.CHECKOUT_ADDRESS,
    customerName: name,
  });

  await sendButtonsWithConfig(
    await waConfig(session.restaurantId || restaurantId()),
    msg.from,
    `Thanks, *${name}*! 😊\n\nWould you like delivery or pickup?`,
    [
      { id: "type_takeaway", title: "🏃 Pickup" },
      { id: "type_delivery", title: "🛵 Delivery" },
    ]
  );
}

async function handleCheckoutAddress(msg: IncomingMessage, session: SessionData) {
  const btnId = msg.buttonReplyId;

  if (btnId === "type_takeaway") {
    await updateSessionForRestaurant(session.restaurantId || restaurantId(), msg.from, {
      orderType: "takeaway",
    });
    // Skip address, go straight to payment
    const updatedSession = await updateSessionForRestaurant(session.restaurantId || restaurantId(), msg.from, {
      state: WA_STATES.PAYMENT_PENDING,
    });
    const cartText = formatCartMessage(updatedSession.cart);

    await sendButtonsWithConfig(
      await waConfig(session.restaurantId || restaurantId()),
      msg.from,
      `📋 *Order Summary*\n\n${cartText}\n\nName: *${updatedSession.customerName}*\nType: *Pickup*`,
      [
        { id: "btn_confirm_pay", title: "💳 Pay Now" },
        { id: "btn_cancel_order", title: "❌ Cancel" },
      ],
      "Confirm Order"
    );
    return;
  }

  if (btnId === "type_delivery") {
    await updateSessionForRestaurant(session.restaurantId || restaurantId(), msg.from, { orderType: "takeaway" }); // still takeaway in POS
    await sendTextWithConfig(
      await waConfig(session.restaurantId || restaurantId()),
      msg.from,
      "Please share your *delivery address*: 📍"
    );
    return;
  }

  // If text, assume it's the address
  const address = msg.text?.trim();
  if (address && address.length >= 5) {
    const updatedSession = await updateSessionForRestaurant(session.restaurantId || restaurantId(), msg.from, {
      customerAddress: address,
      state: WA_STATES.PAYMENT_PENDING,
    });

    const cartText = formatCartMessage(updatedSession.cart);

    await sendButtonsWithConfig(
      await waConfig(session.restaurantId || restaurantId()),
      msg.from,
      `📋 *Order Summary*\n\n${cartText}\n\nName: *${updatedSession.customerName}*\nAddress: *${address}*`,
      [
        { id: "btn_confirm_pay", title: "💳 Pay Now" },
        { id: "btn_cancel_order", title: "❌ Cancel" },
      ],
      "Confirm Order"
    );
    return;
  }

  if (address) {
    await sendTextWithConfig(await waConfig(session.restaurantId || restaurantId()), msg.from, "Address seems too short. Please provide a more detailed address.");
    return;
  }

  await sendTextWithConfig(await waConfig(session.restaurantId || restaurantId()), msg.from, "Please share your delivery address or tap *Pickup*.");
}

async function handlePaymentPending(msg: IncomingMessage, session: SessionData) {
  const btnId = msg.buttonReplyId;

  if (btnId === "btn_cancel_order") {
    await resetSessionForRestaurant(session.restaurantId || restaurantId(), msg.from);
    await sendTextWithConfig(await waConfig(session.restaurantId || restaurantId()), msg.from, "Order cancelled. 🗑️\n\nSend *menu* to start again.");
    return;
  }

  if (btnId === "btn_confirm_pay") {
    // Generate Razorpay payment link
    try {
      await sendPaymentLink(msg.from, session);
    } catch (err) {
      console.error("[wa-state] payment link creation failed:", err);
      await sendTextWithConfig(
        await waConfig(session.restaurantId || restaurantId()),
        msg.from,
        "Sorry, we couldn't create a payment link right now. Please try again. 😔"
      );
    }
    return;
  }

  // If payment is already pending, remind them
  if (session.paymentLinkUrl) {
    await sendTextWithConfig(
      await waConfig(session.restaurantId || restaurantId()),
      msg.from,
      `⏳ Your payment is pending.\n\nClick here to pay: ${session.paymentLinkUrl}\n\nOr send *cancel* to cancel.`
    );
    return;
  }

  await sendTextWithConfig(
    await waConfig(session.restaurantId || restaurantId()),
    msg.from,
    "Please tap *Pay Now* to proceed or *Cancel* to cancel."
  );
}

async function handleOrderConfirmed(msg: IncomingMessage, session: SessionData) {
  await sendTextWithConfig(
    await waConfig(session.restaurantId || restaurantId()),
    msg.from,
    `Your order has already been confirmed! ✅\n\n` +
      `Send *menu* to place a new order.`
  );
}

/* ─────── Main dispatcher ─────── */

const stateHandlers: Record<
  WaState,
  (msg: IncomingMessage, session: SessionData) => Promise<void>
> = {
  [WA_STATES.START]: handleStart,
  [WA_STATES.BROWSING]: handleBrowsing,
  [WA_STATES.ITEM_SELECTED]: handleItemSelected,
  [WA_STATES.ADDING_QUANTITY]: handleAddingQuantity,
  [WA_STATES.CART_VIEW]: handleCartView,
  [WA_STATES.CHECKOUT_NAME]: handleCheckoutName,
  [WA_STATES.CHECKOUT_ADDRESS]: handleCheckoutAddress,
  [WA_STATES.PAYMENT_PENDING]: handlePaymentPending,
  [WA_STATES.ORDER_CONFIRMED]: handleOrderConfirmed,
};

/**
 * Main entry point — called by the webhook for every incoming message.
 */
export async function handleIncomingMessage(msg: IncomingMessage, ctx?: { restaurantId?: string }) {
  const ctxRestaurantId = ctx?.restaurantId || restaurantId();
  try {
    const session = await getOrCreateSessionForRestaurant(ctxRestaurantId, msg.from);
    session.restaurantId = ctxRestaurantId;

    // 1. Check universal commands first (work in any state)
    const handled = await handleUniversalCommand(msg, session);
    if (handled) return;

    // 2. Handle catalog product messages in any state (user browsed catalog)
    if (msg.productIds && msg.productIds.length > 0 && session.state !== WA_STATES.ADDING_QUANTITY) {
      const productId = msg.productIds[0];
      await connectToDatabase();
      const item = await MenuItem.findOne({
        _id: oid(productId),
        restaurantId: oid(ctxRestaurantId),
        isActive: true
      })
        .select("_id name price")
        .lean();

      if (item) {
        await updateSessionForRestaurant(ctxRestaurantId, msg.from, {
          state: WA_STATES.ADDING_QUANTITY,
          selectedItemId: item._id.toString(),
        });
        await askQuantity(msg.from, item.name);
        return;
      }
    }

    // 3. Dispatch to state handler
    const handler = stateHandlers[session.state as WaState];
    if (handler) {
      await handler(msg, session);
    } else {
      console.warn(`[wa-state] unknown state: ${session.state}`);
      await resetSessionForRestaurant(ctxRestaurantId, msg.from);
      await sendWelcome(msg.from);
    }
  } catch (error) {
    console.error("[wa-state] unhandled error:", error);
    try {
      await sendTextWithConfig(
        await waConfig(ctxRestaurantId),
        msg.from,
        "Oops! Something went wrong. 😔\nPlease send *menu* to start over."
      );
    } catch {
      // Can't even send error message — nothing more we can do
    }
  }
}

/**
 * Called by the Razorpay webhook when payment succeeds.
 * Creates the POS order and sends confirmation.
 */
export async function handlePaymentSuccess(
  paymentLinkId: string
) {
  const { getSessionByPaymentLinkId } = await import("./wa-session-service");

  const session = await getSessionByPaymentLinkId(paymentLinkId);
  if (!session) {
    console.warn("[wa-state] no session for payment link:", paymentLinkId);
    return;
  }

  if (session.paymentStatus === "success") {
    // Already processed — idempotent
    return;
  }

  try {
    // 1. Create POS order
    const order = await createWhatsAppOrder({
      restaurantId: restaurantId(),
      phone: session.phone,
      customerName: session.customerName || "WhatsApp Customer",
      customerAddress: session.customerAddress,
      cart: session.cart,
      orderType: (session.orderType as "dine_in" | "takeaway") || "takeaway",
      paymentReference: paymentLinkId,
    });

    // 2. Update session
    await updateSessionForRestaurant(session.restaurantId || restaurantId(), session.phone, {
      state: WA_STATES.ORDER_CONFIRMED,
      paymentStatus: "success",
      orderId: order.id,
    });

    // 3. Send confirmation on WhatsApp
    await sendOrderConfirmation(
      session.phone,
      order.orderNumber,
      order.tokenNumber
    );
  } catch (err) {
    console.error("[wa-state] handlePaymentSuccess error:", err);
    await updateSessionForRestaurant(session.restaurantId || restaurantId(), session.phone, { paymentStatus: "failed" });
    await sendTextWithConfig(
      await waConfig(session.restaurantId || restaurantId()),
      session.phone,
      "⚠️ Your payment was received but we had trouble creating your order. " +
        "Please contact us and we'll sort it out."
    );
  }
}
