import { Clarinet, Tx, types, assertEquals } from './deps.ts'
import type { Account, Chain } from './deps.ts'

const { int, list } = types

const call = (method: string, args: string[], address: string) =>
  Tx.contractCall('custom-iteration', method, args, address)

const getApi = (account: Account) => {
  const { address } = account
  return {
    getSquaredValuesNative: (nbs: number[]) =>
      call('get-squared-values-native', [list(nbs.map(int))], address),
    getSquaredValuesCustom: (nbs: number[]) =>
      call('get-squared-values-custom', [list(nbs.map(int))], address),
    getEvenValuesNative: (nbs: number[]) =>
      call('get-even-values-native', [list(nbs.map(int))], address),
    getEvenValuesCustom: (nbs: number[]) =>
      call('get-even-values-custom', [list(nbs.map(int))], address),
  }
}

// map
Clarinet.test({
  name: '`get-squared-values-native` - returns the squared list',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { getSquaredValuesNative } = getApi(accounts.get('wallet_1')!)

    const { receipts } = chain.mineBlock([
      getSquaredValuesNative([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]),
    ])

    const result = receipts[0].result.expectList()
    result.forEach((v, i) => v.expectInt(i * i))
  },
})

Clarinet.test({
  name: '`get-squared-values-custom` - returns the squared list',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { getSquaredValuesCustom } = getApi(accounts.get('wallet_1')!)

    const { receipts } = chain.mineBlock([
      getSquaredValuesCustom([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]),
    ])

    const result = receipts[0].result.expectList()
    result.forEach((v, i) => v.expectInt(i * i))
  },
})

// filter
Clarinet.test({
  name: '`get-even-values-native` - returns the list of even numbers',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { getEvenValuesNative } = getApi(accounts.get('wallet_1')!)

    const { receipts } = chain.mineBlock([
      getEvenValuesNative([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]),
    ])

    const result = receipts[0].result.expectList()
    assertEquals(
      result.map((n) => parseInt(n as string)),
      [0, 2, 4, 6, 8],
    )
  },
})

Clarinet.test({
  name: '`get-even-values-custom` - returns the list of even numbers',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { getEvenValuesCustom } = getApi(accounts.get('wallet_1')!)

    const { receipts } = chain.mineBlock([
      getEvenValuesCustom([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]),
    ])

    const result = receipts[0].result.expectList()
    assertEquals(
      result.map((n) => parseInt(n as string)),
      [0, 2, 4, 6, 8],
    )
  },
})
