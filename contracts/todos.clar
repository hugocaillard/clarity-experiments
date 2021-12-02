;; todos
;; this contract shows how storing the author's address in the key tuple avoids
;; the need to check if ones owns the todo to edit or delete

(define-data-var next-id uint u0)

(define-map todos { id: uint, author: principal } {
  text: (string-utf8 128),
  done: bool
})

(define-public (add-todo (text (string-utf8 128)))
  (let ((id (var-get next-id)))
    (map-insert todos { id: id, author: tx-sender } { text: text, done: false })
    (var-set next-id (+ id u1))
    (ok id)
  )
)

(define-public (mark-as-done (id uint))
  (let (
    (key { id: id, author: tx-sender })
    (todo (unwrap! (map-get? todos key) (err u404)))
  )
    (ok (map-set todos key (merge todo { done: true })))
  )
)

(define-public (delete-todo (id uint))
  (ok (asserts!
    (is-eq true (map-delete todos { id: id, author: tx-sender }))
    (err u401)
  ))
)
