import { useEffect, useState } from "react";
import { fetchDatasetStatus, fetchModelStatus } from "../lib/api";
import {
  DATASET_STATUS,
  MODEL_STATUS,
  type DatasetInfo,
  type ModelStatusInfo,
} from "../lib/modelStatus";

export function useModelStatus(): {
  status: ModelStatusInfo;
  backendReachable: boolean;
} {
  const [status, setStatus] = useState(MODEL_STATUS);
  const [backendReachable, setBackendReachable] = useState(true);

  useEffect(() => {
    void fetchModelStatus().then((result) => {
      setBackendReachable(result !== null);
      if (result) setStatus(result);
    });
  }, []);

  return { status, backendReachable };
}

export function useDatasetStatus(): {
  status: DatasetInfo;
  backendReachable: boolean;
} {
  const [status, setStatus] = useState(DATASET_STATUS);
  const [backendReachable, setBackendReachable] = useState(true);

  useEffect(() => {
    void fetchDatasetStatus().then((result) => {
      setBackendReachable(result !== null);
      if (result) setStatus(result);
    });
  }, []);

  return { status, backendReachable };
}
