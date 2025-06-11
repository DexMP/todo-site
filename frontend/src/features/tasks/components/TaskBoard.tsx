import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'; // Changed import
import { selectTasksByProjectId, selectTasksLoading, selectTasksError, Task, updateTask, updateTaskStatusOptimistic } from '../taskSlice';
import { RootState, AppDispatch } from '../../../app/store';
import TaskItem from './TaskItem';
import TaskCreateForm from './TaskCreateForm';

interface TaskBoardProps {
  projectId: string;
}

const columnsConfig: { id: Task['status']; title: string }[] = [
  { id: 'todo', title: 'To Do' },
  { id: 'inprogress', title: 'In Progress' },
  { id: 'done', title: 'Done' },
];

const TaskBoard: React.FC<TaskBoardProps> = ({ projectId }) => {
  const dispatch = useDispatch<AppDispatch>();
  const tasks = useSelector((state: RootState) => selectTasksByProjectId(state, projectId));
  const isLoading = useSelector(selectTasksLoading) === 'pending';
  const error = useSelector(selectTasksError);

  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return; // Dropped outside a valid droppable
    if (source.droppableId === destination.droppableId && source.index === destination.index) return; // Dropped in the same place

    const task = tasks.find(t => t.id === draggableId);
    if (!task) return;

    const newStatus = destination.droppableId as Task['status'];

    // Optimistic UI update
    dispatch(updateTaskStatusOptimistic({ projectId, taskId: draggableId, newStatus }));

    // Persist change to backend
    dispatch(updateTask({ ...task, status: newStatus }))
      .unwrap()
      .catch((updateError) => {
        // Revert optimistic update on error
        dispatch(updateTaskStatusOptimistic({ projectId, taskId: draggableId, newStatus: task.status })); // task.status is original status
        alert(`Failed to update task: ${updateError.message}`);
      });
  };

  if (isLoading && tasks.length === 0) return <p>Loading tasks...</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;
  if (!projectId) return <p>Select a project to view its task board.</p>;

  return (
    <div>
      <h3>Task Board for Project {projectId}</h3>
      <TaskCreateForm projectId={projectId} />
      {tasks.length === 0 && !isLoading && <p>No tasks yet. Add one to see the board!</p>}

      <DragDropContext onDragEnd={onDragEnd}>
        <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '20px' }}>
          {columnsConfig.map(column => (
            <Droppable key={column.id} droppableId={column.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`p-4 w-full md:w-1/3 bg-background rounded-lg shadow-sm border border-border-color min-h-[500px]
                              ${snapshot.isDraggingOver ? 'bg-primary-accent bg-opacity-20' : 'bg-opacity-50'}`}
                >
                  <h4 className="text-lg font-semibold text-text-primary mb-4 pb-2 border-b border-border-color">{column.title}</h4>
                  <div className="space-y-3 min-h-[400px]"> {/* Ensure placeholder has space */}
                    {tasks
                      .filter(task => task.status === column.id)
                      .map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(providedDraggable, snapshotDraggable) => (
                            <TaskItem
                              task={task}
                              isDraggable={true}
                              innerRef={providedDraggable.innerRef}
                              draggableProps={providedDraggable.draggableProps}
                              dragHandleProps={providedDraggable.dragHandleProps}
                              // Consider adding isDragging prop to TaskItem if specific styles are needed: snapshotDraggable.isDragging
                            />
                          )}
                        </Draggable>
                      ))}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
};

export default TaskBoard;
