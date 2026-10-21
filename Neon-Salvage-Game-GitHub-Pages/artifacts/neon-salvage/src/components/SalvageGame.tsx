import { useEffect, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, BatteryCharging, Crosshair, RotateCcw, ShieldAlert, Signal, Sparkles, Zap } from 'lucide-react';
import { GAME_MODES, type GameModeId } from '../gameModes';
import SalvageScene from './SalvageScene';
import StoryBriefing from './StoryBriefing';

export type GameOutcome = 'ready' | 'playing' | 'won' | 'lost';

export type SalvageGameProps = {
  active: boolean;
  outcome?: GameOutcome;
  score: number;
  cores: number;
  lives: number;
  timeRemaining: number;
  resetKey: number;
  mode: GameModeId;
  onStart: () => void;
  onRestart: () => void;
  onModeChange: (mode: GameModeId) => void;
  onCoreCollected: () => void;
  onHazardHit: () => void;
};

function formatTime(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(safeSeconds / 60)).padStart(2, '0')}:${String(safeSeconds % 60).padStart(2, '0')}`;
}

export default function SalvageGame({
  active, outcome = active ? 'playing' : 'ready', score, cores, lives, timeRemaining, resetKey, mode, onStart, onRestart, onModeChange, onCoreCollected, onHazardHit,
}: SalvageGameProps) {
  const finished = outcome === 'won' || outcome === 'lost';
  const ready = !active && !finished;
  const dangerTime = timeRemaining <= 30;
  const [showBriefing, setShowBriefing] = useState(true);

  useEffect(() => {
    const handleResetKey = (event: KeyboardEvent) => {
      if (showBriefing || event.code !== 'KeyR' || event.repeat) return;
      event.preventDefault();
      onRestart();
    };
    window.addEventListener('keydown', handleResetKey);
    return () => window.removeEventListener('keydown', handleResetKey);
  }, [onRestart, showBriefing]);

  return (
    <main className="game-shell">
      <SalvageScene
        active={active}
        resetKey={resetKey}
        mode={mode}
        onCoreCollected={onCoreCollected}
        onHazardHit={onHazardHit}
      />
      <div className="world-vignette" />
      <header className="game-topbar">
        <div className="brand-lockup">
          <div className="brand-mark"><span /><span /><span /></div>
          <div>
            <div className="brand-title">NEON <span>SALVAGE</span></div>
            <div className="brand-sub">RECOVERY DIVISION <i /> OUTPOST 09</div>
          </div>
        </div>
        <div className="mission-tag"><span className="live-dot" /> <span>MISSION // {active ? 'IN PROGRESS' : finished ? 'DEBRIEF' : 'STANDBY'}</span></div>
        <div className="sound-toggle is-on" aria-label="Game status" data-testid="game-status">
          <Signal size={15} strokeWidth={1.8} /><span>LOCAL LINK</span>
        </div>
      </header>

      <section className="game-hud" aria-label="Mission status">
        <div className="hud-block score-block">
          <div className="hud-label"><Zap size={13} /> RECOVERY VALUE</div>
          <div className="score-value" data-testid="score-display">{String(score).padStart(5, '0')}<small> CR</small></div>
        </div>
        <div className="hud-block core-block">
          <div className="hud-label"><BatteryCharging size={14} /> ENERGY CORES</div>
          <div className="core-progress" data-testid="core-display" aria-label={`${cores} of 8 energy cores recovered`}>
            {Array.from({ length: 8 }, (_, index) => <span key={index} className={index < cores ? 'collected' : ''} />)}
            <b>{String(cores).padStart(2, '0')} <em>/ 08</em></b>
          </div>
        </div>
        <div className="hud-block timer-block">
          <div className="hud-label"><span className="timer-led" /> STATION COLLAPSE</div>
          <div className={`timer-value ${dangerTime ? 'timer-danger' : ''}`} data-testid="timer-display">{formatTime(timeRemaining)}</div>
        </div>
        <div className="hud-block lives-block">
          <div className="hud-label"><ShieldAlert size={13} /> HULL INTEGRITY</div>
          <div className="life-pips" data-testid="lives-display" aria-label={`${lives} lives remaining`}>
            {[0, 1, 2].map((index) => <span key={index} className={index < lives ? 'life-live' : ''} />)}
            <small>{lives} <i> / 3</i></small>
          </div>
        </div>
      </section>

      <div className="sector-label"><span>SECTOR 04</span><b>◆</b> HELIOS TRANSFER DECK</div>
      <div className="scene-reticle"><Crosshair size={24} strokeWidth={1} /><span /></div>

      <aside className={`threat-readout ${ready || finished ? 'is-overlayed' : ''}`}>
        <div className="threat-icon"><ShieldAlert size={17} /></div>
        <div><b>SECURITY SWEEP</b><span>{GAME_MODES[mode].droneCount} HOSTILES{mode === 'impossible' ? ' · NO VICTORY' : ' DETECTED'}</span></div>
        <span className="threat-bars"><i /><i /><i /></span>
      </aside>

      <div className="game-footer">
        <div className="controls-hint">
          <div className="control-arrows" aria-hidden="true">
            <span className="key up"><ArrowUp size={12} /></span>
            <span className="key left"><ArrowLeft size={12} /></span>
            <span className="key down"><ArrowDown size={12} /></span>
            <span className="key right"><ArrowRight size={12} /></span>
          </div>
          <div className="control-copy"><b>FLIGHT CONTROLS</b><span>W A S D <i>or</i> ARROW KEYS</span></div>
          <div className="control-divider" />
          <div className="collect-glyph"><span>R</span></div>
          <div className="control-copy"><b>RESET RUN</b><span>PRESS R</span></div>
        </div>
        <div className="bottom-status"><span className="status-light" /> LINK STABLE <span className="status-separator">/</span> DRONE MK–IV <span className="status-separator">/</span> LATENCY 18MS</div>
      </div>

      {showBriefing && ready && <StoryBriefing onExit={() => setShowBriefing(false)} />}

      {(ready || finished) && !showBriefing && (
        <div className="mission-overlay" data-testid="mission-overlay">
          <div className="overlay-eyebrow"><span>{finished ? 'RECOVERY REPORT' : 'DISTRESS SIGNAL // 09.44.18'}</span><span className="eyebrow-line" /></div>
          <div className="overlay-title-wrap">
            <h1>{finished ? (outcome === 'won' ? <>SALVAGE<br /><i>SECURED</i></> : <>SIGNAL<br /><i>LOST</i></>) : <>THE DECK<br /><i>IS YOURS</i></>}</h1>
            <div className="title-index">09<br /><span>—</span><br />04</div>
          </div>
          <p className="mission-description">
            {finished
              ? outcome === 'won'
                ? 'All cores recovered. The station can go dark now.'
                : mode === 'impossible'
                  ? 'No victory is available in Impossible mode. The run ends when time or integrity runs out.'
                  : 'The station has gone quiet. The salvage is still out there.'
              : mode === 'impossible'
                ? 'Victory is disabled in this mode. Collect cores for points and last as long as you can.'
                : 'Eight cores. One failing station. Bring the power home before the whole place comes apart.'}
          </p>
          <div className="difficulty-picker" role="group" aria-label="Choose game difficulty">
            <div className="difficulty-label">SELECT DIFFICULTY</div>
            <div className="difficulty-options">
              {Object.values(GAME_MODES).map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={`difficulty-option ${mode === option.id ? 'is-selected' : ''}`}
                  onClick={() => onModeChange(option.id)}
                  aria-pressed={mode === option.id}
                  data-testid={`mode-${option.id}`}
                >
                  <span>{option.label}</span>
                  <small>{option.summary}</small>
                </button>
              ))}
            </div>
          </div>
          {finished && <div className="debrief-score"><span>FINAL RECOVERY VALUE</span><b>{String(score).padStart(5, '0')} <small>CR</small></b></div>}
          <button className="launch-button" onClick={finished ? onRestart : onStart} data-testid={finished ? 'restart-button' : 'start-button'}>
            <span>{finished ? 'RUN IT BACK' : 'DEPLOY RECOVERY DRONE'}</span>
            {finished ? <RotateCcw size={16} /> : <Sparkles size={16} />}
          </button>
          <div className="overlay-foot"><span><i /> {finished ? 'READY FOR ANOTHER RUN' : 'NO BACKUP. NO SECOND CHANCES.'}</span><Zap size={13} /></div>
        </div>
      )}

      <div className="mission-corner mission-corner-left"><span>HELIOS STATION</span><b>ORBITAL SALVAGE / 2189</b></div>
      <div className="mission-corner mission-corner-right"><b>CORE SIGNATURE</b><span>DETECTED <i /></span></div>
    </main>
  );
}
