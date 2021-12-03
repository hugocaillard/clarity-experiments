import { Clarinet, Chain, Account, Tx, types, assertEquals } from './deps.ts'

const { utf8, uint } = types

const getCall =
  (contract: string) => (method: string, args: string[], address: string) =>
    Tx.contractCall(contract, method, args, address)
const callStorage = getCall('items-storage')
const callProxyV1 = getCall('proxy-v1')
const callProxyV2 = getCall('proxy-v2')

const getApi = (account: Account) => {
  const { address } = account
  return {
    addAuthorizedContract: (contract: string) =>
      callStorage('add-authorized-contract', [contract], address),
    revokeAuthorizedContract: (contract: string) =>
      callStorage('revoke-authorized-contract', [contract], address),
    getIsAuthorized: (contract: string) =>
      callStorage('get-is-authorized', [contract], address),
    addItem: (data: string) => callStorage('add-item', [utf8(data)], address),
    updateItem: (id: number, data: string) =>
      callStorage('update-item', [uint(id), utf8(data)], address),
    deleteItem: (id: number) => callStorage('delete-item', [uint(id)], address),
    getItem: (id: number) => callStorage('get-item', [uint(id)], address),

    addItemV1: (data: string) => callProxyV1('add-item', [utf8(data)], address),
    getItemV1: (id: number) => callProxyV1('get-item', [uint(id)], address),

    addItemV2: (data: string) => callProxyV2('add-item', [utf8(data)], address),
    updateItemV2: (id: number, data: string) =>
      callProxyV2('update-item', [uint(id), utf8(data)], address),
    deleteItemV2: (id: number) =>
      callProxyV2('delete-item', [uint(id)], address),
    getItemV2: (id: number) => callProxyV2('get-item', [uint(id)], address),
  }
}

Clarinet.test({
  name: 'storage `add-authorized-contract` - owner only can add authorized-contract',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { address } = accounts.get('deployer')!
    const deployer = getApi(accounts.get('deployer')!)
    const w1 = getApi(accounts.get('wallet_1')!)

    const { receipts } = chain.mineBlock([
      deployer.getIsAuthorized('.proxy-v1'),
      w1.addAuthorizedContract('.proxy-v1'), // 401
      deployer.addAuthorizedContract('.proxy-v1'),
      deployer.getIsAuthorized('.proxy-v1'),
      w1.getIsAuthorized(`'${address}.proxy-v1`), // same as above
    ])

    receipts[0].result.expectBool(false)
    receipts[1].result.expectErr().expectUint(401)
    receipts[2].result.expectOk()
    receipts[3].result.expectBool(true)
    receipts[4].result.expectBool(true)
  },
})

Clarinet.test({
  name: 'storage `*-item` - storage items can not be directly call',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = getApi(accounts.get('deployer')!)
    const { receipts } = chain.mineBlock([
      deployer.addItem('Hello world!'),
      deployer.updateItem(1, 'Hello world!'),
      deployer.getItem(1),
      deployer.deleteItem(1),
    ])

    receipts.forEach(({ result }) => result.expectErr().expectUint(401))
  },
})

Clarinet.test({
  name: 'v1 `add-item` - contract has to be authorized to call storage',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = getApi(accounts.get('deployer')!)
    const w1 = getApi(accounts.get('wallet_1')!)
    const { receipts } = chain.mineBlock([
      w1.addItemV1('Hello world!'),
      deployer.addAuthorizedContract('.proxy-v1'),
      w1.addItemV1('Hello world!'),
      w1.getItemV1(1),
    ])
    receipts[0].result.expectErr().expectUint(401)
    receipts[1].result.expectOk()
    receipts[2].result.expectOk().expectUint(1)
    receipts[3].result.expectOk().expectTuple()
  },
})

Clarinet.test({
  name: 'proxyv2 - can crud items',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = getApi(accounts.get('deployer')!)
    const w1 = getApi(accounts.get('wallet_1')!)
    const { receipts } = chain.mineBlock([
      deployer.addAuthorizedContract('.proxy-v2'),
      w1.addItemV2('Hello again'),
      w1.updateItemV2(1, 'Hello again'),
      w1.getItemV2(1),
      w1.deleteItemV2(1),
      w1.getItemV2(1),
    ])
    receipts[0].result.expectOk()
    receipts[1].result.expectOk().expectUint(1)
    receipts[2].result.expectOk().expectBool(true)
    const result = receipts[3].result.expectOk().expectTuple()
    assertEquals(result, { data: utf8('Hello again') })
    receipts[4].result.expectOk()
    receipts[5].result.expectErr().expectUint(404)
  },
})

Clarinet.test({
  name: 'storage - can add and revoke multiple authorized contract',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = getApi(accounts.get('deployer')!)
    const w1 = getApi(accounts.get('wallet_1')!)
    const { receipts } = chain.mineBlock([
      deployer.addAuthorizedContract('.proxy-v1'),
      deployer.addAuthorizedContract('.proxy-v2'),
      w1.addItemV1('Hello world!'),
      w1.addItemV2('Hello again!'),
      deployer.revokeAuthorizedContract('.proxy-v1'),
      w1.getItemV1(1),
      w1.getItemV2(1),
      deployer.revokeAuthorizedContract('.proxy-v2'),
      w1.getItemV1(1),
      w1.getItemV2(1),
    ])
    receipts[0].result.expectOk()
    receipts[1].result.expectOk()
    receipts[2].result.expectOk().expectUint(1)
    receipts[3].result.expectOk().expectUint(2)
    receipts[4].result.expectOk().expectBool(true)
    receipts[5].result.expectErr().expectUint(401)
    receipts[6].result.expectOk().expectTuple()
    receipts[7].result.expectOk().expectBool(true)
    receipts[8].result.expectErr().expectUint(401)
    receipts[9].result.expectErr().expectUint(401)
  },
})
