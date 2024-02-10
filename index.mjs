import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';

const app = express();
const port = 4000;

const uri = process.env.MONGODB || 'mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+2.1.3'

const client = new MongoClient(uri);
const db = client.db('superball');
const leaderboards = db.collection('leaderboards');

app.use(cors());
app.use(express.json());

app.get('/leaderboards', async (req, res) => {
  const entriesCursor = leaderboards
    .find({})
    .sort({score: -1})
    .project({_id:0})
    .limit(5);

  const entries = await entriesCursor.toArray();
  entriesCursor.close();

  res.json(entries);
});

app.post('/leaderboards', async (req, res) => {
  if (typeof req.body.name !== 'string'
      || typeof req.body.score !== 'number')
  {
    res.status(400).json({
      status: 400,
      error: 'Bad Request',
      message: 'Check name and score fields'
    });
    return;
  }

  const entry = await leaderboards.findOne({name: req.body.name});

  if (!entry || entry.score < req.body.score) {
    const newEntry = {
      name: req.body.name,
      score: req.body.score
    };

    await leaderboards.updateOne(
      {name: newEntry.name},
      { $set: { score: newEntry.score } },
      { upsert: true }
    );

    res.json(newEntry);
  }
  else {
    res.status(400).json({
      status: 400,
      error: 'Bad Request',
      message: 'Higher score already exists'
    });
  }
});

app.get('/leaderboards/:name', async (req, res) => {
  const entry = await leaderboards.findOne({name: req.params.name});

  if (!entry) {
    res.status(404).json({
      status: 404,
      error: 'Not Found',
      message: 'No score for name exists'
    });
  }
  else {
    res.json({
      name: entry.name,
      score: entry.score
    });
  }
});

app.listen(port, () => {
  console.log('Listening on port ' + port);
});
