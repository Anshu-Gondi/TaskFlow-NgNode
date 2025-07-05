export class Task {
  _id!: string;
  title!: string;
  _listId!: string;
  completed!: boolean;
  priority?: number;
  dueDate?: string;
  applied?: boolean;
  priorityLabel?: 'low' | 'medium' | 'high' | 'urgent';
  _teamId?: string;
  sortOrder?: number;

  constructor(init?: Partial<Task>) {
    Object.assign(this, init);
  }
}
