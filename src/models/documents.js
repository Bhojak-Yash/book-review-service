module.exports = (sequelize, Sequelize) => {
    const documents = sequelize.define("documents", {
        "documnetId": {
            type: Sequelize.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true,
        },
        "userId": {
            type: Sequelize.INTEGER
        },
        "categoryId": {
            type: Sequelize.INTEGER
        },
        "image":{
            type: Sequelize.TEXT
        },
        "status": {
            type: Sequelize.STRING
        },
    },

        {
            tableName: "documents",
        })
    // await documents.sync({ alter: true });
    return documents
}