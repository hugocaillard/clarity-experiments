;; double-linked-list

;; abstract dll logic
(define-data-var global-uniq-id uint u1)

(define-map items-dll uint {
  previousId: (optional uint),
  nextId: (optional uint),
})

;; on item insert, link the previous one to the new one
(define-private (link-to-previous (id? (optional uint)) (next-id uint))
  (let ((id (unwrap! id? (ok false))))
    (ok (map-set items-dll id (merge
      (unwrap! (map-get? items-dll id) ERR_UNEXPECTED)
      { nextId: (some next-id) }
    )))
  )
)

;; on item delete, link the previous one to the next one
(define-private (relink-previous
  (previous-id? (optional uint))
  (next-id (optional uint))
)
  (let ((previous-id (unwrap! previous-id? (ok false))))
    (ok (map-set items-dll previous-id (merge
      (unwrap! (map-get? items-dll previous-id) ERR_UNEXPECTED)
      { nextId: next-id }
    )))
  )
)

;; on item delete, link the next one to the previous one
(define-private (relink-next
  (next-id? (optional uint))
  (previous-id (optional uint))
)
  (let ((next-id (unwrap! next-id? (ok false))))
    (ok (map-set items-dll next-id (merge
      (unwrap! (map-get? items-dll next-id) ERR_UNEXPECTED)
      { previousId: previous-id }
    )))
  )
)

;; fold to ordered list of dll ids
(define-private (get-last-ids (next uint) (acc (list 10 uint)))
  (if (is-eq (len acc) u0)
    (unwrap! (as-max-len? (append acc next) u10) acc)
    (let (
      (last-id (unwrap! (element-at acc (- (len acc) u1)) acc))
      (item-dll (unwrap! (map-get? items-dll last-id) acc))
      (previous-id (unwrap! (get previousId item-dll) acc))
    )
      (unwrap! (as-max-len? (append acc previous-id) u10) acc)
    )
  )
)

(define-private (fold-from (id uint))
  (fold get-last-ids (list id u0 u0 u0 u0 u0 u0 u0 u0 u0) (list))
)

;; contract logic

(define-map users principal { lastItemId: (optional uint) })
(define-map items uint { author: principal, data: (string-utf8 64) })

;; private functions
(define-private (get-item-by-id (id uint))
  (let (
    (item (unwrap! (map-get? items id) ERR_NOT_FOUND))
    (item-dll (unwrap! (map-get? items-dll id) ERR_UNEXPECTED))
  )
    (ok (merge (merge { id: id } item) item-dll))
  )
)

(define-private (get-or-create-user)
  (unwrap!
    (map-get? users tx-sender)
    (let ((data { lastItemId: none }))
      (map-set users tx-sender data)
      data
    )
  )
)

(define-private (is-author (address principal))
  (ok (asserts! (is-eq address tx-sender) ERR_FORBIDDEN))
)

(define-private (relink-author-last-item
  (item-id uint)
  (previous-id (optional uint))
)
  (let (
    (user (unwrap! (map-get? users tx-sender) ERR_UNEXPECTED))
    (user-last-item-id (unwrap! (get lastItemId user) ERR_UNEXPECTED))
  )
    (if (is-eq user-last-item-id item-id)
      (ok (map-set users tx-sender (merge user { lastItemId: previous-id })))
      (ok false)
    )
  )
)

;; public functions
(define-public (add-item (data (string-utf8 64)))
  (let (
    (id (var-get global-uniq-id))
    (user (get-or-create-user))
    (last-item-id (get lastItemId user))
  )
    (try! (link-to-previous last-item-id id))
    (map-insert items id { author: tx-sender, data: data } )
    (map-insert items-dll id { previousId: last-item-id, nextId: none })
    (map-set users tx-sender (merge user { lastItemId: (some id) }))
    (var-set global-uniq-id (+ id u1))
    (ok id)
  )
)

(define-public (delete-item (id uint))
  (let (
    (item (try! (get-item-by-id id)))
    (previous-id (get previousId item))
    (next-id (get nextId item))
  )
    (try! (is-author (get author item)))
    (try! (relink-author-last-item id previous-id))
    (try! (relink-previous previous-id next-id))
    (try! (relink-next next-id previous-id))
    (map-delete items-dll id)
    (ok (map-delete items id))
  )
)

(define-public (get-item (item-id uint))
  (get-item-by-id item-id)
)

(define-public (get-items (item-id uint))
  (begin
    (asserts! (is-some (map-get? items item-id)) ERR_NOT_FOUND)
    (ok (map get-item-by-id (fold-from item-id)))
  )
)

;; error codes
(define-constant ERR_BAD_REQUEST (err u400))
(define-constant ERR_UNAUTHORIZED (err u401))
(define-constant ERR_FORBIDDEN (err u403))
(define-constant ERR_NOT_FOUND (err u404))
(define-constant ERR_UNEXPECTED (err u500))
