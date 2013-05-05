'use strict';

/* Services */
var shareTaskApp = angular.module('shareTaskApp.services', ['ngResource']);

shareTaskApp.service('User', function($resource, $http) {
	
	this.authenticate = function(user, success, error) {
		console.log("Login user (user: %o)", user);
		//return $http.post('/sharetask/api/user/login', {username: 'dev1@shareta.sk', password: 'password'}).success(success).error(error);
		return $http.post('/sharetask/api/user/login', {username: user.username, password: user.password}).success(success).error(error);
	};
});

shareTaskApp.service('Workspace', function($resource) {
	
	this.findAll = function(callback) {
		console.log("Getting all workspaces from server");
		return $resource("/sharetask/resources-1.0.0/scripts/data/workspaces.json", {}, {query: {method: "GET", isArray: true}}).query(callback);
	};
	
	this.getTasks = function(input, callback) {
		console.log("Getting tasks for workspace (id: %s) from server", input.workspaceId);
		console.log("Get JSON file js/data/workspace-"+input.workspaceId+"-tasks.json");
		return $resource("/sharetask/resources-1.0.0/scripts/data/workspace-"+input.workspaceId+"-tasks.json", {}, {query: {method: "GET", isArray: true}}).query(callback);
	};
});

shareTaskApp.service('Task', function($resource) {
	
	this.findById = function(input, callback) {
		console.log("Getting task (id: %s) from server", input.id);
		console.log("Get JSON file js/data/task-"+input.id+".json");
		return $resource("/sharetask/resources-1.0.0/scripts/data/task-"+input.id+".json", {}, {query: {method: "GET", isArray: false}}).query(callback);
	};
});

shareTaskApp.service('Logger', function($log) {
	
	this.debug = function() {
		
	};
});

shareTaskApp.service('Utils', function($resource) {
	
	this.isCookieEnabled = function() {
		console.log("isCookieEnabled called");
		var cookieEnabled = (navigator.cookieEnabled) ? true : false;
		if (typeof navigator.cookieEnabled == "undefined" && !cookieEnabled) {
			document.cookie="testcookie";
			cookieEnabled = (document.cookie.indexOf("testcookie") != -1) ? true : false;
		}
		return (cookieEnabled);
	};
});

shareTaskApp.service('LocalStorage', function($resource) {
	
	var keyPrefix = 'sharetask-storage-';
	
	this.get = function(key) {
		return JSON.parse(localStorage.getItem(keyPrefix + key) || '[]');
	};
	
	this.store = function(key, data) {
		console.log("Store data (data: %o) to local storage (key: %s)", data, keyPrefix + key);
		localStorage.setItem(keyPrefix + key, JSON.stringify(data));
	};
	
	this.remove = function(key) {
		console.log("Remove from local storage (key: %s)", keyPrefix + key);
		localStorage.removeItem(keyPrefix + key);
	};
});
