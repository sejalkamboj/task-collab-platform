export interface User {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  avatar_url?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Board {
  id: string;
  title: string;
  description?: string;
  owner_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface BoardMember {
  board_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  joined_at: Date;
}

export interface List {
  id: string;
  board_id: string;
  title: string;
  position: number;
  created_at: Date;
  updated_at: Date;
}

export interface Task {
  id: string;
  list_id: string;
  title: string;
  description?: string;
  position: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface TaskAssignee {
  task_id: string;
  user_id: string;
  assigned_at: Date;
}

export interface Activity {
  id: string;
  board_id: string;
  user_id?: string;
  action_type: string;
  entity_type: 'task' | 'list' | 'board';
  entity_id?: string;
  details?: any;
  created_at: Date;
}

// DTOs for API requests
export interface CreateUserDTO {
  email: string;
  password: string;
  full_name: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface CreateBoardDTO {
  title: string;
  description?: string;
}

export interface UpdateBoardDTO {
  title?: string;
  description?: string;
}

export interface CreateListDTO {
  title: string;
  position: number;
}

export interface UpdateListDTO {
  title?: string;
  position?: number;
}

export interface CreateTaskDTO {
  title: string;
  description?: string;
  position: number;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
}

export interface UpdateTaskDTO {
  title?: string;
  description?: string;
  position?: number;
  list_id?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
}

export interface AuthPayload {
  userId: string;
  email: string;
}

// Extended types with relations
export interface TaskWithDetails extends Task {
  assignees?: User[];
}

export interface ListWithTasks extends List {
  tasks: TaskWithDetails[];
}

export interface BoardWithDetails extends Board {
  lists: ListWithTasks[];
  members: User[];
  owner: User;
}
