;; svg-nft
;; experiment with dynamic

(impl-trait .sip009-nft-trait.sip009-nft-trait)

(define-non-fungible-token colorful-flag uint)
(define-data-var last-token-id uint u0)

(define-data-var FLAG_FR (string-ascii 350) "")

(define-private (build-flag-fr (s (string-ascii 70)))
  (var-set FLAG_FR
    (unwrap-panic (as-max-len? (concat (var-get FLAG_FR) s) u350))
  )
)

(define-read-only (get-rect
  (x (string-ascii 3))
  (y (string-ascii 3))
  (width (string-ascii 3))
  (height (string-ascii 3))
  (fill (string-ascii 6))
)
  (concat (concat (concat (concat (concat
  (concat (concat (concat (concat (concat
    "<rect x='" x) "' y='") y)
    "' width='") width) "' height='") height)
    "' fill='") fill) "' />"
  )
)

(build-flag-fr "<svg id='france' width='302' height='202'>")
(build-flag-fr (get-rect "0" "0" "302" "202" "000000"))
(build-flag-fr "<g>")
(build-flag-fr (get-rect "1" "1" "100" "200" "002395"))
(build-flag-fr (get-rect "101" "1" "100" "200" "FFFFFF"))
(build-flag-fr (get-rect "101" "1" "100" "200" "ED2939"))
(build-flag-fr "</g>")
(build-flag-fr "</svg>")

(define-read-only (get-last-token-id)
  (ok (var-get last-token-id))
)

(define-read-only (get-token-uri (token-id uint))
  (ok none)
)

(define-read-only (get-owner (token-id uint))
  (ok (nft-get-owner? colorful-flag token-id))
)

(define-public (transfer
  (token-id uint)
  (sender principal)
  (recipient principal)
)
  (begin
    (asserts! (is-eq tx-sender sender) ERR_FORBIDDEN)
    (nft-transfer? colorful-flag token-id sender recipient)
  )
)

(define-read-only (get-flag)
  (var-get FLAG_FR)
)

;; ERRORS
(define-constant ERR_FORBIDDEN (err u401))
