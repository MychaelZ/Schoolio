var Models = require('../db.js').Models;
var Promise = require('bluebird');
var helpers = require('../helpers.js');

// MODELS
var Class = Models.Class;
var Student = Models.Student;
var Project = Models.Project;
var StudentProject = Models.StudentProject;
var ClassProject = Models.ClassProject;

module.exports = {
  assignProjectToStudent: function (req, res, next) {
    var id = req.params.id;

    Promise
      .all([
        Student
          .findById(id),

        Project
          .findById(req.body.ProjectId)
      ])
      .spread(function (student, project) {
        return student.addProject(project);
      })
      .then(helpers.sendResponse(res));
  },

  assignProjectToClass: function (req, res, next) {
    var id = req.params.id;

    Class
      .findById(id)
      .then(function (foundClass) {
        return Promise.all([
          foundClass
            .getStudents(),

          Project
            .findById(req.body.ProjectId)
            .then(function(project){
              project.addClass(foundClass);
              return project;
            }),

          foundClass
        ]);
      })
      .spread(function (students, project, foundClass) {
        return Promise
          .all([
            Promise
              .map(students, function (student) {
                return student.addProject(project);
              }),
            foundClass,
            project
          ]);
      })
      .then(function(data){
        helpers.sendResponse(res)(data);
      });
  },

  unassignProjectFromStudent: function (req, res) {
    var id = req.params.id;

    StudentProject
      .findOne({
        where: {
          StudentId: id,
          ProjectId: req.body.ProjectId
        }
      })
      .then(function (studentProject) {
        return studentProject.destroy();
      })
      .then(helpers.sendResponse(res));
  },

  unassignProjectFromClass: function (req, res) {
    var classid   = req.params.classid;
    var projectid = req.params.projectid;

    Class
      .findById(classid)
      .then(function (foundClass) {
        return Promise.all([
          foundClass.getStudents(),
          ClassProject
            .findOne({
              where: {
                ProjectId: projectid,
                ClassId: foundClass.id
              }
            })
            .then(function(classProject){
              return classProject ? classProject.destroy() : null;
            }) 
        ]);
      })
      .spread(function (students) {
        return Promise
          .map(students, function (student) {
            return StudentProject
              .findOne({
                where: {
                  StudentId: student.id,
                  ProjectId: projectid
                }
              })
              .then(function (studentProject) {
                return (studentProject) ? studentProject.destroy() : null;
              });
          });
      })
      .then(helpers.sendResponse(res));
  }
};