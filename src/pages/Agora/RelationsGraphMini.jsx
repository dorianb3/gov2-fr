// src/pages/Agora/RelationsGraphMini.jsx

/**
 * Petit graphe relationnel minimaliste en SVG.
 *
 * Convention :
 * - Node central = proposition actuelle
 * - Node au-dessus = parent (forked_from)
 * - Nodes en dessous = forks enfants (count)
 * - Nodes à gauche/droite = alternatives (count condensé)
 * - Bordure / halo différent si supersedes / supersededBy
 */
export default function RelationsGraphMini({ relations }) {
  if (!relations) {
    return (
      <svg
        width="80"
        height="48"
        viewBox="0 0 80 48"
        className="text-muted-foreground/40"
      >
        <circle cx="40" cy="24" r="6" fill="none" stroke="currentColor" strokeWidth="1" />
      </svg>
    );
  }

  const {
    isFork,
    hasParentFork,
    forksCount = 0,
    alternativesCount = 0,
    supersedes,
    supersededBy,
  } = relations;

  const hasChildren = forksCount > 0;
  const hasAlternatives = alternativesCount > 0;

  const centralRadius = supersedes || supersededBy ? 7 : 6;

  return (
    <svg
      width="80"
      height="48"
      viewBox="0 0 80 48"
      className="text-muted-foreground"
    >
      {/* Lignes vers parent / enfants / alternatives */}
      {/* Parent (au-dessus) */}
      {hasParentFork && (
        <>
          <line
            x1="40"
            y1="10"
            x2="40"
            y2="18"
            stroke="currentColor"
            strokeWidth="0.7"
          />
          <circle
            cx="40"
            cy="8"
            r="3"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.7"
          />
        </>
      )}

      {/* Enfants (forks en dessous, représentés par un cluster) */}
      {hasChildren && (
        <>
          <line
            x1="40"
            y1="30"
            x2="40"
            y2="36"
            stroke="currentColor"
            strokeWidth="0.7"
          />
          {/* cluster enfants */}
          <circle
            cx="32"
            cy="40"
            r="3"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.7"
          />
          <circle
            cx="40"
            cy="40"
            r="3"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.7"
          />
          <circle
            cx="48"
            cy="40"
            r="3"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.7"
          />
          {/* count */}
          <text
            x="40"
            y="47"
            textAnchor="middle"
            fontSize="7"
            className="fill-current"
          >
            {forksCount}
          </text>
        </>
      )}

      {/* Alternatives à gauche/droite (cluster) */}
      {hasAlternatives && (
        <>
          {/* liens */}
          <line
            x1="32"
            y1="24"
            x2="22"
            y2="24"
            stroke="currentColor"
            strokeWidth="0.7"
          />
          <line
            x1="48"
            y1="24"
            x2="58"
            y2="24"
            stroke="currentColor"
            strokeWidth="0.7"
          />
          {/* clusters */}
          <circle
            cx="18"
            cy="18"
            r="3"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.7"
          />
          <circle
            cx="18"
            cy="30"
            r="3"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.7"
          />
          <circle
            cx="62"
            cy="18"
            r="3"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.7"
          />
          <circle
            cx="62"
            cy="30"
            r="3"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.7"
          />
          {/* count */}
          <text
            x="10"
            y="26"
            textAnchor="middle"
            fontSize="7"
            className="fill-current"
          >
            {alternativesCount}
          </text>
        </>
      )}

      {/* Node central */}
      <circle
        cx="40"
        cy="24"
        r={centralRadius}
        fill={supersededBy ? "none" : "currentColor"}
        stroke="currentColor"
        strokeWidth={supersedes || supersededBy ? 1.3 : 0.8}
        className={isFork ? "opacity-90" : "opacity-60"}
      />

      {/* Indicateur de direction si supersedes / supersededBy */}
      {supersedes && (
        <polygon
          points="44,24 50,22 50,26"
          fill="currentColor"
          className="opacity-80"
        />
      )}
      {supersededBy && (
        <polygon
          points="36,24 30,22 30,26"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.7"
        />
      )}
    </svg>
  );
}
