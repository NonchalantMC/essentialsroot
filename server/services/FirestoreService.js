const { db, docToObj, snapToArr } = require('../config/firebase');
const { v4: uuid } = require('uuid');

class FirestoreService {
  constructor(collectionName) {
    this.col  = db.collection(collectionName);
    this.name = collectionName;
  }

  // NOTE: resolves to a falsy value (not throwing) when the doc doesn't
  // exist or `id` isn't a real Firestore doc ID — wrapping this in
  // try/catch to detect "not found" will NOT work, check the return value.
  async findById(id) {
    if (!id) return null;
    const doc = await this.col.doc(String(id)).get();
    return docToObj(doc);
  }

  async findOne(query = {}) {
    let ref = this.col;
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null) ref = ref.where(k, '==', v);
    });
    const snap = await ref.limit(1).get();
    return snap.empty ? null : docToObj(snap.docs[0]);
  }

  async find(query = {}, options = {}) {
    const {
      limit      = 50,
      skip       = 0,
      orderBy    = 'createdAt',
      orderDir   = 'desc',
      arrayField = null,
      arrayValue = null,
    } = options;

    let ref = this.col;

    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        ref = ref.where(k, '==', v);
      }
    });

    if (arrayField && arrayValue) {
      ref = ref.where(arrayField, 'array-contains', arrayValue);
    }

    try {
      ref = ref.orderBy(orderBy, orderDir);
    } catch {}

    const snap = await ref.limit(limit + skip).get();
    const docs = snapToArr(snap);
    return skip > 0 ? docs.slice(skip) : docs;
  }

  async count(query = {}) {
    let ref = this.col;
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null) ref = ref.where(k, '==', v);
    });
    try {
      const snap = await ref.count().get();
      return snap.data().count;
    } catch {
      const snap = await ref.get();
      return snap.size;
    }
  }

  async create(data) {
    const id  = uuid();
    const now = new Date().toISOString();
    const doc = { ...data, createdAt: now, updatedAt: now };
    Object.keys(doc).forEach(k => doc[k] === undefined && delete doc[k]);
    await this.col.doc(id).set(doc);
    return { ...doc, _id: id, id };
  }

  async updateById(id, data) {
    if (!id) throw new Error('updateById requires an id');
    const now     = new Date().toISOString();
    const updates = { ...data, updatedAt: now };
    Object.keys(updates).forEach(k => updates[k] === undefined && delete updates[k]);
    await this.col.doc(String(id)).update(updates);
    return this.findById(id);
  }

  async deleteById(id) {
    await this.col.doc(String(id)).delete();
    return { _id: id };
  }

  async getNextCounter(counterId = 'orders') {
    const counterRef = db.collection('_counters').doc(counterId);
    return db.runTransaction(async (t) => {
      const doc     = await t.get(counterRef);
      const current = doc.exists ? (doc.data().count || 0) : 0;
      const nextVal = current + 1;
      t.set(counterRef, { count: nextVal, updatedAt: new Date().toISOString() });
      return nextVal;
    });
  }
}

module.exports = FirestoreService;
