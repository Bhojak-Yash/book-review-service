module.exports = (sequelize, DataTypes) => {
    const States = sequelize.define("states", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        state: {
            type: DataTypes.STRING,
            allowNull: false
        },
        GSTIN:{
            type: DataTypes.INTEGER,
            allowNull: false
        },
        stateCode:{
            type: DataTypes.STRING,
            allowNull: false
        }
    }, {
        timestamps: false 
    });

    return States;
};
