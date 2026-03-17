// ─── English translations (canonical — defines the Translations type) ──────────

export const en = {

  // ── Navigation ─────────────────────────────────────────────────────────────
  nav: {
    dashboard:     "Dashboard",
    pipeline:      "Pipeline",
    leaderboard:   "Leaderboard",
    settings:      "Settings",
    users:         "Users",
    squads:        "Squads",
    pipelineConfig:"Pipeline",
    gamification:  "Gamification",
    signOut:       "Sign out →",
    collapseHint:  "Collapse sidebar (⌘B)",
    expandHint:    "Expand sidebar (⌘B)",
    devArena:      "DevArena",
  },

  // ── Common labels & actions ─────────────────────────────────────────────────
  common: {
    save:          "Save Changes",
    cancel:        "Cancel",
    edit:          "Edit",
    delete:        "Delete",
    upload:        "Upload",
    search:        "Search",
    open:          "Open ↗",
    online:        "Online",
    offline:       "Offline",
    filtered:      "filtered",
    days:          "days",
    tasksPerWeek:  "tasks/wk",
    noData:        "—",
    add:           "Add",
    close:         "Close",
    loading:       "Loading…",
  },

  // ── Relative time ───────────────────────────────────────────────────────────
  time: {
    justNow:    "just now",
    minutesAgo: "m ago",
    hoursAgo:   "h ago",
    daysAgo:    "d ago",
  },

  // ── Notifications ───────────────────────────────────────────────────────────
  notifications: {
    title:       "Notifications",
    markAllRead: "Mark all read",
    dismissAll:  "Dismiss all",
    empty:       "No notifications yet",
    emptyHint:   "@mention someone in a task comment to notify them",
  },

  // ── General Dashboard ───────────────────────────────────────────────────────
  dashboard: {
    title:    "General Dashboard",
    subtitle: "Overview of your development ecosystem and performance metrics.",
    exportReport: "Export Report",
    allSquads:    "All Squads",
    last7days:    "Last 7 days",
    last30days:   "Last 30 days",
    lastQuarter:  "Last quarter",
    custom:       "Custom",
    startDate:    "Start Date",
    endDate:      "End Date",
    // KPI labels
    activeProjects:       "Active Projects",
    projectsDelivered:    "Projects Delivered",
    avgDevTime:           "Avg Development Time",
    tasksCompleted:       "Tasks Completed",
    tasksOnTrack:         "Tasks On Track",
    estimationAccuracy:   "Estimation Accuracy",
    bugRate:              "Bug Rate",
    // KPI subtexts
    activeProjectsDesc:     "in active development (WIP)",
    projectsDeliveredDesc:  "completed in selected period",
    avgDevTimeDesc:         "from start to delivery",
    tasksCompletedDesc:     "done within selected period",
    tasksOnTrackDesc:       "within time estimate (active tasks)",
    estimationAccuracyDesc: "estimated vs actual time on done tasks",
    // Throughput
    throughput:     "Throughput",
    throughputDesc: "Tasks completed per week",
    doneTasks:      "done tasks",
    // Pipeline distribution
    pipelineDistribution: "Pipeline Distribution",
    bottleneck:           "Bottleneck:",
    otherStages:          "Other stages",
    // WIP
    wip:     "WIP",
    wipDesc: "projects in active development",
    project: "project",
    projects:"projects",
    // Recent projects table
    recentProjects:       "Recent Projects",
    noActiveProjects:     "No active projects",
    noCompletedProjects:  "No completed projects in range",
    tableProject:  "Project Name",
    tableLead:     "Lead Developer",
    tableSquad:    "Squad",
    tableStatus:   "Status",
    tableVelocity: "Velocity",
  },

  // ── Product Pipeline ────────────────────────────────────────────────────────
  pipeline: {
    title:    "Product Pipeline",
    subtitle: "From idea to delivery — track every initiative through the full lifecycle.",
    newItem:            "New Item",
    searchPlaceholder:  "Search projects…",
    activeItem:         "active item",
    activeItems:        "active items",
    // Stage labels
    stages: {
      opportunity:        "Opportunity",
      ideation:           "Ideation",
      technicalDesign:    "Technical Design",
      activeDevelopment:  "Active Development",
      release:            "Release",
      iteration:          "Iteration",
      cleanUp:            "Clean Up",
      completed:          "Completed",
    },
    // New/edit form
    form: {
      title:       "Title",
      description: "Description",
      squad:       "Squad",
      impact:      "Impact",
      noSquad:     "— No squad —",
      startDate:   "Start Date",
      targetEnd:   "Target End Date",
      cancel:      "Cancel",
      create:      "Create Item",
    },
  },

  // ── Tasks ───────────────────────────────────────────────────────────────────
  tasks: {
    // Board column headers (TaskBoard)
    columns: {
      backlog:         "Backlog",
      inProgress:      "In Progress",
      review:          "Review",
      readyToRelease:  "Ready to Release",
      done:            "Done",
    },
    // Status values (used in dropdowns / badges)
    statuses: {
      backlog:         "Backlog",
      inProgress:      "In Progress",
      review:          "Review",
      readyToRelease:  "Ready to Release",
      done:            "Done",
    },
    priorities: {
      urgent: "Urgent",
      high:   "High",
      medium: "Medium",
      low:    "Low",
    },
    types: {
      task:      "Task",
      bug:       "Bug",
      iteration: "Iteration",
    },
    // Quick-advance button labels (ActiveTasksBoard)
    advance: {
      toReview:          "Review",
      toReadyToRelease:  "Ready to Release",
      done:              "Done ✓",
    },
    searchPlaceholder: "Search tasks…",
    metricsBar: {
      onTimeRate:  "On-Time Rate",
      tasks:       "Tasks",
      done:        "done",
      onTime:      "on time",
      late:        "late",
    },
    // Task detail modal labels
    detail: {
      newTask:           "New Task",
      editTask:          "Edit Task",
      title:             "Title",
      description:       "Description",
      assignedTo:        "Assigned To",
      unassigned:        "Unassigned",
      status:            "Status",
      priority:          "Priority",
      type:              "Type",
      targetEndDate:     "Target End Date",
      startDate:         "Start Date (auto-set)",
      completionDate:    "Completion Date (auto-set)",
      actualTime:        "Actual Time (hrs)",
      estimatedTime:     "Estimated Time (hrs)",
      comments:          "Comments",
      addComment:        "Add a comment…",
      post:              "Post",
      save:              "Save",
      deleteTask:        "Delete Task",
      noComments:        "No comments yet",
      noCommentsHint:    "Use @name to mention a teammate",
      createTask:         "Create Task",
      taskDetailsSection: "Task Details",
    },
    // Active tasks board
    activeBoard: {
      title:    "Active Tasks",
      subtitle: "Tasks currently in progress, review or ready to release",
      noTasks:  "No active tasks",
      allSquads:"All Squads",
      allUsers: "All Members",
    },
  },

  // ── Project Detail ──────────────────────────────────────────────────────────
  projectDetail: {
    overallProgress:   "Overall Progress",
    milestones:        "Milestones completed",
    leadTime:          "Lead Time",
    ofPlanned:         "of {n} planned",
    timelineUsed:      "% of timeline used",
    onTimeDelivery:    "On-Time Delivery",
    onTime:            "on time",
    late:              "late",
    noTasksWithDates:  "No completed tasks with target dates yet",
    team:              "Project Team",
    noSquad:           "No squad assigned",
    details:           "Project Details",
    lead:              "Lead",
    squad:             "Squad",
    start:             "Start",
    targetEnd:         "Target End",
    completedDate:     "Completed",
    documentation:     "Project Documentation",
    noDocs:            "No documentation linked",
    additionalDocs:    "Additional Documents",
    noAttachments:     "No documents attached yet",
    attachmentHint:    "Upload PDF, DOCX, PPTX, PNG or JPG (max 10 MB)",
    activity:          "Activity",
    badFileType:       "Unsupported file type. Allowed: PDF, DOCX, PPTX, PNG, JPG.",
    fileTooLarge:      "File is too large. Maximum size is 10 MB.",
    // Activity feed entries (static mock)
    activityStatus:    "Project moved to",
    activityTask:      "New task added by",
    activityPrd:       "PRD review complete",
    activity2hAgo:     "2h ago",
    activity1dAgo:     "1d ago",
    activity3dAgo:     "3d ago",
    taskBoard:         "Task Board",
    taskBoardSubtitle: "Manage and track tasks for this project",
  },

  // ── Leaderboard / Gamification ──────────────────────────────────────────────
  leaderboard: {
    title:    "🏆 Leaderboard",
    subtitle: "Points are awarded for completing tasks, beating estimates, and penalised for bugs and delays. Iterations never penalise developers.",
    topDevs:          "Top Developers Spotlight",
    topSquad:         "Top Squad of the Week",
    fastestSquad:     "Fastest Squad",
    tasksCompleted:   "Tasks Completed (All Squads)",
    weekEvaluated:    "Week evaluated:",
    mondaySunday:     "(Monday–Sunday)",
    thisWeek:         "This week · all squads",
    pts:              "pts",
    noData:           "No data yet",
  },

  // ── Settings ─────────────────────────────────────────────────────────────────
  settings: {
    users: {
      title:        "Users",
      addUser:      "Add User",
      name:         "Name",
      email:        "Email",
      password:     "Password",
      role:         "Role",
      position:     "Position",
      squad:        "Squad",
      avatar:       "Avatar",
      uploadAvatar: "Upload",
      actions:      "Actions",
      noSquad:      "No squad",
      jpgPngOnly:   "Only JPG, PNG, and WEBP files are accepted.",
      imageTooLarge:"Image must be smaller than 2 MB.",
      saveUser:     "Save",
      deleteUser:   "Delete",
      editUser:     "Edit",
      confirmDelete:"Delete this user?",
    },
    squads: {
      title:      "Squads",
      addSquad:   "Add Squad",
      squadName:  "Squad Name",
      members:    "Members",
      noSquads:   "No squads yet",
      saveSquad:  "Save",
      deleteSquad:"Delete",
      editSquad:  "Edit",
    },
    pipeline: {
      title: "Pipeline Settings",
      description: "Pipeline stages define the lifecycle of every project in DevArena. You can edit display labels below. Stage order and identifiers are fixed to maintain consistency across the platform.",
      stageCategories: "Stage Categories:",
      active:      "Active",
      wip:         "WIP",
      relevant:    "Relevant",
      categoryHint:"Active: counts toward project KPIs · WIP: in active development · Relevant: shown in pipeline chart",
      colHash:          "#",
      colStageId:       "Stage ID",
      colDisplayLabel:  "Display Label",
      colCategories:    "Categories",
      colActions:       "Actions",
      saveLabel:        "Save",
    },
    gamification: {
      title:      "Gamification Config",
      ruleTask:   "Task Complete",
      ruleTaskDesc:"Awarded once for every task that is marked as done.",
      ruleOnTime: "On Time Completion",
      ruleOnTimeDesc:"Awarded when a task is done and actual hours ≤ estimated hours.",
      ruleDelay:  "Delay Penalty",
      ruleDelayDesc:"Applied when a done task exceeds its estimate. Not applied in Iteration.",
      ruleBug:    "Bug Penalty",
      ruleBugDesc:"Applied at squad level — one penalty per open bug in the squad's projects.",
      points:     "points",
      save:       "Save Config",
    },
  },

  // ── Auth / Login ─────────────────────────────────────────────────────────────
  auth: {
    welcome:            "Welcome back",
    subtitle:           "Productivity and Gamification for Melonn Squads",
    email:              "Email Address",
    password:           "Password",
    forgotPassword:     "Forgot password?",
    remember:           "Remember this device",
    invalidCredentials: "Invalid email or password.",
    signingIn:          "Signing in…",
    signIn:             "Sign In",
    orContinueWith:     "Or continue with",
    google:             "Google",
    github:             "GitHub",
    noAccount:          "Don't have an account?",
    joinSquad:          "Join the squad",
    demoCredentials:    "Demo credentials",
    demoEmail:          "Email:",
    demoPassword:       "Password:",
  },

  // ── Edit Project Modal ───────────────────────────────────────────────────────
  editProject: {
    title:              "Edit Project",
    titleField:         "Title",
    titleRequired:      "Title *",
    description:        "Description",
    squad:              "Squad",
    impact:             "Impact",
    noSquad:            "— No squad —",
    startDate:          "Start Date",
    targetEndDate:      "Target End Date",
    completionDate:     "Completion Date",
    completionOptional: "(optional)",
    prdUrl:             "PRD URL",
    oddUrl:             "ODD URL",
    trdUrl:             "TRD URL",
    saveChanges:        "Save Changes",
    cancel:             "Cancel",
  },

  // ── Subtasks ───────────────────────────────────────────────────────────────
  subtasks: {
    title:          "Subtasks",
    add:            "Add Subtask",
    noSubtasks:     "No subtasks yet",
    noSubtasksHint: "Break this task into smaller steps",
    placeholder:    "Subtask title…",
    todo:           "To Do",
    inProgress:     "In Progress",
    done:           "Done",
    progress:       "{done} of {total} done",
    assignedTo:     "Assignee",
    description:    "Description",
    save:           "Add",
    cancel:         "Cancel",
    deleteSubtask:  "Delete subtask",
  },

  // ── Profile ─────────────────────────────────────────────────────────────────
  profile: {
    title:             "Profile",
    profileInfo:       "Profile Information",
    name:              "Name",
    email:             "Email",
    role:              "Role",
    squad:             "Squad",
    uploadAvatar:      "Upload Avatar",
    changePassword:    "Change Password",
    currentPassword:   "Current Password",
    newPassword:       "New Password",
    confirmPassword:   "Confirm New Password",
    updatePassword:    "Update Password",
    saveChanges:       "Save Changes",
    passwordMismatch:  "New passwords do not match",
    incorrectPassword: "Current password is incorrect",
    passwordUpdated:   "Password updated successfully",
    profileUpdated:    "Profile updated",
    readOnly:          "Read-only",
  },

} as const;

// Converts all string literal leaf types to `string` so translated files
// aren't constrained to use the exact same English literal values.
type Stringify<T> = {
  [K in keyof T]: T[K] extends string
    ? string
    : T[K] extends Record<string, unknown>
    ? Stringify<T[K]>
    : T[K];
};

export type Translations = Stringify<typeof en>;
