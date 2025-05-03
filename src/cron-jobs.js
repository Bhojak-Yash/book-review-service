const cron = require('node-cron');
const moment = require("moment");
const salesReport = require('./services/salesReport')
const nodemailer = require("nodemailer");
require('dotenv').config()

const cronTest = async () => {
    console.log('test cron job');
};

const sendmail = async (data) => {
    try {
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            auth: {
                user: process.env.EMAIL,
                pass: process.env.EMAIL_PASSWORD
            }
        });
        const formattedText = `
📊 *Daily Sales Report - Jee-1*

🏢 *Company Name:* ${data.companyName}

🛒 *Sales*
- Opening Time: ${moment(data.salesOpeningTime).format("DD-MMM-YYYY hh:mm A")}
- Opening Invoice: ${data.salesOpeningInv}
- Closing Time: ${moment(data.salesClosingTime).format("DD-MMM-YYYY hh:mm A")}
- Closing Invoice: ${data.salesClosingInv}
- Total Sales: ${data.totalSales}

📦 *Purchases*
- Opening Time: ${moment(data.purchaseOpeningTime).format("DD-MMM-YYYY hh:mm A")}
- Opening Invoice: ${data.purchaseOpeningInv || "N/A"}
- Closing Time: ${moment(data.purchaseClosingTime).format("DD-MMM-YYYY hh:mm A")}
- Closing Invoice: ${data.purchaseClosingInv || "N/A"}
- Total Purchase: ${data.totalpurchase}

💰 *Finance*
- Collections: ${data.collections}
- Total Payout: ${data.totalPayout}

📦 *Stocks*
- Opening Stocks: ${data.openingStocks}
- Closing Stocks: ${data.closingStocks}
`;

        const mailOptions = {
            from: process.env.EMAIL,
            to: data?.email,
            subject: "Daily Sales Report Jee-1",
            text: formattedText
        };


        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.log('sendMail error in cronjob:', error.message)
    }
}

const sendSalesReport = async () => {
    try {
        const start_date = moment().format("DD-MM-YYYY");
        const end_date = moment().format("DD-MM-YYYY");
        const data = { start_date, end_date }
        const result = await salesReport.sales_report(data)
        const sendMail = await result?.map(async (item) => {
            await sendmail(item)
        })
    } catch (error) {
        console.log('sendSalesReport cronjob error:', error.message)
    }
}
const openingStockEntry = async () => {
    try {
        const start_date = moment().format("DD-MM-YYYY");
        const end_date = moment().format("DD-MM-YYYY");
        // const data = { start_date, end_date }
            await salesReport.stocksReport( start_date, end_date)
    } catch (error) {
        console.log('openingStockEntry cronjob error:',error.message)
    }
}




// cron.schedule('*/1 * * * *', cronTest);
cron.schedule('0 19 * * *', sendSalesReport);
cron.schedule('0 7 * * *', openingStockEntry);


module.exports = { cronTest, sendSalesReport,openingStockEntry }