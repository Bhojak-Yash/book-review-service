module.exports = (sequelize, DataTypes) => {
    const States = sequelize.define("States", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        state: {
            type: DataTypes.STRING,
            allowNull: false
        }
    }, {
        timestamps: false 
    });

    return States;
};
