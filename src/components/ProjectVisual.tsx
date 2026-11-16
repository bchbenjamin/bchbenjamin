type Props = {
  variant: "awarespan" | "siddhi" | "aiida" | "clipz";
  name: string;
};

export default function ProjectVisual({ variant, name }: Props) {
  return (
    <div className={"project-visual visual-" + variant} aria-label={name + " visual preview"} role="img">
      {variant === "awarespan" && (
        <div className="visual-radar">
          <span className="radar-ring radar-ring-one" />
          <span className="radar-ring radar-ring-two" />
          <span className="radar-ring radar-ring-three" />
          <span className="radar-sweep" />
          <span className="radar-point" />
          <span className="radar-label">NODE / 01</span>
          <span className="radar-coordinate">12.9716° N · 77.5946° E</span>
        </div>
      )}
      {variant === "siddhi" && (
        <div className="visual-dashboard">
          <div className="mini-sidebar">
            <span className="mini-logo">S</span>
            <i /><i /><i /><i />
          </div>
          <div className="mini-content">
            <div className="mini-topline"><span>OVERVIEW</span><span>•••</span></div>
            <div className="mini-heading" />
            <div className="mini-stat-row"><b /><b /><b /></div>
            <div className="mini-chart"><i /><i /><i /><i /><i /><i /><i /><i /></div>
            <div className="mini-footline"><i /><i /><i /></div>
          </div>
        </div>
      )}
      {variant === "aiida" && (
        <div className="visual-classifier">
          <div className="classifier-node node-source">MESSAGE</div>
          <span className="classifier-line line-one" />
          <span className="classifier-line line-two" />
          <span className="classifier-line line-three" />
          <div className="classifier-node node-model">MODEL</div>
          <div className="classifier-output">
            <span>RISK SIGNAL</span>
            <strong>0.92</strong>
            <small>HIGH CONFIDENCE</small>
          </div>
        </div>
      )}
      {variant === "clipz" && (
        <div className="visual-editor">
          <div className="editor-screen"><span>CLIPZ</span><i>PLAY</i></div>
          <div className="editor-timeline">
            <div className="timeline-ruler"><span>00:00</span><span>00:15</span><span>00:30</span><span>00:45</span></div>
            <div className="timeline-track track-a"><i /><i /><i /></div>
            <div className="timeline-track track-b"><i /><i /></div>
            <div className="timeline-playhead" />
          </div>
        </div>
      )}
      <span className="visual-index">BCH / 0{["awarespan", "siddhi", "aiida", "clipz"].indexOf(variant) + 1}</span>
    </div>
  );
}
