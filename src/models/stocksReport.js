module.exports = (sequelize, DataTypes) => {
    const stocksReport = sequelize.define("stocksReport", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        openingStock:{
            type: DataTypes.BIGINT
        },
        closingStock:{
            type: DataTypes.BIGINT
        }
    }, {
        tableName: "stocksReport",
      });

    return stocksReport;
};
