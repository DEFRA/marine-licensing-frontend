export const mockUsers = {
  testContactId: 'Test User',
  testContactId2: 'Another user',
  johnSmithId: 'John Smith',
  janeDoeId: 'Jane Doe'
}

export const mockDashboardServerResponse = (projects, users) => ({
  projects: projects ?? [],
  users: users ?? mockUsers
})
