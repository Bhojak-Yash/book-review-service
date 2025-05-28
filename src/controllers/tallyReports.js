const TallyReportsService = require('../services/tallyReports');

exports.partwise_outstanding_report = async (req, res) => {
  try {
    const data = {...req.query,...req.user}
    const report = await TallyReportsService.partwise_outstanding_report(data,res);

    // return res.status(report?.status || 200).json(report);
  } catch (error) {
    console.error("Error fetching partwise_outstanding_report:", error);
    return res.status(500).json({ status:500,message:error.message });
  }
};
