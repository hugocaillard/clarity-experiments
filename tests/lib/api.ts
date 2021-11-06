import { Tx, Account, types } from '../deps.ts'

const { utf8, uint, principal } = types

const call = (method: string, args: string[], address: string) =>
  Tx.contractCall('double-linked-list', method, args, address)

export const getApi = (account: Account) => {
  const { address } = account
  return {
    register: (name: string) => call('register', [utf8(name)], address),
    getMe: () => call('get-me', [], address),
    addItem: (data: string) => call('add-item', [utf8(data)], address),
    deleteItem: (id: number) => call('delete-item', [uint(id)], address),
    getItem: (addr: string, id: number) =>
      call('get-item', [principal(addr), uint(id)], address),
    getItems: (addr: string, id: number) =>
      call('get-items', [principal(addr), uint(id)], address),
  }
}
