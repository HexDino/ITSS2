'use client';

import { useState } from 'react';
import { AnswerActions } from './answer-actions';
import { ReportDialog } from './report-dialog';

export function AnswerToolbar({
  answerId,
  upvotes,
  accepted,
  voted = false,
  canAccept,
}: {
  answerId: string;
  upvotes: number;
  accepted: boolean;
  voted?: boolean;
  canAccept: boolean;
}) {
  const [reportOpen, setReportOpen] = useState(false);
  return (
    <>
      <AnswerActions
        answerId={answerId}
        upvotes={upvotes}
        accepted={accepted}
        voted={voted}
        canAccept={canAccept}
        onReport={() => setReportOpen(true)}
      />
      <ReportDialog
        targetType="ANSWER"
        targetId={answerId}
        open={reportOpen}
        onOpenChange={setReportOpen}
      />
    </>
  );
}
