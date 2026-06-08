import { useState, useEffect } from "react";
import { Html, Line } from "@react-three/drei";

const AMBER = "#e8a23a";

function getDefaultArticle(_blockId: string): string {
  return "";
}

function parseMarkdown(text: string) {
  return text.split("\n").map((line, idx) => {
    if (line.startsWith("# ")) {
      return (
        <h1 key={idx} className="text-[14px] font-bold text-[#e8a23a] mt-2 mb-0.5 tracking-wide uppercase">
          {line.slice(2)}
        </h1>
      );
    }
    if (line.startsWith("## ")) {
      return (
        <h2 key={idx} className="text-[12.5px] font-semibold text-white/95 mt-1.5 mb-0.5 border-b border-white/5 pb-0.5">
          {line.slice(3)}
        </h2>
      );
    }
    if (line.startsWith("### ")) {
      return (
        <h3 key={idx} className="text-[11px] font-medium text-[#e8a23a]/80 mt-1 mb-0.5">
          {line.slice(4)}
        </h3>
      );
    }
    if (line.startsWith("- ")) {
      return (
        <li key={idx} className="text-[10px] text-white/60 ml-3.5 list-disc my-0.5">
          {line.slice(2)}
        </li>
      );
    }
    if (line.trim() === "") {
      return <div key={idx} className="h-1.5" />;
    }
    return (
      <p key={idx} className="text-[10.5px] leading-[1.6] text-white/55 my-0.5 font-light">
        {line}
      </p>
    );
  });
}

interface BlockArticleProps {
  blockId: string;
  active: boolean;
  blockW: number;
  blockD: number;
  blockH: number;
  level: number;
}

export function BlockArticle({ blockId, active, blockW: _blockW, blockD: _blockD, blockH, level }: BlockArticleProps) {
  const [activeTab, setActiveTab] = useState<"read" | "edit">("read");
  const [content, setContent] = useState("");

  // Load persisted content or default
  useEffect(() => {
    // If it is level 10 and this is the big CPU, we use a special pipeline article!
    if (level === 10 && blockId === "cpu-big") {
      const saved = localStorage.getItem("bnb_article_pipeline");
      if (saved) {
        setContent(saved);
        return;
      }
      setContent("");
      return;
    }

    const saved = localStorage.getItem(`bnb_article_${blockId}`);
    if (saved) {
      setContent(saved);
    } else {
      setContent(getDefaultArticle(blockId));
    }
  }, [blockId, level]);

  const handleContentChange = (val: string) => {
    setContent(val);
    if (level === 10 && blockId === "cpu-big") {
      localStorage.setItem("bnb_article_pipeline", val);
    } else {
      localStorage.setItem(`bnb_article_${blockId}`, val);
    }
  };

  if (!active) return null;

  // We rotate it flat on top of the block cap
  // HTML card dimension: 420px width by 280px height (larger, more spacious)
  // scaled by 0.0125, it maps to 5.25 units wide by 3.5 units deep in 3D
  const htmlScale = 0.0125;

  return (
    <group position={[0, blockH + 1.8, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      {/* Dynamic guide line connecting block cap to the floating holographic card */}
      <Line
        points={[[0, 0, -1.75], [0, 0, 0]]}
        color={AMBER}
        lineWidth={1.5}
        transparent
        opacity={0.65}
      />
      <mesh position={[0, 0, -1.75]}>
        <sphereGeometry args={[0.045, 8, 8]} />
        <meshBasicMaterial color={AMBER} />
      </mesh>

      {/* 3D Glass card backing */}
      <mesh receiveShadow castShadow>
        <planeGeometry args={[435 * htmlScale, 290 * htmlScale]} />
        <meshStandardMaterial
          color="#060912"
          metalness={0.95}
          roughness={0.1}
          transparent
          opacity={0.4}
        />
      </mesh>

      {/* HTML transform element */}
      <Html
        transform
        distanceFactor={6.8}
        portal={undefined}
        position={[0, 0, 0.01]}
      >
        <div className="w-[420px] h-[280px] flex flex-col bg-black/85 border border-[#e8a23a]/25 rounded-lg p-3.5 backdrop-blur-md text-white font-sans select-text shadow-2xl">
          {/* Header controls */}
          <div className="flex justify-between items-center border-b border-white/10 pb-2 mb-2 shrink-0">
            <span className="text-[9px] font-mono font-bold tracking-[0.2em] text-[#e8a23a]/80 uppercase">
              BNB Co-Spatial Journal
            </span>
            <div className="flex gap-1 p-0.5 rounded bg-white/5 border border-white/5">
              <button
                onClick={() => setActiveTab("read")}
                className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-wider transition-colors duration-150 cursor-pointer ${activeTab === "read"
                    ? "bg-[#e8a23a]/80 text-black shadow"
                    : "text-white/45 hover:text-white/85"
                  }`}
              >
                Read
              </button>
              <button
                onClick={() => setActiveTab("edit")}
                className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-wider transition-colors duration-150 cursor-pointer ${activeTab === "edit"
                    ? "bg-[#e8a23a]/80 text-black shadow"
                    : "text-white/45 hover:text-white/85"
                  }`}
              >
                Edit
              </button>
            </div>
          </div>

          {/* Plaque main text viewport */}
          <div className="flex-1 overflow-y-auto pr-0.5 select-text scrollbar-thin">
            {activeTab === "read" ? (
              <div className="text-left select-text">
                {parseMarkdown(content)}
              </div>
            ) : (
              <textarea
                value={content}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder="Paste your markdown or notes here..."
                className="w-full h-full bg-black/20 border border-white/5 focus:border-[#e8a23a]/30 rounded p-1.5 text-[9.5px] font-mono leading-relaxed text-white/75 outline-none resize-none select-text focus:ring-0 focus:outline-none"
              />
            )}
          </div>
        </div>
      </Html>
    </group>
  );
}
