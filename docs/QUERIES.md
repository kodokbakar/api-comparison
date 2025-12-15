REST calls

Project Detail:
GET /api/v0/projects/:id
GET /api/v0/projects/:id/tasks?take=50&skip=0

Task Detail:
GET /api/v0/tasks/:id
GET /api/v0/tasks/:id/project

GraphQL queries

Sample IDs:
query { sample { projectId taskId } }

Project Detail:
query ProjectDetail($id: ID!, $skip: Int!, $take: Int!) {
  projectDetail(id: $id, skip: $skip, take: $take) {
    project { id name description taskCount }
    tasks { projectId skip take items { id title status priority dueDate } }
  }
}

Task Detail:
query TaskDetail($id: ID!) {
  taskDetail(id: $id) {
    task { id projectId title status priority dueDate }
    project { id name description taskCount }
  }
}
