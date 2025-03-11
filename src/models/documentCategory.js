module.exports =(sequelize,Sequelize)=>{
    const documentCategory = sequelize.define("documentCategory",{
        "id":{
            type:Sequelize.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true,
        },
        "documentName":{
            type:Sequelize.STRING
        },
        "category":{
            type: Sequelize.STRING
        }
    },

    {
        tableName: "documentCategory", 
    })
    return documentCategory
}