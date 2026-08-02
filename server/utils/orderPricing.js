const FirestoreService = require('../services/FirestoreService');

const ProductService = new FirestoreService('products');

const PRICE_TOLERANCE = 1;

/**
 * @param {Array} clientItems - items as submitted by the client, each
 *   expected to include at least { productId, quantity, price }.
 * @returns {Promise<
 *   { valid: true,  items: Array, subtotal: number } |
 *   { valid: false, status: number, message: string, priceChanges?: Array }
 * >}
 */
async function revalidateOrderItems(clientItems) {
  if (!Array.isArray(clientItems) || clientItems.length === 0) {
    return { valid: false, status: 400, message: 'Your order has no items.' };
  }

  const products = await Promise.all(
    clientItems.map(item => ProductService.findById(item.productId))
  );

  const priceChanges = [];
  const invalidQuantities = [];
  let subtotal = 0;
  let hasMissingProduct = false;

  const trustedItems = clientItems.map((item, i) => {
    const product = products[i];

    if (!product) {
      hasMissingProduct = true;
      priceChanges.push({
        productId: item.productId,
        name:      item.name || 'Unknown item',
        reason:    'no_longer_available',
      });
      return null;
    }

    const trustedPrice = Number(product.price);
    const clientPrice  = Number(item.price);

    if (Math.abs(trustedPrice - clientPrice) > PRICE_TOLERANCE) {
      priceChanges.push({
        productId: product._id || product.id,
        name:      product.name,
        oldPrice:  clientPrice,
        newPrice:  trustedPrice,
      });
    }

    const quantity = Number(item.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
      // Bug fixed here: this used to `return` an error object directly from
      // this map callback, which only exits THIS callback, not
      // revalidateOrderItems as a whole. The error object silently became
      // a corrupted line item in trustedItems — missing productId, price,
      // and quantity — and since it never reached the `subtotal +=` line
      // below, it contributed nothing to the price actually charged. A
      // quantity of 0, a negative number, a decimal, or anything over 100
      // effectively made that item free while still nominally appearing in
      // the order. Collecting these here and rejecting below, the same
      // pattern the other two checks in this function already use.
      invalidQuantities.push({
        productId: product._id || product.id,
        name:      product.name,
        quantity:  item.quantity,
      });
      return null;
    }

    if (typeof product.stock === 'number' && quantity > product.stock) {
      invalidQuantities.push({
        productId: product._id || product.id,
        name:      product.name,
        quantity:  item.quantity,
        reason:    'insufficient_stock',
        available: product.stock,
      });
      return null;
    }

    subtotal += trustedPrice * quantity;

    return {
      productId: product._id || product.id,
      sku:       product.sku || item.sku || '',
      name:      product.name,
      image:     product.images?.[0] || item.image || '',
      price:     trustedPrice,
      quantity,
      // Firestore rejects `undefined` anywhere in a document, including
      // nested inside an array element — unlike FirestoreService.create(),
      // which only strips undefined from top-level fields. These three are
      // optional per-product (size doesn't apply to decor, width/color may
      // not apply to every item), so default to null rather than passing
      // through whatever the client did or didn't send.
      size:      item.size  ?? null,
      width:     item.width ?? null,
      color:     item.color ?? null,
    };
  });

  if (hasMissingProduct) {
    return {
      valid:   false,
      status:  409,
      message: 'One or more items in your order are no longer available. Please update your cart.',
      priceChanges,
    };
  }

  if (invalidQuantities.length > 0) {
    const stockIssues = invalidQuantities.filter(i => i.reason === 'insufficient_stock');
    const message = stockIssues.length > 0
      ? `Not enough stock for "${stockIssues[0].name}" (${stockIssues[0].available} available).`
      : `Invalid quantity for "${invalidQuantities[0].name}". Must be a whole number between 1 and 100.`;
    return { valid: false, status: 400, message, priceChanges: invalidQuantities };
  }

  if (priceChanges.length > 0) {
    return {
      valid:   false,
      status:  409,
      message: 'Some item prices have changed since you added them to your cart. Please review and confirm before placing your order.',
      priceChanges,
    };
  }

  return { valid: true, items: trustedItems, subtotal };
}

module.exports = { revalidateOrderItems };
