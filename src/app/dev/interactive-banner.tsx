"use client";

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

type BannerNodeKind = "title" | "subtitle" | "chip";

type BannerNode = {
  id: string;
  kind: BannerNodeKind;
  text: string;
  x: number;
  y: number;
};

type BannerMetrics = {
  published: number;
  building: number;
  ideas: number;
};

type BannerCopy = {
  title: string;
  subtitle: string;
  metricsPublished: string;
  metricsBuilding: string;
  metricsIdeas: string;
};

type InteractiveDevBannerProps = {
  metrics: BannerMetrics;
  copy: BannerCopy;
};

const BANNER_CSS_DEFAULT = `.dev-banner-node--title {
  font-size: clamp(1.12rem, 2vw, 1.58rem);
  font-weight: 800;
  color: #dcfce7;
  letter-spacing: -0.01em;
  max-width: 26ch;
}

.dev-banner-node--subtitle {
  font-size: 0.84rem;
  color: #86efac;
  line-height: 1.45;
  max-width: 42ch;
}

.dev-banner-node--chip {
  font-size: 0.68rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  font-weight: 700;
  color: #bbf7d0;
}`;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

function buildDefaultNodes(metrics: BannerMetrics, copy: BannerCopy): BannerNode[] {
  return [
    {
      id: "title",
      kind: "title",
      text: copy.title,
      x: 24,
      y: 20,
    },
    {
      id: "subtitle",
      kind: "subtitle",
      text: copy.subtitle,
      x: 24,
      y: 84,
    },
    {
      id: "chip-published",
      kind: "chip",
      text: `${copy.metricsPublished}: ${metrics.published}`,
      x: 24,
      y: 170,
    },
    {
      id: "chip-building",
      kind: "chip",
      text: `${copy.metricsBuilding}: ${metrics.building}`,
      x: 200,
      y: 170,
    },
    {
      id: "chip-ideas",
      kind: "chip",
      text: `${copy.metricsIdeas}: ${metrics.ideas}`,
      x: 404,
      y: 170,
    },
  ];
}

export default function InteractiveDevBanner({ metrics, copy }: InteractiveDevBannerProps) {
  const [nodes, setNodes] = useState<BannerNode[]>(() => buildDefaultNodes(metrics, copy));
  const [cssCode] = useState(BANNER_CSS_DEFAULT);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const nodeRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const dragRef = useRef<{
    id: string | null;
    offsetX: number;
    offsetY: number;
  }>({
    id: null,
    offsetX: 0,
    offsetY: 0,
  });

  useEffect(() => {
    setNodes((prev) =>
      prev.map((node) => {
        if (node.id === "chip-published") return { ...node, text: `${copy.metricsPublished}: ${metrics.published}` };
        if (node.id === "chip-building") return { ...node, text: `${copy.metricsBuilding}: ${metrics.building}` };
        if (node.id === "chip-ideas") return { ...node, text: `${copy.metricsIdeas}: ${metrics.ideas}` };
        if (node.id === "title") return { ...node, text: copy.title };
        if (node.id === "subtitle") return { ...node, text: copy.subtitle };
        return node;
      })
    );
  }, [
    copy.metricsBuilding,
    copy.metricsIdeas,
    copy.metricsPublished,
    copy.subtitle,
    copy.title,
    metrics.building,
    metrics.ideas,
    metrics.published,
  ]);

  useEffect(() => {
    const handleMove = (event: PointerEvent) => {
      const dragId = dragRef.current.id;
      if (!dragId) return;
      const container = containerRef.current;
      if (!container) return;
      const element = nodeRefs.current[dragId];
      if (!element) return;

      const rect = container.getBoundingClientRect();
      const nodeWidth = element.offsetWidth || 120;
      const nodeHeight = element.offsetHeight || 36;

      const localX = event.clientX - rect.left - dragRef.current.offsetX;
      const localY = event.clientY - rect.top - dragRef.current.offsetY;

      setNodes((prev) =>
        prev.map((node) =>
          node.id === dragId
            ? {
                ...node,
                x: clamp(localX, 6, rect.width - nodeWidth - 6),
                y: clamp(localY, 6, rect.height - nodeHeight - 6),
              }
            : node
        )
      );
    };

    const stopDrag = () => {
      dragRef.current.id = null;
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", stopDrag);
    window.addEventListener("pointercancel", stopDrag);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", stopDrag);
      window.removeEventListener("pointercancel", stopDrag);
    };
  }, []);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>, node: BannerNode) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    dragRef.current.id = node.id;
    dragRef.current.offsetX = event.clientX - rect.left - node.x;
    dragRef.current.offsetY = event.clientY - rect.top - node.y;
  };

  return (
    <aside className="dev-banner">
      <style>{cssCode}</style>
      <div className="dev-banner-canvas" ref={containerRef}>
        {nodes.map((node) => (
          <div
            key={node.id}
            ref={(el) => {
              nodeRefs.current[node.id] = el;
            }}
            className={`dev-banner-node dev-banner-node--${node.kind}`}
            style={{
              left: `${node.x}px`,
              top: `${node.y}px`,
            }}
            onPointerDown={(event) => onPointerDown(event, node)}
          >
            {node.text}
          </div>
        ))}
      </div>
    </aside>
  );
}
