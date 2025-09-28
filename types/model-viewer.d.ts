import React from 'react'

declare module '@google/model-viewer' {
  interface ModelViewerElement extends HTMLElement {
    src: string
    poster?: string
    alt?: string
    ar?: boolean
    'ar-modes'?: string
    'ar-placement'?: string
    'ar-scale'?: string
    'camera-controls'?: boolean
    'camera-orbit'?: string
    'touch-action'?: string
    exposure?: string
    'auto-rotate'?: boolean
    'auto-rotate-delay'?: number
    'interaction-policy'?: string
    loading?: string
    reveal?: string
    scale: string
    cameraOrbit: string
    canActivateAR: boolean
    activateAR(): Promise<void>
  }
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        ref?: React.Ref<any>
        src?: string
        poster?: string
        alt?: string
        ar?: boolean
        'ar-modes'?: string
        'ar-placement'?: string
        'ar-scale'?: string
        'camera-controls'?: boolean
        'camera-orbit'?: string
        'touch-action'?: string
        exposure?: string
        'auto-rotate'?: boolean
        'auto-rotate-delay'?: number
        'interaction-policy'?: string
        loading?: string
        reveal?: string
      }
    }
  }
}

export {}