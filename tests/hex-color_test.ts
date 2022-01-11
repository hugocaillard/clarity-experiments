import { Clarinet, Tx, Chain, Account, types } from './deps.ts'

const { ascii } = types

const call = (method: string, args: string[], address: string) =>
  Tx.contractCall('hex-color', method, args, address)

Clarinet.test({
  name: 'ensure that is valid does return true or false',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { address } = accounts.get('wallet_1')!
    const { receipts } = chain.mineBlock([
      call('is-valid', [ascii('FFF')], address),
      call('is-valid', [ascii('00000G')], address),
      call('is-valid', [ascii('000000')], address),
      call('is-valid', [ascii('FFFFFF')], address),
      call('is-valid', [ascii('0A1B2C')], address),
    ])

    receipts[0].result.expectBool(false)
    receipts[1].result.expectBool(false)
    receipts[2].result.expectBool(true)
    receipts[3].result.expectBool(true)
    receipts[4].result.expectBool(true)
  },
})
Clarinet.test({
  name: 'ensure that get-uint returns the value or an error',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { address } = accounts.get('wallet_1')!
    const { receipts } = chain.mineBlock([
      call('get-uint', [ascii('FFF')], address),
      call('get-uint', [ascii('00000G')], address),
      call('get-uint', [ascii('000000')], address),
      call('get-uint', [ascii('FFFFFF')], address),
    ])

    receipts[0].result.expectErr().expectUint(400)
    receipts[1].result.expectErr().expectUint(400)
    receipts[2].result.expectOk().expectUint(0)
    receipts[3].result.expectOk().expectUint(16777215)
  },
})
