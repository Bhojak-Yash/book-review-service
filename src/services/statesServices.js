const db = require('../models/db');
const { Op } = require('sequelize');

// exports.getStatesAndCities = async (stateName) => {
//     try {
//         if (stateName) {
//             const state = await db.states.findOne({ where: { state: stateName } });

//             if (!state) {
//                 return { success: false, message: "State not found" };
//             }

//             const cities = await db.cities.findAll({ where: { state_id: state.id } });
//             return { success: true, data: cities };
//         }

//         const states = await db.states.findAll();
//         return { success: true, data: states };
//     } catch (error) {
//         console.error("Error fetching states/cities:", error);
//         throw new Error("Database query failed");
//     }
// };

exports.getStatesAndCities = async (stateId) => {
    try {
        if (stateId) {
            const state = await db.states.findByPk(stateId);
            
            // console.log("/////////////////",stateId);

            if (!state) {
                return { success: false, message: "State not found" };
            }

            // Fetch all cities belonging to the state
            const cities = await db.cities.findAll({
                where: { state_id: stateId }
            });

            if (!cities.length) {
                return { success: false, message: "No cities found for this state" };
            }

            return { success: true, data: cities };
        }

        // Fetch all states if no stateId is provided
        const states = await db.states.findAll();
        return { success: true, data: states };

    } catch (error) {
        console.error("Error fetching states/cities:", error);
        return { success: false, message: "Database query failed", error: error.message };
    }
};

