// src/components/proposals/ProposalHistoryPanel.jsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

export default function ProposalHistoryPanel({
  statusHistory,
  formatDateTime,
}) {
  return (
    <Card className="bg-neutral-900 border-neutral-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Historique des statuts</CardTitle>
        <CardDescription>
          Suivi de la trajectoire institutionnelle.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 max-h-[320px] overflow-y-auto">
        {statusHistory.length === 0 && (
          <p className="text-sm text-neutral-400">
            Aucun changement de statut n&apos;a été enregistré pour le
            moment.
          </p>
        )}
        {statusHistory.map((h) => (
          <div
            key={h.id}
            className="bg-neutral-950 border border-neutral-800 p-3 rounded-md"
          >
            <div className="flex justify-between items-center text-xs text-neutral-400 mb-1">
              <span>
                {h.old_status} →{" "}
                <span className="font-semibold text-neutral-100">
                  {h.new_status}
                </span>
              </span>
              <span>{formatDateTime(h.created_at)}</span>
            </div>
            {h.changer && (
              <div className="text-[11px] text-neutral-400 mb-1">
                Décidé par{" "}
                <span className="font-semibold text-neutral-100">
                  {h.changer.username}
                </span>
                {h.changer.role && (
                  <>
                    {" "}
                    — <span className="italic">{h.changer.role}</span>
                  </>
                )}
              </div>
            )}
            {h.comment && (
              <p className="text-xs text-neutral-200 whitespace-pre-line mt-1">
                {h.comment}
              </p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
