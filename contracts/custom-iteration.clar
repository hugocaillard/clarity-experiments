;; custom-iteration
;; exercises
;; implement map and filter equivalents with fold


;; exercise 01
;; write a function that take a list of numbers and raise it to the power of 2
;; < (list 0 1 2 4 5 6 7 8 9)
;; > (list 0 1 4 16 25 36 49 64 81)

(define-private (square (n int))
  (* n n)
)

;; using the regular map function
(define-read-only (get-squared-values-native (numbers (list 10 int)))
  (map square numbers)
)

;; using fold
(define-private (fold-square-number (n int) (acc (list 10 int)))
  (default-to acc (as-max-len? (append acc (square n)) u10))
)

(define-read-only (get-squared-values-custom (numbers (list 10 int)))
  (fold fold-square-number numbers (list))
)

;; exercise 02
;; write a function that take a list of numbers and return the even ones
;; < (list 0 1 2 4 5 6 7 8 9)
;; < (list 0 2 4 6 8)

(define-private (is-even (n int))
  (is-eq (mod n 2) 0)
)

;; using the regular filter function
(define-read-only (get-even-values-native (numbers (list 10 int)))
  (filter is-even numbers)
)

;; using fold
(define-private (fold-even-number (n int) (acc (list 10 int)))
  (if (is-even n)
    (default-to acc (as-max-len? (append acc n) u10))
    acc
  )
)

(define-read-only (get-even-values-custom (numbers (list 10 int)))
  (fold fold-even-number numbers (list))
)
