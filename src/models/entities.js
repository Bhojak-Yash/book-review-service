module.exports =(sequelize,Sequelize)=>{
    const entities = sequelize.define("entities",{
        "entityId":{
            type:Sequelize.INTEGER,
            primaryKey: true, // Mark this as the primary key
           autoIncrement: true, // Optional: Automatically increment the ID
            allowNull: false
        },
        "entityCode":{
            type:Sequelize.STRING
        },
        "name":{
            type:Sequelize.STRING
        },
        "address":{
            type:Sequelize.STRING
        },
        "phone":{
            type:Sequelize.BIGINT
        },
       "email":{
            type:Sequelize.STRING
        },
        "organisationId":{
            type:Sequelize.INTEGER
        },
       "status":{
            type:Sequelize.STRING
        },
       "entityType":{
            type:Sequelize.STRING
        },

    },

    {
        tableName: "entities"
      })
    return entities
}

