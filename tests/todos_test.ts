import { Clarinet, Chain, Account, Tx, types } from './deps.ts'

const { utf8, uint } = types

const call = (method: string, args: string[], address: string) =>
  Tx.contractCall('todos', method, args, address)

const getApi = (account: Account) => {
  const { address } = account
  return {
    addTodo: (data: string) => call('add-todo', [utf8(data)], address),
    deleteTodo: (id: number) => call('delete-todo', [uint(id)], address),
    markAsDone: (id: number) => call('mark-as-done', [uint(id)], address),
  }
}

Clarinet.test({
  name: '`add-item` - todo can be added',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { addTodo } = getApi(accounts.get('wallet_1')!)
    const { receipts } = chain.mineBlock([addTodo('Hello world')])

    receipts[0].result.expectOk().expectUint(0)
  },
})

Clarinet.test({
  name: '`delete-todo` - todo can be removed',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { addTodo, deleteTodo } = getApi(accounts.get('wallet_1')!)
    const { receipts } = chain.mineBlock([
      addTodo('Hello world'),
      deleteTodo(0),
    ])

    receipts[1].result.expectOk().expectBool(true)
  },
})

Clarinet.test({
  name: '`delete-todo` - todo can not be deleted by someone else',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { addTodo } = getApi(accounts.get('wallet_1')!)
    const { deleteTodo } = getApi(accounts.get('wallet_2')!)
    const { receipts } = chain.mineBlock([
      addTodo('Hello world'),
      deleteTodo(0),
    ])

    receipts[1].result.expectErr().expectUint(401)
  },
})

Clarinet.test({
  name: '`mark-as-done` - todo can completed',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { addTodo, markAsDone } = getApi(accounts.get('wallet_1')!)
    const { receipts } = chain.mineBlock([
      addTodo('Hello world'),
      markAsDone(0),
    ])

    receipts[1].result.expectOk().expectBool(true)
  },
})

Clarinet.test({
  name: '`mark-as-done` - todo can not be completed by someone else',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { addTodo } = getApi(accounts.get('wallet_1')!)
    const { markAsDone } = getApi(accounts.get('wallet_2')!)
    const { receipts } = chain.mineBlock([
      addTodo('Hello world'),
      markAsDone(0),
    ])

    receipts[1].result.expectErr().expectUint(404)
  },
})
