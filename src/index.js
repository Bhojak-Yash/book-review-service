const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;
const db = require('./models/db')
const Sequelize = db.sequelize
const { usersRouter, dashboardRouter, orderRouter, pharmacyRouter, inquiryRouter, productRouter,manufacturerRouter,
  retailerRouter,distributorRouter,stockRouter} = require('./routers/index')
const cors = require('cors')
app.use(cors());
const dbConnection = async () => {
  await db.sequelize.sync()
    .then(() => {
      console.log("Synced db.");
    })
    .catch((err) => {
      console.log("Failed to sync db: " + err.message);
    });
}
dbConnection()

app.use(express.json());

app.post('/trigger-webhook', async (req, res) => {
  try {
    // console.log(req.body);
    const data = req.body.data
    const response = await axios.post(process.env.URL, {
      // Add any data you need to send in the payload
      data: req.body,
    });


    const query = `
    INSERT INTO delivery_track (driverId, routeId, orderNumber, stopId, start_dateTime, end_dateTime)
    VALUES (:driverId, :routeId, :orderNumber, :stopId, :start_dateTime, :end_dateTime)
`;

    await Sequelize.query(query, {
      replacements: {
        driverId: data.route_stop.id,
        routeId: data.route_stop.route_id,
        orderNumber: data.route_stop.order_number,
        stopId: data.route_stop.route_stop_trip.id,
        start_dateTime: formatToMySQLDateTime(data.route_stop.route_stop_trip.start_datetime),
        end_dateTime: formatToMySQLDateTime(data.route_stop.route_stop_trip.end_datetime),
      },
    });

    res.status(response.status).send({
      message: 'Google Script webhook called successfully',
      data: response.data,
    });

  } catch (error) {
    res.status(error.response?.status || 500).send({
      message: 'Error calling Google Script webhook',
      error: error.message,
    });
  }
});
function formatToMySQLDateTime(inputDate) {
  const date = new Date(inputDate); // Ensure the input is converted to a Date object
  if (isNaN(date.getTime())) {
      throw new Error('Invalid date value'); // Handle invalid dates
  }
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

app.use(usersRouter, dashboardRouter, orderRouter, pharmacyRouter, inquiryRouter, productRouter,manufacturerRouter,
  retailerRouter,distributorRouter,stockRouter)
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
