export enum Role {
  USER = 'user',
  ADMIN = 'admin',
  TEAM_LEAD = 'team_lead',
  MANAGER = 'manager',
}

export enum Permission {
  CREATE_TASK = 'create:task',
  READ_TASK = 'read:task',
  UPDATE_TASK = 'update:task',
  DELETE_TASK = 'delete:task',
  MANAGE_USERS = 'manage:users',
  MANAGE_TEAMS = 'manage:teams',
  VIEW_ANALYTICS = 'view:analytics',
  MANAGE_AUTOMATIONS = 'manage:automations',
  MANAGE_WEBHOOKS = 'manage:webhooks',
  MANAGE_SETTINGS = 'manage:settings',
}
