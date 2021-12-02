import { Clarinet, Chain, Account, Tx, types } from './deps.ts'

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
    // addItem: (data: string) => callStorage('add-item', [utf8(data)], address),
    // updateItem: (id: number, data: string) =>
    //   callStorage('update-item', [uint(id), utf8(data)], address),
    // deleteItem: (id: number) => callStorage('delete-item', [uint(id)], address),
    // getItem: (id: number) => callStorage('get-item', [uint(id)], address),

    addItemV1: (data: string) => callProxyV1('add-item', [utf8(data)], address),
    updateItemV1: (id: number, data: string) =>
      callProxyV1('update-item', [uint(id), utf8(data)], address),

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
    const { addAuthorizedContract: add1 } = getApi(accounts.get('wallet_1')!)
    const { addAuthorizedContract: addDeployer, getIsAuthorized } = getApi(
      accounts.get('deployer')!,
    )

    const { receipts } = chain.mineBlock([
      getIsAuthorized('.proxy-v1'),
      add1('.proxy-v1'),
      addDeployer('.proxy-v1'),
      getIsAuthorized('.proxy-v1'),
    ])

    receipts[0].result.expectBool(false)
    receipts[1].result.expectErr().expectUint(401)
    receipts[2].result.expectOk()
    receipts[3].result.expectBool(true)
  },
})

Clarinet.test({
  name: 'v1 `add-item` - contract has to be authorized to call storage',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { addItemV1 } = getApi(accounts.get('wallet_1')!)
    const { receipts } = chain.mineBlock([addItemV1('Hello world!')])

    receipts[0].result.expectErr().expectUint(401)
  },
})
