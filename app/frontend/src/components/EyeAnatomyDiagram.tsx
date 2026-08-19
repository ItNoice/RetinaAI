import { useState } from "react";

interface Region {
  id: string;
  label: string;
  x: number;
  y: number;
  description: string;
}

// Coordinates are in the SVG's 400×300 viewBox — see the wrapper's
// `aspect-[4/3]` below, which keeps percentage-positioned hotspot buttons
// aligned with the underlying schematic regardless of rendered width.
const REGIONS: Region[] = [
  {
    id: "retina",
    label: "Retina",
    x: 238,
    y: 228,
    description:
      "The light-sensitive layer of tissue lining the back of the eye. Photoreceptor cells here (rods and cones) convert incoming light into electrical signals sent to the brain via the optic nerve. This is the tissue a fundus photograph — and this application — actually images.",
  },
  {
    id: "macula",
    label: "Macula",
    x: 306,
    y: 150,
    description:
      "A small, oval area near the center of the retina responsible for detailed, central vision — used for reading, recognizing faces, and other tasks requiring sharp focus.",
  },
  {
    id: "fovea",
    label: "Fovea",
    x: 330,
    y: 150,
    description:
      "A tiny depression at the very center of the macula, packed with cone photoreceptors. It's responsible for the sharpest point of vision in the entire visual field.",
  },
  {
    id: "optic-disc",
    label: "Optic disc",
    x: 296,
    y: 116,
    description:
      "The point where the optic nerve and the retina's main blood vessels enter and exit the eye. It contains no photoreceptors, which is why it corresponds to a natural blind spot in the visual field.",
  },
  {
    id: "optic-nerve",
    label: "Optic nerve",
    x: 354,
    y: 92,
    description:
      "The bundle of roughly one million nerve fibers that carries visual information from the retina's ganglion cells to the brain.",
  },
  {
    id: "vessels",
    label: "Retinal vessels",
    x: 266,
    y: 92,
    description:
      "Blood vessels that branch across the retina's surface from the optic disc, supplying its inner layers with oxygen and nutrients. Their appearance — hemorrhages, abnormal new vessel growth, beading — is a key indicator in conditions like diabetic retinopathy.",
  },
  {
    id: "choroid",
    label: "Choroid",
    x: 253,
    y: 65,
    description:
      "A layer of blood vessels and connective tissue between the retina and the sclera (the eye's outer white wall), supplying oxygen and nutrients to the retina's outer layers.",
  },
];

export default function EyeAnatomyDiagram() {
  const [activeId, setActiveId] = useState<string>(REGIONS[0].id);
  const active = REGIONS.find((r) => r.id === activeId)!;

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
      <div className="md:col-span-3 relative aspect-[4/3] rounded-lg border border-clinic-200 bg-clinic-50">
        <svg
          viewBox="0 0 400 300"
          className="absolute inset-0 w-full h-full"
          aria-hidden="true"
        >
          <defs>
            <clipPath id="eye-back-half">
              <rect x="210" y="0" width="190" height="300" />
            </clipPath>
          </defs>

          {/* Choroid + retina layers — only drawn on the posterior (back) half */}
          <g clipPath="url(#eye-back-half)" fill="none" stroke="currentColor">
            <ellipse cx="210" cy="150" rx="121" ry="98" className="text-clinic-300" strokeWidth="1.5" />
            <ellipse cx="210" cy="150" rx="110" ry="88" className="text-clinic-400" strokeWidth="1.5" />
          </g>

          {/* Globe outline (sclera) */}
          <ellipse cx="210" cy="150" rx="130" ry="105" fill="none" className="text-clinic-400" stroke="currentColor" strokeWidth="1.5" />

          {/* Cornea bulge */}
          <path d="M80,72 Q40,150 80,228" fill="none" className="text-clinic-500" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />

          {/* Lens */}
          <ellipse cx="128" cy="150" rx="10" ry="32" fill="none" className="text-clinic-400" stroke="currentColor" strokeWidth="1.5" />

          {/* Visual axis */}
          <line x1="128" y1="150" x2="320" y2="150" className="text-clinic-200" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />

          {/* Macula shading */}
          <ellipse cx="308" cy="150" rx="20" ry="15" className="text-accent-400/20" fill="currentColor" />

          {/* Optic nerve stalk */}
          <path d="M330,120 Q345,105 372,88" fill="none" className="text-clinic-400" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />

          {/* Retinal vessels fanning from the optic disc */}
          <g fill="none" className="text-danger-500/60" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M298,120 Q270,95 245,70" />
            <path d="M298,120 Q280,100 255,90" />
            <path d="M300,122 Q285,150 255,175" />
            <path d="M300,122 Q290,160 268,205" />
          </g>

          {/* Optic disc */}
          <circle cx="298" cy="118" r="7" className="text-warn-500" fill="currentColor" opacity="0.85" />

          {/* Fovea */}
          <circle cx="330" cy="150" r="3" className="text-accent-600" fill="currentColor" />
        </svg>

        {REGIONS.map((region) => {
          const isActive = region.id === activeId;
          return (
            <button
              key={region.id}
              type="button"
              onClick={() => setActiveId(region.id)}
              aria-pressed={isActive}
              aria-label={region.label}
              title={region.label}
              style={{ left: `${(region.x / 400) * 100}%`, top: `${(region.y / 300) * 100}%` }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 ${
                isActive
                  ? "border-accent-600 bg-accent-500 scale-125"
                  : "border-surface bg-clinic-500/70 hover:bg-accent-500"
              }`}
            />
          );
        })}
      </div>

      <div className="md:col-span-2">
        <div role="tablist" aria-label="Eye anatomy regions" className="flex flex-wrap gap-1.5 mb-4">
          {REGIONS.map((region) => (
            <button
              key={region.id}
              type="button"
              role="tab"
              aria-selected={region.id === activeId}
              onClick={() => setActiveId(region.id)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 ${
                region.id === activeId
                  ? "bg-accent-soft text-accent-soft-ink"
                  : "bg-clinic-100 text-clinic-600 hover:bg-clinic-200"
              }`}
            >
              {region.label}
            </button>
          ))}
        </div>
        <div className="rounded-lg border border-clinic-200 bg-surface p-4">
          <h3 className="text-sm font-semibold text-clinic-900">{active.label}</h3>
          <p className="mt-2 text-sm text-clinic-600 leading-relaxed">
            {active.description}
          </p>
        </div>
      </div>
    </div>
  );
}
