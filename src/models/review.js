module.exports = (sequelize, Sequelize) => {
  const Review = sequelize.define("reviews", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    rating: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    comment: {
      type: Sequelize.STRING,
    },
    bookId: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
  }, {
    tableName: 'reviews',
  });

  Review.associate = (models) => {
    Review.belongsTo(models.books, {
      foreignKey: 'bookId',
      as: 'book',
    });
  };

  return Review;
};
