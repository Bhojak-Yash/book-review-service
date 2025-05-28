const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3002;
const db = require('./models/db')
const Sequelize = db.sequelize
const { usersRouter, dashboardRouter, orderRouter, pharmacyRouter, inquiryRouter, productRouter,
  manufacturerRouter,retailerRouter,distributorRouter,stockRouter,usercartRouter,entityRouter,
  rolesRouter,empolyeeRouter,authRouter,manufacturerDashboard, distributorPanelRouter, statesRouter,
   notificationsRouter, expiryRouter, employeeManagement_Router, warehouseManagement_Router,
    accountsRouter,retailerSalesRouter,patientRouter,doctorRouter,salesReportRouter,tallyReports} = require('./routers/index')
const cors = require('cors')
const {cronTest,sendSalesReport,openingStockEntry} =require('./cron-jobs')
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

function formatToMySQLDateTime(inputDate) {
  const date = new Date(inputDate); // Ensure the input is converted to a Date object
  if (isNaN(date.getTime())) {
      throw new Error('Invalid date value'); // Handle invalid dates
  }
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

app.use(usersRouter, dashboardRouter, orderRouter, pharmacyRouter, inquiryRouter, productRouter,manufacturerRouter,
  retailerRouter,distributorRouter,stockRouter,usercartRouter,entityRouter,rolesRouter,empolyeeRouter,authRouter,manufacturerDashboard,
   distributorPanelRouter, statesRouter, notificationsRouter, expiryRouter, employeeManagement_Router,
    warehouseManagement_Router, accountsRouter,retailerSalesRouter,patientRouter,doctorRouter,salesReportRouter,tallyReports)


    cronTest()
    sendSalesReport()
    openingStockEntry()



app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
