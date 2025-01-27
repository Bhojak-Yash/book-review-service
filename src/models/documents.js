module.exports =async(sequelize,Sequelize)=>{
    const documents = sequelize.define("documents",{
        "documnetId": {
            type: Sequelize.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true,
        },
        "PAN":{
            type:Sequelize.STRING
        },
        "GST":{
            type: Sequelize.STRING
        },
        "CIN":{
            type:Sequelize.STRING
        },
        "manufacturingLicense":{
            type:Sequelize.STRING
        },
        "drugLicense":{
            type:Sequelize.STRING
        },
        "ISO":{
            type:Sequelize.STRING
        }
    },

    {
        tableName: "documents", 
    })
    await documents.sync({ alter: true });
    return documents
}