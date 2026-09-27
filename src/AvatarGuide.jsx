import React, { useEffect, useMemo, useState } from 'react';
import { Box, RotateCcw, Video } from 'lucide-react';
import AvatarPreview from './AvatarPreview.jsx';
import VoiceGuide from './VoiceGuide.jsx';
import LamAvatarStage from './LamAvatarStage.jsx';
import { createLamController } from './lam-controller.js';
import './lam-avatar.css';

export default function AvatarGuide(props) {
  const [config, setConfig] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const [mode, setMode] = useState('interactive');
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const controller = useMemo(() => createLamController(), []);
  useEffect(() => {
    const abort = new AbortController();
    setConfig(null); setReady(false); setError('');
    fetch('/api/avatar', { signal: AbortSignal.any([abort.signal, AbortSignal.timeout(6000)]) })
      .then(result => result.ok ? result.json() : null)
      .then(data => { if (!abort.signal.aborted) setConfig(data || { ready: false }); })
      .catch(() => { if (!abort.signal.aborted) setConfig({ ready: false }); });
    return () => abort.abort();
  }, [attempt]);
  return <div className="avatar-guide-container">
    <div className="avatar-mode-picker" aria-label="Avatar experience">
      <button aria-pressed={mode === 'interactive'} onClick={() => setMode('interactive')}><Box size={14} />Interactive avatar <small>EXPERIMENTAL</small></button>
      <button aria-pressed={mode === 'preview'} onClick={() => setMode('preview')}><Video size={14} />Recorded introduction</button>
    </div>
    {mode === 'preview' ? <AvatarPreview {...props} /> : config?.ready ?
      <VoiceGuide {...props} key={attempt} avatarController={controller} avatarReady={ready} avatarName={config.name} avatarError={error}
        renderPresence={state => <LamAvatarStage assetUrl={config.assetUrl} controller={controller} phase={state.phase}
          name={config.name} onReady={setReady} onError={setError} />} /> :
      <section className="lam-unavailable">
        <img src="/media/siddharth-poster.jpg" alt="Siddharth, Abhilekh's archive guide" />
        <div><span className="eyebrow">THE NEXT CHAPTER</span><h2>Siddharth, <em>in conversation.</em></h2>
          <p>{!config ? 'Checking the interactive avatar…' : config.workerReady && !config.assetReady ?
            'The voice animation engine is connected. Siddharth’s 3D portrait is being prepared.' :
            'The interactive 3D guide is in development. Live voice conversation and the recorded introduction are available now.'}</p>
          <div className="lam-readiness"><span>{config?.workerReady ? '✓' : '○'} Voice animation</span><span>{config?.assetReady ? '✓' : '○'} 3D portrait</span></div>
          <button className="button primary" onClick={props.onVoice}>Try voice conversation</button>
          <button className="lam-retry" onClick={() => setAttempt(value => value + 1)}><RotateCcw size={13} />Check availability</button>
          <small>Siddharth represents Abhilekh, not Dr. Ambedkar.</small>
        </div>
      </section>}
  </div>;
}
