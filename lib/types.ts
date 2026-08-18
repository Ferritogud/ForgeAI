export interface Task {
  title: string;
  done: boolean;
}

export interface Milestone {
  title: string;
  tasks: Task[];
  dueWeek: number;
}

export interface Roadmap {
  milestones: Milestone[];
}

export interface Project {
  id: string;
  name: string;
  goal: string;
  milestones: Milestone[];
  createdAt: string;
}
