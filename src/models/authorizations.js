module.exports =(sequelize,Sequelize)=>{
    const authorizations = sequelize.define("authorizations",{
        "authorizedBy":{
            type: Sequelize.INTEGER,
            allowNull: false
        },
        "authorizedId":{
            type: Sequelize.INTEGER,
            allowNull: false
        },
        "status":{
            type: Sequelize.STRING
        },
        "poStatus":{
            type:Sequelize.STRING
        },
        "creditCycle":{
            type:Sequelize.INTEGER,
            defaultValue: 30
        }
    },

    {
        tableName: "authorizations", 
    })
    return authorizations
}