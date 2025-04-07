module.exports = (sequelize, Sequelize) => {
    const documents = sequelize.define("documents", {
        "documentId": {
            type: Sequelize.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true,
        },
        "userId": {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        "categoryId": {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        "image":{
            type: Sequelize.TEXT,
            allowNull: false
        },
        "status": {
            type: Sequelize.STRING
        },
        "isDeleted":{
            type: Sequelize.BOOLEAN,
            defaultValue: false,
        }
    },

        {
            tableName: "documents",
        })
    // await documents.sync({ alter: true });
    return documents
}