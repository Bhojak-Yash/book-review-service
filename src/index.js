const express = require('express');
const app = express();
const bookRoutes = require('./routers/books');
const db = require('./models/db');

app.use(express.json());
app.use('/api', bookRoutes);

const PORT = process.env.PORT || 3000;

db.sequelize.sync({ alter: true })
  .then(() => {
    console.log("DB synced successfully");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => console.error("DB Sync Error:", err));