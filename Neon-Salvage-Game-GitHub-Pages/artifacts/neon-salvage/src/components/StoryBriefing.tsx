import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import { ArrowLeft, ArrowRight, Signal } from 'lucide-react';

type BriefingSlide = {
  chapter: string;
  title: string;
  story: string;
  tipLabel: string;
  tip: string;
};

const briefingSlides: BriefingSlide[] = [
  {
    chapter: '01 // DISTRESS SIGNAL',
    title: 'Helios went dark.',
    story:
      'The orbital station has lost power and entered emergency mode. Eight energy cores are stranded across the transfer deck.',
    tipLabel: 'THE MISSION',
    tip: 'Pilot a recovery drone and bring the cores home before the station fails.',
  },
  {
    chapter: '02 // SECURITY SWEEP',
    title: 'The drones woke up.',
    story:
      'Security drones have reactivated and patrol the transfer deck. The station is dangerous, but the salvage is still reachable.',
    tipLabel: 'STAY INTACT',
    tip: 'A drone hit costs one integrity point. Your recovery drone has three.',
  },
  {
    chapter: '03 // RECOVERY OBJECTIVE',
    title: 'Bring back all eight.',
    story:
      'Each energy core is worth 100 CR. Recover all eight before time or integrity runs out to win on Easy, Hard, and Super Hard.',
    tipLabel: 'KNOW THE MODES',
    tip: 'Impossible is a survival challenge with no victory state.',
  },
  {
    chapter: '04 // FLIGHT SCHOOL',
    title: 'You have the controls.',
    story:
      'Steer through the deck, collect cyan cores, and avoid red security drones. Choose a difficulty on the loadout screen before deployment.',
    tipLabel: 'QUICK CONTROLS',
    tip: 'Move with WASD or the arrow keys. Press R to restart a run.',
  },
];

type StoryBriefingProps = {
  onExit: () => void;
};

export default function StoryBriefing({ onExit }: StoryBriefingProps) {
  const [step, setStep] = useState(0);
  const dialogRef = useRef<HTMLElement>(null);
  const exitButtonRef = useRef<HTMLButtonElement>(null);
  const currentSlide = briefingSlides[step];
  const isLastSlide = step === briefingSlides.length - 1;

  useEffect(() => {
    exitButtonRef.current?.focus();
  }, []);

  const continueBriefing = () => {
    if (isLastSlide) {
      onExit();
      return;
    }
    setStep((currentStep) => Math.min(currentStep + 1, briefingSlides.length - 1));
  };

  const previousSlide = () => {
    setStep((currentStep) => Math.max(0, currentStep - 1));
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onExit();
      return;
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      continueBriefing();
      return;
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      previousSlide();
      return;
    }
    if (event.key !== 'Tab' || !dialogRef.current) return;

    const focusable = Array.from(
      dialogRef.current.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'),
    );
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const activeElement = document.activeElement;

    if (event.shiftKey && (activeElement === first || activeElement === dialogRef.current)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <div className="briefing-backdrop" data-testid="story-briefing">
      <section
        ref={dialogRef}
        className="briefing-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="briefing-title"
        aria-describedby="briefing-story"
        tabIndex={-1}
        onKeyDown={handleKeyDown}
      >
        <div className="briefing-topline">
          <div className="briefing-brand">
            <Signal size={14} aria-hidden="true" />
            <span>HELIOS STATION / RECOVERY BRIEFING</span>
          </div>
          <button
            ref={exitButtonRef}
            type="button"
            className="briefing-exit"
            onClick={onExit}
            data-testid="button-briefing-exit"
          >
            EXIT BRIEFING
          </button>
        </div>

        <div
          className="briefing-progress"
          role="progressbar"
          aria-label="Story briefing progress"
          aria-valuemin={1}
          aria-valuemax={briefingSlides.length}
          aria-valuenow={step + 1}
        >
          {briefingSlides.map((slide, index) => (
            <span
              key={slide.chapter}
              className={index <= step ? 'is-complete' : ''}
              aria-hidden="true"
            />
          ))}
        </div>

        <div className="briefing-chapter">
          <span>{currentSlide.chapter}</span>
          <span>{String(step + 1).padStart(2, '0')} / {String(briefingSlides.length).padStart(2, '0')}</span>
        </div>

        <div className="briefing-copy" aria-live="polite">
          <h1 id="briefing-title">{currentSlide.title}</h1>
          <p id="briefing-story">{currentSlide.story}</p>
        </div>

        <aside className="briefing-field-note">
          <span>{currentSlide.tipLabel}</span>
          <p>{currentSlide.tip}</p>
        </aside>

        <div className="briefing-navigation">
          <button
            type="button"
            className="briefing-previous"
            onClick={previousSlide}
            disabled={step === 0}
            data-testid="button-briefing-previous"
          >
            <ArrowLeft size={15} aria-hidden="true" />
            BACK
          </button>
          <button
            type="button"
            className="briefing-continue"
            onClick={continueBriefing}
            data-testid="button-briefing-continue"
          >
            {isLastSlide ? 'CONTINUE TO LOADOUT' : 'CONTINUE'}
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
        <div className="briefing-key-hint">ARROW KEYS TO NAVIGATE <span>·</span> ESC TO EXIT</div>
      </section>
    </div>
  );
}
