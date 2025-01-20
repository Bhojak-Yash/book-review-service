module.exports =(sequelize,Sequelize)=>{
    const authorizations = sequelize.define("authorizations",{
        "authorizedBy":{
            type:Sequelize.INTEGER
        },
        "authorizedId":{
            type:Sequelize.INTEGER
        },
        "status":{
            type: Sequelize.STRING
        }
    },

    {
        tableName: "authorizations", 
    })
    return authorizations
}