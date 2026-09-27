import React, { useEffect, useRef } from 'react';

export default function LamAvatarStage({ assetUrl, controller, phase, name, onReady, onError }) {
  const container = useRef(null);
  const currentPhase = useRef(phase);
  currentPhase.current = phase;
  useEffect(() => {
    const host = container.current;
    let disposed = false, loaded = false, renderer;
    onReady(false);
    const timeout = setTimeout(() => { if (!disposed) onError('The 3D avatar did not load. Try the recorded introduction or voice conversation.'); }, 45000);
    async function load() {
      try {
        const { GaussianSplatRenderer } = await import('gaussian-splat-renderer-for-lam');
        if (disposed || !host?.isConnected) return;
        renderer = await GaussianSplatRenderer.getInstance(host, assetUrl, {
          backgroundColor: '0x193a3e', alpha: 1,
          getExpressionData: () => { const frame = controller.frame(); return Object.keys(frame).length ? frame : null; },
          getChatState: () => ({ listening: 'Listening', thinking: 'Thinking', speaking: 'Responding' }[currentPhase.current] || 'Idle'),
          loadProgress: progress => {
            if (progress >= 1) {
              loaded = true;
              clearTimeout(timeout);
              if (disposed) renderer?.dispose();
              else onReady(true);
            }
          },
        });
        if (!renderer) throw new Error('Renderer unavailable');
        const camera = renderer.getCamera();
        if (camera?.isPerspectiveCamera) { camera.zoom = 2.4; camera.updateProjectionMatrix(); }
        if (disposed && loaded) renderer.dispose();
      } catch {
        clearTimeout(timeout);
        if (!disposed) onError('This device could not render the 3D avatar. Voice conversation is still available.');
      }
    }
    void load();
    // The SDK starts rendering in its asynchronous scene-load callback. Wait for
    // that callback before disposing, so it cannot start an already-disposed viewer.
    return () => { disposed = true; clearTimeout(timeout); controller.stop(); if (loaded) renderer?.dispose(); };
  }, [assetUrl, controller, onReady, onError]);
  return <div className="lam-stage" ref={container} role="img" aria-label={`${name}, an interactive 3D archive guide`} />;
}
