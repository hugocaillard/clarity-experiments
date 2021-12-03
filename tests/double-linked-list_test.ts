import { Clarinet, Chain, Account, assertEquals, Tx, types } from './deps.ts'

const { utf8, uint, some, none } = types

const call = (method: string, args: string[], address: string) =>
  Tx.contractCall('double-linked-list', method, args, address)

const getApi = (account: Account) => {
  const { address } = account
  return {
    addItem: (data: string) => call('add-item', [utf8(data)], address),
    deleteItem: (id: number) => call('delete-item', [uint(id)], address),
    getItem: (id: number) => call('get-item', [uint(id)], address),
    getItems: (id: number) => call('get-items', [uint(id)], address),
  }
}

function getFakeItem(
  id: number,
  data: string,
  author: string,
  previous = 0,
  next = 0,
) {
  return {
    id: uint(id),
    author: author,
    data: utf8(data),
    previousId: previous ? some(uint(previous)) : none(),
    nextId: next ? some(uint(next)) : none(),
  }
}

Clarinet.test({
  name: '`add-item` - item can be added',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { addItem } = getApi(accounts.get('wallet_1')!)
    const { receipts } = chain.mineBlock([addItem('Hello world')])

    receipts[0].result.expectOk().expectUint(1)
  },
})

Clarinet.test({
  name: '`get-item` - item can be retrieved',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { address } = accounts.get('wallet_1')!
    const { addItem, getItem } = getApi(accounts.get('wallet_1')!)

    const { receipts } = chain.mineBlock([addItem('Hello world'), getItem(1)])
    const result = receipts[1].result.expectOk().expectTuple()
    assertEquals(result, getFakeItem(1, 'Hello world', address))
  },
})

Clarinet.test({
  name: '`get-items` - retrieve items lists',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { address } = accounts.get('wallet_2')!
    const { addItem, getItems } = getApi(accounts.get('wallet_2')!)

    const { receipts } = chain.mineBlock([
      ...Array.from(Array(41)).map((_, i) => addItem(`Hello world`)),
      getItems(41),
      getItems(4),
    ])

    const tenItems = receipts[41].result.expectOk().expectList()
    assertEquals(tenItems.length, 10)

    const fourItems = receipts[42].result.expectOk().expectList()
    assertEquals(fourItems.length, 4)
    fourItems.forEach((item, i) => {
      assertEquals(
        item.expectOk().expectTuple(),
        getFakeItem(4 - i, `Hello world`, address, 4 - (i + 1), 4 - (i - 1)),
      )
    })
  },
})

Clarinet.test({
  name: '`add-item` - items are well linked to each others',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { address } = accounts.get('wallet_1')!
    const { addItem, getItem } = getApi(accounts.get('wallet_1')!)
    chain.mineBlock([
      addItem('Hello world 1'),
      addItem('Hello world 2'),
      addItem('Hello world 3'),
    ])
    const { receipts } = chain.mineBlock([getItem(1), getItem(2), getItem(3)])

    assertEquals(
      receipts[0].result.expectOk().expectTuple(),
      getFakeItem(1, 'Hello world 1', address, 0, 2),
    )
    assertEquals(
      receipts[1].result.expectOk().expectTuple(),
      getFakeItem(2, 'Hello world 2', address, 1, 3),
    )
    assertEquals(
      receipts[2].result.expectOk().expectTuple(),
      getFakeItem(3, 'Hello world 3', address, 2, 0),
    )
  },
})

Clarinet.test({
  name: '`delete-item` - item can be deleted',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { addItem, deleteItem, getItem } = getApi(accounts.get('wallet_1')!)
    chain.mineBlock([addItem('Hello world')])
    const { receipts } = chain.mineBlock([deleteItem(1), getItem(1)])

    receipts[0].result.expectOk().expectBool(true)
    receipts[1].result.expectErr().expectUint(404)
  },
})

Clarinet.test({
  name: '`delete-item` - relinks previous and next posts',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { address } = accounts.get('wallet_1')!
    const { addItem, deleteItem, getItem, getItems } = getApi(
      accounts.get('wallet_1')!,
    )
    chain.mineBlock([
      addItem('Hello world'),
      addItem('Hello world'),
      addItem('Hello world'),
      addItem('Hello world'),
      deleteItem(2),
    ])
    const { receipts } = chain.mineBlock([getItem(1), getItem(3), getItems(4)])

    const post1 = receipts[0].result.expectOk().expectTuple()
    const post2 = receipts[1].result.expectOk().expectTuple()
    assertEquals(post1, getFakeItem(1, 'Hello world', address, 0, 3))
    assertEquals(post2, getFakeItem(3, 'Hello world', address, 1, 4))

    const list = receipts[2].result.expectOk().expectList()
    assertEquals(list.length, 3)
    assertEquals(
      list[0].expectOk().expectTuple(),
      getFakeItem(4, 'Hello world', address, 3),
    )
    assertEquals(
      list[1].expectOk().expectTuple(),
      getFakeItem(3, 'Hello world', address, 1, 4),
    )
    assertEquals(
      list[2].expectOk().expectTuple(),
      getFakeItem(1, 'Hello world', address, 0, 3),
    )
  },
})
