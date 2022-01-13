import { Clarinet, Chain, Tx } from './deps.ts'
import type { Account } from './deps.ts'

const call = (method: string, args: string[], address: string) =>
  Tx.contractCall('svg-nft', method, args, address)

Clarinet.test({
  name: 'Ensure that <...>',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { address } = accounts.get('wallet_1')!

    const { receipts } = chain.mineBlock([
      call('get-flag', [], address),
      call('say-hello', [], address),
    ])

    console.log(receipts[0].result)
    console.log(receipts[1].result)
  },
})
