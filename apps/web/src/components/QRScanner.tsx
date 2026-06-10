import { useEffect, useRef } from 'react'
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode'

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void
  onScanError?: (errorMessage: string) => void
}

export function QRScanner({ onScanSuccess, onScanError }: QRScannerProps) {
  const containerId = 'dascash-qr-scanner'
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)
  const hasScannedRef = useRef(false)

  useEffect(() => {
    if (scannerRef.current) return

    const scanner = new Html5QrcodeScanner(
      containerId,
      {
        fps: 10,
        qrbox: { width: 260, height: 260 },
        rememberLastUsedCamera: true,
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
        showTorchButtonIfSupported: true,
      },
      false
    )

    scanner.render(
      (decodedText) => {
        if (hasScannedRef.current) return
        hasScannedRef.current = true
        onScanSuccess(decodedText)
        scanner.clear().catch(() => {})
      },
      (errorMessage) => {
        if (
          onScanError &&
          !errorMessage.includes('NotFoundException') &&
          !errorMessage.includes('No barcode')
        ) {
          onScanError(errorMessage)
        }
      }
    )

    scannerRef.current = scanner

    return () => {
      scanner.clear().catch(() => {})
      scannerRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="w-full">
      <div
        id={containerId}
        className="w-full rounded-2xl overflow-hidden [&_video]:rounded-xl"
      />
    </div>
  )
}
