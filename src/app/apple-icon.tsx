import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#0a0818',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {/* Outer purple border */}
        <div
          style={{
            position: 'absolute',
            top: 6,
            left: 6,
            right: 6,
            bottom: 6,
            border: '3px solid #7c3aed',
            borderRadius: 14,
            display: 'flex',
          }}
        />

        {/* Inner gold border */}
        <div
          style={{
            position: 'absolute',
            top: 14,
            left: 14,
            right: 14,
            bottom: 14,
            border: '1.5px solid rgba(251, 191, 36, 0.6)',
            borderRadius: 8,
            display: 'flex',
          }}
        />

        {/* Corner dots */}
        <div style={{ position: 'absolute', top: 10, left: 10, width: 5, height: 5, borderRadius: 3, background: '#fbbf24', display: 'flex' }} />
        <div style={{ position: 'absolute', top: 10, right: 10, width: 5, height: 5, borderRadius: 3, background: '#fbbf24', display: 'flex' }} />
        <div style={{ position: 'absolute', bottom: 10, left: 10, width: 5, height: 5, borderRadius: 3, background: '#fbbf24', display: 'flex' }} />
        <div style={{ position: 'absolute', bottom: 10, right: 10, width: 5, height: 5, borderRadius: 3, background: '#fbbf24', display: 'flex' }} />

        {/* Diamond shape */}
        <div
          style={{
            width: 76,
            height: 76,
            background: '#1e1040',
            border: '2px solid #7c3aed',
            transform: 'rotate(45deg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Star inside diamond (counter-rotated) */}
          <div
            style={{
              transform: 'rotate(-45deg)',
              fontSize: 38,
              color: '#fbbf24',
              lineHeight: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ★
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
