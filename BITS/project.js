const express = require('express');
const router = express.Router();
const { User, Project, Bug } = require('./schema');
const jwt = require('jsonwebtoken');

// Middleware to verify if the user is a manager
function isManager(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).send('Access denied. No token provided.');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        console.log(decoded);

        if (req.user.role !== 'Manager') {
            return res.status(403).send('Access denied. Not authorized.');
        }

        console.log(decoded);

        next();
    } catch (ex) {
        res.status(400).send('Invalid token.');
    }
}

// Middleware to check if the user is logged in
function isAuthenticated(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
  
    if (!token) {
      return res.status(401).send('Access denied. No token provided.');
    }
  
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      next();
    } catch (ex) {
      res.status(400).send('Invalid token.');
    }
  }

// POST route to create a new project
router.post('/create', isManager, async (req, res) => {
    try {
        const { name, description, developers, bugs } = req.body;

        // Create a new project with the provided details and defaults
        const project = new Project({
            name: name,
            description: description,
            managerId: req.user.userId,
            developers: developers,
            bugs: bugs
        });

        await project.save();
        console.log(project);
        res.status(201).send(project);
        
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});


// GET route to retrieve all projects
router.get('/all', async (req, res) => {
    try {
        const projects = await Project.find();
        res.status(200).send(projects);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});

// GET route to retrieve the projects of the specific user
router.get('/my-projects', isAuthenticated, async (req, res) => {
    try {
      // Get all projects where the user is either the manager or a developer
      const assignedProjects = await Project.find({ $or: [{ managerId: req.user.userId }, { developers: { $in: [req.user.userId] } }] });
  
      // Check if the user has any assigned projects
      if (assignedProjects.length === 0) {
        // Send a message to the user indicating that they have no projects
        return res.status(200).send('You have no assigned projects.');
      }
  
      // Get the project details for each assigned project
      const projectDetails = await Promise.all(assignedProjects.map(async (project) => {
        return await Project.findById(project._id).populate('managerId', 'name').populate('developers', 'name');
      }));
  
      // Send the project details back to the user
      res.status(200).send(projectDetails);
    } catch (error) {
      // Handle any errors
      console.error(error);
      res.status(500).send('Server error');
    }
  });
  


// GET route to retrieve a specific project by ID
router.get('/:id', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).send('Project not found');
        }
        res.status(200).send(project);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});

// PUT route to update a project
router.put('/update/:id', isManager, async (req, res) => {
    try {
        const { name, description } = req.body; 
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).send('Project not found');
        }

        // Check if the current user is the manager who created the project
        if (project.managerId.toString() !== req.user.userId) {
            return res.status(403).send('Access denied. Only the creating manager can modify this project.');
        }

        project.name = name;
        project.description = description;
        await project.save();

        res.status(200).send(project);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});

// DELETE route to delete a project
router.delete('/delete/:id', isManager, async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).send('Project not found');
        }

        // Check if the current user is the manager who created the project
        if (project.managerId.toString() !== req.user.userId) {
            return res.status(403).send('Access denied. Only the creating manager can modify this project.');
        }

        await project.remove();
        res.status(200).send('Project deleted successfully');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});

// POST route to add a developer to a project
router.post('/addDeveloper', isManager, async (req, res) => {
    try {
        const { projectId, developerId } = req.body;
        const project = await Project.findById(projectId);

        if (!project) {
            return res.status(404).send('Project not found');
        }

        // Check if the current user is the manager who created the project
        if (project.managerId.toString() !== req.user.userId) {
            return res.status(403).send('Access denied. Only the creating manager can modify this project.');
        }

        // Check if the user is already a developer in the project
        if (project.developers.includes(developerId)) {
            return res.status(400).send('Developer already assigned to this project');
        }

        project.developers.push(developerId);
        await project.save();

        res.status(200).send('Developer added successfully');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});

// POST route to remove a developer from a project
router.post('/removeDeveloper', isManager, async (req, res) => {
    try {
        const { projectId, developerId } = req.body;
        const project = await Project.findById(projectId);

        if (!project) {
            return res.status(404).send('Project not found');
        }

        // Check if the current user is the manager who created the project
        if (project.managerId.toString() !== req.user.userId) {
            return res.status(403).send('Access denied. Only the creating manager can modify this project.');
        }

        // Check if the user is actually a developer in the project
        if (!project.developers.includes(developerId)) {
            return res.status(400).send('Developer not found in this project');
        }

        project.developers = project.developers.filter(dev => dev.toString() !== developerId);
        await project.save();

        res.status(200).send('Developer removed successfully');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});

module.exports = router;
