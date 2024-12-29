module.exports =(sequelize,Sequelize)=>{
    const divisions = sequelize.define("divisions",{
        "divisionId":{
            type:Sequelize.INTEGER,
            primaryKey: true, // Mark this as the primary key
           autoIncrement: true, // Optional: Automatically increment the ID
            allowNull: false
        },
        "divisionCode":{
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
        "divisionOf":{
            type:Sequelize.STRING
        },
       "status":{
            type:Sequelize.STRING
        },

    },

    {
        tableName: "divisions"
      })
    return divisions
}

