(define-public (add-item (data (string-utf8 100)))
  (as-contract (contract-call? .items-storage add-item data))
)

(define-read-only (get-item (id uint))
  (as-contract (contract-call? .items-storage get-item id))
)
