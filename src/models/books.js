module.exports = (sequelize, DataTypes) => {
  const Book = sequelize.define("books", {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,  
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    author: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    bookSignature: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    }
  });

  Book.associate = (models) => {
    Book.hasMany(models.reviews, {
      foreignKey: 'bookId',
      as: 'reviews',
      onDelete: 'CASCADE',
    });
  };

  return Book;
};
