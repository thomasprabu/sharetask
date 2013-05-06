'use strict';

/* Controllers */
angular.module('shareTaskApp.controllers', ['ui']).
	controller('AuthCtrl', ['$scope', '$location', '$rootScope', 'User', 'LocalStorage', function($scope, $location, $rootScope, User, LocalStorage) {
		
		$scope.errorStatus = 0;
		
		// get logged user from local storage
		$rootScope.loggedUser = LocalStorage.get('logged-user');
		console.log("Logged user: %o", $rootScope.loggedUser);
		
		// redirect to tasks page if user is already logged in
		if (!jQuery.isEmptyObject($rootScope.loggedUser)) {
			console.log("User (user: %o) is already logged in. Redirect to tasks page.", $rootScope.loggedUser);
			$location.path("/tasks");
		}
		
		/**
		 * Login user.
		 * User is redirected to tasks page.
		 */
		$scope.login = function() {
			console.log("Login user (username: %s) with password (password: %s)", $scope.user.username, $scope.user.password);
			User.authenticate({username: $scope.user.username, password: $scope.user.password}, function(data, status) {
					console.log("Auth success! data: %o, status: %o", data, status);
					$rootScope.loggedUser = {username: $scope.user.username};
					LocalStorage.store('logged-user', $rootScope.loggedUser);
					$location.path("/tasks");
				}, function(data, status) {
					console.log("Auth error! data: %o, status: %o", data, status);
					$rootScope.loggedUser = {};
					LocalStorage.remove('logged-user');
					$scope.errorStatus = status;
			});
		}
		
	}])
	.controller('AppCtrl', ['$scope', '$location', '$rootScope', '$filter', 'Workspace', 'Task', 'User', 'LocalStorage', function($scope, $location, $rootScope, $filter, Workspace, Task, User, LocalStorage) {
		
		$scope.viewPanelTaskFilter = true;
		$scope.selectedWorkspaceId;
		$scope.selectedTask;
		$scope.taskEditMode = '';
		$scope.filter = {'queue': 'MY_PENDING', 'tag': '', 'searchString': '', 'orderBy': 'TASK_DUE_DATE'};
		$scope.tags = [];
		var taskFilter = $filter('filterTasks');
		
		/**
		 * Logout user.
		 * User is redirected to login page.
		 */
		$scope.logout = function() {
			console.log("Logout user: %s", $rootScope.loggedUser.username);
			$rootScope.loggedUser = {};
			LocalStorage.remove('logged-user');
			$location.path("/");
		};
		
		/**
		 * Setting active workspace.
		 * Event is propagated into Workspace controller for loading workspace tasks from server.
		 * @param {number} id - Workspace ID.
		 */
		/*
		$scope.setActiveWorkspace = function(id) {
			console.log("Setting active workspace (id: %s)", id);
			$scope.$broadcast('EVENT_SET_ACTIVE_WORKSPACE', {workspaceId: id});
		};
		*/
		/**
		 * Receive event 'EVENT_SET_ACTIVE_WORKSPACE' for setting active workspace.
		 * After receiving of event all workspace tasks are loaded from server.
		 */
		/*
		$scope.$on('EVENT_SET_ACTIVE_WORKSPACE', function(event, data) {
			console.log("Received broadcast message 'EVENT_SET_ACTIVE_WORKSPACE' (data: %o)", data);
			$scope.selectedWorkspaceId = data.workspaceId;
			$scope.loadTasks();
		});
		*/
		
		/**
		 * Loading all workspaces from server.
		 */
		$scope.loadWorkspaces = function() {
			console.log("Load all workspaces");
			Workspace.findAll(function(workspaces) {
				console.log("Loaded workspaces from server: %o", workspaces);
				if (workspaces.length) {
					$scope.workspaces = workspaces;
					$scope.selectedWorkspaceId = workspaces[0].id;
					$scope.loadTasks();
				}
			}, function(response) {
				console.log("error response: %o", response);
				if (response.status == 403) {
					$scope.logout();
				}
			});
		};
		
		/**
		 * Load all active tasks for selected workspace.
		 */
		$scope.loadTasks = function() {
			console.log("Load all active tasks for workspace (id: %s)", $scope.selectedWorkspaceId);
			Workspace.getActiveTasks({workspaceId: $scope.selectedWorkspaceId}, function(tasks) {
					console.log("Loaded workspace tasks from server: %o", tasks);
					$scope.allTasks = tasks;
					$scope.setTaskFilterQueue($scope.filter.queue);
				}, function(response) {
					console.log("Error getting all active tasks for workspace(id: %s): %o", $scope.selectedWorkspaceId, response);
					if (response.status == 403) {
						$scope.logout();
					}
			});
		};
		
		/**
		 * Setting filter queue.
		 * Presented tasks are filtered and ordered according current filter settings.
		 * @param {string} queue - Queue name.
		 */
		$scope.setTaskFilterQueue = function(queue) {
			console.log("Set filter queue: %s", queue);
			$scope.filter.queue = queue;
			$scope.filterTasks();
			if (!jQuery.isEmptyObject($scope.tasks)) {
				// set selected task
				$scope.setSelectedTask($scope.tasks[0].id);
				// parse tags
				var taskTags = new Array();
				angular.forEach($scope.tasks, function(task) {
					if (task.tags.length) {
						angular.forEach(task.tags, function(tag) {
							if (taskTags.indexOf(tag) == -1) {
								taskTags.push(tag);
							}
						});
					}
				});
				$scope.tags = taskTags;
				console.log("Tags parsed for queue: %o", $scope.tags);
			}
		};
		
		/**
		 * Setting filter tag.
		 * If input tag is same as current filter tag then current filter tag is removed.
		 * Presented tasks are filtered and ordered according current filter settings.
		 * @param {string} tag - Tag name.
		 */
		$scope.setTaskFilterTag = function(tag) {
			console.log("Set filter tag: %s", tag);
			if (tag == $scope.filter.tag) {
				$scope.filter.tag = '';
			}
			else {
				$scope.filter.tag = tag;
			}
			$scope.filterTasks();
		};
		
		/**
		 * Filter tasks.
		 * Presented tasks are filtered and ordered according current filter settings.
		 */
		$scope.filterTasks = function() {
			console.log("Filter tasks: %o", $scope.filter);
			$scope.tasks = taskFilter($scope.filter, this.allTasks);
			$scope.tasks = $filter('orderBy')(this.tasks, this.orderTasks);
		};
		
		/**
		 * Setting task filter ordering.
		 * Presented tasks are filtered and ordered according current filter settings.
		 * @param {string} orderBy - Order by name.
		 */
		$scope.setTaskOrdering = function(orderBy) {
			console.log("Set task ordering to: %s", orderBy);
			$scope.filter.orderBy = orderBy;
			$scope.filterTasks();
		};
		
		/**
		 * Setting selected task.
		 * @param {number} taskId - Task ID.
		 */
		$scope.setSelectedTask = function(taskId) {
			console.log("Set selected task (id: %s)", taskId);
			var tasks = $.grep($scope.tasks, function(e) {
				return e.id == taskId;
			});
			$scope.selectedTask = tasks[0];
			console.log("Selected task: %o", $scope.selectedTask);
			/*
			$scope.selectedTask = Task.findById({id: taskId}, function(data) {
					console.log("Task.findById: %o", data);
			}, function(response) {
					console.log("response: %o", response);
			});
			*/
			console.log("Selected task: %o", $scope.selectedTask);
		};
		
		/**
		 * Function for ordering tasks.
		 * @param {object} task - Task.
		 */
		$scope.orderTasks = function(task) {
			if ($scope.filter.orderBy == "TASK_DUE_DATE") { return task.dueDate; }
			else if ($scope.filter.orderBy == "TASK_TITLE") { return task.title; }
			else if ($scope.filter.orderBy == "TASK_AUTHOR") { return task.createdBy.name; }
		};
		
		/**
		 * Removing tag from the task.
		 * Task is stored to server.
		 * @param {number} taskId - Task ID.
		 * @param {string} tag - Tag name.
		 */
		$scope.addTaskTag = function() {
			console.log("Add new tag to task, id: %s, tag: %s", $scope.selectedTask.id, $scope.newTag);
			$scope.selectedTask.tags.push($scope.newTag);
			$scope.updateTask($scope.selectedTask);
			$scope.taskEditMode = '';
			$scope.newTag = '';
		};
		
		/**
		 * Removing tag from the task.
		 * Task is stored to server.
		 * @param {number} taskId - Task ID.
		 * @param {string} tag - Tag name.
		 */
		$scope.removeTag = function(taskId, tag) {
			console.log("Remove task tag, id: %s, tag: %s", taskId, tag);
		};
		
		/**
		 * Setting task edit mode.
		 * Represents task attribute which is currently in editing mode.
		 * @param {string} mode - Edit mode.
		 */
		$scope.setTaskEditMode = function(mode) {
			console.log("Switch task edit mode to: %s", mode);
			if (mode == this.taskEditMode) {
				$scope.taskEditMode = "";
			}
			else {
				$scope.taskEditMode = mode;
			}
		};
		
		/**
		 * Setting view flag.
		 * Flag represent if element is displayed.
		 * @param {string} element - Element name.
		 */
		$scope.setView = function(element) {
			console.log("Set view for element: %s", element);
			if (element == 'PANEL-TASK-FILTER') {
				$scope.viewPanelTaskFilter === true ? $scope.viewPanelTaskFilter = false : $scope.viewPanelTaskFilter = true;
				console.log("viewPanelTaskFilter set to: %s", $scope.viewPanelTaskFilter);
			}
		};
		
		/**
		 * Updating task data.
		 * Task data are stored to server.
		 * @param {object} task - Task.
		 */
		$scope.updateTask = function(task) {
			console.log("Update task data (task: %o)", task);
			$scope.taskEditMode = '';
			$scope.selectedTask = task;
			var result = $.grep(this.tasks, function(e) {
				return e.id == task.id;
			});
			result[0].title = task.title;
			result[0].description = task.description;
			result[0].tags = task.tags;
			//console.log("tasks, %o", this.tasks);
			// TODO - call REST API update
			Task.update({workspaceId: $scope.selectedWorkspaceId, task: $scope.selectedTask}, function(data, status) {
					console.log("Task update success! data: %o, status: %o", data, status);
				}, function(data, status) {
					console.log("Task update error! data: %o, status: %o", data, status);
			});
			
			LocalStorage.store('workspace-' + $scope.selectedWorkspaceId, $scope.allTasks);
		};
		
		/**
		 * Changing task queue filter.
		 */
		$scope.changeTaskQueue = function() {
			console.log("Change task filter queue (queue: %s)", $scope.filter.queue);
			if ($scope.filter.queue == 'MY_PENDING') { $scope.setTaskFilterQueue('MY_TODAY'); }
			else if ($scope.filter.queue == 'MY_TODAY') { $scope.setTaskFilterQueue('MY_OVERDUE'); }
			else if ($scope.filter.queue == 'MY_OVERDUE') { $scope.setTaskFilterQueue('MY_HIGH_PRIORITY'); }
			else if ($scope.filter.queue == 'MY_HIGH_PRIORITY') { $scope.setTaskFilterQueue('MY_COMPLETED'); }
			else if ($scope.filter.queue == 'MY_COMPLETED') { $scope.setTaskFilterQueue('MY_PENDING'); }
		};
		
		/**
		 * Changing active task priority.
		 * Task data are stored to server.
		 */
		$scope.changeTaskPriority = function() {
			console.log("Change task priority (id: %s, priority: %s)", $scope.selectedTask.id, $scope.selectedTask.priority);
			if ($scope.selectedTask.priority == 'LOW') { $scope.selectedTask.priority = 'MEDIUM'; }
			else if ($scope.selectedTask.priority == 'MEDIUM') { $scope.selectedTask.priority = 'HIGH'; }
			else if ($scope.selectedTask.priority == 'HIGH') { $scope.selectedTask.priority = 'LOW'; }
			$scope.updateTask($scope.selectedTask);
		};
		
		/**
		 * Add new task.
		 * User adds task title only. All others attributes are set to default values.
		 * Task data are stored to server.
		 */
		$scope.addTask = function() {
			console.log("Add new task (taskTitle: %s)", $scope.newTaskTitle);
			var task = {title: $scope.newTaskTitle, createdBy: 'mmoravek', createdOn: new Date(), priority: 'MEDIUM', comments: 0};
			console.log("Task: %o", task);
			// TODO Store new task to server
			
			$scope.allTasks.push(task);
			$scope.filterTasks();
			$scope.newTaskTitle = '';
		};
		
		/**
		 * Forward active task to another workspace member.
		 * Task data are stored to server.
		 */
		$scope.forwardTask = function(user) {
			console.log("Forward task (id: %s) to user (user: %s)", $scope.selectedTask.id, user);
			$scope.updateTask($scope.selectedTask);
		};
		
		/**
		 * Delete active task.
		 * Task data are stored to server.
		 */
		$scope.deleteTask = function() {
			console.log("Delete task (id: %s)", $scope.selectedTask.id);
			$scope.updateTask($scope.selectedTask);
		};
		
		/**
		 * Complete active task.
		 * Task data are stored to server.
		 */
		$scope.completeTask = function() {
			console.log("Complete task (id: %s)", $scope.selectedTask.id);
			$scope.selectedTask.state = 'FINISHED';
			$scope.updateTask($scope.selectedTask);
		};
		
		/**
		 * Move active task to another workspace.
		 * Task data are stored to server.
		 */
		$scope.moveTask = function(workspace) {
			console.log("move task (id: %s) to workspace (%s)", $scope.selectedTask.id, workspace);
		};
		
		// get logged user from local storage
		$rootScope.loggedUser = LocalStorage.get('logged-user');
		console.log("Logged user: %o", $rootScope.loggedUser);
		
		// redirect to login page if user is not logged in
		if (jQuery.isEmptyObject($rootScope.loggedUser) || jQuery.isEmptyObject($rootScope.loggedUser.username)) {
			console.log("Unauthenticated access. Redirect to login page.");
			$location.path("/");
		}
		else {
			// Loading all workspaces from server.
			$scope.loadWorkspaces();
		}
	}])
	.controller('AdminCtrl', ['$scope', '$location', '$rootScope', 'Workspace', 'LocalStorage', function($scope, $location, $rootScope, Workspace, LocalStorage) {
		
		// get logged user from local storage
		$rootScope.loggedUser = LocalStorage.get('logged-user');
		console.log("Logged user: %o", $rootScope.loggedUser);
		
		// redirect to login page if user is not logged in
		if (jQuery.isEmptyObject($rootScope.loggedUser) || jQuery.isEmptyObject($rootScope.loggedUser.username)) {
			console.log("Unauthenticated access. Redirect to login page.");
			$location.path("/");
		}
		else {
			
		}
	}])
	.controller('UserCtrl', ['$scope', '$location', '$rootScope', 'Workspace', 'LocalStorage', function($scope, $location, $rootScope, Workspace, LocalStorage) {
		
		// get logged user from local storage
		$rootScope.loggedUser = LocalStorage.get('logged-user');
		console.log("Logged user: %o", $rootScope.loggedUser);
		
		// redirect to login page if user is not logged in
		if (jQuery.isEmptyObject($rootScope.loggedUser) || jQuery.isEmptyObject($rootScope.loggedUser.username)) {
			console.log("Unauthenticated access. Redirect to login page.");
			$location.path("/");
		}
		else {
			
		}
	}])
	;