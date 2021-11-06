import { types } from '../deps.ts'

const { utf8, uint, none, some } = types

export function getFakePost(id: number, data: string, previous = 0, next = 0) {
  return {
    id: uint(id),
    data: utf8(data),
    previousId: previous ? some(uint(previous)) : none(),
    nextId: next ? some(uint(next)) : none(),
  }
}

export function getFakePerson(name: string, lastItemId = 0) {
  return {
    name: utf8(name),
    lastItemId: lastItemId ? some(uint(lastItemId)) : none(),
  }
}
