;; version tuple acc
(define-read-only (is-greater (n uint) (acc { prev: uint, result: bool}))
  { prev: n, result: (and (get result acc) (>= n (get prev acc))) }
)

(define-read-only (is-sorted (nbs (list 10 uint)))
  (let ((sorted (fold is-greater nbs { prev: u0, result: true })))
    (get result sorted)
  )
)

;; version ctx var
(define-data-var ctx uint u0)

(define-private (is-bigger (num uint) (result bool))
  (and result (> num (var-get ctx)) (var-set ctx num))
)

(define-public (is-ordered (numbers (list 10 uint)))
  (begin
    (var-set ctx u0)
    (ok (fold is-bigger numbers true))
  )
)


;; version is-some
(define-private (is-ge (num uint) (output (optional uint)))
  (if (>= num (unwrap! output none)) (some num) none)
)

(define-read-only (is-ordered2 (numbers (list 10 uint)))
  (is-some (fold is-ge numbers (some u0)))
)
