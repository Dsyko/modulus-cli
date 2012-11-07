var modulus = require('../modulus'),
    async = require('async'),
    userConfig = require('../common/api').userConfig,
    error = require('../common/error'),
    projectController = require('../controllers/project'),
    fs = require('fs');

var env = {};

env.list = function(cb) {
  env._getAndChooseProject(function(err, project) {
    if(err) { return cb(err); }

    modulus.io.print("Project " + project.name.data + " Environment Variables");
    for (var i = 0; i < project.envVars.length; i++) {
      env._printEnv(project.envVars[i]);
    }
    return cb();
  });
};

env.set = function(name, value, cb) {
  env._getAndChooseProject(function(err, project) {
    if(err) { return cb(err); }

    var newEnv = {name : name, value : value};
    var found = false;
    modulus.io.print("Setting " + newEnv.name.yellow + " for project " + project.name.data);
    for (var i = 0; i < project.envVars.length; i++) {
      if(project.envVars[i].name === newEnv.name) {
        project.envVars[i].value = newEnv.value;
        found = true;
      }
    }
    if(!found) {
      project.envVars.push(newEnv);
    }

    projectController.saveVars(project.id, project.envVars, function(err, res) {
      if(err) {
        return cb(err);
      }
      modulus.io.success('Successfully set environment variable.');
      return cb();
    });
  });
};

env._getAndChooseProject = function(cb) {
  projectController.find({
      userId : userConfig.data.userId
    },
    function(err, projects) {
      if(err) {
        return error.handleApiError(err, cb);
      }
      if(projects.length === 0) {
        return cb('You currently have no projects. You can create one with "project create".');
      }
      modulus.commands.project.chooseProjectPrompt(projects, function(err, result) {
        if(err) {
          return cb('Could not choose project.');
        }
        if(!result) {
          return cb('You must choose a project.');
        }
        projectController.find({projectId : result.id}, function(err, project) {
          if(err) {
            console.log(err);
            return cb('Could not retrieve project.');
          }
          if(!result) {
            return cb('No project found.');
          }
          return cb(null, project);
        });
      });
  });
};

env._printEnv = function(env) {
  modulus.io.print(env.name.yellow + " = " + env.value.grey);
};

module.exports = env;