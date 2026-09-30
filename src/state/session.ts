const ACCESS_KEY = 'meridian.accessToken'
const REFRESH_KEY = 'meridian.refreshToken'

let accessToken = sessionStorage.getItem(ACCESS_KEY)
let refreshToken = localStorage.getItem(REFRESH_KEY)

export const session = {
  getAccess() {
    return accessToken
  },
  getRefresh() {
    return refreshToken
  },
  setTokens(nextAccess: string, nextRefresh: string) {
    accessToken = nextAccess
    refreshToken = nextRefresh
    sessionStorage.setItem(ACCESS_KEY, nextAccess)
    localStorage.setItem(REFRESH_KEY, nextRefresh)
  },
  clear() {
    accessToken = null
    refreshToken = null
    sessionStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
  },
}
