const stateService = require('../services/statesServices');

exports.getStatesAndCities = async (req, res) => {
    try {
        const { stateName } = req.query; 
        const result = await stateService.getStatesAndCities(stateName);
        return res.json(result);
    } catch (error) {
        console.error('Error in getStatesAndCities controller:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};
