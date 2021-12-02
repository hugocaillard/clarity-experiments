;; storage-contract
;; experiment with proxy contract
;; where one holds the data
;; and others can call it

;; authorization logics
(define-data-var owner principal tx-sender)
(define-map authorized-contracts principal bool)

(define-private (is-owner) 
  (ok (asserts! (is-eq tx-sender (var-get owner)) ERR_UNAUTHORIZED))
)

(define-private (is-authorized)
  (ok (asserts!
    (is-eq true (default-to false (map-get? authorized-contracts tx-sender)))
    ERR_UNAUTHORIZED
  ))
)

(define-public (add-authorized-contract (new-contract principal))
  (begin
    (try! (is-owner))
    (ok (map-insert authorized-contracts new-contract true))
  )
)

(define-public (revoke-authorized-contract (contract-name principal))
  (begin
    (try! (is-owner))
    (ok (map-delete authorized-contracts contract-name))
  )
)

(define-read-only (get-is-authorized (contract principal))
  (default-to false (map-get? authorized-contracts contract))
)

;; storage logic
(define-data-var uniq-id uint u1)

(define-map items uint {
  data: (string-utf8 100)
})

(define-public (add-item (data (string-utf8 100)))
  (let ((id (var-get uniq-id)))
    (try! (is-authorized))
    (map-insert items id { data: data })
    (var-set uniq-id (+ id u1))
    (ok id)
  )
)

(define-read-only (get-item (id uint))
  (begin
    (try! (is-authorized))
    (ok (unwrap! (map-get? items id) ERR_NOT_FOUND))
  )
)

(define-public (update-item (id uint) (data (string-utf8 100)))
  (let ((item (unwrap! (map-get? items id) ERR_NOT_FOUND)))
    (try! (is-authorized))
    (ok (map-set items id (merge item { data: data })))
  )
)

(define-public (delete-item (id uint))
  (begin
    (try! (is-authorized))
    (ok (map-delete items id))
  )
)

;; error codes
(define-constant ERR_UNAUTHORIZED (err u401))
(define-constant ERR_NOT_FOUND (err u404))
(define-constant ERR_UNEXPECTED (err u500))
