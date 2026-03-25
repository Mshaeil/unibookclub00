import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(145deg, #2a3878 0%, #4c5fd9 100%)',
          borderRadius: 40,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            gap: 14,
            paddingBottom: 36,
          }}
        >
          <div
            style={{
              width: 48,
              height: 72,
              background: 'rgba(255,255,255,0.95)',
              borderRadius: 6,
            }}
          />
          <div
            style={{
              width: 48,
              height: 94,
              background: 'rgba(255,255,255,0.78)',
              borderRadius: 6,
            }}
          />
        </div>
      </div>
    ),
    { ...size },
  )
}
