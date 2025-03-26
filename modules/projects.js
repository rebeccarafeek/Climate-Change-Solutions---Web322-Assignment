// Objective:
// Create and publish a web app that uses multiple routes which serve static content (text / json) as well as create a
// "project service" module for accessing data. For this assignment, we will initially use data from https://drawdown.org
// (specifically, data related to some of their projects / solutions for solving climate change).

//reads the files and creates 2 arrays of objects: "projectData" and "sectorData"

//Objective for A3:adding a custom landing page with links to various projects, as well as an "about" page and
//custom 404 error page. Additionally, we will be updating our server.js file to support more dynamic routes, status codes
//and static content (css)
require('dotenv').config();
require('pg');
const Sequelize = require('sequelize');
//set up sequelize to get our database 
const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: "postgres",
    dialectOptions: {
      ssl: {
        require: true, // This will help you connect to the database with SSL
        rejectUnauthorized: false, // Allows self-signed certificates
      },
    },
  });

// Sector model definition
const Sector = sequelize.define(
    'Sector',
    {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      sector_name: Sequelize.STRING,
    },
    {
      createdAt: false, // disable createdAt
      updatedAt: false, // disable updatedAt
    }
  );
  
  // Project model definition
  const Project = sequelize.define(
    'Project',
    {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      title: Sequelize.STRING,
      feature_img_url: Sequelize.STRING,
      summary_short: Sequelize.TEXT,
      intro_short: Sequelize.TEXT,
      impact: Sequelize.TEXT,
      original_source_url: Sequelize.STRING,
    },
    {
      createdAt: false, // disable createdAt
      updatedAt: false, // disable updatedAt
    }
  );
  //associate relationship between project and sector
Project.belongsTo(Sector, {foreignKey: 'sector_id'});

module.exports = { initialize, getAllProjects, getProjectById, getProjectsBySector,
     getAllSectors, addProject, editProject, deleteProject };

//changed to invoke sequelize.sync(). If sequelize.sync() resolves successfully then the return promise is resolved
function initialize(){
    return new Promise((resolve, reject) => {
        sequelize.sync()
          .then(() => {
            resolve("Database synchronized successfully");
          })
          .catch((err) => {
            reject(err.message);
          });
      });
    }
//reads the project data from the database and includes sector data
function getAllProjects(){
    return new Promise((resolve, reject) => {
        Project.findAll({ 
          include: [Sector] 
        })
          .then((projects) => {
            resolve(projects);
          })
          .catch((err) => {
            reject(err.message);
          });
      });
}
//resolve the returned Promise with a single project whose id value matches the projectid
function getProjectById(projectId){
    return new Promise((resolve, reject) => {
        Project.findAll({ 
          where: {
            id: projectId
          },
          include: [Sector]
        })
          .then((projects) => {
            if (projects.length > 0) {
              resolve(projects[0]); //resolves 1st element of returned array instead of the entire array 
            } else {
              reject("Unable to find requested project");
            }
          })
          .catch((err) => {
            reject(err.message);
          });
      });
}
//resolve the returned Promise with all the returned projects whose Sector.sector_name contains the string in the sector parameter.
function getProjectsBySector(sector) {
    return new Promise((resolve, reject) => {
      // Check if sectorParam is a number (ID) or string (name)
      const isNumeric = !isNaN(parseInt(sector));
      
      let queryOptions;
      if (isNumeric) {
        // If it's a numeric ID
        queryOptions = {
          include: [Sector],
          where: {
            sector_id: parseInt(sector)
          }
        };
      } else {
        // If it's a string to match against sector_name
        queryOptions = {
          include: [Sector],
          where: {
            '$Sector.sector_name$': {
              [Sequelize.Op.iLike]: `%${sector}%`
            }
          }
        };
      }
  
      Project.findAll(queryOptions)
        .then((projects) => {
          if (projects.length > 0) {
            resolve(projects);
          } else {
            reject("Unable to find requested projects");
          }
        })
        .catch((err) => {
          reject(err.message);
        });
    });
  }

//gets all sectors from database
function getAllSectors() {
    return new Promise((resolve, reject) => {
      Sector.findAll()
        .then((sectors) => {
          resolve(sectors);
        })
        .catch((err) => {
          reject(err.message);
        });
    });
  }

  //adss a project to database
function addProject(projectData) {
    return new Promise((resolve, reject) => {
      Project.create(projectData)
        .then(() => {
          resolve();
        })
        .catch((err) => {
          // Provide a more human-readable error message
          if (err.errors) {
            reject(err.errors[0].message);
          } else {
            reject(err.message);
          }
        });
    });
  }

  //edits project
  function editProject(id, projectData) {
    return new Promise((resolve, reject) => {
      //ensures id is an int
      const projectId = parseInt(id, 10);
      
      //edit the project where id matches
      Project.update(projectData, {
        where: { id: projectId }
      })
        .then(([numRows]) => {
          // checks if any rows were affected
          if (numRows === 0) {
            reject("No project found with that ID, or no changes were made");
          } else {
            resolve();
          }
        })
        .catch((err) => {
          if (err.errors && err.errors.length > 0) {
            reject(err.errors[0].message);
          } else {
            reject(err.message);
          }
        });
    });
  }

  //deletes a project
  function deleteProject(id) {
    return new Promise((resolve, reject) => {
      //ensures id is an int
      const projectId = parseInt(id, 10);
      
      //deletes the project where id matches
      Project.destroy({
        where: { id: projectId }
      })
        .then((numRows) => {
          if (numRows === 0) {
            reject("No project found with that ID");
          } else {
            resolve();
          }
        })
        .catch((err) => {
          if (err.errors && err.errors.length > 0) {
            reject(err.errors[0].message);
          } else {
            reject(err.message);
          }
        });
    });
  }
// function getProjectsBySector(sector){
//     return new Promise((resolve, reject) => {
//         Project.findAll({
//           include: [Sector], 
//           where: {
//             '$Sector.sector_name$': {
//               [Sequelize.Op.iLike]: `%${sector}%`
//             }
//           }
//         })
//           .then((projects) => {
//             if (projects.length > 0) {
//               resolve(projects);
//             } else {
//               reject("Unable to find requested projects");
//             }
//           })
//           .catch((err) => {
//             reject(err.message);
//           });
//       });
//     }

//NO LONGER NEEDED SINCE THE DATA HAS BEEN ADDED
// sequelize
// .sync()
// .then( async () => {
//   try{
//     await Sector.bulkCreate(sectorData); 
//     await Project.bulkCreate(projectData);

//     await sequelize.query(`SELECT setval(pg_get_serial_sequence('"Sectors"', 'id'), (SELECT MAX(id) FROM "Sectors"))`);
//     await sequelize.query(`SELECT setval(pg_get_serial_sequence('"Projects"', 'id'), (SELECT MAX(id) FROM "Projects"))`);

//     console.log("-----");
//     console.log("data inserted successfully");
//   }catch(err){
//     console.log("-----");
//     console.log(err.message);

//   }

//   process.exit();
// })
// .catch((err) => {
//   console.log('Unable to connect to the database:', err);
// });



