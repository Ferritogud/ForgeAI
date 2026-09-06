"use client";

import { Project } from "@/lib/types";
import Modal from "./Modal";
import HeatmapView from "./HeatmapView";

interface ActivityModalProps {
  open: boolean;
  onClose: () => void;
  project: Project | null;
}

export default function ActivityModal({ open, onClose, project }: ActivityModalProps) {
  return (
    <Modal open={open} onClose={onClose} eyebrow="Activity" title={project?.name ?? "No active mission"} widthClass="max-w-2xl">
      {project ? (
        <HeatmapView project={project} />
      ) : (
        <p className="text-sm text-ink-faint">Create or select a project to see its activity.</p>
      )}
    </Modal>
  );
}
