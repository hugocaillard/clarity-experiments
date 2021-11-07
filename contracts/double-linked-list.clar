;; double-linked-list

;; constants
(define-constant ERR_BAD_REQUEST (err u400))
(define-constant ERR_UNAUTHORIZED (err u401))
(define-constant ERR_FORBIDDEN (err u403))
(define-constant ERR_NOT_FOUND (err u404))
(define-constant ERR_UNEXPECTED (err u500))

;; data maps and vars
(define-data-var uniq-id uint u1) ;; start as u1, u0 will be used to loop

(define-map users principal { name: (string-utf8 32), lastItemId: (optional uint) })

(define-map items { author: principal, id: uint } { data: (string-utf8 64) })
(define-map items-dll uint { previousId: (optional uint), nextId: (optional uint) })


;; private functions
(define-private (find-item (key { author: principal, id: uint }))
  (let (
    (item (unwrap! (map-get? items key) ERR_NOT_FOUND))
    (item-dll (unwrap! (map-get? items-dll (get id key)) ERR_UNEXPECTED))
  )
    (ok (merge (merge { id: (get id key) } item) item-dll))
  )
)

(define-private (link-to-previous-item
  (new-id uint)
  (optional-previous-id (optional uint))
)
  (if (is-some optional-previous-id)
    (let (
      (previous-id (unwrap! optional-previous-id ERR_UNEXPECTED))
      (previous-item-dll 
        (unwrap! (map-get? items-dll previous-id) ERR_UNEXPECTED)
      )
    )
      (ok (map-set items-dll previous-id
        (merge previous-item-dll { nextId: (some new-id) })
      ))
    )
    (ok false)
  )
)

(define-private (relink-previous-item
  (optional-previous-id (optional uint))
  (next-id (optional uint))
) 
  (let (
    (previous-id (unwrap! optional-previous-id (ok false)))
    (item-dll (unwrap! (map-get? items-dll previous-id) ERR_UNEXPECTED))
  )
    (ok (map-set items-dll previous-id (merge item-dll { nextId: next-id})))
  )
)

(define-private (relink-next-item
  (optional-next-id (optional uint))
  (previous-id (optional uint))
) 
  (let (
    (next-id (unwrap! optional-next-id (ok false)))
    (item-dll (unwrap! (map-get? items-dll next-id) ERR_UNEXPECTED))
  )
    (ok (map-set items-dll next-id (merge item-dll { previousId: previous-id})))
  )
)

(define-private (set-user-last-item (id uint) (previous-id (optional uint)))
  (let ((user (unwrap! (map-get? users tx-sender) ERR_FORBIDDEN)))
    (if (is-eq (get lastItemId user) (some id))
      (ok (map-set users tx-sender (merge user { lastItemId: previous-id })))
      (ok false)
    )
  )
)

;; public functions
(define-public (register (name (string-utf8 32))) 
  (ok (map-insert users tx-sender { name: name, lastItemId: none }))
)

(define-public (get-me)
  (ok (map-get? users tx-sender))
)

(define-public (add-item (data (string-utf8 64)))
  (let (
    (id (var-get uniq-id))
    (user (unwrap! (map-get? users tx-sender) ERR_FORBIDDEN))
    (last-item-id (get lastItemId user))
  )
    (try! (link-to-previous-item id last-item-id))
    (map-insert items { author: tx-sender, id: id} { data: data })
    (map-insert items-dll id { previousId: last-item-id, nextId: none })
    (map-set users tx-sender (merge user { lastItemId: (some id) }))
    (var-set uniq-id (+ id u1))
    (ok id)
  )
)

(define-public (delete-item (id uint))
  (let (
    (item-dll (unwrap! (map-get? items-dll id) ERR_NOT_FOUND))
    (previous-id (get previousId item-dll))
    (next-id (get nextId item-dll))
  )
    (try! (set-user-last-item id previous-id))
    (try! (relink-previous-item previous-id next-id))
    (try! (relink-next-item next-id previous-id))
    (map-delete items-dll id)
    (ok (map-delete items { author: tx-sender, id: id }))
  )
)

(define-public (get-item (author principal) (id uint))
  (find-item { author: author, id: id })
)

(define-private (find-items-list
  (next { author: principal, id: uint })
  (acc (list 10 { author: principal, id: uint }))
)
  (if (is-eq (len acc) u0)
    (unwrap! (as-max-len? (append acc next) u10) acc)
    (let (
      (last (unwrap! (element-at acc (- (len acc) u1)) acc))
      (item-dll (unwrap! (map-get? items-dll (get id last)) acc))
      (previous-id (unwrap! (get previousId item-dll) acc))
    )
      (unwrap! (as-max-len?
        (append acc { author: (get author last), id: previous-id })
        u10
      ) acc)
    )
  )
)

(define-public (get-items (author principal) (id uint))
  (begin 
    (asserts! 
      (is-some (map-get? items { author: author, id: id })) ERR_NOT_FOUND
    )
    (ok (map find-item (fold find-items-list (list
      { author: author, id: id }
      { author: author, id: u0 }
      { author: author, id: u0 }
      { author: author, id: u0 }
      { author: author, id: u0 }
      { author: author, id: u0 }
      { author: author, id: u0 }
      { author: author, id: u0 }
      { author: author, id: u0 }
      { author: author, id: u0 }
    ) (list))))
  )
)
