;; var-get-costs
;; let's say we have a private function that need to access a global var
;; this function is called X times by a read-only function
;; is more cost efficient
;; - 1 `var-get` the var one time in the read-only func and pass it
;; - 2 `var-get` it multiple time in the prive func

(define-data-var a-number uint u10)

;; -------------------
;; - 1 get-it-one-time

;; | Runtime              | 2404000  | 5000000000 |
;; +----------------------+----------+------------+
;; | Read count           | 4        | 7750       |
;; +----------------------+----------+------------+
;; | Read length (bytes)  | 1667     | 100000000  |

(define-private (print-arg (nb uint))
  (print nb)
)

(define-read-only (get-it-one-time)
  (let ((nb (var-get a-number)))
    (print-arg nb)
    (print-arg nb)
    (print-arg nb)
    (print-arg nb)
    (print-arg nb)
    (print-arg nb)
    (print-arg nb)
    (print-arg nb)
    (print-arg nb)
    (print-arg nb)
    
    (ok true)
  )
)

;; -------------------------
;; - 2 get-it-multiple-times

;; | Runtime              | 2035000  | 5000000000 |
;; +----------------------+----------+------------+
;; | Read count           | 13       | 7750       |
;; +----------------------+----------+------------+
;; | Read length (bytes)  | 1820     | 100000000  |

(define-private (print-num)
  (print (var-get a-number))
)

(define-read-only (get-it-mul-time)
  (begin
    (print-num)
    (print-num)
    (print-num)
    (print-num)
    (print-num)
    (print-num)
    (print-num)
    (print-num)
    (print-num)
    (print-num)
    
    (ok true)
  )
)
