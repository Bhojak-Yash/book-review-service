const message = require('../helpers/message');
const salesReport = require('../services/salesReport');

exports.sales_report = async (req, res) => {
    try {
        const data = {...req.query,...req.user}
        const result = await salesReport.sales_report(data);
        return res.json(result);
    } catch (error) {
        console.error('sales_report error:', error);
        return res.status(500).json({status:message.code500,message:error.message});
    }
};