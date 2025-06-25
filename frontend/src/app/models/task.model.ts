export class Task {
  _id!: string;
  title!: string;
  _listId!: string;
  completed!: boolean;
  priority?: number;
  dueDate?: string;
  applied?: boolean;

  constructor(init?: Partial<Task>) {
    Object.assign(this, init);
  }
}
