const distributorDashboard = require('../services/distributorPanelService');

exports.getStatistics_one = async (req, res) => {
    try {
        const stats = await distributorDashboard.Statistics_one(req.user);
        return res.status(stats.status).json(stats);
    } catch (error) {
        console.error('Error in getStatistics_one controller:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.getStatistics_two = async (req, res) => {
    try {
        const { statusFilter = 'All' } = req.query;
        const stats = await distributorDashboard.Statistics_two(req.user, statusFilter);
        return res.status(stats.status).json(stats);
    } catch (error) {
        console.error('Error in getStatistics_two controller:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.Statistics_three = async (req, res) => {
    try {
        const stats = await distributorDashboard.Statistics_three(req.user);
        return res.status(stats.status).json(stats);
    } catch (error) {
        console.error('Error in Statistics_three controller:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.Statistics_four = async(req, res) => {
    try{
        const {filterType} = req.query;
        const stats = await distributorDashboard.Statistics_four(req.user, filterType);
        return res.status(stats.status).json(stats);
    }catch (error){
        console.log("Error in Statistics_four Controller:", error);
        return res.status(500).json({message: "Internal Server Error"});
    }
};

exports.Statistics_five = async(req, res) => {
    try{
        const {filterType} = req.query;
        const stats = await distributorDashboard.Statistics_five(req.user, filterType);
        return res.status(stats.status).json(stats);
    }catch (error){
        console.log("Error in Statistics_four Controller:", error);
        return res.status(500).json({message: "Internal Server Error"});
    }
};