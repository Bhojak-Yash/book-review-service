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
        const { statusFilter = 'All' } = req.query;
        const stats = await distributorDashboard.distributorRequest(req.user, statusFilter);
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

exports.topDistributors = async(req, res) => {
    try{
        const {filterType} = req.query;
        const stats = await distributorDashboard.topDistributors(req.user, filterType);
        return res.status(stats.status).json(stats);
    }catch (error){
        console.log("Error in Statistics_four Controller:", error);
        return res.status(500).json({message: "Internal Server Error"});
    }
};