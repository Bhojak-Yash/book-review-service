const stateService = require('../services/statesServices');

exports.getStatesAndCities = async (req, res) => {
    try {
        const { stateId } = req.query; 
        const result = await stateService.getStatesAndCities(stateId);
        return res.json(result);
    } catch (error) {
        console.error('Error in getStatesAndCities controller:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};
