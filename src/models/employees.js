module.exports =(sequelize,Sequelize)=>{
    const employees = sequelize.define("employees",{
        "employeeId":{
            type:Sequelize.INTEGER,
            primaryKey: true, // Mark this as the primary key
           // autoIncrement: true, // Optional: Automatically increment the ID
            allowNull: false
        },
        "employeeCode":{
            type: Sequelize.STRING,
            allowNull: false
        },
        "firstName":{
            type: Sequelize.STRING,
            allowNull: false
        },
        "lastName":{
            type:Sequelize.STRING
        },
        "address":{
            type:Sequelize.STRING
        },
        "phone":{
            type:Sequelize.BIGINT
        },
       "email":{
           type: Sequelize.STRING,
           allowNull: false
        },
        "employeeOf":{
            type:Sequelize.STRING
        },
        "entityId": {
            type: Sequelize.BIGINT
        },
        // "divisionId":{
        //     type:Sequelize.STRING
        // },
        "roleId":{
            type:Sequelize.BIGINT
        },
       "employeeStatus":{
            type:Sequelize.STRING
        },
    },

    {
        tableName: "employees",
        timestamps: true,
        paranoid: true
      })
    return employees
}

