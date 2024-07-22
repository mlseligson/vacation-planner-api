import express from 'express';
import { pool, connectToPool } from '../db.js';

const tripsRouter = express.Router();

tripsRouter.use(connectToPool);

tripsRouter.get('/', indexTrips);
tripsRouter.post('/', createTrip);
tripsRouter.get('/:id', getTrip);
tripsRouter.patch('/:id', updateTrip);
tripsRouter.delete('/:id', deleteTrip);

export default tripsRouter;

async function indexTrips(req, res) {
  const trips = await req.client.query('SELECT * FROM trips ORDER BY id ASC');

  req.client.release();
  res.json(trips.rows);
}

async function createTrip(req, res, next) {
  try {
    const { name, destination, cost, image_url, start_time, end_time, user_id } = req.body;

    const trip = await req.client.query({
      text: 'INSERT INTO trips (name, destination, cost, image_url, start_time, end_time user_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      values: [name, destination, cost, image_url, start_time, end_time, user_id]
    });

    if (!trip.rowCount)
      throw new Error({status: 404});

    res.status(201).json(trip.rows[0]);
  } catch(err) {
    next(err);
  } finally {
    req.client.release();
  }
}

async function getTrip(req, res, next) {
  try {
    const trip = await req.client.query({
      text: 'SELECT * FROM trips WHERE id=($1)',
      values: [req.params.id]
    });

    if (!trip.rowCount)
      throw new Error({status: 404});

    res.json(trip.rows[0]);
  } catch(err) {
    next(err);
  } finally {
    req.client.release();
  }
}

async function updateTrip(req, res, next) {
  try {
    const { name, destination, cost, image_url, start_time, end_time, user_id } = req.body;

    const trip = await req.client.query({
      text: `UPDATE trips SET
              name = updateIfChanged($1, name),
              destination = updateIfChanged($2, destination),
              cost = updateIfChanged($3, cost),
              image_url = updateIfChanged($4, image_url),
              start_time = updateIfChanged($5, start_time),
              end_time = updateIfChanged($6, end_time),
              user_id = updateIfChanged($7, user_id)
            WHERE id = $8 RETURNING *;`,
      values: [name, destination, cost, image_url, start_time, end_time, user_id, req.params.id]
    });

    if (!trip.rowCount)
      throw new Error({status: 404});

    res.status(202).json(trip.rows[0]);

  } catch(err) {
    next(err);
  } finally {
    req.client.release();
  }
}

async function deleteTrip(req, res, next) {
  try {
    await req.client.query('DELETE FROM trips WHERE id=$1', [req.params.id]);

    res.status(204).send();
  } catch(err) {
    next(err);
  } finally {
    req.client.release();
  }
}