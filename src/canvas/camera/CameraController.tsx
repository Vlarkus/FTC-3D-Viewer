import React from "react";
import { useGraph } from "../../context/GraphContext";
import { FreeCamera } from "./FreeCamera";
import { FollowCamera } from "./FollowCamera";

export const CameraController: React.FC = () => {
  const { cameraMode } = useGraph();

  if (cameraMode === "free") {
    return <FreeCamera />;
  }

  return <FollowCamera />;
};
