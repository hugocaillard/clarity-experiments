import { Clarinet, Chain, Account, assertEquals } from './deps.ts'
import { getApi } from './lib/api.ts'
import { getFakePost, getFakePerson } from './lib/fake.ts'

Clarinet.test({
  name: '`add-item` - item can be added',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { register, addItem } = getApi(accounts.get('wallet_1')!)

    const { receipts } = chain.mineBlock([
      register('Cohars'),
      addItem('Hello world'),
    ])

    receipts[1].result.expectOk().expectUint(1)
  },
})

Clarinet.test({
  name: '`get-item` - item can be retrieved',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { address } = accounts.get('wallet_1')!
    const { register, addItem, getItem, getMe } = getApi(
      accounts.get('wallet_1')!,
    )

    const { receipts } = chain.mineBlock([
      register('Cohars'),
      addItem('Hello world'),
      getItem(address, 1),
      getMe(),
    ])
    const result = receipts[2].result.expectOk().expectTuple()
    assertEquals(result, getFakePost(1, 'Hello world'))
    const me = receipts[3].result.expectOk().expectSome().expectTuple()
    assertEquals(me, getFakePerson('Cohars', 1))
  },
})

Clarinet.test({
  name: '`get-items` - retrieve items lists',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { address } = accounts.get('wallet_2')!
    const { register, addItem, getItems } = getApi(accounts.get('wallet_2')!)

    const { receipts } = chain.mineBlock([
      register('Cohars'),
      ...Array.from(Array(21)).map((_, i) => addItem(`Hello world ${i + 1}`)),
      getItems(address, 21),
      getItems(address, 4),
    ])

    const tenItems = receipts[22].result.expectOk().expectList()
    assertEquals(tenItems.length, 10)
    tenItems.forEach((item, i) => {
      assertEquals(
        item.expectOk().expectTuple(),
        getFakePost(
          21 - i,
          `Hello world ${21 - i}`,
          21 - (i + 1),
          i === 0 ? 0 : 21 - (i - 1),
        ),
      )
    })

    const fourItems = receipts[23].result.expectOk().expectList()
    assertEquals(fourItems.length, 4)
    fourItems.forEach((item, i) => {
      assertEquals(
        item.expectOk().expectTuple(),
        getFakePost(4 - i, `Hello world ${4 - i}`, 4 - (i + 1), 4 - (i - 1)),
      )
    })
  },
})

Clarinet.test({
  name: '`add-item` - items are well linked to each others',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { address } = accounts.get('wallet_1')!
    const { register, addItem, getItem } = getApi(accounts.get('wallet_1')!)

    chain.mineBlock([
      register('Cohars'),
      addItem('Hello world 1'),
      addItem('Hello world 2'),
      addItem('Hello world 3'),
    ])

    const { receipts } = chain.mineBlock([
      getItem(address, 1),
      getItem(address, 2),
      getItem(address, 3),
    ])

    assertEquals(
      receipts[0].result.expectOk().expectTuple(),
      getFakePost(1, 'Hello world 1', 0, 2),
    )
    assertEquals(
      receipts[1].result.expectOk().expectTuple(),
      getFakePost(2, 'Hello world 2', 1, 3),
    )
    assertEquals(
      receipts[2].result.expectOk().expectTuple(),
      getFakePost(3, 'Hello world 3', 2, 0),
    )
  },
})

Clarinet.test({
  name: '`delete-item` - item can be deleted',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { address } = accounts.get('wallet_1')!
    const { register, addItem, deleteItem, getItem } = getApi(
      accounts.get('wallet_1')!,
    )

    chain.mineBlock([register('Cohars'), addItem('Hello world')])

    const { receipts } = chain.mineBlock([deleteItem(1), getItem(address, 1)])

    receipts[0].result.expectOk().expectBool(true)
    receipts[1].result.expectErr().expectUint(404)
  },
})

Clarinet.test({
  name: '`delete-item` - impacts user lastPostId',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { register, addItem, deleteItem, getMe } = getApi(
      accounts.get('wallet_1')!,
    )

    chain.mineBlock([
      register('Cohars'),
      addItem('Hello world'),
      addItem('Hello world'),
    ])

    const { receipts } = chain.mineBlock([getMe(), deleteItem(2), getMe()])

    const me = receipts[0].result.expectOk().expectSome().expectTuple()
    assertEquals(me, getFakePerson('Cohars', 2))
    const meAfter = receipts[2].result.expectOk().expectSome().expectTuple()
    assertEquals(meAfter, getFakePerson('Cohars', 1))
  },
})

Clarinet.test({
  name: '`delete-item` - relinks previous and next posts',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { address } = accounts.get('wallet_1')!
    const { register, addItem, deleteItem, getItem } = getApi(
      accounts.get('wallet_1')!,
    )

    chain.mineBlock([
      register('Cohars'),
      addItem('Hello world'),
      addItem('Hello world'),
      addItem('Hello world'),
      addItem('Hello world'),
      deleteItem(2),
    ])

    const { receipts } = chain.mineBlock([
      getItem(address, 1),
      getItem(address, 3),
    ])

    const post1 = receipts[0].result.expectOk().expectTuple()
    const post2 = receipts[1].result.expectOk().expectTuple()
    assertEquals(post1, getFakePost(1, 'Hello world', 0, 3))
    assertEquals(post2, getFakePost(3, 'Hello world', 1, 4))
  },
})
