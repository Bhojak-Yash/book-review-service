module.exports =(sequelize,Sequelize)=>{
    const inquiry = sequelize.define("inquiry",{
        "mobile":{
            type:Sequelize.BIGINT
        },
        "ip":{
            type:Sequelize.STRING
        },
        "isDeleted":{
            type: Sequelize.BOOLEAN,
            defaultValue: false,
        }
    })
    return inquiry
}