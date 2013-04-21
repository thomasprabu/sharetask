/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership. The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
package org.sharetask.api;

import java.util.List;

import javax.validation.Valid;
import javax.validation.constraints.NotNull;

import org.sharetask.api.dto.TaskDTO;
import org.springframework.validation.annotation.Validated;

/**
 * Service for accessing tasks.
 * @author Michal Bocek
 * @since 1.0.0
 */
@Validated
public interface TaskService {

	/**
	 * Create new task
	 * @param task
	 * @return
	 */
	@NotNull TaskDTO createTask(@NotNull Long workspaceId, @Valid @NotNull TaskDTO task);
	
	/**
	 * Add comment to specified task.
	 * @param taskId
	 * @param message
	 * @return
	 */
	@NotNull TaskDTO addComment(@NotNull Long taskId, @NotNull String message);
	
	/**
	 * Find task by specified queue.
	 * @param workspaceId
	 * @param taskQueue
	 * @return
	 */
	@NotNull List<TaskDTO> findTaskByQueue(@NotNull Long workspaceId, @NotNull TaskQueue taskQueue);
	
	/**
	 * Update task.
	 * @param task
	 * @return
	 */
	@NotNull TaskDTO updateTask(@NotNull @Valid TaskDTO task);
	
	/**
	 * Complete task.
	 * Set state to FINISH and add FINISHED event to events.
	 * @param taskId
	 */
	void completeTask(@NotNull Long taskId);
	
	/**
	 * Forward task to specified group.
	 * @param taskId
	 * @param owners
	 */
	void forwardTask(@NotNull Long taskId, @NotNull List<Long> owners);
}
