import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

/** Browser tab favicon; colors align with site primary. */
export default function Icon() {
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
          borderRadius: 7,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            gap: 3,
            paddingBottom: 6,
          }}
        >
          <div
            style={{
              width: 9,
              height: 13,
              background: 'rgba(255,255,255,0.95)',
              borderRadius: 2,
            }}
          />
          <div
            style={{
              width: 9,
              height: 17,
              background: 'rgba(255,255,255,0.78)',
              borderRadius: 2,
            }}
          />
        </div>
      </div>
    ),
    { ...size },
  )
}
