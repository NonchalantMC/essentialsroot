// server/jobs/expireStaleOrders.js
//
// Scheduled cleanup for abandoned checkouts: orders created via POST /orders
// or /orders/guest are written to Firestore immediately at checkout
// submission, in `pending` status, BEFORE payment happens — PesaPal is only
// initiated as a separate follow-up call. If a customer closes the tab or
// payment never completes, that `pending` order sits in the `orders`
// collection forever with nothing to clean it up. This job finds pending
// orders older than STALE_AFTER_MS and marks them `expired`.
//
// ── The correctness trap this design avoids ─────────────────────────────────
// handlePaid() (payments.js) guards on `order.orderStatus !== 'pending'` to
// stay idempotent against duplicate IPN retries. If this job changed
// orderStatus to anything handlePaid() doesn't recognize, a genuinely late
// payment confirmation — a delayed IPN retry, a slow mobile-money
// confirmation — arriving AFTER this job has already run would be silently
// dropped: no stock decrement, no customer notification, nothing. The
// customer would have paid with zero confirmation and zero fulfillment.
//
// This is solved by NOT treating "expired" as terminal the way "cancelled"
// is. payments.js's handlePaid() guard must be updated (see the comment
// left in payments.js) to also accept orders in `expired` status — so if
// PesaPal ever does confirm payment after this job has already run, the
// order still gets correctly finalized. "Expired" here only means "stop
// showing this in the admin's active-orders view," not "this can never be
// paid." The ground truth for whether an order is real is always PesaPal's
// own payment confirmation, never this job's own bookkeeping.
//
// ── What this job deliberately does NOT touch, and why ──────────────────────
// - Stock: never decremented until payment confirms (see payments.js), so
//   there's nothing to release for a pending order.
// - Coupon usage/dedup locks: NOT restored here, even though a customer who
//   abandoned a cart with a coupon applied does "waste" that redemption.
//   Restoring it would create a real double-spend race: if a freed-up
//   coupon slot gets claimed by someone else, and the original abandoned
//   order's payment THEN completes late, the coupon would effectively be
//   used twice. A slightly under-utilized coupon is a far safer failure
//   mode than an accidentally double-redeemed one — this is a deliberate
//   choice, not an oversight. Coupon locks are only ever released via
//   explicit admin cancellation of an already-paid order, a deliberate
//   human decision with full information, not a time-based guess.

const { onSchedule } = require('firebase-functions/v2/scheduler');
const FirestoreService = require('../services/FirestoreService');

const OrderService = new FirestoreService('orders');

const STALE_AFTER_MS = 24 * 60 * 60 * 1000; // 24h — generous buffer well beyond
                                              // any realistic PesaPal redirect/IPN
                                              // retry window, so the "late payment"
                                              // case above stays a rare edge case
                                              // rather than a common occurrence.

// Firestore batched writes cap at 500 operations. Capping well under that
// keeps this safe even if a single run ever finds an unusually large
// backlog (e.g. after downtime), without needing cursor-based pagination
// for what should, in normal operation, be a small number per run.
const MAX_PER_RUN = 300;

async function expireStaleOrdersOnce() {
  const cutoff = new Date(Date.now() - STALE_AFTER_MS).toISOString();

  // Requires a composite index on (orderStatus ASC, createdAt ASC) — see
  // firestore.indexes.json. Without it, this query throws instead of
  // silently doing a full collection scan, so the missing-index case fails
  // loudly rather than becoming a slow, expensive surprise at scale.
  const staleOrders = await OrderService.find(
    { orderStatus: 'pending' },
    { limit: MAX_PER_RUN, orderBy: 'createdAt', orderDir: 'asc' }
  );

  const eligible = staleOrders.filter(o => o.createdAt && o.createdAt < cutoff);

  if (eligible.length === 0) {
    console.log('expireStaleOrders: nothing to expire.');
    return { checked: staleOrders.length, expired: 0 };
  }

  await Promise.all(eligible.map(order =>
    OrderService.updateById(order._id || order.id, {
      orderStatus: 'expired',
      statusHistory: [
        ...(order.statusHistory || []),
        {
          status: 'expired',
          note: `Auto-expired — no payment confirmed within ${STALE_AFTER_MS / 3600000}h of order creation.`,
          updatedAt: new Date().toISOString(),
        },
      ],
    })
  ));

  console.log(`expireStaleOrders: expired ${eligible.length} stale order(s).`);
  return { checked: staleOrders.length, expired: eligible.length };
}

// Runs every 6 hours. Frequent enough that clutter never builds up much
// between runs (bounding how large `eligible` can realistically get, which
// is what keeps MAX_PER_RUN comfortably sufficient at scale); infrequent
// enough to be effectively free to run.
const expireStaleOrders = onSchedule('every 6 hours', async () => {
  await expireStaleOrdersOnce();
});

module.exports = { expireStaleOrders, expireStaleOrdersOnce };
