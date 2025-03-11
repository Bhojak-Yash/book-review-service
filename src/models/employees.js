module.exports =(sequelize,Sequelize)=>{
    const employees = sequelize.define("employees",{
        "employeeId":{
            type:Sequelize.INTEGER,
            primaryKey: true, // Mark this as the primary key
           // autoIncrement: true, // Optional: Automatically increment the ID
            allowNull: false
        },
        "employeeCode":{
            type:Sequelize.STRING
        },
        "firstName":{
            type:Sequelize.STRING
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
            type:Sequelize.STRING
        },
        "employeeOf":{
            type:Sequelize.STRING
        },
        // "divisionId":{
        //     type:Sequelize.STRING
        // },
        // "roleId":{
        //     type:Sequelize.BIGINT
        // },
       "employeeStatus":{
            type:Sequelize.STRING
        },
        "entityId":{
            type:Sequelize.BIGINT
        },

    },

    {
        tableName: "employees"
      })
    return employees
}

