import client from './client'

export const auth = {
  login: (data) => client.post('/auth/login', data),
  register: (data) => client.post('/auth/register', data),
}

const crud = (resource) => ({
  list: (params) => client.get(`/${resource}`, { params }),
  get: (id) => client.get(`/${resource}/${id}`),
  create: (data) => client.post(`/${resource}`, data),
  update: (id, data) => client.put(`/${resource}/${id}`, data),
  remove: (id) => client.delete(`/${resource}/${id}`),
  count: (params) => client.get(`/count/${resource}`, { params }),
})

export const users        = crud('users')
export const languages    = { ...crud('languages'), active: () => client.get('/active/languages') }
export const translate    = (key, lang) => client.get('/t', { params: { key, lang } })
export const categories   = {
  ...crud('categories'),
  active: (lang) => client.get('/active/categories', { params: lang ? { lang } : {} }),
}
export const countries    = {
  ...crud('countries'),
  active: (parentId, lang) => {
    const params = {}
    if (parentId) params.parent_id = parentId
    if (lang) params.lang = lang
    return client.get('/active/countries', { params })
  },
}
export const translations = crud('translations')
export const vacancies    = { ...crud('vacancies'), getBySlug: (slug) => client.get(`/vacancies/${slug}`) }
export const resumes      = { ...crud('resumes'),   getBySlug: (slug) => client.get(`/resumes/${slug}`) }
export const comments     = crud('comments')

export const upload = (file) => {
  const fd = new FormData()
  fd.append('photo', file)
  return client.post('/upload', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
