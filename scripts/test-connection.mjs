import dns from 'node:dns';

dns.setServers(['8.8.8.8', '8.8.4.4']);

import mongoose from 'mongoose';




import 'dotenv/config';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('FAIL: MONGODB_URI is not set in .env');
    process.exit(1);
}

console.log('Testing MongoDB connection...');
console.log('URI (masked):', MONGODB_URI.replace(/(mongodb\+srv:\/\/)([^:]+):[^@]+(@.*)/, '$1***:***$2'));

try {
    const conn = await mongoose.connect(MONGODB_URI, {
        bufferCommands: false,
        serverSelectionTimeoutMS: 15000,
    });

    console.log('SUCCESS: Connected to MongoDB');
    console.log('  Host:', conn.connection.host);
    console.log('  Port:', conn.connection.port);
    console.log('  Database name:', conn.connection.name);
    console.log('  Ready state:', conn.connection.readyState, '(1 = connected)');

    // List collections to prove we can actually read from the DB
    const collections = await conn.connection.db.listCollections().toArray();
    console.log('  Collections found:', collections.map(c => c.name).join(', ') || '(none)');

    // Clean up a test collection we create and drop
    const testCol = conn.connection.db.collection('connection_test');
    await testCol.insertOne({ test: true, at: new Date() });
    const count = await testCol.countDocuments();
    await testCol.drop();
    console.log('  Write/read test: inserted and dropped test doc, count was', count);

    await mongoose.disconnect();
    console.log('Disconnected cleanly. Connection test PASSED.');
    process.exit(0);
} catch (err) {
    console.error('FAIL: Could not connect to MongoDB');
    console.error('  Error:', err.message);
    if (err.name === 'MongoNetworkError' || err.name === 'MongoTimeoutError') {
        console.error('  Hint: check your network/VPN, IP whitelist in Atlas, or the URI credentials.');
    } else if (err.name === 'MongoServerSelectionError') {
        console.error('  Hint: Atlas may be paused, or the cluster hostname is wrong/unreachable.');
    }
    try { await mongoose.disconnect(); } catch {}
    process.exit(1);
}