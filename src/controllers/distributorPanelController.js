const distributorDashboard = require('../services/distributorPanelService');

exports.distProductInfo = async (req, res) => {
    try {
        const stats = await distributorDashboard.distProductInfo(req.user);
        return res.status(stats.status).json(stats);
    } catch (error) {
        console.error('Error in getStatistics_one controller:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.distributorRequest = async (req, res) => {
    try {
        const { statusFilter = '',page=1,limit=10 } = req.query;
        const stats = await distributorDashboard.distributorRequest(req.user, statusFilter,page,limit);
        return res.status(stats.status).json(stats);
    } catch (error) {
        console.error('Error in getStatistics_two controller:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.stockRunningLow = async (req, res) => {
    try {
        const stats = await distributorDashboard.stockRunningLow(req.user);
        return res.status(stats.status).json(stats);
    } catch (error) {
        console.error('Error in Statistics_three controller:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.topProducts = async(req, res) => {
    try{
        const {filterType} = req.query;
        const stats = await distributorDashboard.topProducts(req.user, filterType);
        return res.status(stats.status).json(stats);
    }catch (error){
        console.log("Error in Statistics_four Controller:", error);
        return res.status(500).json({message: "Internal Server Error"});
    }
};

exports.topRetailers = async(req, res) => {
    try{
        const {filterType} = req.query;
        const stats = await distributorDashboard.topRetailers(req.user, filterType);
        return res.status(stats.status).json(stats);
    }catch (error){
        console.log("Error in topRetailer Controller:", error);
        return res.status(500).json({message: "Internal Server Error"});
    }
};

exports.topDistributors = async(req, res) => {
    try{
        const {filterType} = req.query;
        const stats = await distributorDashboard.topDistributorsandretailers(req.user, filterType);
        return res.status(stats.status).json(stats);
    }catch (error){
        console.log("Error in topDistributors Controller:", error);
        return res.status(500).json({message: "Internal Server Error"});
    }
};

//KPIs......
exports.topProductsToday = async (req, res) => {
    try {
        const stats = await distributorDashboard.getDashboardStatsToday(req.user, req.query.date);
        return res.status(stats?.status || 200).json(stats);
    } catch (error) {
        console.log("Error in topProductsToday Controller:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

//payment Card stats
exports.getPaymentRelatedStats = async (req, res) => {
    try {
        const stats = await distributorDashboard.getPaymentRelatedStats(req.user, req.query.date);
        return res.status(stats?.status || 200).json(stats);
    } catch (error) {
        console.log("Error in getPaymentRelatedStats Controller:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};
