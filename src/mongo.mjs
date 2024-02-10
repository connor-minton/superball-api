import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB || 'mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+2.1.3'

const client = new MongoClient(uri);

async function run() {
  try {
    const db = client.db('superball');
    const leaderboards = db.collection('leaderboards');

    const entriesCursor = leaderboards
      .find({})
      .sort({score: -1})
      .limit(5);

    const entries = await entriesCursor.toArray();
    entriesCursor.close();

    console.log(entries);
  }
  finally {
    await client.close();
  }
}

run().catch(console.dir);