export function logout() {
  localStorage.removeItem('lookogs_token')
  window.location.reload()
}