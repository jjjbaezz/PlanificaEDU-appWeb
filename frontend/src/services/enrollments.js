import http from './http'

export const fetchGroupEnrollments = (groupId) =>
  http.get(`/enrollments/admin/groups/${groupId}/enrollments`)

export const adminAddStudentToGroup = (groupId, studentId) =>
  http.post(`/enrollments/admin/groups/${groupId}/enrollments`, { studentId })

export const adminRemoveEnrollment = (groupId, enrollmentId) =>
  http.delete(`/enrollments/admin/groups/${groupId}/enrollments/${enrollmentId}`)

export const fetchAvailableGroups = (params = {}) =>
  http.get('/enrollments/me/enrollments/options', { params })

export const fetchMyEnrollments = () =>
  http.get('/enrollments/me/enrollments')

export const enrollInGroup = (groupId) =>
  http.post('/enrollments/me/enrollments', { groupId })

export const cancelEnrollment = (enrollmentId) =>
  http.delete(`/enrollments/me/enrollments/${enrollmentId}`)

export default {
  fetchGroupEnrollments,
  adminAddStudentToGroup,
  adminRemoveEnrollment,
  fetchAvailableGroups,
  fetchMyEnrollments,
  enrollInGroup,
  cancelEnrollment,
}
