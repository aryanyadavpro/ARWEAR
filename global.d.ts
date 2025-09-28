import * as React from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        ref?: React.Ref<any>;
        src?: string;
        poster?: string;
        alt?: string;
        ar?: boolean;
        'ar-modes'?: string;
        'ar-placement'?: string;
        'ar-scale'?: string;
        'camera-controls'?: boolean;
        'camera-orbit'?: string;
        'touch-action'?: string;
        exposure?: string;
        'auto-rotate'?: boolean;
        'auto-rotate-delay'?: number;
        'interaction-policy'?: string;
        loading?: string;
        reveal?: string;
        scale?: string;
      };
    }
  }

  // WebXR type definitions
  interface Navigator {
    xr?: {
      isSessionSupported(mode: string): Promise<boolean>;
      requestSession(mode: string, options?: any): Promise<any>;
    };
  }

  interface Window {
    XRSystem?: any;
  }
}

export {};
