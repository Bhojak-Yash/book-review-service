const message = require('../helpers/message');
const salesReport = require('../services/salesReport');

exports.sales_report = async (req, res) => {
    try {
        const data = {...req.query,...req.user}
        const result = await salesReport.sales_report(data);
        return res.status(200).json({
            status:200,
            message:'ok',
            apiData:result[0]
        });
    } catch (error) {
        console.error('sales_report error:', error);
        return res.status(500).json({status:message.code500,message:error.message});
    }
};

exports.operationalMetrics = async (req, res) => {
    try {
        const { date, type } = req.query;
        const stats = await salesReport.operationalMetrics(req.user, date, type);
        return res.status(stats?.status || 200).json(stats);
    } catch (error) {
        console.log("Error in operationalMetrics Controller:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};
