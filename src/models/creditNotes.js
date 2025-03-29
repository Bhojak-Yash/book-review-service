module.exports =(sequelize,Sequelize)=>{
    const creditNotes = sequelize.define("creditnotes",{
        "id":{
            type:Sequelize.INTEGER,
            primaryKey: true, 
            autoIncrement: true, 
            allowNull: false
        },
        "amount":{
            type:Sequelize.BIGINT
        },
        "url":{
            type:Sequelize.STRING
        },
        "issuedBy":{
            type: Sequelize.INTEGER
        },
        "issuedTo":{
            type:Sequelize.INTEGER
        },
        "isSettled":{
            type:Sequelize.BOOLEAN
        },
        "returnId":{
            type:Sequelize.BIGINT,
            unique:true,
            allowNull:false
        },
        "balance":{
            type:Sequelize.BIGINT
        }
    },
    {
        tableName: 'creditnotes'
    });
    return creditNotes
}