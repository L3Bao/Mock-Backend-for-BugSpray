const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// User Schema
const userSchema = new Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, default: '' },
    role: { type: String, enum: ['Manager', 'Developer'], default: 'Developer' },
    developerType: {
        type: String,
        enum: ['Front-end', 'Back-end', 'Full-stack', 'DevOps', 'Cloud', null],
        default: null
    },
});

// Project Schema
const projectSchema = new Schema({
    name: { type: String, required: true, default: '' },
    description: { type: String, default: '' },
    managerId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    developers: [{ type: Schema.Types.ObjectId, ref: 'User', default: [] }],
    bugs: [{ type: Schema.Types.ObjectId, ref: 'Bug', default: [] }],
});

// Bug Schema
const bugSchema = new Schema({
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', default: null },
    reportedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    priority: { type: Number, default: 0 },
    severity: { type: Number, default: 0 },
    stepsToReproduce: { type: String, default: '' },
    image: { type: String, default: '' }, // URL or path to image
    deadline: { type: Date, default: null},
    status: { type: String, enum: ['Open', 'To-do', 'Resolved', 'Closed'], default: 'Open' },
    comments: [{
        userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
        comment: { type: String, default: '' },
        date: { type: Date, default: Date.now }
    }]
});

// Creating models
const User = mongoose.model('User', userSchema);
const Project = mongoose.model('Project', projectSchema);
const Bug = mongoose.model('Bug', bugSchema);

module.exports = { User, Project, Bug };
