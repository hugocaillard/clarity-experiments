(define-read-only (is-authorised)
  (is-eq tx-sender .sender-test-b)
)
