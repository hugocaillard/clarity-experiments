;; hex-to-int
;; convert an hex color into it uint value
;; FFFFFFFF -> u16777215

(define-constant HEX (list
  "0" "1" "2" "3" "4" "5" "6" "7" "8" "9" "A" "B" "C" "D" "E" "F"
))

(define-private (is-valid-clojure (str (string-ascii 1)) (acc bool))
  (and (is-some (index-of HEX str)) acc)
)

(define-read-only (is-valid (hex (string-ascii 6)))
  (begin
    (asserts! (is-eq (len hex) u6) false)
    (fold is-valid-clojure hex true)
  )
)

(define-private (hex-to-uint
  (str (string-ascii 1))
  (acc { val: uint, i: uint })
)
  {
    val: (+
      (* (unwrap-panic (index-of HEX str)) (pow u16 (get i acc)))
      (get val acc)
    ),
    i: (+ (get i acc) u1)
  }
)

(define-read-only (get-uint (hex (string-ascii 6)))
  (begin
    (asserts! (is-valid hex) ERR_BAD_REQUEST)
    (ok (get val (fold hex-to-uint hex { val: u0, i: u0})))
  )
)

(define-constant ERR_BAD_REQUEST (err u400))


;; alternative
;; check validity within hex-to-uint to avoid 2 iterations on the hex string
;; but it makes the function more complex
;; (define-private (hex-to-uint2
;;   (str (string-ascii 1))
;;   (acc? (response { val: uint, i: uint } uint))
;; )
;;   (let ((acc (unwrap-panic acc?)))
;;     (ok {
;;       val: (+
;;         (*
;;           (unwrap! (index-of HEX str) ERR_BAD_REQUEST)
;;           (pow u16 (get i acc))
;;         )
;;         (get val acc)
;;       ),
;;       i: (+ (get i acc) u1)
;;     })
;;   )
;; )
;;
;; can be called like so
  ;; (ok (get val (unwrap!
  ;;   (fold hex-to-uint2 hex (ok { val: u0, i: u0}))
  ;;   ERR_BAD_REQUEST
  ;; )))
