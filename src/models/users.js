module.exports =(sequelize,Sequelize)=>{
    const users = sequelize.define("users",{
        "id":{
            type:Sequelize.INTEGER,
            primaryKey: true, // Mark this as the primary key
            autoIncrement: true, // Optional: Automatically increment the ID
            allowNull: false
        },
        "userName":{
            type:Sequelize.STRING
        },
        "password":{
            type:Sequelize.STRING
        },
        "userType":{
            type:Sequelize.STRING
        },
        "isPasswordChangeRequired":{
            type:Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 1,
        },
        "status":{
            type:Sequelize.STRING
        },
        // "entityId":{
        //     type:Sequelize.INTEGER
        // }
    },

    {
        tableName: "users"
      })
    return users
}
