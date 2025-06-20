export const queryKeys = {
    // Auth
    auth: {
        currentUser: () => ["auth", "currentUser"] as const,
    },

    // Config
    config: {
        all: () => ["config"] as const,
    },

    // Users
    users: {
        all: () => ["users"] as const,
        lists: () => [...queryKeys.users.all(), "list"] as const,
        list: (filters: Record<string, unknown>) => [...queryKeys.users.lists(), filters] as const,
        details: () => [...queryKeys.users.all(), "detail"] as const,
        detail: (id: string) => [...queryKeys.users.details(), id] as const,
        currentUser: () => [...queryKeys.users.all(), "current"] as const,
        currentUserComputers: () => [...queryKeys.users.all(), "current", "computers"] as const,
    },

    // User Project Keys
    userProjectKeys: {
        all: () => ["userProjectKeys"] as const,
        currentUser: () => [...queryKeys.userProjectKeys.all(), "current"] as const,
    },

    // Computers
    computers: {
        all: () => ["computers"] as const,
        lists: () => [...queryKeys.computers.all(), "list"] as const,
        list: (filters: Record<string, unknown>) => [...queryKeys.computers.lists(), filters] as const,
        details: () => [...queryKeys.computers.all(), "detail"] as const,
        detail: (id: string) => [...queryKeys.computers.details(), id] as const,
        attachments: (computerId: string) => [...queryKeys.computers.detail(computerId), "attachments"] as const,
        preferenceGroup: (computerId: string) =>
            [...queryKeys.computers.detail(computerId), "preferenceGroup"] as const,
    },

    // Invite Codes
    inviteCodes: {
        all: () => ["inviteCodes"] as const,
        lists: () => [...queryKeys.inviteCodes.all(), "list"] as const,
        list: (filters: Record<string, unknown>) => [...queryKeys.inviteCodes.lists(), filters] as const,
        details: () => [...queryKeys.inviteCodes.all(), "detail"] as const,
        detail: (id: string) => [...queryKeys.inviteCodes.details(), id] as const,
    },

    // Projects
    projects: {
        all: () => ["projects"] as const,
        lists: () => [...queryKeys.projects.all(), "list"] as const,
        list: (filters: Record<string, unknown>) => [...queryKeys.projects.lists(), filters] as const,
        details: () => [...queryKeys.projects.all(), "detail"] as const,
        detail: (id: string) => [...queryKeys.projects.details(), id] as const,
        attachments: (projectId: string) => [...queryKeys.projects.detail(projectId), "attachments"] as const,
    },

    // Preference Groups
    preferenceGroups: {
        all: () => ["preferenceGroups"] as const,
        lists: () => [...queryKeys.preferenceGroups.all(), "list"] as const,
        list: (filters: Record<string, unknown>) => [...queryKeys.preferenceGroups.lists(), filters] as const,
        details: () => [...queryKeys.preferenceGroups.all(), "detail"] as const,
        detail: (id: string) => [...queryKeys.preferenceGroups.details(), id] as const,
    },

    // Project Attachments
    attachments: {
        all: () => ["attachments"] as const,
        details: () => [...queryKeys.attachments.all(), "detail"] as const,
        detail: (id: string) => [...queryKeys.attachments.details(), id] as const,
    },
} as const;
