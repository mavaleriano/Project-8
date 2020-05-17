'use strict';
const Sequelize = require('sequelize');

module.exports = (sequelize) => {
  class Book extends Sequelize.Model {}
  Book.init({
    title: {
      type: Sequelize.STRING,
      validate: {
        notEmpty: {
          msg: '"Title" is required'
        }
      }
    },
    author: {
      type: Sequelize.STRING,
      validate: {
        notEmpty: {
          msg: '"Author" is required'
        }
      }
    },
    genre: {
      type: Sequelize.STRING,
      allowNull: true
    },
    year: {
      type: Sequelize.INTEGER,
      allowNull: true
    }
  }, { sequelize });

  // (async () => {
  //   //await Book.sync();
  //   try {
  //     await sequelize.authenticate();
  //   }
  //   catch(error)
  //   {
      
  //   }
  // })

  return Book;
};