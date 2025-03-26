/********************************************************************************
* WEB322 – Assignment 05
*
* I declare that this assignment is my own work in accordance with Seneca's
* Academic Integrity Policy:
*
* https://www.senecapolytechnic.ca/about/policies/academic-integrity-policy.html
*
* Name:Rebecca Rafeek Student ID: 168393239 Date: 26 March 2025
*
********************************************************************************/
require("dotenv").config();
const projectData = require("./modules/projects");
const express = require('express'); // "require" the Express module
const app = express(); // obtain the "app" object
const PORT = process.env.PORT || 3000; // assign a port

const path = require("path");

app.use(express.urlencoded({extended:true})); //middleware to use urlencoded form data

app.use(express.static('public')); //makes the public folder static ie files in public can be accessed directly via URL

app.set('view engine', 'ejs'); //lets express know that we are setting the view engine as ejs
app.set('views', __dirname + '/views'); // needed for vercel by giving the absolute path for the views folder and if the folder isnt called views then change it 

app.get('/', (req, res) => {
    res.render("home");
});

app.get('/about', (req, res) => {
    res.render("about");
});

app.get('/solutions/projects', async (req, res) => {
    try {
        const sector = req.query.sector ? parseInt(req.query.sector, 10) : null; // converts to number
    
        let data;
        if (sector) {
            // filter projects by sector
            data = await projectData.getProjectsBySector(sector);
            if (data.length === 0) { 
                return res.status(404).render("404", { message: `No projects found for sector: ${sector}` });
            }
        } else {
            // return all projects if no sector
            data = await projectData.getAllProjects();
        }

        //passes sector to ejs template
        res.render("projects", { projects: data, sector });

    } catch (error) {
        res.status(404).send({ error: error.message });
    }
});

app.get('/solutions/projects/:id', async (req, res) => {
    try {
        const projectId = parseInt(req.params.id, 10);

        if (isNaN(projectId)) {
            return res.status(400).render("404",{message:"Invalid project ID" });
        }

        const project = await projectData.getProjectById(projectId);
        if (!project) {
            return res.status(404).render("404",{message: `No project found with ID: ${projectId}` });
        }
        
        res.render("project", {project: project}); // send the project using ejs
    } catch (error) {
        res.status(404).send({message: "An error occurred while retrieving the project"});
    }
});
//route to get the add project functionality
//Once the Promise has resolved with the sectors, the "addproject" view will be rendered
app.get('/solutions/addProject', async (req, res) => {
    try {
        const sectorData = await projectData.getAllSectors();
        res.render("addProject", { sectors: sectorData });
    } catch (error) {
        res.render("500", { message: `I'm sorry, but we have encountered the following error: ${error}` });
    }
});
//requests Promise-based "addProject(projectData)" function and provides the data in req.body as the "projectData" parameter.
//promise resolves and then redirects to projects
app.post('/solutions/addProject', async (req, res) => {
    try {
        await projectData.addProject(req.body);
        res.redirect("/solutions/projects");
    } catch (error) {
        res.render("500", { message: `I'm sorry, but we have encountered the following error: ${error}` });
    }
});

//route for displaying the edit form with the project data
app.get('/solutions/editProject/:id', async (req, res) => {
    try {
        const projectId = parseInt(req.params.id, 10);
        
        // gets the project data and sectors list
        const project = await projectData.getProjectById(projectId);
        const sectors = await projectData.getAllSectors();

        if (!projectData) {
            return res.status(404).render("404", { message: "Project not found" });
        }

        // render the edit form with project and sector data
        res.render("editProject", { sectors: sectors, project: project });
    } catch (error) {
        res.status(404).render("404", { message: error });
    }
});

// POST route for processing the edit form submission
app.post('/solutions/editProject', async (req, res) => {
    try {
        const id = req.body.id;
        // pass the id and the form data
        await projectData.editProject(id, req.body);
        // redirects to projects page after successful update
        res.redirect("/solutions/projects");
    } catch (error) {
        res.render("500", { message: `I'm sorry, but we have encountered the following error: ${error}` });
    }
});

// route for deleting a project
app.get('/solutions/deleteProject/:id', async (req, res) => {
    try {
        const projectId = parseInt(req.params.id, 10);
        
        // deletes project
        await projectData.deleteProject(projectId);
        
        // redirects to project page after its been deleted
        res.redirect("/solutions/projects");
    } catch (error) {
        res.render("500", { message: `I'm sorry, but we have encountered the following error: ${error}` });
    }
});
//middleware function that catches all requests which werent handled by previous routes.
//must be at the end bcus if no other route was matched then this will run
app.use((req, res) => {
    res.status(404).render("404");
});

projectData.initialize()
.then(message => {
    console.log(message);
    return app.listen(PORT, () => console.log(`server listening on: ${PORT}`));
}).catch(error => {
        console.error("Failed to initialize project data:", error);
        return;
    });
   