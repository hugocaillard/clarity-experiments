(define-read-only (call-contract-a-1)
  ;; this will return false because in sender-test-a,
  ;; tx-sender will be equal to whatever calls this function
  (contract-call? .sender-test-a is-authorised)
)
(define-read-only (call-contract-a-2)
  ;; this will return true since tx-sender will represent this contract
  (as-contract (contract-call? .sender-test-a is-authorised))
)
