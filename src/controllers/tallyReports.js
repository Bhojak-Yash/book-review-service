const TallyReportsService = require('../services/tallyReports');

exports.partywise_outstanding_report = async (req, res) => {
  try {
    const data = {...req.query,...req.user}
    const report = await TallyReportsService.partywise_outstanding_report(data,res);

    // return res.status(report?.status || 200).json(report);
  } catch (error) {
    console.error("Error fetching partywise_outstanding_report:", error);
    return res.status(500).json({ status:500,message:error.message });
  }
};

exports.partywise_payable_report = async (req, res) => {
  try {
    const data = {...req.query,...req.user}
    const report = await TallyReportsService.partywise_payable_report(data,res);

    // return res.status(report?.status || 200).json(report);
  } catch (error) {
    console.error("Error fetching partywise_payable_report:", error);
    return res.status(500).json({ status:500,message:error.message });
  }
};

exports.ladger_report = async (req, res) => {
  try {
    const data = {...req.query,...req.user}
    const report = await TallyReportsService.ladger_report(data,res);

    // return res.status(report?.status || 200).json(report);
  } catch (error) {
    console.error("Error fetching ladger_report:", error);
    return res.status(500).json({ status:500,message:error.message });
  }
};