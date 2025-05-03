module.exports =(sequelize,Sequelize)=>{
    const roles = sequelize.define("roles",{
        "id":{
            type:Sequelize.INTEGER,
            primaryKey: true, // Mark this as the primary key
            autoIncrement: true, // Optional: Automatically increment the ID
            allowNull: false
        },
        "roleCode":{
            type:Sequelize.STRING
        },
        "roleName":{
            type:Sequelize.STRING
        },
        "description":{
            type:Sequelize.STRING
        },
        "status":{
            type:Sequelize.STRING
        },
        "priority":{
            type:Sequelize.INTEGER,
            // allowNull: false, 
        },
        "ownerId":{
            type: Sequelize.INTEGER,
            allowNull: false
        }
    },

    {
        tableName: "roles",
        timestamps: true,
        paranoid: true
      })
    return roles
}
