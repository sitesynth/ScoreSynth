export const MOCK_USER = {
  name: "Mayya Aprosina",
  email: "mayya@gmail.com",
  handle: "@mayya",
  plan: "Pro" as const,
  initials: "M",
  createdAt: "1 january 2025",
};

export type Composition = {
  id: string;
  name: string;
  projectId: string;
  projectName: string;
  updatedAt: string;
};

export type Project = {
  id: string;
  name: string;
  updatedAt: string;
  compositions: Composition[];
};

export const MOCK_PROJECTS: Project[] = [
  {
    id: "v1",
    name: "v1 project",
    updatedAt: "1 hour ago",
    compositions: [
      { id: "c1", name: "v1 Composition", projectId: "v1", projectName: "v1 project", updatedAt: "1 hour ago" },
    ],
  },
  {
    id: "v2",
    name: "v2 project",
    updatedAt: "1 hour ago",
    compositions: [
      { id: "c2", name: "v2 Composition", projectId: "v2", projectName: "v2 project", updatedAt: "1 hour ago" },
    ],
  },
];

export const MOCK_RECENTS: Composition[] = MOCK_PROJECTS.flatMap(p => p.compositions);
