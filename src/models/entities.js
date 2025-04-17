module.exports =(sequelize,Sequelize)=>{
    const entities = sequelize.define("entities",{
        "entityId":{
            type:Sequelize.INTEGER,
            primaryKey: true, // Mark this as the primary key
           autoIncrement: true, // Optional: Automatically increment the ID
            allowNull: false
        },
        "entityCode":{
            type: Sequelize.STRING,
            // allowNull: false
        },
        "name":{
            type:Sequelize.STRING
        },
        "address":{
            type:Sequelize.STRING
        },
        "phone":{
            type: Sequelize.BIGINT,
            allowNull: false
        },
       "email":{
           type: Sequelize.STRING,
           allowNull: false
        },
        "organisationId":{
            type:Sequelize.INTEGER
        },
       "status":{
            type:Sequelize.STRING
        },
       "ownerName":{
            type:Sequelize.STRING
        },
       "entityType":{
            type:Sequelize.ENUM("Division", "Warehouse")
        },
    },

    {
        tableName: "entities",
        timestamps: true,
        // paranoid: true
      })
    return entities
}

