require('dotenv').config();
const mongoose = require('mongoose');
const RideHistory = require('../models/RideHistory.model');

const MONGO = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/rideshare';

async function seed() {
  await mongoose.connect(MONGO);
  console.log('Connected to', MONGO);

  // create some dummy ObjectIds for ride, rider and captain
  const ids = Array.from({ length: 6 }, () => new mongoose.Types.ObjectId());

  const docs = [
    {
      ride: ids[0],
      rider: ids[1],
      captain: ids[2],
      status: 'COMPLETED',
      events: [
        { type: 'REQUESTED', by: ids[1], at: new Date(Date.now() - 1000 * 60 * 60), meta: {} },
        { type: 'ACCEPTED', by: ids[2], at: new Date(Date.now() - 1000 * 60 * 50), meta: {} },
        { type: 'COMPLETED', by: ids[2], at: new Date(Date.now() - 1000 * 60 * 10), meta: {} },
      ],
      completedAt: new Date(Date.now() - 1000 * 60 * 10),
      riderReview: { rating: 5, comment: 'Great ride', createdAt: new Date(Date.now() - 1000 * 60 * 5) },
    },

    {
      ride: ids[3],
      rider: ids[4],
      captain: ids[5],
      status: 'CANCELLED',
      events: [
        { type: 'REQUESTED', by: ids[4], at: new Date(Date.now() - 1000 * 60 * 120), meta: {} },
        { type: 'MATCHING', by: null, at: new Date(Date.now() - 1000 * 60 * 115), meta: {} },
        { type: 'CANCELLED', by: ids[4], at: new Date(Date.now() - 1000 * 60 * 110), meta: { reason: 'Rider changed plans' } },
      ],
      cancelledBy: ids[4],
      cancelledAt: new Date(Date.now() - 1000 * 60 * 110),
    },

    // another completed with no review yet
    {
      ride: new mongoose.Types.ObjectId(),
      rider: new mongoose.Types.ObjectId(),
      captain: new mongoose.Types.ObjectId(),
      status: 'COMPLETED',
      events: [
        { type: 'REQUESTED', by: null, at: new Date(Date.now() - 1000 * 60 * 200), meta: {} },
        { type: 'ACCEPTED', by: null, at: new Date(Date.now() - 1000 * 60 * 180), meta: {} },
        { type: 'COMPLETED', by: null, at: new Date(Date.now() - 1000 * 60 * 20), meta: {} },
      ],
      completedAt: new Date(Date.now() - 1000 * 60 * 20),
    },
  ];

  try {
    // insertMany will fail if unique ride index conflicts; use insertMany with ordered:false to continue
    const res = await RideHistory.insertMany(docs, { ordered: false });
    console.log('Inserted', res.length, 'ride history documents');
  } catch (err) {
    // if duplicate key or others, log and continue
    console.error('Error inserting docs (some may already exist):', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected');
  }
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
