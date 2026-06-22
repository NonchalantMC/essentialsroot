const FirestoreService = require('../services/FirestoreService');

const ProductService = new FirestoreService('products');

// UGX has no sub-unit in practice; this only guards against stray floating
// point noise from upstream math, not real price differences.
const PRICE_TOLERANCE = 1;

/**
 * Re-prices every cart item against the live product catalog. The server's
 * stored price always wins — a client-submitted price is never trusted or
 * written to an order. If the trusted subtotal doesn't match what the
 * client believed it was paying, the order is rejected with the specifics
 * of what changed, rather than silently charging a different total than
 * what the customer saw at checkout.
 *
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

    const quantity = Number(item.quantity) || 1;
    subtotal += trustedPrice * quantity;

    return {
      productId: product._id || product.id,
      sku:       product.sku || item.sku || '',
      name:      product.name,
      image:     product.images?.[0] || item.image || '',
      price:     trustedPrice, // server price always wins
      quantity,
      size:      item.size,
      width:     item.width,
      color:     item.color,
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
