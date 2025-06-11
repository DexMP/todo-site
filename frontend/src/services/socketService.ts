import { io, Socket } from 'socket.io-client';
import { store, AppDispatch } from '../app/store'; // To dispatch actions
import { Task, updateTask as updateTaskAction, createTask as createTaskAction, deleteTask as deleteTaskAction } from '../features/tasks/taskSlice';
import { ProjectMember, addProjectMember as addProjectMemberAction, removeProjectMember as removeProjectMemberAction, updateProjectMemberRole as updateProjectMemberRoleAction } from '../features/projects/projectSlice';
import { toast } from 'react-toastify';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001'; // Adjust if your backend is elsewhere

let socket: Socket | null = null;

export const initSocket = (token: string | null) => {
  if (socket || !token) {
    // console.log('Socket already initialized or no token provided.');
    return;
  }

  console.log('Initializing socket connection with token...');
  socket = io(SOCKET_URL, {
    auth: { token },
    // autoConnect: false, // Can be true if you want to connect immediately
  });

  socket.on('connect', () => {
    console.log('Socket connected:', socket?.id);
    // Note: Joining project rooms is handled by the backend on connection based on token
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
    toast.error(`Socket connection error: ${error.message}`);
  });

  // --- Task Event Handlers ---
  socket.on('task_created', (data: { projectId: string; task: Task }) => {
    console.log('Event: task_created', data);
    store.dispatch(createTaskAction.fulfilled(data.task, 'socket/task_created', data.task)); // Manually fulfill if thunk not used directly
    toast.success(`New task "${data.task.title}" added to project ${data.projectId}`);
  });

  socket.on('task_updated', (data: { projectId: string; task: Task }) => {
    console.log('Event: task_updated', data);
    store.dispatch(updateTaskAction.fulfilled(data.task, 'socket/task_updated', data.task));
    toast.info(`Task "${data.task.title}" in project ${data.projectId} updated.`);
  });

  socket.on('task_deleted', (data: { projectId: string; taskId: string }) => {
    console.log('Event: task_deleted', data);
    store.dispatch(deleteTaskAction.fulfilled(data, 'socket/task_deleted', data));
    toast.warn(`Task (ID: ${data.taskId}) deleted from project ${data.projectId}.`);
  });

  // --- Project Member Event Handlers ---
  socket.on('member_added', (data: { projectId: string; member: ProjectMember }) => {
    console.log('Event: member_added', data);
    store.dispatch(addProjectMemberAction.fulfilled(data.member, 'socket/member_added', {projectId: data.projectId, email: data.member.email || '', role: data.member.role as 'editor' | 'viewer'}));
    toast.info(`User ${data.member.username || data.member.email} added to project ${data.projectId}.`);
  });

  socket.on('member_removed', (data: { projectId: string; userId: string }) => {
    console.log('Event: member_removed', data);
    store.dispatch(removeProjectMemberAction.fulfilled(data, 'socket/member_removed', data));
    toast.warn(`A member was removed from project ${data.projectId}.`);
  });

  socket.on('member_role_updated', (data: { projectId: string; member: ProjectMember }) => {
    console.log('Event: member_role_updated', data);
     store.dispatch(updateProjectMemberRoleAction.fulfilled(data.member, 'socket/member_role_updated', {projectId: data.projectId, userId: data.member.user_id, role: data.member.role as 'editor' | 'viewer'}));
    toast.info(`Role updated for ${data.member.username || data.member.email} in project ${data.projectId}.`);
  });

  // General notification from backend (example)
  socket.on('notification', (data: { message: string; type: 'info' | 'error' | 'success' }) => {
    console.log('Event: notification', data);
    switch (data.type) {
      case 'info': toast.info(data.message); break;
      case 'success': toast.success(data.message); break;
      case 'error': toast.error(data.message); break;
      default: toast(data.message);
    }
  });


  return socket;
};

export const getSocket = () => {
  if (!socket) {
    // console.warn('Socket not initialized. Call initSocket first, typically after login.');
    // You might want to auto-initialize here if a token is available from Redux store,
    // but that could create circular dependencies if not handled carefully.
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    console.log('Disconnecting socket...');
    socket.disconnect();
    socket = null;
  }
};

// Example function to emit an event (though most emits will be from backend)
// export const sendSocketMessage = (eventName: string, data: any) => {
//   if (socket) {
//     socket.emit(eventName, data);
//   } else {
//     console.error('Socket not initialized. Cannot send message.');
//   }
// };

// When user logs in, call initSocket(token).
// When user logs out, call disconnectSocket().
// When user's projects change, backend should handle re-joining rooms.
// Client might also request to join rooms explicitly if needed via an emitted event.
