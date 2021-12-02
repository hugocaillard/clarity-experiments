(define-public (add-item (data (string-utf8 100)))
  (as-contract (contract-call? .items-storage add-item data))
)

(define-read-only (get-item (id uint))
  (as-contract (contract-call? .items-storage get-item id))
)

(define-public (update-item (id uint) (data (string-utf8 100)))
  (as-contract (contract-call? .items-storage update-item id data))
)

(define-public (delete-item (id uint))
  (as-contract (contract-call? .items-storage delete-item id))
)
