import { Clarinet, Chain, Tx } from './deps.ts'
import type { Account } from './deps.ts'

const call = (method: string, args: string[], address: string) =>
  Tx.contractCall('svg-nft', method, args, address)

Clarinet.test({
  name: 'Ensure that <...>',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { address } = accounts.get('wallet_1')!

    const { receipts } = chain.mineBlock([call('get-flag', [], address)])

    receipts[0].result.expectAscii(
      "<svg id='france' width='302' height='202'><rect x='0' y='0' width='302' height='202' fill='#000000' /><g><rect x='1' y='1' width='100' height='200' fill='#002395' /><rect x='101' y='1' width='100' height='200' fill='#FFFFFF' /><rect x='201' y='1' width='100' height='200' fill='#ED2939' /></g></svg>",
    )
  },
})
