/*
 * ARCHIVO: apps/web/src/components/QRScanner.tsx
 * ACCIÓN:  CREAR (archivo nuevo)
 *
 * Componente reutilizable de scanner QR usando html5-qrcode.
 * Activa la cámara del celular y lee QR codes.
 *
 * REQUIERE: npm install html5-qrcode (en apps/web/)
 */

import { useEffect, useRef } from 'react'
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode'

interface QRScannerProps {
  /** Callback cuando se lee un QR exitosamente */
  onScanSuccess: (decodedText: string) => void
  /** Callback opcional para errores (no incluir errores normales de "no QR visible") */
  onScanError?: (errorMessage: string) => void
}

/**
 * QRScanner
 *
 * Renderiza un viewport de cámara que escanea QR codes en tiempo real.
 * Se limpia automáticamente al desmontar.
 *
 * Uso:
 *   <QRScanner
 *     onScanSuccess={(text) => console.log('QR leído:', text)}
 *   />
 */
export function QRScanner({ onScanSuccess, onScanError }: QRScannerProps) {
  // ID único del div para html5-qrcode (necesita un ID estático en el DOM)
  const containerId = 'dascash-qr-scanner'
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)
  const hasScannedRef = useRef(false)

  useEffect(() => {
    // Prevenir doble inicialización en StrictMode de React
    if (scannerRef.current) return

    const scanner = new Html5QrcodeScanner(
      containerId,
      {
        fps: 10,
        qrbox: { width: 260, height: 260 },
        rememberLastUsedCamera: true,
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
        // Ocultar el botón de "switch to file" — solo queremos cámara
        showTorchButtonIfSupported: true,
      },
      /* verbose= */ false
    )

    scanner.render(
      (decodedText) => {
        // Evitar múltiples callbacks por el mismo QR
        if (hasScannedRef.current) return
        hasScannedRef.current = true

        onScanSuccess(decodedText)

        // Limpiar el scanner después de un scan exitoso
        scanner.clear().catch(() => {})
      },
      (errorMessage) => {
        // html5-qrcode emite errores continuamente cuando no hay QR en frame.
        // Solo propagamos errores reales (no "NotFoundException").
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
      {/*
        html5-qrcode monta su UI dentro de este div por ID.
        El estilo del viewport lo aplica la librería — podemos sobreescribir
        con CSS global si hace falta.
      */}
      <div
        id={containerId}
        className="w-full rounded-2xl overflow-hidden [&_video]:rounded-xl"
      />
    </div>
  )
}
